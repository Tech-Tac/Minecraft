let world = document.getElementById("world");

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

let GUIScale = 3;
let rotX = -35.264389682754654315377000330019;
let rotY = 45;

let panX = 0;
let panY = 0;

let blockSize = 128;

let rotateSensitivity = 1;

let isRotating = false;
let isPanning = false;

function initialize() {
  const oldType = currBlockType;

  for (const id in blockTypes) {
    if (Object.prototype.hasOwnProperty.call(blockTypes, id)) {
      const blockType = blockTypes[id];

      let newSlot = document.createElement("div");
      newSlot.classList.add("slot");

      newSlot.addEventListener("click", function () {
        let selectedSlot = document.querySelector("#hotbar > .slot.selected");
        selectedSlot.classList.remove("selected");

        currBlockType = { ...defaultBlock, id: id, ...blockType };
        newSlot.classList.add("selected");

        showStatus(currBlockType.name);
        document.getElementById("hotbar").scrollTop = 0;
      });

      currBlockType = { ...defaultBlock, id: id, ...blockType };
      let smallBlock = addBlock(0, 0, 0);
      world.removeChild(smallBlock);
      newSlot.appendChild(smallBlock);

      document.getElementById("hotbar").appendChild(newSlot);
    }
  }

  document.querySelector("#hotbar > .slot").classList.add("selected");

  currBlockType = oldType;
  if (blockTypes.length < 9) {
    let fullPages = Math.ceil(blockTypes.length / 9) * 9;
    let difference = fullPages - blockTypes.length;
    for (let i = 0; i < difference; i++) {
      let newSlot = document.createElement("div");
      newSlot.classList.add("slot");
      document.getElementById("hotbar").appendChild(newSlot);
    }
  }
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

  let block = undefined;

  if (!getBlockAt(newX, newY, newZ)) {
    block = addBlock(newX, newY, newZ);
    if (currBlockType.shape == "slab") {
      if (face == "top" || (face != "bottom" && fy >= blockSize * 0.5)) {
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

  const faces = ["top", "bottom", "front", "back", "left", "right"];

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

addBlock(0, 0, 0, "grass_block");

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

document.addEventListener("mousemove", function (e) {
  if (isRotating) {
    let newRotX = (-e.movementY * rotateSensitivity) % 360;
    let newRotY = 0 - ((-e.movementX * rotateSensitivity) % 360);

    rotX += newRotX;
    rotY += newRotY;
    world.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  if (isPanning) {
    panX += e.movementX;
    panY += e.movementY;

    world.style.marginLeft = panX + "px";
    world.style.marginTop = panY + "px";

    world.style.transformOrigin = `${innerWidth / 2 + -panX}px ${innerHeight / 2 + -panY}px`;
  }
});

document.addEventListener("mouseup", function (e) {
  isRotating = false;
  isPanning = false;
});

document.addEventListener("wheel", function (e) {
  if (!(e.target.classList.contains("slot") || e.target.id == "hotbar")) {
    let sensitivity = 0.25;
    let delta = e.deltaY * -sensitivity;
    let min = 4;
    let max = (window.innerWidth + window.innerHeight) / 4;

    blockSize += delta;
    blockSize = Math.max(min, Math.min(max, blockSize));
    world.style.setProperty("--block-size", blockSize + "px");
  }
});

document.getElementById("hotbar").addEventListener("wheel", function (e) {
  if (e.deltaY != 0) {
    e.preventDefault();
    let direction = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : e.deltaY;
    document.getElementById("hotbar").scrollTo(this.scrollLeft + 24 * direction * GUIScale, 0);
  }
});

window.addEventListener("load", initialize);

function loadBuild(saveText) {
  const oldType = currBlockType;
  for (let block of getBlocks()) {
    block.remove();
  }
  let newBlocks = saveText.split("|");
  for (let newBlock of newBlocks) {
    let props = newBlock.split(",");
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
    textArray.push(blockProps.join(","));
  }
  return textArray.join("|");
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
