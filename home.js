const boardRoot = document.getElementById("oxo-board");
const moveCountNode = document.getElementById("move-count");
const currentPlayerNode = document.getElementById("current-player");
const messageNode = document.getElementById("game-message");
const resetButton = document.getElementById("reset-game");

const size = 3;
const players = [
  { key: "rose", label: "Roos", symbol: "O" },
  { key: "cream", label: "Lichtbruin", symbol: "X" },
];
const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let board = [];
let currentPlayerIndex = 0;
let moves = 0;
let gameOver = false;

function setMessage(text) {
  messageNode.textContent = text;
}

function updateMoves() {
  moveCountNode.textContent = String(moves);
}

function updateCurrentPlayer() {
  currentPlayerNode.textContent = players[currentPlayerIndex].label;
}

function createBoard() {
  return Array(size * size).fill(null);
}

function hasWinner(playerKey) {
  return winningLines.some((line) =>
    line.every((cellIndex) => board[cellIndex] === playerKey),
  );
}

function syncBoardToUi() {
  const cells = boardRoot.querySelectorAll(".oxo-cell");

  cells.forEach((cell) => {
    const index = Number(cell.dataset.index);
    const value = board[index];
    const player = players.find((item) => item.key === value);

    cell.dataset.state = value || "empty";
    cell.textContent = player ? player.symbol : "";
  });
}

function switchPlayer() {
  currentPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
  updateCurrentPlayer();
}

function handleCellPress(index) {
  if (gameOver || board[index]) {
    return;
  }

  const player = players[currentPlayerIndex];
  board[index] = player.key;
  moves += 1;
  updateMoves();
  syncBoardToUi();

  if (hasWinner(player.key)) {
    gameOver = true;
    setMessage(`${player.label} wint`);
    return;
  }

  if (moves === board.length) {
    gameOver = true;
    setMessage("Gelijkspel");
    return;
  }

  switchPlayer();
  setMessage("");
}

function createCell(index) {
  const button = document.createElement("button");
  button.className = "oxo-cell";
  button.type = "button";
  button.dataset.index = String(index);
  button.dataset.state = "empty";
  button.setAttribute("aria-label", `Vakje ${index + 1}`);
  button.addEventListener("click", () => handleCellPress(index));
  return button;
}

function renderBoard() {
  boardRoot.innerHTML = "";

  for (let index = 0; index < size * size; index += 1) {
    boardRoot.appendChild(createCell(index));
  }
}

function initGame() {
  board = createBoard();
  currentPlayerIndex = 0;
  moves = 0;
  gameOver = false;
  updateMoves();
  updateCurrentPlayer();
  setMessage("");
  renderBoard();
}

resetButton.addEventListener("click", initGame);

initGame();
