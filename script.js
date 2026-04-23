let viewport = document.getElementById("viewport");
let camera = document.getElementById("camera");
let world = document.getElementById("world");
let hotbar = document.getElementById("hotbar");

function getBlocks() {
  return document.querySelectorAll("#world .block");
}

let blockTypes = {
  grass_block: {
    name: "Grass block",
  },
  dirt: {
    name: "Dirt",
  },
  grass: {
    name: "Grass",
    shape: "cutout",
  },
  oak_log: {
    name: "Oak log",
  },
  oak_leaves: {
    name: "Oak leaves",
  },
  oak_planks: {
    name: "Oak planks",
  },
  stone: {
    name: "Stone",
  },
  cobblestone: {
    name: "Cobblestone",
  },
  snow: {
    name: "Snow",
  },
  copper: {
    name: "Copper",
  },
  glass: {
    name: "Glass",
  },
  oak_slab: {
    name: "Oak slab",
    shape: "slab",
  },
};

let shapeFaces = {
  cube: ["top", "bottom", "front", "back", "left", "right"],
  slab: ["top", "bottom", "front", "back", "left", "right"],
  cutout: ["top", "bottom", "front", "back", "left", "right", "cross1", "cross2"],
};

let blockTags = {
  replaceable: ["grass"],
};

const defaultBlock = {
  id: "unknown",
  name: "Unknown block",
  shape: "cube",
};

let currBlockType = { ...defaultBlock, id: "grass_block", ...blockTypes.grass_block };

let statusTimer;

let blockSize = 128;

let GUIScale = 3;
let rotX = 0;
let rotY = 0;

let posX = 0;
let posZ = 0;
let posY = 200;
let movementSpeed = 16;

let rotateSensitivity = 0.5;

let isRotating = false;
let isPanning = false;

function initialize() {
  move();
  const oldType = currBlockType;

  for (const id in blockTypes) {
    if (Object.prototype.hasOwnProperty.call(blockTypes, id)) {
      const blockType = blockTypes[id];

      let newSlot = document.createElement("div");
      newSlot.classList.add("slot");
      newSlot.blockId = id;
      newSlot.blockType = blockType;

      currBlockType = { ...defaultBlock, id: id, ...blockType };
      let smallBlock = addBlock(0, 0, 0);
      world.removeChild(smallBlock);
      newSlot.appendChild(smallBlock);

      hotbar.appendChild(newSlot);
    }
  }

  hotbar.querySelector(".slot").classList.add("selected");

  currBlockType = oldType;
}

function showStatus(text) {
  document.getElementById("status").innerText = text;
  window.clearTimeout(statusTimer);
  statusTimer = undefined;
  statusTimer = window.setTimeout(function () {
    document.getElementById("status").innerText = "";
    window.clearTimeout(statusTimer);
    statusTimer = undefined;
  }, 2000);
}

function getBlockAt(x, y, z) {
  for (let block of getBlocks()) {
    if (block.x == x && block.y == y && block.z == z) {
      return block;
    }
  }
}

function placeBlock(x, y, z, targetBlock, face, fx, fy) {
  let newX = x;
  let newY = y;
  let newZ = z;

  if (blockTags.replaceable.includes(targetBlock.blockId)) {
    targetBlock.remove();
  } else {
    newX = face == "right" ? parseInt(x) + 1 : face == "left" ? parseInt(x) - 1 : parseInt(x);
    newY = face == "top" ? parseInt(y) + 1 : face == "bottom" ? parseInt(y) - 1 : parseInt(y);
    newZ = face == "front" ? parseInt(z) + 1 : face == "back" ? parseInt(z) - 1 : parseInt(z);
  }

  let block;

  const blockThere = getBlockAt(newX, newY, newZ);
  if (!blockThere) {
    block = addBlock(newX, newY, newZ);
    if (currBlockType.shape == "slab") {
      if (targetBlock.blockType.shape == "slab") {
        block.classList.add(targetBlock.classList.contains("slab_bottom") ? "slab_bottom" : "slab_top");
      } else if (face == "top" || (face != "bottom" && fy >= blockSize * 0.5)) {
        block.classList.add("slab_bottom");
      } else if (face == "bottom" || (face != "top" && fy < blockSize * 0.5)) {
        block.classList.add("slab_top");
      }
    }
  }

  return block;
}

