const flowerCountNode = document.getElementById("flower-count");
const flowersRoot = document.getElementById("bouquet-flowers");
const decreaseButton = document.getElementById("decrease-flowers");
const increaseButton = document.getElementById("increase-flowers");

const storageKey = "bouquet-flower-count-v1";
const minimumFlowers = 1;
const maximumFlowers = 12;
const defaultFlowers = 6;

const flowerLayouts = [
  { left: "34%", top: "38%", rotate: "-20deg", height: "11.5rem", petal: "rgba(228, 120, 149, 0.98)", petalSoft: "rgba(244, 180, 196, 0.98)", size: "4.2rem" },
  { left: "43%", top: "28%", rotate: "-10deg", height: "12.1rem", petal: "rgba(251, 174, 187, 0.98)", petalSoft: "rgba(255, 213, 220, 0.98)", size: "4.2rem" },
  { left: "51%", top: "24%", rotate: "-3deg", height: "12.8rem", petal: "rgba(255, 206, 153, 0.98)", petalSoft: "rgba(255, 228, 188, 0.98)", size: "4.2rem" },
  { left: "60%", top: "29%", rotate: "8deg", height: "12rem", petal: "rgba(241, 145, 168, 0.98)", petalSoft: "rgba(255, 205, 215, 0.98)", size: "4.2rem" },
  { left: "68%", top: "38%", rotate: "16deg", height: "11.5rem", petal: "rgba(255, 188, 196, 0.98)", petalSoft: "rgba(255, 226, 231, 0.98)", size: "4.2rem" },
  { left: "50%", top: "35%", rotate: "4deg", height: "11.8rem", petal: "rgba(231, 114, 135, 0.98)", petalSoft: "rgba(248, 185, 197, 0.98)", size: "4.8rem" },
  { left: "29%", top: "46%", rotate: "-28deg", height: "10.5rem", petal: "rgba(253, 195, 162, 0.98)", petalSoft: "rgba(255, 228, 205, 0.98)", size: "3.8rem" },
  { left: "39%", top: "44%", rotate: "-15deg", height: "10.8rem", petal: "rgba(236, 142, 163, 0.98)", petalSoft: "rgba(248, 203, 214, 0.98)", size: "3.8rem" },
  { left: "58%", top: "44%", rotate: "14deg", height: "10.8rem", petal: "rgba(255, 214, 171, 0.98)", petalSoft: "rgba(255, 235, 205, 0.98)", size: "3.8rem" },
  { left: "71%", top: "47%", rotate: "26deg", height: "10.3rem", petal: "rgba(247, 171, 187, 0.98)", petalSoft: "rgba(255, 220, 227, 0.98)", size: "3.8rem" },
  { left: "46%", top: "47%", rotate: "-6deg", height: "10rem", petal: "rgba(229, 122, 151, 0.98)", petalSoft: "rgba(246, 196, 209, 0.98)", size: "3.6rem" },
  { left: "54%", top: "48%", rotate: "7deg", height: "10rem", petal: "rgba(255, 196, 144, 0.98)", petalSoft: "rgba(255, 229, 191, 0.98)", size: "3.6rem" }
];

let flowerCount = loadFlowerCount();

function loadFlowerCount() {
  const saved = Number(window.localStorage.getItem(storageKey));

  if (!Number.isFinite(saved)) {
    return defaultFlowers;
  }

  return Math.min(maximumFlowers, Math.max(minimumFlowers, saved));
}

function saveFlowerCount() {
  window.localStorage.setItem(storageKey, String(flowerCount));
}

function createFlower(layout, index) {
  const fragment = document.createDocumentFragment();
  const stem = document.createElement("span");
  const leafLeft = document.createElement("span");
  const leafRight = document.createElement("span");
  const bloom = document.createElement("span");

  stem.className = "stem";
  stem.style.setProperty("--left", layout.left);
  stem.style.setProperty("--rotate", layout.rotate);
  stem.style.setProperty("--height", layout.height);

  leafLeft.className = "leaf";
  leafLeft.style.setProperty("--left", layout.left);
  leafLeft.style.setProperty("--bottom", `calc(8.6rem + ${(index % 3) * 0.7}rem)`);
  leafLeft.style.setProperty("--leaf-rotate", index % 2 === 0 ? "-30deg" : "-22deg");
  leafLeft.style.setProperty("--leaf-shift", "-1.9rem");

  leafRight.className = "leaf";
  leafRight.style.setProperty("--left", layout.left);
  leafRight.style.setProperty("--bottom", `calc(9.7rem + ${(index % 4) * 0.45}rem)`);
  leafRight.style.setProperty("--leaf-rotate", index % 2 === 0 ? "28deg" : "20deg");
  leafRight.style.setProperty("--leaf-shift", "0.2rem");

  bloom.className = "bloom";
  bloom.style.setProperty("--left", layout.left);
  bloom.style.setProperty("--top", layout.top);
  bloom.style.setProperty("--size", layout.size);
  bloom.style.setProperty("--petal", layout.petal);
  bloom.style.setProperty("--petal-soft", layout.petalSoft);

  fragment.append(stem, leafLeft, leafRight, bloom);
  return fragment;
}

function renderBouquet() {
  flowersRoot.innerHTML = "";

  for (let index = 0; index < flowerCount; index += 1) {
    flowersRoot.appendChild(createFlower(flowerLayouts[index], index));
  }

  flowerCountNode.textContent = String(flowerCount);
  decreaseButton.disabled = flowerCount <= minimumFlowers;
  increaseButton.disabled = flowerCount >= maximumFlowers;
  saveFlowerCount();
}

function changeFlowers(step) {
  const nextCount = flowerCount + step;

  if (nextCount < minimumFlowers || nextCount > maximumFlowers) {
    return;
  }

  flowerCount = nextCount;
  renderBouquet();
}

decreaseButton.addEventListener("click", () => changeFlowers(-1));
increaseButton.addEventListener("click", () => changeFlowers(1));

renderBouquet();
