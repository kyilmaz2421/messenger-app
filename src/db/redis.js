const { model } = require("../models/user");
const redis = require("redis");

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

client.on("error", (error) => {
  console.error(error);
});

client.on("connect", (msg) => {
  console.log("Connected on redis server");
});

module.exports = client;
