import "./style.scss";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";

const init = () => {
  // Getting elements from DOM
  const canvas = document.getElementById("canvas");

  const darkButton = document.getElementsByClassName("btn--switch-theme")[0];

  const video = document.getElementById("video");

  const initialStorage = () => {
    const flag = localStorage.getItem("theme");
    if (!flag) {
      localStorage.setItem("theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", flag);
      if (flag === "dark") darkButton.checked = true;
    }
  };
  initialStorage();
  // Adding dark theme

  // Scene creation
  const scene = new THREE.Scene();
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
  //scene mat
  const sceneMaterials = {
    scene_0: {},
    scene_1: {},
  };
  // Loading textures
  const textLoader = new THREE.TextureLoader();
  Object.keys(textureLoc).forEach((key) => {
    const textDay = textLoader.load(textureLoc[key].day);
    textDay.flipY = false;
    textDay.colorSpace = THREE.SRGBColorSpace;
    textures[key].day = textDay;
    sceneMaterials[key] = new THREE.MeshBasicMaterial({
      map: textures[key].day,
    });

    const textNight = textLoader.load(textureLoc[key].night);
    textNight.flipY = false;
    textNight.colorSpace = THREE.SRGBColorSpace;
    textures[key].night = textNight;
    textures[key].night = textNight;
    if (document.documentElement.dataset.theme === "dark") {
      sceneMaterials[key] = new THREE.MeshBasicMaterial({
        map: textures[key].night,
      });
    }
  });
  // Environment
  const envMap = new THREE.TextureLoader()
    .setPath("environment/")
    .load(["nx.webp", "ny.webp", " nz.webp", "px.webp", "py.webp", "pz.webp"]);
  // Instantiate a loader

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader); // Load a glTF resource

  // gltf materials
  const baseMat = new THREE.MeshBasicMaterial({ color: "#ffffff" }); //base mat
  const fanMat = new THREE.MeshBasicMaterial({ color: "#99ccfb" }); //base mat
  const glassMat = new THREE.MeshPhysicalMaterial({
    // glass mat
    depthWrite: false,
  });

  // fan array
  const fanList = [];

  gltfLoader.load(
    // Resource URL
    "room.glb",
    // Resource is loaded.
    function (gltf) {
      gltf.scene.traverse((child) => {
        if (child.name.includes("glass")) {
          glassMat.transmission = 1;
          glassMat.reflectivity = 0.2;
          glassMat.metalness = 0;
          glassMat.ior = 1.5;
          glassMat.envMap = envMap;
          glassMat.envMapIntensity = 1;
          glassMat.opacity = 1;
          glassMat.specularIntensity = 1;

          glassMat.roughness = 0.05;
          glassMat.thickness = 0.01;

          child.material = glassMat;
        }
        if (child.name.includes("water")) {
          const waterMat = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            color: "#00DBFF",
          });
          child.material = waterMat;
        }
        if (child.name.includes("base")) {
          const baseMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
          child.material = baseMat;
        }
        if (child.name.includes("text") || child.name.includes("name")) {
          child.material = baseMat;
        }
        if (child.name.includes("fan") && child.name != "top_fan_scene_0") {
          child.material = fanMat;
          fanList.push(child);
        }
        if (child.isMesh) {
          Object.keys(textures).forEach((key) => {
            if (child.name.includes(key)) {
              // placeholder
              child.material = sceneMaterials[key];
              if (child.material.map) {
                child.material.map.minFilter = THREE.LinearFilter;
              }
            }
          });
        }
        if (child.name.includes("screen")) {
          const videoTexture = new THREE.VideoTexture(video);
          videoTexture.colorSpace = THREE.SRGBColorSpace;
          videoTexture.minFilter = THREE.LinearFilter;
          videoTexture.flipY = false;
          videoTexture.needsUpdate = true;
          videoTexture.toneMappingExposure = true;
          videoTexture.toneMapping = true;
          const videoMaterial = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.FrontSide,
            toneMapped: true,
          });
          child.material = videoMaterial;
        }

        scene.add(gltf.scene);
      });
    },

    // Loading process
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    // Error logging
    function (error) {
      console.log("An error happened" + error);
    }
  );

  //Adding skybox

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(
    0.48076381611554364,
    1.3981027631600826,
    -1.7862633770308336
  );

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(
    -1.4689363583900092,
    1.366318717884619,
    -2.667293567183144
  );
  renderer.setAnimationLoop(() => {
    fanList.forEach((fan) => (fan.rotation.y += 0.02));
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
  window.addEventListener("click", (e) => {
    if (e.target === darkButton) {
      if (document.documentElement.dataset.theme === "light") {
        sceneMaterials.scene_0.map = textures["scene_0"].night;
        sceneMaterials.scene_1.map = textures["scene_1"].night;
      } else {
        sceneMaterials.scene_0.map = textures["scene_0"].day;
        sceneMaterials.scene_1.map = textures["scene_1"].day;
      }
    }
  });
  document
    .querySelector("input[name=theme_switch]")
    .addEventListener("change", (cb) => {
      localStorage.setItem("theme", cb.target.checked ? "dark" : "light");
      document.documentElement.setAttribute(
        "data-theme",
        cb.target.checked ? "dark" : "light"
      );
    });
};
init();
