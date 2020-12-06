const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const socketCookieParser = require("socket.io-cookie-parser");
const socketConfig = require("./events/socket");
const app = require("./api/app");
require("./db/mongoose");

const port = process.env.PORT;

const server = http.createServer(app);
const io = socketio(server);
io.use(socketCookieParser(process.env.COOKIE_SECRET));

io.on("connection", async function (socket) {
  socketConfig(socket, io);
});

server.listen(port, () => {
  console.log("Server is up on port " + port);
});
