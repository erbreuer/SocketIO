// Admin Dashboard Client
let socket = null;
let statsInterval = null;

// Login function with password middleware
function login() {
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("loginError");

  if (!password) {
    errorDiv.textContent = "Bitte Passwort eingeben!";
    errorDiv.style.display = "block";
    return;
  }

  // Connect to admin namespace with password in auth
  socket = io("/admin", {
    auth: {
      password: password,
    },
  });

  socket.on("connect", () => {
    console.log("Admin connected:", socket.id);
    // Hide login, show dashboard
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    updateStatus("connected");

    // Request initial stats
    refreshStats();
    // Stats will be pushed automatically via 'stats' event
  });

  socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
    errorDiv.textContent = err.message || "Verbindungsfehler!";
    errorDiv.style.display = "block";
    // Reset socket
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Admin disconnected:", reason);
    updateStatus("disconnected");
  });

  socket.on("reconnect", () => {
    console.log("Admin reconnected");
    updateStatus("connected");
    refreshStats();
  });

  // Listen for stats updates from server
  socket.on("stats", (data) => {
    updateDashboard(data);
  });
}

// Refresh stats from server
function refreshStats() {
  if (!socket || !socket.connected) {
    console.log("Socket not connected, cannot refresh stats");
    return;
  }

  socket.emit("getStats", (stats) => {
    console.log("Received stats:", stats);
    updateDashboard(stats);
  });
}

// Update dashboard with received stats
function updateDashboard(stats) {
  if (!stats) return;

  // Update namespaces list
  const namespacesList = document.getElementById("namespacesList");
  if (stats.namespaces && stats.namespaces.length > 0) {
    namespacesList.innerHTML = stats.namespaces
      .map((ns) => `<div>${ns.name} (${ns.sockets} sockets)</div>`)
      .join("");
  } else {
    namespacesList.innerHTML = "<p>Keine Namespaces gefunden</p>";
  }

  // Update connected count
  document.getElementById("connectedCount").textContent =
    stats.totalSockets || 0;

  // Update total messages
  document.getElementById("totalMessages").textContent =
    stats.totalMessages || 0;

  // Update socket table
  const tableBody = document.getElementById("socketTableBody");
  if (stats.sockets && stats.sockets.length > 0) {
    tableBody.innerHTML = stats.sockets
      .map(
        (s) => `
        <tr>
          <td>${s.id}</td>
          <td>${s.namespace}</td>
          <td>${s.rooms.filter((r) => r !== s.id).join(", ") || "keine"}</td>
          <td>${s.messageCount}</td>
          <td>${formatTime(s.connectedAt)}</td>
        </tr>
      `,
      )
      .join("");
  } else {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">Keine verbundenen Sockets</td>
      </tr>
    `;
  }
}

// Update connection status display
function updateStatus(status) {
  const statusDiv = document.getElementById("status");
  if (status === "connected") {
    statusDiv.textContent = "Status: Verbunden";
  } else {
    statusDiv.textContent = "Status: Nicht verbunden";
  }
}

// Format timestamp
function formatTime(timestamp) {
  if (!timestamp) return "unbekannt";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds

  if (diff < 60) return `vor ${diff}s`;
  if (diff < 3600) return `vor ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`;
  return date.toLocaleString("de-DE");
}

// Allow login with Enter key
document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        login();
      }
    });
    passwordInput.focus();
  }
});
