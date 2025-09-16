# https-php-server
An HTTPS server that runs on Node.js and supports PHP.  
WebXR requires a secure HTTPS connection.  
I use this server for developing WebXR applications with three.js.

# Requirements
Node.js and PHP must be installed. 

# Settings
Modify the paths to match your environment.  
```
const keypempath = 'c:/xxxx/key.pem'
const certpempath = 'c:/xxxx/cert.pem'
const filePathBase = 'C:/xxxx/xxxx';  //public_html
const phpCgiPath = 'C:/php/php-cgi.exe';
```

# Run
```
node httpsphpserver.js
```
Open `https://localhost` in your web browser

# Not compatible with De-Panther/unity-webxr-export.
De-Panther/unity-webxr-export uses a fixed index.html file.  
Therefore, it requires a mechanism to interpret index.html as a PHP file.  
To support Brotli compression, you may need to add source code like the following.
```
const expressStaticGzip = require('express-static-gzip');
app.use('/', expressStaticGzip(filePathBase, {
  enableBrotli: true,
  orderPreference: ['br'],
  setHeaders: (res, path) => {
    if (path.endsWith('.br')) {
      res.setHeader('Content-Encoding', 'br');
    }
  }
}));
```
When deploying a PHP-enabled web application that uses De-Panther/unity-webxr-export to a shared hosting server, the server must also be configured to interpret index.html as a PHP file.
