import http from "http";
import path from "path";
import { readFile } from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { Server } from "socket.io";

const httpServer = http.createServer((req, res) => {
  let filePath;

  if (req.url === "/") {
    filePath = "./public/intro.html";
  } else if (req.url === "/room") {
    filePath = "./public/index.html";
  } else {
    filePath = `./public${req.url}`;
  }

  readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Datei nicht gefunden");
    }

    const ext = path.extname(filePath);
    let contentType = "text/plain";
    if (ext === ".html") contentType = "text/html";
    if (ext === ".js") contentType = "application/javascript";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log("user connected");
  console.log("connected with", socket.conn.transport.name);
  socket.conn.on("upgrade", (transport) => {
    console.log("upgraded to", transport.name);
  });

  socket.on("hello", (arg, callback) => {
    console.log(arg); 
    callback("Hello from server!"); 
  });

  socket.on("joinRoom", (room) => {
    socket.join(room);
  });

  socket.on("message", ({ room, message }) => {
    io.to(room).emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

httpServer.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
