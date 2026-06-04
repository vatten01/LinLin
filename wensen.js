const storageKey = "romantic-repair-list-v3";
const defaultWishes = [];

const form = document.getElementById("wish-form");
const input = document.getElementById("wish-input");
const list = document.getElementById("wish-list");
const counter = document.getElementById("wish-counter");
const helper = document.getElementById("wish-helper");
const downloadButton = document.getElementById("download-wishes");
const importInput = document.getElementById("import-wishes");

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

function setHelper(text) {
  helper.textContent = text;
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
  counter.textContent = `${openCount} ${openCount === 1 ? "ding" : "dingen"}`;
}

function addWish(text) {
  wishes.unshift({
    id: Date.now(),
    text,
    done: false,
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
      done: !wish.done,
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

function downloadWishes() {
  const backup = {
    exportedAt: new Date().toISOString(),
    wishes,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "wat-we-kunnen-doen-back-up.json";
  link.click();
  window.URL.revokeObjectURL(url);
  setHelper("Back-up gedownload.");
}

function isValidWish(item) {
  return (
    item &&
    typeof item.id === "number" &&
    typeof item.text === "string" &&
    typeof item.done === "boolean"
  );
}

function importWishes(file) {
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const imported = Array.isArray(parsed) ? parsed : parsed.wishes;

      if (!Array.isArray(imported) || !imported.every(isValidWish)) {
        throw new Error("invalid");
      }

      wishes = imported;
      saveWishes();
      renderWishes();
      setHelper("Back-up geladen.");
    } catch {
      setHelper("Kan back-up niet laden.");
    }
  });

  reader.readAsText(file);
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

downloadButton.addEventListener("click", downloadWishes);

importInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  importWishes(file);
  importInput.value = "";
});

renderWishes();
