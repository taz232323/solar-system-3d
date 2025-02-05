// Import Three.js and OrbitControls from node_modules
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

console.log("app.js loaded");

// ===== Scene Setup =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 30, 80);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ===== Lighting =====
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

// ===== Raycaster & Mouse for Tooltip/Clicks =====
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create a tooltip element (for hover)
const tooltip = document.createElement("div");
tooltip.className = "tooltip";
document.body.appendChild(tooltip);

// ===== Helper: Create an Orbit Group =====
function createPlanetOrbit(orbitRadius, planetMesh) {
  const orbitGroup = new THREE.Object3D();
  // Place the planet along the X-axis at the specified orbit radius.
  planetMesh.position.set(orbitRadius, 0, 0);
  orbitGroup.add(planetMesh);
  scene.add(orbitGroup);
  return orbitGroup;
}

// ===== The Sun =====
const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// ===== Planetary Data =====
const planetsData = [
  {
    name: "Mercury",
    orbitRadius: 8,
    planetRadius: 0.5,
    color: 0xaaaaaa,
    rotationSpeed: 0.02,
    funFact: "Mercury is the smallest planet and closest to the Sun."
  },
  {
    name: "Venus",
    orbitRadius: 11,
    planetRadius: 0.7,
    color: 0xeed5b7,
    rotationSpeed: 0.015,
    funFact: "Venus has a thick atmosphere and is the hottest planet."
  },
  {
    name: "Earth",
    orbitRadius: 14,
    planetRadius: 1,
    color: null,
    rotationSpeed: 0.01,
    texture: "https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg",
    funFact: "Earth is our home and the only planet known to support life.",
    hasMoon: true
  },
  {
    name: "Mars",
    orbitRadius: 17,
    planetRadius: 0.53,
    color: 0xff4500,
    rotationSpeed: 0.008,
    funFact: "Mars is known as the Red Planet, home to the tallest volcano."
  },
  {
    name: "Jupiter",
    orbitRadius: 22,
    planetRadius: 2,
    color: 0xffa500,
    rotationSpeed: 0.005,
    funFact: "Jupiter is the largest planet and features the Great Red Spot."
  },
  {
    name: "Saturn",
    orbitRadius: 28,
    planetRadius: 1.7,
    color: 0xffd27f,
    rotationSpeed: 0.003,
    funFact: "Saturn is famous for its spectacular rings.",
    hasRings: true
  },
  {
    name: "Uranus",
    orbitRadius: 34,
    planetRadius: 1.2,
    color: 0x66ccff,
    rotationSpeed: 0.002,
    funFact: "Uranus rotates on its side, giving it extreme seasons."
  },
  {
    name: "Neptune",
    orbitRadius: 40,
    planetRadius: 1.2,
    color: 0x3366ff,
    rotationSpeed: 0.001,
    funFact: "Neptune has supersonic winds and a deep blue color."
  }
];

const textureLoader = new THREE.TextureLoader();
const planetOrbits = [];      // For rotation animations
const hoverablePlanets = [];  // For raycasting (hover & click)

planetsData.forEach(planetData => {
  // Create planet geometry and material.
  const geometry = new THREE.SphereGeometry(planetData.planetRadius, 32, 32);
  let material;
  if (planetData.texture) {
    const texture = textureLoader.load(planetData.texture);
    material = new THREE.MeshStandardMaterial({ map: texture });
  } else {
    material = new THREE.MeshStandardMaterial({ color: planetData.color });
  }
  const planetMesh = new THREE.Mesh(geometry, material);
  // Save tooltip data on the mesh.
  planetMesh.userData = { name: planetData.name, funFact: planetData.funFact };
  hoverablePlanets.push(planetMesh);
  
  // Create an orbit group for the planet.
  const orbitGroup = createPlanetOrbit(planetData.orbitRadius, planetMesh);
  planetOrbits.push({ group: orbitGroup, speed: planetData.rotationSpeed });
  
  // If the planet should have a moon (like Earth), add one.
  if (planetData.hasMoon) {
    const moonGeometry = new THREE.SphereGeometry(0.27, 32, 32);
    const moonTexture = textureLoader.load("https://threejs.org/examples/textures/moon_1024.jpg");
    const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });
    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    const moonOrbit = new THREE.Object3D();
    moonMesh.position.set(2, 0, 0);
    moonOrbit.add(moonMesh);
    planetMesh.add(moonOrbit);
    planetOrbits.push({ group: moonOrbit, speed: 0.05 });
  }
  
  // If the planet should have rings (like Saturn), add them.
  if (planetData.hasRings) {
    const ringGeometry = new THREE.RingGeometry(
      planetData.planetRadius * 1.2,
      planetData.planetRadius * 1.8,
      32
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x8d6e63,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    planetMesh.add(ringMesh);
  }
});

// ===== Animation Control =====
let animationActive = true;

window.addEventListener("mousedown", () => {
  animationActive = false;
});
window.addEventListener("mouseup", () => {
  animationActive = true;
});

// ===== Animation Loop =====
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  
  if (animationActive) {
    planetOrbits.forEach(item => {
      item.group.rotation.y += item.speed * delta * 60;
    });
  }
  
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ===== Responsive Resize =====
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== Hover Tooltip =====
window.addEventListener("mousemove", onMouseMove, false);
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hoverablePlanets);
  
  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    tooltip.style.display = "block";
    tooltip.innerHTML = `<strong>${intersected.userData.name}</strong><br>${intersected.userData.funFact}`;
    tooltip.style.left = event.clientX + 10 + "px";
    tooltip.style.top = event.clientY + 10 + "px";
  } else {
    tooltip.style.display = "none";
  }
}

// ===== Click Event for Mars GIF =====
window.addEventListener("click", onClick, false);
function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hoverablePlanets);
  
  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    if (intersected.userData.name === "Mars") {
      showGifOverlay();
    }
  }
}

function showGifOverlay() {
  let gifOverlay = document.getElementById("gifOverlay");
  if (!gifOverlay) {
    gifOverlay = document.createElement("div");
    gifOverlay.id = "gifOverlay";
    gifOverlay.style.position = "fixed";
    gifOverlay.style.top = "50%";
    gifOverlay.style.left = "50%";
    gifOverlay.style.transform = "translate(-50%, -50%)";
    gifOverlay.style.zIndex = "10000";
    gifOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    gifOverlay.style.padding = "10px";
    gifOverlay.style.borderRadius = "8px";
    document.body.appendChild(gifOverlay);
  }
  gifOverlay.innerHTML = `<img src="https://media.giphy.com/media/oImOwaZ34b8K70aQ6B/giphy.gif" style="max-width:100%; max-height:80vh;" alt="Mars GIF" />`;
  gifOverlay.style.display = "block";
  
  // Hide the GIF overlay after 5 seconds.
  setTimeout(() => {
    gifOverlay.style.display = "none";
  }, 5000);
}
