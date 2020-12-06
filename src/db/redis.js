let redisConnectionUrl = null;
if (process.env.REDIS_URL) {
  redisConnectionUrl = process.env.REDIS_URL;
} else {
  redisConnectionUrl = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  };
}

const client = require("redis").createClient(redisConnectionUrl);

client.on("error", (error) => {
  console.error(error);
});

client.on("connect", (msg) => {
  console.log("Connected on redis server");
});

module.exports = client;
