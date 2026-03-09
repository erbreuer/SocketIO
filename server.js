import http from "http";
import path from "path";
import { readFile } from "fs";
import { Server } from "socket.io";

const ADMIN_PASSWORD = "admin123";
const messageStats = new Map();

const httpServer = http.createServer((req, res) => {
  const routes = {
    "/": "./public/intro.html",
    "/rooms": "./public/rooms.html",
    "/admin": "./public/admin.html",
  };
  const filePath = routes[req.url] || `./public${req.url}`;
  readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Datei nicht gefunden");
    }
    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
    };
    const contentType = contentTypes[ext] || "text/plain";
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

  socket.on("joinRoom", (room, callback) => {
    console.log(`Socket ${socket.id} joined room: ${room}`);
    socket.join(room);
    if (typeof callback === "function") {
      callback(room);
    }
    // Broadcast updated stats to admins
    broadcastStatsToAdmins();
  });

  socket.on("leaveRoom", (room, callback) => {
    console.log(`Socket ${socket.id} left room: ${room}`);
    socket.leave(room);
    if (typeof callback === "function") {
      callback(room);
    }
    // Broadcast updated stats to admins
    broadcastStatsToAdmins();
  });

  socket.on("message", ({ room, message }, callback) => {
    if (room) {
      // Broadcast message to all clients in the room
      io.to(room).emit("message", `User ${socket.id}: ${message} (from ${room})`);
    } else {
      // Broadcast globally excluding the sender
      socket.broadcast.emit(
        "message",
        `User ${socket.id}: ${message}`,
      );
      // Send message to back to sender
      socket.emit("message", message);
    }
    // Send acknowledgment back to sender
    if (typeof callback === "function") {
      callback("Message received by server");
    }

    const currentCount = messageStats.get(socket.id) || 0;
    messageStats.set(socket.id, currentCount + 1);
    broadcastStatsToAdmins();
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    broadcastStatsToAdmins();
  });

  messageStats.set(socket.id, 0);
  broadcastStatsToAdmins();
});

const adminNamespace = io.of("/admin");
//default namespace: io.of("/") 

adminNamespace.use((socket, next) => {
  const password = socket.handshake.auth.password;

  if (password === ADMIN_PASSWORD) {
    console.log("Admin authenticated:", socket.id);
    next();
  } else {
    console.log("Admin authentication failed");
    next(new Error("Wrong Password!"));
  }
});

function broadcastStatsToAdmins() {
  const stats = getServerStats();
  adminNamespace.emit("stats", stats);
}

adminNamespace.on("connection", (socket) => {
  console.log("Admin connected:", socket.id);

  // Send stats on request
  socket.on("getStats", (callback) => {
    const stats = getServerStats();
    if (typeof callback === "function") {
      callback(stats);
    }
  });

  socket.on("disconnect", () => {
    console.log("Admin disconnected:", socket.id);
  });
});

function getServerStats() {
  const namespaces = [];
  let totalSockets = 0;
  let totalMessages = 0;
  const socketDetails = [];

  // Only get stats for default namespace '/'
  const mainNamespace = io.of("/");
  const adminNamespace = io.of("/admin");
  const sockets = Array.from(mainNamespace.sockets.values());
  const adminSockets = Array.from(adminNamespace.sockets.values());
  namespaces.push({
    name: "/",
    sockets: sockets.length,
  });
  namespaces.push({
    name: "/admin",
    sockets: adminSockets.length,
  });

  totalSockets = sockets.length + adminSockets.length;

  // Get details for each socket in default namespace
  sockets.forEach((sock) => {
    const messageCount = messageStats.get(sock.id) || 0;
    totalMessages += messageCount;

    socketDetails.push({
      id: sock.id,
      namespace: "/",
      rooms: Array.from(sock.rooms),
      messageCount: messageCount,
      connectedAt: sock.handshake.time || Date.now(),
    });
  });

  // Get details for each socket in admin namespace
  adminSockets.forEach((sock) => {
    const messageCount = messageStats.get(sock.id) || 0;
    totalMessages += messageCount;

    socketDetails.push({
      id: sock.id,
      namespace: "/admin",
      rooms: Array.from(sock.rooms),
      messageCount: messageCount,
    });
  });

  return {
    namespaces,
    totalSockets,
    totalMessages,
    sockets: socketDetails,
  };
}

httpServer.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
