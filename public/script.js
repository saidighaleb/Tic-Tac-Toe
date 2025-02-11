const socket = io();
let roomId = null;
let playerRole = null;
let playerName = "";

// DOM Elements
const registrationDiv = document.getElementById("registration");
const gameDiv = document.getElementById("game");
const gameLinkInput = document.getElementById("gameLink");
const boardDiv = document.getElementById("board");
const currentPlayerSpan = document.getElementById("currentPlayer");
const winnerModal = document.getElementById("winnerModal");
const winnerText = document.getElementById("winnerText");
const playerXScore = document.getElementById("playerXScore");
const playerOScore = document.getElementById("playerOScore");

// Initialize board cells
for (let i = 0; i < 9; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.setAttribute("data-index", i);
  cell.addEventListener("click", () => handleMove(i));
  boardDiv.appendChild(cell);
}

// Game Functions
function createGame() {
  playerName = document.getElementById("playerName").value.trim();
  if (!playerName) return alert("Please enter your name!");
  socket.emit("registerPlayer", { playerName });
}

function joinGame() {
  playerName = document.getElementById("playerName").value.trim();
  const roomIdInput = document.getElementById("roomId").value.trim();
  if (!playerName || !roomIdInput) return alert("Fill all fields!");
  socket.emit("registerPlayer", { playerName, roomId: roomIdInput });
}

function handleMove(index) {
  if (playerRole === currentPlayerSpan.textContent && !document.querySelector(`.cell[data-index="${index}"]`).textContent) {
    socket.emit("move", { roomId, index });
  }
}

function resetGame() {
  socket.emit("resetGame", roomId);
}

function copyLink() {
  gameLinkInput.select();
  document.execCommand("copy");
  alert("Link copied!");
}

// Socket.IO Listeners
socket.on("gameCreated", (data) => {
  roomId = data.roomId;
  playerRole = data.role;
  registrationDiv.style.display = "none";
  gameDiv.style.display = "block";
  gameLinkInput.value = `${window.location.href}?room=${roomId}`;
});

socket.on("gameStarted", (data) => {
  playerRole = Object.values(data.players).find(p => p.name === playerName).role;
  currentPlayerSpan.textContent = data.currentPlayer;
  updateScoreboard(data.scores);
});

socket.on("updateGame", (data) => {
  data.board.forEach((cell, index) => {
    document.querySelector(`.cell[data-index="${index}"]`).textContent = cell;
  });
  currentPlayerSpan.textContent = data.currentPlayer;
  updateScoreboard(data.scores);

  if (data.winner) {
    winnerModal.style.display = "flex";
    winnerText.textContent = data.winner === "draw" 
      ? "It's a draw!" 
      : `${data.players[data.winner]} wins!`;
  }
});

function updateScoreboard(scores) {
  playerXScore.textContent = `Player X: ${scores.X}`;
  playerOScore.textContent = `Player O: ${scores.O}`;
}

// Close winner modal on click
winnerModal.addEventListener("click", () => {
  winnerModal.style.display = "none";
});