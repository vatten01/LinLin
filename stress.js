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

const photoListStorageKey = "stress-bag-photos-v5";
const selectedPhotoStorageKey = "stress-bag-selected-v5";
const driveConfig = window.STRESS_DRIVE_CONFIG || { webAppUrl: "", mode: "" };
const driveEnabled = Boolean(driveConfig.webAppUrl);

const impacts = ["tik", "boem", "raak"];

let hits = 0;
let photos = [];
let selectedPhotoId = "";

function savePhotos() {
  try {
    window.localStorage.setItem(photoListStorageKey, JSON.stringify(photos));
    window.localStorage.setItem(selectedPhotoStorageKey, selectedPhotoId);
  } catch {
    noteNode.textContent = "Kon niet opslaan.";
  }
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
      noteNode.textContent = "";
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
      photos = parsedPhotos.filter(
        (item) => item && typeof item.src === "string" && item.src,
      );
    }

    if (savedSelected && photos.some((photo) => photo.id === savedSelected)) {
      selectedPhotoId = savedSelected;
    } else if (photos.length) {
      selectedPhotoId = photos[0].id;
    }
  } catch {
    noteNode.textContent = "Kon niet laden.";
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
  //noteNode.textContent = setRandomText(notes);
  triggerImpact();
}

function resetBag() {
  hits = 0;
  updateHits();
  noteNode.textContent = "";
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
    reader.addEventListener("error", () =>
      reject(new Error("Kon bestand niet lezen")),
    );
    reader.readAsDataURL(file);
  });
}

function dataUrlToBase64(dataUrl) {
  const parts = dataUrl.split(",");
  return parts[1] || "";
}

async function postToDriveBridge(payload) {
  await fetch(driveConfig.webAppUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
}

async function uploadPhotoToDrive(photo) {
  if (!driveEnabled || photo.driveFileName) {
    return photo;
  }

  const dotIndex = photo.name.lastIndexOf(".");
  const extension = dotIndex >= 0 ? photo.name.slice(dotIndex) : ".png";
  const driveFileName = `stress-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;

  await postToDriveBridge({
    action: "uploadCurrent",
    fileName: driveFileName,
    mimeType: photo.mimeType || "image/png",
    base64: dataUrlToBase64(photo.src),
  });

  return {
    ...photo,
    driveFileName,
  };
}

async function movePhotoToDriveDeleted(photo) {
  if (!driveEnabled || !photo.driveFileName) {
    return false;
  }

  await postToDriveBridge({
    action: "moveToDeleted",
    fileName: photo.driveFileName,
  });
  return true;
}

async function moveFileToDeleted(photo) {
  let movedSomewhere = false;

  try {
    const movedToDrive = await movePhotoToDriveDeleted(photo);
    movedSomewhere = movedSomewhere || movedToDrive;
  } catch {
    noteNode.textContent = "Kon niet verwijderen.";
  }

  return movedSomewhere;
}

async function handlePhotoUpload(event) {
  const files = Array.from(event.target.files || []);

  if (!files.length) {
    return;
  }

  try {
    let uploadedPhotos = await Promise.all(
      files.map(async (file) => {
        const src = await readFileAsDataUrl(file);

        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name || "foto",
          mimeType: file.type || "image/png",
          src,
          driveFileName: "",
        };
      }),
    );

    if (driveEnabled) {
      uploadedPhotos = await Promise.all(
        uploadedPhotos.map((photo) => uploadPhotoToDrive(photo)),
      );
    }

    photos = [...photos, ...uploadedPhotos];
    selectedPhotoId = uploadedPhotos[0]?.id || selectedPhotoId;
    setPhoto(getSelectedPhoto()?.src || "");
    renderPhotoPicker();
    savePhotos();

    if (driveEnabled) {
      noteNode.textContent = "";
    } else {
      noteNode.textContent = "";
    }
  } catch {
    noteNode.textContent = "Kon niet laden.";
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
    noteNode.textContent = "";
  } else {
    noteNode.textContent = "";
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
    noteNode.textContent = "Kon niet wissen.";
    return;
  }

  noteNode.textContent = "";
}

bag.addEventListener("click", hitBag);
resetButton.addEventListener("click", resetBag);
uploadInput.addEventListener("change", handlePhotoUpload);
clearPhotoButton.addEventListener("click", clearPhoto);

updateHits();
loadSavedPhotos();
