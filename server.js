const http = require("http");

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/") {
    res.end(JSON.stringify({
      success: true,
      message: "ReelSaver Backend is Running!"
    }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({
      success: false,
      message: "Route not found"
    }));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("ReelSaver server running on port " + PORT);
});
