const socket = io("http://localhost:3000");

let messageCounter = 0;

socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);
  getTransportInformation();
  updateConnectButton();
});

function getTransportInformation() {
  const transport = socket.io.engine.transport.name;
  console.log("Starting Protocol:", transport);

  socket.io.engine.on("upgrade", (transport) => {
    console.log("Upgraded to:", transport.name);
  });
}

function sendMessage() {
  messageCounter++;
  const messageId = `msg-${messageCounter}`;
  const ul = document.getElementById("messageList");
  const li = createMessageListItem(messageId);
  ul.appendChild(li);

  // Send message with acknowledgment callback
  socket.emit("hello", "Hallo vom Client!", (response) => {
    console.log(response);
    if (response) {
      const ackCheckbox = document.getElementById(`${messageId}-ack`);
      if (ackCheckbox) {
        ackCheckbox.checked = true;
      }
    }
  });
}

socket.on("connect", () => {
  setStatus("connected");
  updateConnectButton();
});
socket.on("disconnect", () => {
  setStatus("disconnected");
  updateConnectButton();
});
socket.on("reconnect_attempt", () => setStatus("reconnecting..."));
socket.on("reconnect", () => setStatus("reconnected"));

function toggleConnection() {
  if (socket.connected) {
    socket.disconnect();
    console.log("Disconnected from server");
  } else {
    socket.connect();
    console.log("Connecting to server...");
  }
  updateConnectButton();
}



function createMessageListItem(messageId) {
  const li = document.createElement("li");
  li.id = messageId;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `${messageId}-ack`;
  checkbox.disabled = true;

  const textSpan = document.createElement("span");
  textSpan.textContent = "Nachricht gesendet - ";

  const checkboxLabel = document.createElement("label");
  checkboxLabel.htmlFor = `${messageId}-ack`;
  checkboxLabel.textContent = "Antwort vom Server erhalten";

  li.appendChild(textSpan);
  li.appendChild(checkbox);
  li.appendChild(document.createTextNode(" "));
  li.appendChild(checkboxLabel);

  return li;
}



function updateConnectButton() {
  const btn = document.getElementById("connectBtn");
  if (socket.connected) {
    btn.textContent = "Disconnect";
  } else {
    btn.textContent = "Connect";
  }
}

function setStatus(text) {
  document.getElementById("status").textContent = text;
}

