const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getMCServers } = require('./functions/minecraft');

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

module.exports = router;