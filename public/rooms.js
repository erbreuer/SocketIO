const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);
  getTransportInformation();
});

function getTransportInformation() {
  const transport = socket.io.engine.transport.name;
  console.log("Starting Protocol:", transport);
  socket.io.engine.on("upgrade", (transport) => {
    console.log("Upgraded to:", transport.name);
  });
}

let currentRoom = "";

function joinRoom(roomNumber) {
  currentRoom = `room${roomNumber}`;
  socket.emit("joinRoom", currentRoom, (callback) => {
    console.log(`Successfully joined room: ${callback}`);
    // Update header to show current room
    const header = document.querySelector("h1");
    header.textContent = `Rooms in Socket IO - Aktueller Raum: ${callback}`;
    // Show leave button
    document.getElementById("leaveBtn").style.display = "inline-block";
  });
  console.log(`Joining room: ${currentRoom}`);
}

function leaveRoom() {
  if (!currentRoom) {
    console.log("Not in any room");
    return;
  }

  socket.emit("leaveRoom", currentRoom, (callback) => {
    console.log(`Left room: ${callback}`);
    currentRoom = "";
    // Update header to show no room
    const header = document.querySelector("h1");
    header.textContent = `Rooms in Socket IO`;
    // Hide leave button
    document.getElementById("leaveBtn").style.display = "none";
  });
}

function sendMessage() {
  const message = document.getElementById("msg").value;

  if (!message.trim()) return;

  socket.emit("message", {
    room: currentRoom || null,
    message,
  });

  document.getElementById("msg").value = "";
}

socket.on("message", (msg) => {
  const li = document.createElement("li");
  li.textContent = msg;
  document.getElementById("messages").appendChild(li);
});
