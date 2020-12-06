const { model } = require("../models/user");
const redis = require("redis");

const redisUrl= process.env.REDIS_URL.split(":")
const client = redis.createClient({
  host: redisUrl[0],
  port: redisUrl[1],
});

client.on("error", (error) => {
  console.error(error);
});

client.on("connect", (msg) => {
  console.log("Connected on redis server");
});

module.exports = client;
