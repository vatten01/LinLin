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
const linkCurrentFolderButton = document.getElementById("link-current-folder");
const linkDeletedFolderButton = document.getElementById("link-deleted-folder");
const folderStatusNode = document.getElementById("folder-status");

const photoListStorageKey = "stress-bag-photos-v4";
const selectedPhotoStorageKey = "stress-bag-selected-v4";
const supportsDirectoryAccess = typeof window.showDirectoryPicker === "function";

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
let selectedPhotoId = "";
let currentImagesHandle = null;
let deletedImagesHandle = null;

function savePhotos() {
  try {
    window.localStorage.setItem(photoListStorageKey, JSON.stringify(photos));
    window.localStorage.setItem(selectedPhotoStorageKey, selectedPhotoId);
  } catch {
    noteNode.textContent = "Foto's konden niet opgeslagen worden.";
  }
}

function updateFolderStatus() {
  if (!supportsDirectoryAccess) {
    folderStatusNode.textContent = "Map-koppeling wordt door deze browser niet ondersteund.";
    return;
  }

  const currentText = currentImagesHandle ? `current: ${currentImagesHandle.name}` : "current: niet gekoppeld";
  const deletedText = deletedImagesHandle ? `deleted: ${deletedImagesHandle.name}` : "deleted: niet gekoppeld";
  folderStatusNode.textContent = `${currentText} | ${deletedText}`;
}

function setPhoto(src) {
  bagPhoto.src = src || bagPhoto.dataset.defaultSrc || "stress-photo.svg";
}

function getSelectedPhoto() {
  return photos.find((photo) => photo.id === selectedPhotoId) || null;
}

