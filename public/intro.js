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

function sendMessage() {
  socket.emit("hello", "Hallo vom Client!", (response) => {
    console.log(response);
  });
}

function setStatus(text) {
  document.getElementById("status").textContent = text;
}
socket.on("connect", () => setStatus("connected"));
socket.on("disconnect", () => setStatus("disconnected"));
socket.io.on("reconnect_attempt", () => setStatus("reconnecting..."));
socket.io.on("reconnect", () => setStatus("reconnected"));