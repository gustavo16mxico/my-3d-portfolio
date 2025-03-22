import "./style.scss";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import gsap from "gsap";
const init = () => {
  // Getting elements from DOM
  const modals = {
    acerca: document.querySelector(".modal.acerca"),
    experiencia: document.querySelector(".modal.experiencia"),
    contacto: document.querySelector(".modal.contacto"),
  };
  const loadingScreen = document.getElementsByClassName("loading-screen")[0];

  const canvas = document.getElementById("canvas");
  const darkButton = document.getElementsByClassName("btn--switch-theme")[0];
  const video = document.getElementById("video");
  let theme = localStorage.getItem("theme");
  // Storage
  // Adding dark theme
  const initialStorage = () => {
    if (!theme) {
      localStorage.setItem("theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
      theme = "light";
    } else {
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark") darkButton.checked = true;
    }
  };
  initialStorage();

  const showModal = (modal) => {
    raycaster.layers.disableAll();
    modal.style.display = "block";
    gsap.set(modal, { opacity: 0 });
    gsap.to(modal, {
      opacity: 1,
      duration: 0.5,
    });
  };
  const hideModal = (modal) => {
    gsap.to(modal, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        raycaster.layers.enableAll();
        modal.style.display = "none";
      },
    });
  };

  // Scene creation
  const scene = new THREE.Scene();

  // Useful variables
  // fan array
  const fanList = [];
  const targetList = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let intersectObj = [];
  //Texture location
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

  // Loading textures
  const textLoader = new THREE.TextureLoader();
  Object.keys(textureLoc).forEach((key) => {
    const textDay = textLoader.load(textureLoc[key].day);
    textDay.flipY = false;
    textDay.colorSpace = THREE.SRGBColorSpace;
    textures[key].day = textDay;

    const textNight = textLoader.load(textureLoc[key].night);
    textNight.flipY = false;
    textNight.colorSpace = THREE.SRGBColorSpace;
    textures[key].night = textNight;
  });
  // Environment Map
  const envMap = new THREE.TextureLoader()
    .setPath("environment/")
    .load(["nx.webp", "ny.webp", " nz.webp", "px.webp", "py.webp", "pz.webp"]);
  // Instantiate loader to load compressed gltf/glb

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader); // Load a glTF resource

  // gltf materials

  const fanMat = new THREE.MeshBasicMaterial({ color: "#99ccfb" }); //base mat
  const glassMat = new THREE.MeshPhysicalMaterial({
    // glass mat
    depthWrite: false,
  });

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
          const baseMat = new THREE.MeshBasicMaterial({ visible: false }); //base mat
          const material = new THREE.MeshBasicMaterial({ color: "white" }); //base mat

          child.material = baseMat;
          if (child.children.length > 0) {
            child.children[0].material = material;
          }
        }
        if (child.name.includes("fan") && child.name != "top_fan_scene_0") {
          child.material = fanMat;
          fanList.push(child);
        }
        if (child.isMesh) {
          if (child.name.includes("target")) {
            targetList.push(child);
          }
          Object.keys(textures).forEach((key) => {
            if (child.name.includes(key)) {
              const material = new THREE.MeshBasicMaterial({
                map:
                  theme === "light" ? textures[key].day : textures[key].night,
              });
              child.material = material;
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
      gsap.to(loadingScreen, {
        opacity: 0,
        duration: 1,
        onComplete: () => (loadingScreen.style.display = "none"),
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

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Orbit Controls and settings
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.maxTargetRadius = Math.PI;
  controls.maxPolarAngle = Math.PI / 2;
  controls.minPolarAngle = Math.PI / 4;
  controls.maxZoom = 2;
  controls.minZoom = 1;
  controls.maxDistance = 3;
  controls.target.set(
    -1.4689363583900092,
    1.366318717884619,
    -2.667293567183144
  );

  // Renderer animation
  renderer.setAnimationLoop(() => {
    fanList.forEach((fan) => (fan.rotation.y += 0.02));
    controls.update();
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
  });
  document.body.appendChild(renderer.domElement);

  // Events

  window.addEventListener("mousemove", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    // calculate objects intersecting the picking ray
    intersectObj = raycaster.intersectObjects(targetList);
  });
  Object.values(modals).forEach((modal) =>
    modal.addEventListener("click", () => {
      if (intersectObj.length > 0) {
        const children = intersectObj[i].object.children;
        if (intersectObj[0].object.name.includes("target")) {
          document.body.style.cursor = "pointer";
        } else {
          document.body.style.cursor = "default";
        }
      } else {
        document.body.style.cursor = "default";
      }
    })
  );

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-exit"))
      hideModal(e.target.parentElement);
    if (
      intersectObj.length > 0 &&
      intersectObj[0].object.name.includes("text")
    ) {
      const children = intersectObj[0].object.children[0];
      switch (children.name) {
        case "acerca":
          showModal(modals.acerca);
          break;
        case "experiencia":
          showModal(modals.experiencia);
          break;
        case "contacto":
          showModal(modals.contacto);
          break;
        default:
          break;
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
