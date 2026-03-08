import http from "http";
import path from "path";
import { readFile } from "fs";
import { Server } from "socket.io";

const httpServer = http.createServer((req, res) => {
  let filePath;
  if (req.url === "/") {
    filePath = "./public/intro.html";
  } else if (req.url === "/room") {
    filePath = "./public/rooms.html";
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
    if (typeof callback === "function") {
      callback("Hello from server!");
    }
  });

  socket.on("joinRoom", (room, callback) => {
    console.log(`Socket ${socket.id} joined room: ${room}`);
    socket.join(room);
    if (typeof callback === "function") {
      callback(room);
    }
  });

  socket.on("leaveRoom", (room, callback) => {
    console.log(`Socket ${socket.id} left room: ${room}`);
    socket.leave(room);
    if (typeof callback === "function") {
      callback(room);
    }
  });

  socket.on("message", ({ room, message }, callback) => {
    if (room) {
      // Broadcast message to all clients in the room
      io.to(room).emit("message", message);
    } else {
      socket.broadcast.emit(
        "message",
        `User mit id: ${socket.id} hat gesendet:`,
      );
      io.emit("message", message);
    }
    // Send acknowledgment back to sender
    if (typeof callback === "function") {
      callback("Message received by server");
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

httpServer.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
