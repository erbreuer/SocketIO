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

function joinRoom() {
  currentRoom = document.getElementById("room").value;
  socket.emit("joinRoom", currentRoom);
}

function sendMessage() {
  const message = document.getElementById("msg").value;

  socket.emit("message", {
    room: currentRoom,
    message,
  });
}

socket.on("message", (msg) => {
  const li = document.createElement("li");
  li.textContent = msg;
  document.getElementById("messages").appendChild(li);
});
