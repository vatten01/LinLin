const bag = document.getElementById("punching-bag");
const hitCountNode = document.getElementById("hit-count");
const resetButton = document.getElementById("reset-bag");
const uploadInput = document.getElementById("bag-upload");
const clearPhotoButton = document.getElementById("clear-photo");
const bagPhoto = document.getElementById("bag-photo");
const photoPicker = document.getElementById("photo-picker");
const noteNode = document.getElementById("stress-note");
const impactText = document.getElementById("impact-text");
const impactRing = document.getElementById("impact-ring");
const photoListStorageKey = "stress-bag-photos-v2";
const selectedPhotoStorageKey = "stress-bag-selected-v2";

const notes = [
  "Nog een keer.",
  "Beter.",
  "Laat het eruit.",
  "Rustig door.",
  "Prima.",
  "Even los."
];

const impacts = ["bam", "pow", "boem", "tjak", "pak"];

let hits = 0;
let photos = [];
let selectedPhoto = "";

function savePhotos() {
  try {
    window.localStorage.setItem(photoListStorageKey, JSON.stringify(photos));
    window.localStorage.setItem(selectedPhotoStorageKey, selectedPhoto);
  } catch {
    noteNode.textContent = "Foto's konden niet opgeslagen worden.";
  }
}

function setPhoto(src) {
  bagPhoto.src = src;
}

function setSelectedPhoto(src) {
  selectedPhoto = src;
  setPhoto(src || bagPhoto.dataset.defaultSrc || "stress-photo.svg");
  renderPhotoPicker();
  savePhotos();
}

function renderPhotoPicker() {
  photoPicker.innerHTML = "";

  if (!photos.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "photo-picker-empty";
    emptyState.textContent = "Nog geen foto's gekozen.";
    photoPicker.appendChild(emptyState);
    return;
  }

  photos.forEach((photoSrc, index) => {
    const button = document.createElement("button");
    button.className = `photo-thumb${photoSrc === selectedPhoto ? " active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", `Kies foto ${index + 1}`);

    const image = document.createElement("img");
    image.src = photoSrc;
    image.alt = `Gekozen foto ${index + 1}`;

    button.appendChild(image);
    button.addEventListener("click", () => {
      setSelectedPhoto(photoSrc);
      noteNode.textContent = `Foto ${index + 1} actief.`;
    });
    photoPicker.appendChild(button);
  });
}

function loadSavedPhotos() {
  try {
    const savedPhotos = window.localStorage.getItem(photoListStorageKey);
    const savedSelected = window.localStorage.getItem(selectedPhotoStorageKey);
    const parsedPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];

    if (Array.isArray(parsedPhotos)) {
      photos = parsedPhotos.filter((item) => typeof item === "string" && item);
    }

    if (savedSelected && photos.includes(savedSelected)) {
      selectedPhoto = savedSelected;
    } else if (photos.length) {
      selectedPhoto = photos[0];
    }

    if (selectedPhoto) {
      setPhoto(selectedPhoto);
    }
  } catch {
    noteNode.textContent = "Opgeslagen foto's konden niet geladen worden.";
  }

  renderPhotoPicker();
}

function updateHits() {
  hitCountNode.textContent = String(hits);
}

function setRandomText(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function triggerImpact() {
  bag.classList.remove("is-hit");
  impactText.classList.remove("is-live");
  impactRing.classList.remove("is-live");

  void bag.offsetWidth;

  bag.classList.add("is-hit");
  impactText.textContent = setRandomText(impacts);
  impactText.classList.add("is-live");
  impactRing.classList.add("is-live");
}

function hitBag() {
  hits += 1;
  updateHits();
  noteNode.textContent = setRandomText(notes);
  triggerImpact();
}

function resetBag() {
  hits = 0;
  updateHits();
  noteNode.textContent = "Begin maar.";
  impactText.textContent = "tik";
  bag.classList.remove("is-hit");
  impactText.classList.remove("is-live");
  impactRing.classList.remove("is-live");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string" && reader.result) {
        resolve(reader.result);
        return;
      }

      reject(new Error("Lege afbeelding"));
    });
    reader.addEventListener("error", () => reject(new Error("Kon bestand niet lezen")));
    reader.readAsDataURL(file);
  });
}

async function handlePhotoUpload(event) {
  const files = Array.from(event.target.files || []);

  if (!files.length) {
    return;
  }

  try {
    const uploadedPhotos = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
    photos = [...photos, ...uploadedPhotos];
    selectedPhoto = uploadedPhotos[0] || selectedPhoto;
    setPhoto(selectedPhoto || bagPhoto.dataset.defaultSrc || "stress-photo.svg");
    renderPhotoPicker();
    savePhotos();
    noteNode.textContent = `${uploadedPhotos.length} foto${uploadedPhotos.length === 1 ? "" : "'s"} toegevoegd.`;
  } catch {
    noteNode.textContent = "Foto's konden niet geladen worden.";
  }

  uploadInput.value = "";
}

function clearPhoto() {
  photos = [];
  selectedPhoto = "";
  setPhoto(bagPhoto.dataset.defaultSrc || "stress-photo.svg");
  renderPhotoPicker();
  uploadInput.value = "";

  try {
    window.localStorage.removeItem(photoListStorageKey);
    window.localStorage.removeItem(selectedPhotoStorageKey);
  } catch {
    noteNode.textContent = "Foto's konden niet verwijderd worden.";
    return;
  }

  noteNode.textContent = "Foto's verwijderd.";
}

bag.addEventListener("click", hitBag);
resetButton.addEventListener("click", resetBag);
uploadInput.addEventListener("change", handlePhotoUpload);
clearPhotoButton.addEventListener("click", clearPhoto);

updateHits();
loadSavedPhotos();
