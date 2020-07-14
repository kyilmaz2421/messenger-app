const http = require('http')
const https = require('https');
const fs = require('fs');
const path = require('path')
const socketio = require('socket.io')
const socketCookieParser = require('socket.io-cookie-parser')
const socketConfig = require('./socket')
const app = require('./app')
require('./db/mongoose')

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

