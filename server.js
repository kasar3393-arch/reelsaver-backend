const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;
const API_HOST = process.env.RAPIDAPI_HOST;
const API_KEY = process.env.RAPIDAPI_KEY;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === "/") {
    return res.end(JSON.stringify({
      success: true,
      message: "ReelSaver Backend is Running!"
    }));
  }

  if (req.url.startsWith("/api/download")) {
    const requestUrl = new URL(req.url, "http://localhost");
    const reelUrl = requestUrl.searchParams.get("url");

    if (!reelUrl) {
      res.statusCode = 400;
      return res.end(JSON.stringify({
        success: false,
        message: "Instagram URL is required"
      }));
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(reelUrl);
    } catch {
      res.statusCode = 400;
      return res.end(JSON.stringify({
        success: false,
        message: "Invalid URL"
      }));
    }

    if (
      parsedUrl.protocol !== "https:" ||
      !["instagram.com", "www.instagram.com"].includes(parsedUrl.hostname)
    ) {
      res.statusCode = 400;
      return res.end(JSON.stringify({
        success: false,
        message: "Please provide a valid Instagram URL"
      }));
    }

    if (!API_HOST || !API_KEY) {
      res.statusCode = 500;
      return res.end(JSON.stringify({
        success: false,
        message: "RapidAPI credentials are missing in Render"
      }));
    }

    const apiPath = "/convert?url=" + encodeURIComponent(reelUrl);

    const options = {
      hostname: API_HOST,
      path: apiPath,
      method: "GET",
      headers: {
        "x-rapidapi-host": API_HOST,
        "x-rapidapi-key": API_KEY
      }
    };

    const apiRequest = https.request(options, (apiResponse) => {
      let data = "";

      apiResponse.on("data", chunk => data += chunk);

      apiResponse.on("end", () => {
        res.statusCode = apiResponse.statusCode || 502;

        try {
          const result = JSON.parse(data);

          if (apiResponse.statusCode < 200 ||
              apiResponse.statusCode >= 300) {
            return res.end(JSON.stringify({
              success: false,
              message: result.message || "Downloader API request failed"
            }));
          }

          const media = Array.isArray(result.media) ? result.media : [];

          return res.end(JSON.stringify({
            success: true,
            media: media.map(item => ({
              type: item.type,
              quality: item.quality,
              thumbnail: item.thumbnail,
              url: item.url
            }))
          }));
        } catch {
          return res.end(JSON.stringify({
            success: false,
            message: "Unexpected response from downloader API"
          }));
        }
      });
    });

    apiRequest.setTimeout(20000, () => apiRequest.destroy());

    apiRequest.on("error", () => {
      if (!res.writableEnded) {
        res.statusCode = 502;
        res.end(JSON.stringify({
          success: false,
          message: "Could not connect to downloader API"
        }));
      }
    });

    return apiRequest.end();
  }

  res.statusCode = 404;
  res.end(JSON.stringify({
    success: false,
    message: "Route not found"
  }));
});

server.listen(PORT, () => {
  console.log("ReelSaver server running on port " + PORT);
});
