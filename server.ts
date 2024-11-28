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

app.prepare().then(() => {
    https
        .createServer(httpsOptions, server)
        .listen(PORT, '0.0.0.0', (err: any) => {
            if (err) throw err;
            console.log(`Ready on https://localhost:${PORT}`);
        });
});