function addBlock(x, y, z) {
  let blockElement = document.createElement("div");
  blockElement.classList.add("block");
  blockElement.classList.add(currBlockType.shape);
  blockElement.classList.add(currBlockType.id);

  blockElement.blockId = currBlockType.id;
  blockElement.blockType = currBlockType;

  blockElement.x = x;
  blockElement.y = y;
  blockElement.z = z;

  blockElement.style.setProperty("--x", x);
  blockElement.style.setProperty("--y", y);
  blockElement.style.setProperty("--z", z);

  blockElement.addEventListener("pointerdown", function (e) {
    if (e.button == 0 && getBlocks().length > 1) {
      blockElement.remove();
      isRotating = false;
    }
  });

  let faceElement = document.createElement("div");
  faceElement.classList.add("face");
  faceElement.block = blockElement;

  const faces = shapeFaces[currBlockType.shape] ?? shapeFaces.cube;

  for (let face of faces) {
    const faceClone = faceElement.cloneNode();
    faceClone.face = face;
    faceClone.classList.add(face);

    faceClone.addEventListener("pointerdown", function (e) {
      if (e.button == 2) {
        placeBlock(x, y, z, blockElement, face, e.offsetX, e.offsetY);
      }
    });

    blockElement.appendChild(faceClone);
  }

  world.appendChild(blockElement);

  return blockElement;
}

for (let x = -5; x < 5; x++) {
  for (let z = -5; z < 5; z++) {
    addBlock(x, -2, z);
  }
}

document.addEventListener("mousedown", function (e) {
  if (e.target.classList.contains("face") || e.target.classList.contains("block")) {
    return;
  }
  if (e.button == 0) {
    isRotating = true;
  } else if (e.button == 2) {
    isPanning = true;
  }
});

document.addEventListener("contextmenu", (e) => e.preventDefault());

function setTranslate() {
  world.style.transform = `translate3d(${/* Math.cos((rotY / 180) * Math.PI) *  */ posX}px, ${posY}px, ${/* Math.sin((rotY / 180) * Math.PI) * */ posZ}px)`;
}

function setRotate() {
  camera.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
}

function setTransform() {
  setTranslate();
  setRotate();
}

function wrap(value, min, max) {
  const range = max - min;
  return ((value - min + range) % range) + min;
}

function clamp(value, min, max) {
  return Math.max(Math.min(value, max), min);
}

function normalizeRotation(value) {
  return wrap(value, 0, 360);
}

function clampRotation(value) {
  return clamp(value, -90, 90);
}

document.addEventListener("mousemove", function (e) {
  let rotXAdd = (-e.movementY * rotateSensitivity) % 360;
  let rotYAdd = -((-e.movementX * rotateSensitivity) % 360);

  rotX = clampRotation(rotX + rotXAdd);
  rotY = normalizeRotation(rotY + rotYAdd);

  setRotate();
});

const OGControls = {
  forward: false,
  back: false,
  left: false,
  right: false,
  up: false,
  down: false,
};

let controls = { ...OGControls };

let keyMap = {
  KeyW: "forward",
  KeyS: "back",
  KeyA: "left",
  KeyD: "right",
  Space: "up",
  ShiftLeft: "down",
};

document.addEventListener("keydown", (e) => {
  controls[keyMap[e.code]] = true;
});

document.addEventListener("keyup", (e) => {
  controls[keyMap[e.code]] = false;
});

