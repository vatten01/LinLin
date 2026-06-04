const gameRoot = document.getElementById("memory-game");
const moveCountNode = document.getElementById("move-count");
const messageNode = document.getElementById("game-message");
const resetButton = document.getElementById("reset-game");

const labels = [
  "rust",
  "tijd",
  "luister",
  "eerlijk",
  "ruimte",
  "zacht"
];

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matches = 0;

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function updateMoves() {
  moveCountNode.textContent = String(moves);
}

function setMessage(text) {
  messageNode.textContent = text;
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function finishGame() {
  setMessage("Netjes. Alles gevonden.");
}

function handleMatch() {
  firstCard.dataset.matched = "true";
  secondCard.dataset.matched = "true";
  matches += 1;

  if (matches === labels.length) {
    finishGame();
  } else {
    setMessage("Nice. Nog een paar.");
  }

  resetTurn();
}

function handleMiss() {
  lockBoard = true;
  setMessage("Bijna. Nog eens.");

  window.setTimeout(() => {
    firstCard.dataset.flipped = "false";
    secondCard.dataset.flipped = "false";
    resetTurn();
  }, 700);
}

function onCardPress(button) {
  if (lockBoard || button === firstCard || button.dataset.matched === "true") {
    return;
  }

  button.dataset.flipped = "true";

  if (!firstCard) {
    firstCard = button;
    return;
  }

  secondCard = button;
  moves += 1;
  updateMoves();

  if (firstCard.dataset.value === secondCard.dataset.value) {
    handleMatch();
    return;
  }

  handleMiss();
}

function createCard(value) {
  const button = document.createElement("button");
  button.className = "game-card";
  button.type = "button";
  button.dataset.value = value;
  button.dataset.flipped = "false";
  button.dataset.matched = "false";
  button.setAttribute("aria-label", `Kaart ${value}`);
  button.innerHTML = `
    <span class="game-card-face game-card-front">?</span>
    <span class="game-card-face game-card-back">${value}</span>
  `;
  button.addEventListener("click", () => onCardPress(button));
  return button;
}

function renderGame() {
  const deck = shuffle([...labels, ...labels]);
  gameRoot.innerHTML = "";

  deck.forEach((value) => {
    gameRoot.appendChild(createCard(value));
  });
}

function initGame() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  moves = 0;
  matches = 0;
  updateMoves();
  setMessage("Klaar voor een makkelijke win.");
  renderGame();
}

resetButton.addEventListener("click", initGame);

initGame();
