const socket = io();
const cells = document.querySelectorAll(".cell");
const currentPlayerElement = document.getElementById("current-player");
const resetButton = document.getElementById("reset");

let playerRole = null;

// Set player role
socket.on("playerRole", (role) => {
  playerRole = role;
  alert(`You are Player ${role}`);
});

// Update board
socket.on("updateBoard", ({ index, player }) => {
  cells[index].textContent = player;
});

// Change turn
socket.on("changeTurn", (player) => {
  currentPlayerElement.textContent = player;
});

// Reset game
socket.on("resetGame", () => {
  cells.forEach((cell) => (cell.textContent = ""));
  currentPlayerElement.textContent = "X";
});

// Handle cell clicks
cells.forEach((cell) => {
  cell.addEventListener("click", () => {
    if (!cell.textContent && playerRole === currentPlayerElement.textContent) {
      const index = cell.getAttribute("data-index");
      socket.emit("move", index);
    }
  });
});

// Handle reset button
resetButton.addEventListener("click", () => {
  socket.emit("reset");
});

// Display the game link
const gameLinkInput = document.getElementById("game-link");
gameLinkInput.value = window.location.href;

// Copy link to clipboard
function copyLink() {
  gameLinkInput.select();
  document.execCommand("copy");
  alert("Link copied to clipboard!");
}