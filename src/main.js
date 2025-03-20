import "./style.scss";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
const canvas = document.getElementById("canvas");

const textureLoc = {
  scene_0: {
    day: "/textures/scene_day_001.webp",
    night: "/textures/scene_night_001.webp",
  },
  scene_1: {
    day: "/textures/scene_day_002.webp",
    night: "/textures/scene_night_002.webp",
  },
};
const textures = {
  scene_0: {},
  scene_1: {},
};

const textLoader = new THREE.TextureLoader();
// Loading textures
Object.keys(textureLoc).forEach((key) => {
  const textDay = textLoader.load(textureLoc[key].day);
  textDay.flipY = false;
  textDay.colorSpace = THREE.SRGBColorSpace;
  textures[key].day = textDay;

  textures[key].night = textLoader.load(textureLoc[key].night);
});

// Instantiate a loader
// Optional: Provide a DRACOLoader instance to decode compressed mesh data

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader); // Load a glTF resource
gltfLoader.load(
  // resource URL
  "room.glb",
  // called when the resource is loaded
  function (gltf) {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        Object.keys(textures).forEach((key) => {
          if (child.name.includes(key)) {
            const material = new THREE.MeshBasicMaterial({
              map: textures[key].day,
            });

            child.material = material;
            if (child.material.map) {
              child.material.map.minFilter = THREE.LinearFilter;
            }
          }
        });
      }

      scene.add(gltf.scene);
    });
  },
  // called while loading is progressing
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  // called when loading has errors
  function (error) {
    console.log("An error happened" + error);
  }
);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.z = 2;
camera.position.y = 5;
const light = new THREE.DirectionalLight(0xffffff, 3);
scene.add(light);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
const controls = new OrbitControls(camera, renderer.domElement);
renderer.setAnimationLoop(() => {
  controls.update();
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
});
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
