const http = require('http')
const https = require('https');
const fs = require('fs');
const path = require('path')
const socketio = require('socket.io')
const socketCookieParser = require('socket.io-cookie-parser')
const socketConfig = require('./socket')
const app = require('./app')
require('./db/mongoose')

//openssl genrsa -out www.example.com.key 2048
//openssl req -new -sha256 -key www.example.com.key -out www.example.com.csr
//openssl req -text -in www.example.com.csr -noout
//openssl req -nodes -new -x509 -keyout server.key -out server.cert

const server_config = {
    key: fs.readFileSync(path.join(__dirname,'ssl','server.key')),
    cert: fs.readFileSync(path.join(__dirname,'ssl','server.cert'))
}

const port = process.env.PORT


const server =  http.createServer(app)
const io = socketio(server)
io.use(socketCookieParser(process.env.COOKIE_SECRET))

io.on('connection',async function (socket) {
    socketConfig(socket,io)
})

server.listen(port, () => {
    console.log('Server is up on port ' + port)
})

// server.get('*', function(req, res) {  
    //     res.redirect('https://' + req.headers.host + req.url);
    
    //     // Or, if you don't want to automatically detect the domain name from the request header, you can hard code it:
    //     // res.redirect('https://example.com' + req.url);
    // })