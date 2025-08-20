const express = require('express');
const router = express.Router();
const { getMCServers } = require('./functions/minecraft');

// minecraft servers info endpoint - getMCServers
router.get('/mc-servers', (req, res) => {
  try {
    const servers = getMCServers();
    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get MC servers' });
  }
});

module.exports = router;