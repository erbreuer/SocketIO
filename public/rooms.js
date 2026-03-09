const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);
});

const joinedRooms = new Set();

function joinRoom(roomNumber) {
  const roomName = `room${roomNumber}`;
  socket.emit("joinRoom", roomName, (callback) => {
    console.log(`Successfully joined room: ${callback}`);
    // Add to joined rooms set
    joinedRooms.add(roomName);
    // Show corresponding leave button
    document.getElementById(`leaveBtn${roomNumber}`).style.display =
      "inline-block";
    // Update status
    updateRoomStatus();
  });
  console.log(`Joining room: ${roomName}`);
}

function leaveRoom(roomNumber) {
  const roomName = `room${roomNumber}`;

  if (!joinedRooms.has(roomName)) {
    console.log(`Not in ${roomName}`);
    return;
  }

  socket.emit("leaveRoom", roomName, (callback) => {
    console.log(`Left room: ${callback}`);
    // Remove from joined rooms set
    joinedRooms.delete(roomName);
    // Hide corresponding leave button
    document.getElementById(`leaveBtn${roomNumber}`).style.display = "none";
    // Update status
    updateRoomStatus();
  });
}

function updateRoomStatus() {
  const statusElement = document.getElementById("roomStatus");
  if (joinedRooms.size === 0) {
    statusElement.textContent = "Aktuelle Räume: keine";
  } else {
    statusElement.textContent = `Aktuelle Räume: ${Array.from(joinedRooms).join(", ")}`;
  }
}

function sendMessage() {
  const message = document.getElementById("msg").value;

  if (!message.trim()) return;
  if (joinedRooms.size > 0) {
    joinedRooms.forEach((room) => {
      socket.emit(
        "message",
        {
          room: room,
          message,
        },
        (ack) => {
          console.log(`Message delivered to ${room}:`, ack);
        },
      );
    });
  } else {
    // No room
    socket.emit(
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

  document.getElementById("msg").value = "";
}

socket.on("message", (msg) => {
  const li = document.createElement("li");
  li.textContent = msg;
  document.getElementById("messages").appendChild(li);
});
