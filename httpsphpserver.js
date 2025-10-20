// Node.js HTTPS + PHP CGI Server
//Supports POST and GET requests
//node httpsphpserver.js
const keypempath = 'c:/xxxx/key.pem'
const certpempath = 'c:/xxxx/cert.pem'
const filePathBase = 'C:/xxxx/xxxx';  //public_html
const phpCgiPath = 'C:/php/php-cgi.exe';

const https = require('https');
const fs = require('fs');
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const options = {
  key: fs.readFileSync(keypempath),
  cert: fs.readFileSync(certpempath)
};

// Middleware to handle PHP requests
app.use((req, res, next) => {
  const url = req.url;
  const [rawPath, queryString] = url.split('?');
  let relativePath = rawPath;

  if (relativePath.endsWith('/')) {
    relativePath += 'index.php';
  }

  if (!relativePath.endsWith('.php')) {
    return next();
  }

  const filePath = path.join(filePathBase, relativePath);
  if (!fs.existsSync(filePath)) {
    console.error(`PHP file not found: ${filePath}`);
    return res.status(404).send('No input file specified.');
  }

  const env = {
    ...process.env,
    REDIRECT_STATUS: '200',
    SCRIPT_NAME: filePath,
    SCRIPT_FILENAME: filePath,
    QUERY_STRING: queryString || '',
    REQUEST_METHOD: req.method,
    REQUEST_URI: req.originalUrl,
    REMOTE_ADDR: req.ip,
    SERVER_PROTOCOL: req.protocol.toUpperCase() + '/' + req.httpVersion,
    SERVER_NAME: req.hostname,
    SERVER_PORT: req.socket.localPort,
    CONTENT_TYPE: req.headers['content-type'] || '',
    CONTENT_LENGTH: req.headers['content-length'] || '0'
  };

  const phpCgi = spawn(phpCgiPath, ['-f', filePath], { env });

  const chunks = [];
  phpCgi.stdout.on('data', (chunk) => {
    chunks.push(chunk);
  });

  phpCgi.stderr.on('data', (data) => {
    console.error(`PHP Error: ${data.toString()}`);
  });

  phpCgi.on('close', (code) => {
    console.log(`php-cgi process exited with code ${code}`);
    if (res.headersSent) return;
    if (code !== 0) {
      return res.status(500).send('PHP script execution failed.');
    }

    const phpOutputBuffer = Buffer.concat(chunks);
    let outputString = phpOutputBuffer.toString('utf8');
    outputString = outputString.replace(/^\uFEFF/, '').replace(/\0/g, '');

    const separator = /\r?\n\r?\n/;
    const splitIndex = outputString.search(separator);

    if (splitIndex !== -1) {
      const headersPart = outputString.substring(0, splitIndex);
      const bodyPart = outputString.substring(splitIndex + outputString.match(separator)[0].length);

      headersPart.split(/\r?\n/).forEach(header => {
        const [key, ...rest] = header.split(':');
        const value = rest.join(':').trim();
        if (key && value && !['X-Powered-By'].includes(key)) {
          res.setHeader(key.trim(), value);
        }
      });

      res.send(bodyPart);
    } else {
      res.send(outputString);
    }
  });

  phpCgi.on('error', (err) => {
    console.error('Failed to start PHP CGI process.', err);
    if (!res.headersSent) {
      res.status(500).send('Failed to start PHP CGI process.');
    }
  });

  // Handle POST body
  if (req.method === 'POST') {
    const bodyChunks = [];
    req.on('data', chunk => {
      bodyChunks.push(chunk);
    });
    req.on('end', () => {
      const body = Buffer.concat(bodyChunks);
      phpCgi.stdin.write(body);
      phpCgi.stdin.end();
    });
  } else {
    phpCgi.stdin.end();
  }
});

// Serve static files
app.use(express.static(filePathBase));

// Start HTTPS server
https.createServer(options, app).listen(443, () => {
  console.log('✅ HTTPS Server running on port 443');
});
