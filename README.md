# https-php-server
An HTTPS server that runs on Node.js and supports PHP.  
WebXR requires a secure HTTPS connection.  
I use this server for developing WebXR applications(Three.js , De-Panther/unity-webxr-export).

# Requirements
Node.js and PHP must be installed. 
```
npm install express express-static-gzip
```

# Settings
Modify the paths to match your environment.  
```
const keypempath = 'C:/xxxx/key.pem'
const certpempath = 'C:/xxxx/cert.pem'
const filePathBase = 'C:/xxxx/xxxx';  //public_html
const phpCgiPath = 'C:/php/php-cgi.exe';
```

# Run normal mode
(index.html = not PHP. index.php = PHP.)
```
node httpsphpserver.js
```
Open `https://localhost` in your web browser

# Run De-Panther/unity-webxr-export mode
(index.html = PHP mode.)

(De-Panther/unity-webxr-export uses a fixed index.html file. )
```
node httpsphpserver.js 1
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

# Supports Brotli(.br) , Gzip(.gz)
for De-Panther/unity-webxr-export.

# Compatible with De-Panther/unity-webxr-export.
De-Panther/unity-webxr-export uses a fixed index.html file.
Therefore, it requires a mechanism to interpret index.html as a PHP file. 
```
node httpsphpserver.js 1
```
Supports Brotli/Gzip compression.

# Hosting server(Apache) settings for De-Panther/unity-webxr-export
When deploying a PHP-enabled web application that uses De-Panther/unity-webxr-export to a shared hosting server, the server must also be configured to interpret index.html as a PHP file.

index file directory.

.htaccess
```
<FilesMatch "index.html">
    SetHandler application/x-httpd-php
</FilesMatch>
```
To support Brotli/Gzip compression.

Build directory.

.htaccess
```
# This configuration file should be uploaded to the server as "<Application Folder>/Build/.htaccess"
# This configuration has been tested with Unity 2020.1 builds, hosted on Apache/2.4
# NOTE: "mod_mime" Apache module must be enabled for this configuration to work.
<IfModule mod_mime.c>

# The following lines are required for builds without decompression fallback, compressed with gzip
RemoveType .gz
AddEncoding gzip .gz
AddType application/octet-stream .data.gz
AddType application/wasm .wasm.gz
AddType application/javascript .js.gz
AddType application/octet-stream .symbols.json.gz

# The following lines are required for builds without decompression fallback, compressed with Brotli
RemoveType .br
RemoveLanguage .br
AddEncoding br .br
AddType application/octet-stream .data.br
AddType application/wasm .wasm.br
AddType application/javascript .js.br
AddType application/octet-stream .symbols.json.br

# The following line improves loading performance for uncompressed builds
AddType application/wasm .wasm

# Uncomment the following line to improve loading performance for gzip-compressed builds with decompression fallback
# AddEncoding gzip .unityweb

# Uncomment the following line to improve loading performance for brotli-compressed builds with decompression fallback
# AddEncoding br .unityweb
</IfModule>
```
