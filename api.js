const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getMCServers } = require('./functions/minecraft');
const { execSync } = require('child_process');
const getSystemInfo = require('./functions/system');

const limiter = rateLimit({
  windowMs: 10 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(limiter);

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  next();
});

router.get('/mc-servers', async (req, res) => {
  try {
    const servers = await getMCServers();
    res.json(servers);
  } catch (err) {
    console.error('Error fetching MC servers:', err);
    res.status(500).json({ error: 'Failed to get MC servers' });
  }
});

router.get('/mc-server/:pid', async (req, res) => {
  try {
    const pid = parseInt(req.params.pid);
    if (isNaN(pid)) {
      return res.status(400).json({ error: 'Invalid PID' });
    }
    
    // Get process-specific resource usage
    let processInfo = {};
    try {
      // Get CPU and memory usage for the specific process
      const psOutput = execSync(`ps -p ${pid} -o %cpu,%mem,etime --no-headers`, { encoding: 'utf8' }).trim();
      const [cpuPercent, memPercent, elapsed] = psOutput.split(/\s+/);
      
      processInfo = {
        cpu: parseFloat(cpuPercent),
        memory: {
          usagePercent: parseFloat(memPercent)
        }
      };
      
      // Get more detailed memory usage
      const status = execSync(`cat /proc/${pid}/status`, { encoding: 'utf8' });
      const vmRSSMatch = status.match(/VmRSS:\s+(\d+)\s+kB/);
      if (vmRSSMatch) {
        const rssKb = parseInt(vmRSSMatch[1]);
        processInfo.memory.usedBytes = rssKb * 1024;
        processInfo.memory.totalBytes = require('os').totalmem();
      }
    } catch (err) {
      console.error(`Error getting process info for PID ${pid}:`, err);
    }
    
    res.json({
      pid,
      resources: {
        cpu: processInfo.cpu,
        memory: processInfo.memory
      }
    });
  } catch (err) {
    console.error('Error fetching MC server details:', err);
    res.status(500).json({ error: 'Failed to get MC server details' });
  }
});

router.get('/system-info', (req, res) => {
  try {
    const systemInfo = getSystemInfo();
    res.json(systemInfo);
  } catch (err) {
    console.error('Error fetching system info:', err);
    res.status(500).json({ error: 'Failed to get system information' });
  }
});

module.exports = router;