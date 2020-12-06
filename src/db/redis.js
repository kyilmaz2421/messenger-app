const { model } = require("../models/user");
var client = require('redis').createClient(process.env.REDIS_URL);

client.on("error", (error) => {
  console.error(error);
});

client.on("connect", (msg) => {
  console.log("Connected on redis server");
});

module.exports = client;
