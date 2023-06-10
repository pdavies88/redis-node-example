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
  redisClient.get("photos", async (error, photos) => {
    if (error) console.error(error);
    if (photos != null) {
      console.log("Cache");
      return res.json(JSON.parse(photos));
    } else {
      console.log("No Cache");
      const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/photos",
        { params: { albumId } }
      );
      redisClient.setex("photos", DEFAULT_EXPIRATION, JSON.stringify(data));
      res.json(data);
    }
  });
});

app.get("/photos/:id", async (req, res) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
  );

  res.json(data);
});

const listener = app.listen(8080, function () {
  console.log("Listening on port " + listener.address().port);
});
