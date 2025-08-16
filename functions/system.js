const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

function getSystemInfo() {
  const isLinux = os.platform() === 'linux';
  
  return {
    timestamp: Date.now(),
    system: getSystemDetails(isLinux),
    cpu: getCPUInfo(isLinux),
    memory: getMemoryInfo(isLinux),
    disk: getDiskInfo(isLinux),
    network: getNetworkInfo(),
    uptime: getUptimeInfo()
  };
}

// System:
function getSystemDetails(isLinux) {
  let osInfo = {
    name: os.platform(),
    version: os.release()
  };

  if (isLinux) {
    try {
      const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
      const lines = osRelease.split('\n');
      const getValue = (key) => {
        const line = lines.find(l => l.startsWith(key + '='));
        return line ? line.split('=')[1].replace(/"/g, '') : '';
      };

      osInfo = {
        name: getValue('NAME') || 'Linux',
        version: getValue('VERSION') || os.release(),
        id: getValue('ID') || 'unknown'
      };
    } catch (err) {
    }
  }

  return {
    // hostname
    hostname: os.hostname(),
    // platform
    platform: os.platform(),
    // arch
    arch: os.arch(),
    // os
    os: osInfo
  };
}

// CPU:
function getCPUInfo(isLinux) {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  
  let cpuUsagePercent = null;
  if (isLinux) {
    try {
      const stat = fs.readFileSync('/proc/stat', 'utf8');
      const cpuLine = stat.split('\n')[0];
      const times = cpuLine.split(/\s+/).slice(1).map(Number);
      const idle = times[3];
      const total = times.reduce((a, b) => a + b, 0);
      cpuUsagePercent = Math.round(((total - idle) / total) * 100);
    } catch (err) {
      cpuUsagePercent = null;
    }
  }

  return {
    // model
    model: cpus[0]?.model || 'Unknown',
    // cores
    cores: cpus.length,
    // speedmhz
    speedMHz: cpus[0]?.speed || 0,
    // usagepercent
    usagePercent: cpuUsagePercent,
    // loadaverage
    loadAverage: {
      // onemin
      oneMin: Math.round(loadAvg[0] * 100) / 100,
      // fivemin
      fiveMin: Math.round(loadAvg[1] * 100) / 100,
      // fifteenmin
      fifteenMin: Math.round(loadAvg[2] * 100) / 100
    }
  };
}

// Memory:
function getMemoryInfo(isLinux) {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;
  
  let memDetails = {
    availableBytes: freeBytes,
    buffersBytes: 0,
    cachedBytes: 0,
    swapTotalBytes: 0,
    swapFreeBytes: 0
  };

  if (isLinux) {
    try {
      const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
      const lines = meminfo.split('\n');
      
      const getValue = (key) => {
        const line = lines.find(l => l.startsWith(key));
        return line ? parseInt(line.split(/\s+/)[1]) * 1024 : 0;
      };

      memDetails = {
        availableBytes: getValue('MemAvailable') || freeBytes,
        buffersBytes: getValue('Buffers'),
        cachedBytes: getValue('Cached'),
        swapTotalBytes: getValue('SwapTotal'),
        swapFreeBytes: getValue('SwapFree')
      };
    } catch (err) {
    }
  }

  return {
    // totalbytes
    totalBytes,
    // usedbytes
    usedBytes,
    // freebytes
    freeBytes,
    // usagepercent
    usagePercent: Math.round((usedBytes / totalBytes) * 100),
    // availablebytes
    availableBytes: memDetails.availableBytes,
    // buffersbytes
    buffersBytes: memDetails.buffersBytes,
    // cachedbytes
    cachedBytes: memDetails.cachedBytes,
    // swap
    swap: {
      // totalbytes
      totalBytes: memDetails.swapTotalBytes,
      // usedbytes
      usedBytes: memDetails.swapTotalBytes - memDetails.swapFreeBytes,
      // freebytes
      freeBytes: memDetails.swapFreeBytes,
      // usagepercent
      usagePercent: memDetails.swapTotalBytes > 0 
        ? Math.round(((memDetails.swapTotalBytes - memDetails.swapFreeBytes) / memDetails.swapTotalBytes) * 100)
        : 0
    }
  };
}

// Disk:
function getDiskInfo(isLinux) {
  if (!isLinux) {
    return { error: 'Disk information only available on Linux' };
  }
  
  try {
    const df = execSync('df -B1 --output=source,fstype,size,used,avail,pcent,target', { encoding: 'utf8' });
    const lines = df.trim().split('\n').slice(1);
    
    return lines
      .filter(line => {
        const source = line.split(/\s+/)[0];
        return !source.includes('tmpfs') && 
               !source.includes('devtmpfs') && 
               !source.includes('udev') &&
               source.startsWith('/');
      })
      .map(line => {
        const parts = line.split(/\s+/);
        const sizeBytes = parseInt(parts[2]) || 0;
        const usedBytes = parseInt(parts[3]) || 0;
        const availableBytes = parseInt(parts[4]) || 0;
        const usagePercent = parseInt(parts[5]?.replace('%', '')) || 0;

        return {
          // filesystem
          filesystem: parts[0],
          // type
          type: parts[1],
          // sizebytes
          sizeBytes,
          // usedbytes
          usedBytes,
          // availablebytes
          availableBytes,
          // usagepercent
          usagePercent,
          // mountpoint
          mountPoint: parts[6]
        };
      });
  } catch (err) {
    return { error: 'Could not retrieve disk information' };
  }
}

// Network:
function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const result = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (addrs) {
      const interfaceInfo = {
        // name
        name,
        // addresses
        addresses: addrs
          .filter(addr => !addr.internal || name === 'lo')
          .map(addr => ({
            // address
            address: addr.address,
            // family
            family: addr.family,
            // internal
            internal: addr.internal,
            // mac
            mac: addr.mac
          }))
      };
      
      if (interfaceInfo.addresses.length > 0) {
        result.push(interfaceInfo);
      }
    }
  }

  return result;
}

// Uptime:
function getUptimeInfo() {
  const uptimeSeconds = os.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return {
    // seconds
    seconds: uptimeSeconds,
    // formatted
    formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    // days
    days,
    // hours
    hours,
    // minutes
    minutes
  };
}

module.exports = getSystemInfo;