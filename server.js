const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// Game state
const games = {}; // Stores active games by room ID

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Player registration and room creation/joining
  socket.on("registerPlayer", ({ playerName, roomId }) => {
    if (!roomId) {
      // Create new game room
      roomId = `room_${Math.random().toString(36).substr(2, 6)}`;
      games[roomId] = {
        players: { [socket.id]: { name: playerName, role: "X" } },
        board: Array(9).fill(""),
        currentPlayer: "X",
        scores: { X: 0, O: 0 },
      };
      socket.join(roomId);
      socket.emit("gameCreated", { roomId, role: "X" });
    } else if (games[roomId]?.players && Object.keys(games[roomId].players).length < 2) {
      // Join existing room as Player 2
      games[roomId].players[socket.id] = { name: playerName, role: "O" };
      socket.join(roomId);
      io.to(roomId).emit("gameStarted", {
        players: games[roomId].players,
        currentPlayer: "X",
      });
    }
  });

  // Handle moves
  socket.on("move", ({ roomId, index }) => {
    const game = games[roomId];
    if (game && game.board[index] === "" && !game.winner) {
      game.board[index] = game.currentPlayer;
      game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
      
      // Check for win/draw
      const winner = checkWin(game.board);
      if (winner) {
        game.scores[winner]++;
        game.winner = winner;
      } else if (game.board.every(cell => cell !== "")) {
        game.winner = "draw";
      }

      // Broadcast updates
      io.to(roomId).emit("updateGame", {
        board: game.board,
        currentPlayer: game.currentPlayer,
        scores: game.scores,
        winner: game.winner,
      });
    }
  });

  // Reset game
  socket.on("resetGame", (roomId) => {
    const game = games[roomId];
    if (game) {
      game.board = Array(9).fill("");
      game.currentPlayer = "X";
      game.winner = null;
      io.to(roomId).emit("updateGame", {
        board: game.board,
        currentPlayer: game.currentPlayer,
        scores: game.scores,
        winner: game.winner,
      });
    }
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

// Win condition checker
function checkWin(board) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6], // Diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));