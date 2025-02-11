const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

let players = {};
let currentPlayer = "X";

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  // Assign a player (X or O)
  if (Object.keys(players).length === 0) {
    players[socket.id] = "X";
  } else {
    players[socket.id] = "O";
  }

  // Notify players about their roles
  socket.emit("playerRole", players[socket.id]);

  // Handle player moves
  socket.on("move", (index) => {
    // Broadcast the move to all players
    io.emit("updateBoard", { index, player: currentPlayer });
  
    // Switch turns
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    io.emit("changeTurn", currentPlayer);
  });

  // Handle game reset
  socket.on("reset", () => {
    currentPlayer = "X";
    io.emit("resetGame");
  });

  // Handle player disconnect
  socket.on("disconnect", () => {
    console.log("A player disconnected:", socket.id);
    delete players[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});