const express = require('express');
const router = express.Router();
const { getMCServers } = require('./functions/minecraft');

router.get('/mc-servers', (req, res) => {
  try {
    const servers = getMCServers();
    res.json(servers);
  } catch (err) {
    console.error('Error fetching MC servers:', err);
    res.status(500).json({ error: 'Failed to get MC servers' });
  }
});

module.exports = router;