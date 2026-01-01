// Node.js HTTPS + PHP CGI Server
//Supports POST and GET requests
//Supports Brotli(.br),Gzip(.gz) (for De-Panther/unity-webxr-export.) 
//Supports index.html PHP mode (for De-Panther/unity-webxr-export.) 
//Requirements:
//Node.js and PHP must be installed.
//npm install express express-static-gzip
//Userge:
//normal mode(index.html = not PHP)
//node httpsphpserver.js
//index.hmtl = PHP mode (for De-Panther/unity-webxr-export.) 
//node httpsphpserver.js 1

//Settings
const keypempath = 'C:/xxxx/key.pem';
const certpempath = 'C:/xxxx/cert.pem';
const filePathBase = 'C:/xxxx/xxxx';  // public_html
const phpCgiPath = 'C:/php/php-cgi.exe';

const https = require('https');
const fs = require('fs');
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const expressStaticGzip = require('express-static-gzip');

const app = express();
const options = {
  key: fs.readFileSync(keypempath),
  cert: fs.readFileSync(certpempath)
};
let unity_webxr = false;

if(process.argv[2] == '1'){
  unity_webxr = true;
  console.log("index.html = PHP mode");
}
else{
  console.log("index.html = not PHP mode");
}
console.log("\"node httpphpserver.js\"  index.html = not PHP mode");
console.log("\"node httpphpserver.js 1\"  index.html = PHP mode");

// Middleware to handle PHP requests
app.use((req, res, next) => {
  const url = req.url;
  const [rawPath, queryString] = url.split('?');
  let relativePath = rawPath;

  if (relativePath.endsWith('/')) {
    if(unity_webxr == true){
      relativePath += 'index.html';
    }
    else{
      relativePath += 'index.php';
    }
  }

  if(unity_webxr == true){
    if (!relativePath.endsWith('.php') && !relativePath.endsWith('index.html')) {
      return next();
    }
  }
  else{
    if (!relativePath.endsWith('.php')) {
      return next();
    }
  }

  const filePath = path.join(filePathBase, relativePath);
  if (!fs.existsSync(filePath)) {
    console.error(`PHP file not found: ${filePath}`);
    return res.status(404).send('No input file specified.');
  }

  const env = {
    ...process.env,
    REDIRECT_STATUS: '200',
    SCRIPT_NAME: relativePath,
    SCRIPT_FILENAME: filePath,
    QUERY_STRING: queryString || '',
    REQUEST_METHOD: req.method,
    REQUEST_URI: req.originalUrl,
    REMOTE_ADDR: req.ip,
    SERVER_PROTOCOL: req.protocol.toUpperCase() + '/' + req.httpVersion,
    SERVER_NAME: req.hostname,
    SERVER_PORT: req.socket.localPort,
    CONTENT_TYPE: req.headers['content-type'] || '',
    CONTENT_LENGTH: req.headers['content-length'] || '0',
    HTTPS: req.protocol === 'https' ? 'on' : 'off',
    HTTP_HOST: req.headers.host || req.hostname
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

  // Handle POST body for PHP
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

// ---------------------------------------------------------
// 2. Static File Middleware (Brotli/Gzip/Wasm)
// ---------------------------------------------------------
app.use('/', expressStaticGzip(filePathBase, {
  enableBrotli: true,
  orderPreference: ['br', 'gz'], 
  setHeaders: (res, path) => {
    if (path.endsWith('.br')) {
      res.setHeader('Content-Encoding', 'br');
    } else if (path.endsWith('.gz')) {
      res.setHeader('Content-Encoding', 'gzip');
    }
    
    if (path.includes('.wasm')) {
       res.setHeader('Content-Type', 'application/wasm');
    }
  }
}));

// ---------------------------------------------------------
// 3. Start Server
// ---------------------------------------------------------
https.createServer(options, app).listen(443, () => {
  console.log('✅ HTTPS Server running on port 443 (PHP & Unity WebXR Support)');
});
