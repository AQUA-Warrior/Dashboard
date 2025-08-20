const express = require('express');
const apiRouter = require('./api');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.static('public'));

// all api routers in api.js
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});