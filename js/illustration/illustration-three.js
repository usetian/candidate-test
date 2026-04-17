import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const container = document.getElementById("illustration-3d-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.01,
  1000,
);

camera.position.set(4, 3, 5);
camera.lookAt(1, 0, 0.5);

//membuat render
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
if (container) {
  container.appendChild(renderer.domElement);
} else {
  document.body.appendChild(renderer.domElement);
}

//kontrol kamera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(1, 0, 0.5);
controls.update();

//pencahayaan
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;

//semakin besar semakin detail shadow tapi berat di gpu
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;

//mengatur area yang dicakup oleh bayangan
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

scene.add(directionalLight);

//fill light
const fillLight = new THREE.DirectionalLight(0xffd580, 0.4);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

//garis sumbu x, y, z
const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

//membuat instance untuk memuat file .fbx
const loader = new FBXLoader();

loader.load(
  "model/wood/wood.fbx",
  (fbx) => {
    let woodMaterial = null;
    fbx.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = Array.isArray(child.material)
          ? child.material[0]
          : child.material;
        if (mat) {
          woodMaterial = mat.clone();
          woodMaterial.side = THREE.FrontSide;
          woodMaterial.needsUpdate = true;
        }
      }
    });
    if (!woodMaterial) {
      console.error("Tidak ada material pada model");
      const textureLoader = new THREE.TextureLoader();
      const colorMap = textureLoader.load("model/wood/wood.fbm/Color_A02.jpg");
      const normalMap = textureLoader.load(
        "model/wood/wood.fbm/normal_map.jpg",
      );
      woodMaterial = new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap: normalMap,
        roughness: 0.8,
        metalness: 0.0,
      });
    }

    const group = new THREE.Group();
    function makeWoodBox(w, h, d, mat) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }
    // urutan terpanjang 1, 2, 3
    //batang panjang 1
    const firstWood = makeWoodBox(3.0, 0.2, 0.5, woodMaterial);
    firstWood.position.set(3, 0.1, 0.75);
    group.add(firstWood);

    //batang panjang 2
    const secondWood = makeWoodBox(2.0, 0.2, 0.5, woodMaterial);
    secondWood.position.set(3.04, 0.1, 0.26);
    group.add(secondWood);

    //batang panjang 3
    const horizArm = makeWoodBox(2.0, 0.2, 0.4, woodMaterial);
    horizArm.position.set(3.24, 0.3, 0.45);
    group.add(horizArm);

    //center kamera
    group.position.set(-1.5, 0, -1);
    scene.add(group);
    addMeasurementDots(group);
  },

  (xhr) => {
    const percent = ((xhr.loaded / xhr.total) * 100).toFixed(1);
    console.log(`Loading wood model: ${percent}%`);
  },

  (error) => {
    console.error("Error loading wood.fbx:", error);
    // Jika FBX gagal dimuat, gunakan scene fallback dengan geometri sederhana
    buildFallbackScene();
  },
);

//Menambahkan titik-titik putih kecil di sudut-sudut model.
function addMeasurementDots(parents) {
  const dotGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const dotPositions = [
    // sudut-sudut lengan horizontal (kiri atas)
    new THREE.Vector3(-1.5, 0.1, -1),
    new THREE.Vector3(1.5, 0.1, -1),
    new THREE.Vector3(1.5, 0.1, -0.5),
    // sudut-sudut lengan vertikal
    new THREE.Vector3(0, 0.1, -1),
    new THREE.Vector3(0, 0.1, 1),
    new THREE.Vector3(0.5, 0.1, 1),
    new THREE.Vector3(0.5, 0.1, -1),
    // sudut kanan bawah
    new THREE.Vector3(1.5, 0.1, 1),
  ];

  dotPositions.forEach((pos) => {
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(pos);
  });
}

// dipanggil jika file FBX gagal dimuat
function buildFallbackScene() {
  console.log("Using fallback geometry (wood.fbx not loaded");
  const mat = new THREE.MeshStandardMaterial({
    color: 0xa0855a,
    roughness: 0.9,
  });

  // data setiap segmen: lebar (w), tinggi (h), kedalaman (d), posisi (x, y, z)
  const shapes = [
    { w: 3.0, h: 0.2, d: 0.5, x: 1.75, y: 0, z: 0 }, // lengan kanan
    { w: 2.0, h: 0.2, d: 0.5, x: -0.75, y: 0, z: 0 }, // lengan kiri
    { w: 0.5, h: 0.2, d: 2.0, x: 0.5, y: 0, z: 1.25 }, // lengan bawah
    { w: 0.5, h: 0.2, d: 0.5, x: 3.25, y: 0, z: 1.25 }, // sudut kanan bawah
  ];

  shapes.forEach(({ w, h, d, x, y, z }) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x - 1.5, y, z - 1);
    mesh.castShadow = true;
    scene.add(mesh);
  });
}

// responsif terhadap window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();