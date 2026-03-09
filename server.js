import http from "http";
import path from "path";
import { readFile } from "fs";
import { Server } from "socket.io";

// Admin password (in production: use environment variable!)
const ADMIN_PASSWORD = "admin123";

// Track message counts per socket
const messageStats = new Map();

const httpServer = http.createServer((req, res) => {
  let filePath;
  if (req.url === "/") {
    filePath = "./public/intro.html";
  } else if (req.url === "/room") {
    filePath = "./public/rooms.html";
  } else if (req.url === "/admin") {
    filePath = "./public/admin.html";
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
    if (ext === ".css") contentType = "text/css";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

const io = new Server(httpServer);

// Admin namespace with password middleware
const adminNamespace = io.of("/admin");

// Helper function to broadcast stats to all admins
function broadcastStatsToAdmins() {
  const stats = getServerStats();
  adminNamespace.emit("stats", stats);
}

adminNamespace.use((socket, next) => {
  const password = socket.handshake.auth.password;

  if (password === ADMIN_PASSWORD) {
    console.log("Admin authenticated:", socket.id);
    next();
  } else {
    console.log("Admin authentication failed");
    next(new Error("Falsches Passwort!"));
  }
});

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

// Helper function to gather server statistics
function getServerStats() {
  const namespaces = [];
  let totalSockets = 0;
  let totalMessages = 0;
  const socketDetails = [];

  // Only get stats for default namespace '/'
  const mainNamespace = io.of("/");
  const sockets = Array.from(mainNamespace.sockets.values());

  namespaces.push({
    name: "/",
    sockets: sockets.length,
  });

  totalSockets = sockets.length;

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

  return {
    namespaces,
    totalSockets,
    totalMessages,
    sockets: socketDetails,
  };
}

// Main namespace (default)
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
    // Increment message count for this socket
    const currentCount = messageStats.get(socket.id) || 0;
    messageStats.set(socket.id, currentCount + 1);

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
    // Broadcast updated stats to admins (message count changed)
    broadcastStatsToAdmins();
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    // Clean up message stats after disconnect (optional: keep for history)
    // messageStats.delete(socket.id);
    // Broadcast updated stats to admins
    broadcastStatsToAdmins();
  });
  
  messageStats.set(socket.id, 0);
  broadcastStatsToAdmins();
});

httpServer.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
