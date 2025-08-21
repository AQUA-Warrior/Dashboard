const express = require('express');
const apiRouter = require('./api');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    originAgentCluster: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
      },
    },
  })
);

app.use(express.static('public'));

app.use('/api', apiRouter);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://172.16.16.2:${PORT}`);
});