function setSelectedPhoto(id) {
  selectedPhotoId = id;
  const selectedPhoto = getSelectedPhoto();
  setPhoto(selectedPhoto ? selectedPhoto.src : "");
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

  photos.forEach((photo, index) => {
    const card = document.createElement("div");
    card.className = "photo-thumb-card";

    const button = document.createElement("button");
    button.className = `photo-thumb${photo.id === selectedPhotoId ? " active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", `Kies foto ${index + 1}`);

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.name || `Gekozen foto ${index + 1}`;

    const removeButton = document.createElement("button");
    removeButton.className = "photo-thumb-remove";
    removeButton.type = "button";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", `Verwijder foto ${index + 1}`);

    button.appendChild(image);
    button.addEventListener("click", () => {
      setSelectedPhoto(photo.id);
      noteNode.textContent = `Foto ${index + 1} actief.`;
    });

    removeButton.addEventListener("click", async () => {
      await removePhoto(photo.id);
    });

    card.append(button, removeButton);
    photoPicker.appendChild(card);
  });
}

function loadSavedPhotos() {
  try {
    const savedPhotos = window.localStorage.getItem(photoListStorageKey);
    const savedSelected = window.localStorage.getItem(selectedPhotoStorageKey);
    const parsedPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];

    if (Array.isArray(parsedPhotos)) {
      photos = parsedPhotos.filter((item) => item && typeof item.src === "string" && item.src);
    }

    if (savedSelected && photos.some((photo) => photo.id === savedSelected)) {
      selectedPhotoId = savedSelected;
    } else if (photos.length) {
      selectedPhotoId = photos[0].id;
    }
  } catch {
    noteNode.textContent = "Opgeslagen foto's konden niet geladen worden.";
  }

  setPhoto(getSelectedPhoto()?.src || "");
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

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function createUniqueFileName(directoryHandle, name) {
  const dotIndex = name.lastIndexOf(".");
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  const extension = dotIndex > 0 ? name.slice(dotIndex) : "";
  let candidate = name;
  let count = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await directoryHandle.getFileHandle(candidate);
      count += 1;
      candidate = `${base}-${count}${extension}`;
    } catch {
      return candidate;
    }
  }
}

async function writeFileToDirectory(directoryHandle, file) {
  const safeName = sanitizeFileName(file.name || `image-${Date.now()}.png`);
  const fileName = await createUniqueFileName(directoryHandle, safeName);
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  return fileName;
}

async function moveFileToDeleted(photo) {
  if (!currentImagesHandle || !deletedImagesHandle || !photo.fileName) {
    return false;
  }

  try {
    const currentFileHandle = await currentImagesHandle.getFileHandle(photo.fileName);
    const currentFile = await currentFileHandle.getFile();
    await writeFileToDirectory(deletedImagesHandle, currentFile);
    await currentImagesHandle.removeEntry(photo.fileName);
    return true;
  } catch {
    noteNode.textContent = "Verplaatsen naar deleted images lukte niet.";
    return false;
  }
}

async function handlePhotoUpload(event) {
  const files = Array.from(event.target.files || []);

  if (!files.length) {
    return;
  }

  try {
    const uploadedPhotos = await Promise.all(
      files.map(async (file) => {
        const src = await readFileAsDataUrl(file);
        let fileName = "";

        if (currentImagesHandle) {
          fileName = await writeFileToDirectory(currentImagesHandle, file);
        }

        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name || "foto",
          src,
          fileName
        };
      })
    );

    photos = [...photos, ...uploadedPhotos];
    selectedPhotoId = uploadedPhotos[0]?.id || selectedPhotoId;
    setPhoto(getSelectedPhoto()?.src || "");
    renderPhotoPicker();
    savePhotos();

    if (currentImagesHandle) {
      noteNode.textContent = `${uploadedPhotos.length} foto${uploadedPhotos.length === 1 ? "" : "'s"} toegevoegd aan current images.`;
    } else {
      noteNode.textContent = `${uploadedPhotos.length} foto${uploadedPhotos.length === 1 ? "" : "'s"} toegevoegd. Koppel current images voor echte map-sync.`;
    }
  } catch {
    noteNode.textContent = "Foto's konden niet geladen worden.";
  }

  uploadInput.value = "";
}

async function removePhoto(photoId) {
  const photo = photos.find((item) => item.id === photoId);
  if (!photo) {
    return;
  }

  const moved = await moveFileToDeleted(photo);
  photos = photos.filter((item) => item.id !== photoId);

  if (selectedPhotoId === photoId) {
    selectedPhotoId = photos[0]?.id || "";
  }

  setPhoto(getSelectedPhoto()?.src || "");
  renderPhotoPicker();
  savePhotos();

  if (moved) {
    noteNode.textContent = "Foto verplaatst naar deleted images.";
  } else {
    noteNode.textContent = "Foto verwijderd uit de lijst.";
  }
}

async function clearPhoto() {
  const items = [...photos];

  for (const photo of items) {
    await moveFileToDeleted(photo);
  }

  photos = [];
  selectedPhotoId = "";
  setPhoto("");
  renderPhotoPicker();
  uploadInput.value = "";

  try {
    window.localStorage.removeItem(photoListStorageKey);
    window.localStorage.removeItem(selectedPhotoStorageKey);
  } catch {
    noteNode.textContent = "Foto's konden niet verwijderd worden.";
    return;
  }

  noteNode.textContent = "Lijst leeggemaakt.";
}

async function pickDirectory(kind) {
  if (!supportsDirectoryAccess) {
    noteNode.textContent = "Deze browser ondersteunt geen map-koppeling.";
    return;
  }

  try {
    const directoryHandle = await window.showDirectoryPicker();

    if (kind === "current") {
      currentImagesHandle = directoryHandle;
      noteNode.textContent = "current images gekoppeld.";
    } else {
      deletedImagesHandle = directoryHandle;
      noteNode.textContent = "deleted images gekoppeld.";
    }

    updateFolderStatus();
  } catch {
    noteNode.textContent = "Map kiezen geannuleerd.";
  }
}

bag.addEventListener("click", hitBag);
resetButton.addEventListener("click", resetBag);
uploadInput.addEventListener("change", handlePhotoUpload);
clearPhotoButton.addEventListener("click", clearPhoto);
linkCurrentFolderButton.addEventListener("click", () => pickDirectory("current"));
linkDeletedFolderButton.addEventListener("click", () => pickDirectory("deleted"));

updateHits();
loadSavedPhotos();
updateFolderStatus();
