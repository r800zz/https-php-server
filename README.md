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

# Supports POST and GET requests
POST support added. (20 October 2025)

# Suppots $_SERVER['xxxxxx']
```
$_SERVER['REDIRECT_STATUS']
$_SERVER['SCRIPT_NAME']
$_SERVER['SCRIPT_FILENAME']
$_SERVER['QUERY_STRING']
$_SERVER['REQUEST_METHOD']
$_SERVER['REQUEST_URI']
$_SERVER['REMOTE_ADDR']
$_SERVER['SERVER_PROTOCOL']
$_SERVER['SERVER_NAME']
$_SERVER['SERVER_PORT']
$_SERVER['CONTENT_TYPE']
$_SERVER['CONTENT_LENGTH']
$_SERVER['HTTPS']
$_SERVER['HTTP_HOST']
```
HTTPS and HTTP_HOST support added. (29 October 2025)

Bug fix "SCRIPT_NAME". (29 October 2025)

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
