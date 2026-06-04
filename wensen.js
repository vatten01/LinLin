const storageKey = "romantic-repair-list-v3";

const defaultWishes = [
  { id: 1, text: "Mij rustig bellen als ze klaar is om te praten", done: false },
  { id: 2, text: "Eerlijk zeggen wat haar dwarszit", done: false },
  { id: 3, text: "Mij laten uitpraten zonder te onderbreken", done: false },
  { id: 4, text: "Een rustig moment kiezen om af te spreken", done: false },
  { id: 5, text: "Samen wandelen en alles kalm bespreken", done: false },
  { id: 6, text: "Zeggen wat ze nodig heeft om zich beter te voelen", done: false },
  { id: 7, text: "Een lief bericht sturen als eerste stap", done: false },
  { id: 8, text: "Samen iets kleins en gezelligs doen", done: false },
  { id: 9, text: "Niet boos weglopen maar het gesprek afmaken", done: false },
  { id: 10, text: "Een knuffel geven als woorden lastig zijn", done: false },
  { id: 11, text: "Samen koffie drinken en rustig praten", done: false },
  { id: 12, text: "Een wandeling maken zonder telefoons", done: false },
  { id: 13, text: "Samen iets lekkers eten of bestellen", done: false },
  { id: 14, text: "Een filmavond houden en gewoon dicht bij elkaar zijn", done: false }
];

const form = document.getElementById("wish-form");
const input = document.getElementById("wish-input");
const list = document.getElementById("wish-list");
const counter = document.getElementById("wish-counter");

let wishes = loadWishes();

function loadWishes() {
  const saved = window.localStorage.getItem(storageKey);

  if (!saved) {
    return defaultWishes;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultWishes;
  } catch {
    return defaultWishes;
  }
}

function saveWishes() {
  window.localStorage.setItem(storageKey, JSON.stringify(wishes));
}

function renderWishes() {
  list.innerHTML = "";

  wishes.forEach((wish) => {
    const item = document.createElement("li");
    item.className = `wish-item${wish.done ? " done" : ""}`;

    const checkWrap = document.createElement("label");
    checkWrap.className = "wish-check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = wish.done;
    checkbox.setAttribute("aria-label", `Vink "${wish.text}" af`);
    checkbox.addEventListener("change", () => toggleWish(wish.id));

    const checkMark = document.createElement("span");
    checkMark.className = "wish-check-mark";

    const text = document.createElement("span");
    text.className = "wish-item-text";
    text.textContent = wish.text;

    const removeButton = document.createElement("button");
    removeButton.className = "wish-remove";
    removeButton.type = "button";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", `Verwijder "${wish.text}"`);
    removeButton.addEventListener("click", () => removeWish(wish.id));

    checkWrap.append(checkbox, checkMark);
    item.append(checkWrap, text, removeButton);
    list.appendChild(item);
  });

  const openCount = wishes.filter((wish) => !wish.done).length;
  counter.textContent = `${openCount} ${openCount === 1 ? "idee" : "ideeen"} over`;
}

function addWish(text) {
  wishes.unshift({
    id: Date.now(),
    text,
    done: false
  });

  saveWishes();
  renderWishes();
}

function toggleWish(id) {
  wishes = wishes.map((wish) => {
    if (wish.id !== id) {
      return wish;
    }

    return {
      ...wish,
      done: !wish.done
    };
  });

  saveWishes();
  renderWishes();
}

function removeWish(id) {
  wishes = wishes.filter((wish) => wish.id !== id);
  saveWishes();
  renderWishes();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    return;
  }

  addWish(text);
  form.reset();
  input.focus();
});

renderWishes();