function move() {
  requestAnimationFrame(move);

  const amplitude = Math.sqrt((controls.forward || controls.back) + (controls.left || controls.right));

  if (controls.forward) {
    posZ += (Math.cos((rotY / 180) * Math.PI) * movementSpeed) / amplitude;
    posX -= (Math.sin((rotY / 180) * Math.PI) * movementSpeed) / amplitude;
  }
  if (controls.back) {
    posZ -= (Math.cos((rotY / 180) * Math.PI) * movementSpeed) / amplitude;
    posX += (Math.sin((rotY / 180) * Math.PI) * movementSpeed) / amplitude;
  }
  if (controls.left) {
    posX += (Math.sin(((rotY + 90) / 180) * Math.PI) * movementSpeed) / amplitude;
    posZ -= (Math.cos(((rotY + 90) / 180) * Math.PI) * movementSpeed) / amplitude;
  }
  if (controls.right) {
    posX -= (Math.sin(((rotY + 90) / 180) * Math.PI) * movementSpeed) / amplitude;
    posZ += (Math.cos(((rotY + 90) / 180) * Math.PI) * movementSpeed) / amplitude;
  }
  if (controls.up) {
    posY += movementSpeed;
  }
  if (controls.down) {
    posY -= movementSpeed;
  }

  if ({ ...controls } != { ...OGControls }) {
    console.log("i moved");

    setTranslate();
  }
}
/* 
viewport.addEventListener("click", async () => {
  await viewport.requestPointerLock();
});
 */
document.addEventListener(
  "wheel",
  function (e) {
    e.preventDefault();
    let delta = e.deltaY + e.deltaX;
    if (delta == 0) {
      return;
    }

    let selectedSlot = hotbar.querySelector(".slot.selected");
    selectedSlot.classList.remove("selected");

    let nextSlot = delta > 0 ? selectedSlot.nextSibling : selectedSlot.previousSibling;

    if (!nextSlot) {
      nextSlot = hotbar.querySelector(".slot" + (delta > 0 ? ":first-child" : ":last-child"));
    }

    nextSlot.classList.add("selected");
    nextSlot.scrollIntoView();
    hotbar.scrollTop = 0;

    currBlockType = { ...defaultBlock, id: nextSlot.blockId, ...nextSlot.blockType };
    showStatus(nextSlot.blockType.name);
  },
  { passive: false }
);

window.addEventListener("load", initialize);

const blockSeparator = ";";
const propertySeparator = ",";

function loadBuild(saveText) {
  const oldType = currBlockType;
  for (let block of getBlocks()) {
    block.remove();
  }
  let newBlocks = saveText.split(blockSeparator);
  for (let newBlock of newBlocks) {
    let props = newBlock.split(propertySeparator);
    let x = props[0];
    let y = props[1];
    let z = props[2];
    let type = { ...defaultBlock, id: props[3], ...blockTypes[props[3]] };
    currBlockType = type;
    addBlock(x, y, z);
  }
  currBlockType = oldType;
}

function saveBuild() {
  let textArray = [];
  for (let block of getBlocks()) {
    blockProps = [block.x, block.y, block.z, block.blockId];
    textArray.push(blockProps.join(propertySeparator));
  }
  return textArray.join(blockSeparator);
}

document.getElementById("btnLoad").addEventListener("click", function () {
  document.getElementById("file").click();
});

document.getElementById("file").addEventListener("input", function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.addEventListener("load", (event) => {
    loadBuild(event.target.result);
  });
  reader.readAsText(file);
});

document.getElementById("btnShowSave").addEventListener("click", function () {
  document.getElementById("saveDialog").showModal();
});

document.getElementById("saveForm").addEventListener("submit", function () {
  let anchor = document.createElement("a");
  let filename = document.getElementById("filename").value + ".blocks";
  anchor.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(saveBuild()));
  anchor.setAttribute("download", filename);
  anchor.click();
  anchor.remove();
});
