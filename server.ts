const express = require('express');
const next = require('next');
const https = require('https');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const server = express();

const httpsOptions = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert'),
};

server.all('*', (req: any, res: any) => {
  return handle(req, res);
});

const PORT = process.env.PORT || 3001;

// export const API_BASE_URL = process.env.NODE_ENV === 'development'
//   ? '192.168.1.100:3001/api'
//   : '/api';

app.prepare().then(() => {
  https
    .createServer(httpsOptions, server)
    .listen(PORT, '0.0.0.0', (err: any) => {
      if (err) throw err;
      console.log(`Ready on https://localhost:${PORT}`);
    });
});
