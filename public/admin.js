// Admin Dashboard Client
let socket = null; // Socket for /admin namespace (stats, authentication)
let broadcastSocket = null; // Socket for default namespace (broadcasting)
let statsInterval = null;

// Initialize broadcast socket immediately
broadcastSocket = io("http://localhost:3000");

function sendFromAdminDashboard() {
  const message = document.getElementById("broadcastMessage").value;
  console.log(message);

  broadcastSocket.emit(
    "message",
    {
      room: null,
      message,
    },
    (ack) => {
      console.log("Message delivered globally:", ack);
    },
  );
}

// Connect to admin namespace with password in auth
adminSocket = io("/admin", {
  auth: {
    password: password,
  },
});

adminSocket.on("connect", () => {
  console.log("Admin connected:", socket.id);
  // Hide login, show dashboard
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  // Request initial stats
  refreshStats();
  // Stats will be pushed automatically via 'stats' event
});

adminSocket.on("stats", (data) => {
  updateDashboard(data);
});

// Refresh stats from server
function refreshStats() {
  if (!adminSocket || !adminSocket.connected) {
    console.log("Socket not connected, cannot refresh stats");
    return;
  }

  adminSocket.emit("getStats", (stats) => {
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
        </tr>
      `,
      )
      .join("");
  } else {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4">Keine verbundenen Sockets</td>
      </tr>
    `;
  }
}

function login() {
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("loginError");

  if (!password) {
    errorDiv.textContent = "Bitte Passwort eingeben!";
    errorDiv.style.display = "block";
    return;
  }
}
