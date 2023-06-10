const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const redis = require("redis");

// Local Host since no url passed as params
// Create Client Changes in Redis v4
const redisClient = redis.createClient();
const DEFAULT_EXPIRATION = 3600;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/photos", async (req, res) => {
  const albumId = req.query.albumId;
  const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      { params: { albumId } }
    );
    return data;
  });
  res.json(photos);
});

app.get("/photos/:id", async (req, res) => {
  const photo = await getOrSetCache(`photos:${req.params.id}`, async () => {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
    );
    return data;
  });
  res.json(photo);
});

function getOrSetCache(key, cb) {
  return new Promise((resolve, reject) => {
    redisClient.get(key, async (error, data) => {
      if (error) return reject(error);
      if (data != null) {
        console.log("Data from cache");
        return resolve(JSON.parse(data));
      } else {
        console.log("Not in cache");
        const freshData = await cb();
        redisClient.setex(key, DEFAULT_EXPIRATION, JSON.stringify(freshData));
        resolve(freshData);
      }
    });
  });
}

const listener = app.listen(8080, function () {
  console.log("Listening on port " + listener.address().port);
});
