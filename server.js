const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
res.send("ReelSaver backend is running!");
});

app.get("/api/download", async (req, res) => {
try {
const reelUrl = req.query.url;

if (!reelUrl) {
  return res.status(400).json({
    success: false,
    message: "Instagram URL is required"
  });
}

if (!/^https?:\/\/(www\.)?instagram\.com\//i.test(reelUrl)) {
  return res.status(400).json({
    success: false,
    message: "Please enter a valid Instagram URL"
  });
}

const apiHost = process.env.RAPIDAPI_HOST;
const apiKey = process.env.RAPIDAPI_KEY;

if (!apiHost || !apiKey) {
  return res.status(500).json({
    success: false,
    message: "RapidAPI environment variables are missing"
  });
}

const apiUrl =
  "https://" + apiHost +
  "/scraper?url=" + encodeURIComponent(reelUrl);

const response = await fetch(apiUrl, {
  method: "GET",
  headers: {
    "x-rapidapi-host": apiHost,
    "x-rapidapi-key": apiKey
  }
});

const result = await response.json();

if (!response.ok) {
  return res.status(response.status).json({
    success: false,
    message: result.message || "RapidAPI request failed"
  });
}

const items = Array.isArray(result.data) ? result.data : [];

const media = items
  .filter(item => item && item.media)
  .map(item => ({
    type: item.isVideo ? "video" : "image",
    quality: "HD",
    thumbnail: item.thumb || item.media,
    url: item.media
  }));

if (media.length === 0) {
  return res.status(502).json({
    success: false,
    message: "No downloadable media found",
    details: result
  });
}

return res.json({
  success: true,
  media: media
});

} catch (error) {
return res.status(500).json({
success: false,
message: "Server error while downloading media"
});
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log("ReelSaver backend running on port " + PORT);
});
