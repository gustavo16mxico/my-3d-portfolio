import "./style.scss";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "./utils/OrbitControls.js";
import * as THREE from "three";
import gsap from "gsap";
const init = () => {
  const vertexGlsl = `
    varying vec2 vUv;
    void main() {
    	vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }`;
  const fragmentGlsl = `  	
    uniform sampler2D t1;
    uniform sampler2D t2;
    uniform float transition;
    varying vec2 vUv;
    void main(){
    	vec4 tex1 = texture2D(t1, vUv);
      vec4 tex2 = texture2D(t2, vUv);
      
      gl_FragColor = mix(tex1, tex2, transition);
    
    }`;
  // DOM helper functions
  const get = document.getElementById.bind(document);
  const getClass = document.getElementsByClassName.bind(document);
  const query = document.querySelector.bind(document);
  // Getting elements from DOM
  const sound_icon = getClass("icon--sound")[0];

  const modals = {
    acerca: query(".modal.acerca"),
    experiencia: query(".modal.experiencia"),
    contacto: query(".modal.contacto"),
  };
  const closeModal = {
    acerca: query(".modal.acerca .modal--content .btn-exit"),
    experiencia: query(".modal.experiencia .modal--content .btn-exit"),
    contacto: query(".modal.contacto .modal--content .btn-exit"),
  };
  const audioBtn = getClass("btn--sound-switch")[0];
  const app = getClass("app")[0];
  const loadingScreen = getClass("loading--screen")[0];
  const loadingBar = getClass("loading--bar")[0];
  const canvas = get("canvas");
  const darkButton = getClass("btn--switch-theme")[0];
  const video = query("video");
  video.play();
  video.addEventListener(
    "play",
    function () {
      this.currentTime = 3;
    },
    false
  );
  const localSettings = {
    theme: localStorage.getItem("theme"),
    sound: localStorage.getItem("sound"),
  };

  // Storage
  // Adding dark theme and sound
  const initialStorage = () => {
    if (!localSettings.theme) {
      localStorage.setItem("theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
      localSettings.theme = "light";
    } else {
      document.documentElement.setAttribute("data-theme", localSettings.theme);
      if (localSettings.theme === "dark") darkButton.checked = true;
    }
    if (!localSettings.sound) {
      localStorage.setItem("sound", "true");
      document.documentElement.setAttribute("data-sound", "true");
      audioBtn.checked = true;
    } else {
      document.documentElement.setAttribute("data-sound", localSettings.sound);
      if (localSettings.sound === "true") audioBtn.checked = true;
      else audioBtn.checked = false;
    }
  };
  initialStorage();

  const showModal = (modal) => {
    raycaster.layers.disableAll();
    controls.enabled = false;
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
      duration: 0.7,
      onComplete: () => {
        raycaster.layers.enableAll();
        modal.style.display = "none";
        controls.enabled = true;
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
  let hoverStateObj = null;
  let intersectObj = [];

  const sceneObjs = {
    scene_0: [],
    scene_1: [],
  };
  // Loading textures

  let manager = new THREE.LoadingManager();
  manager.onLoad = () => {
    if (localSettings.theme === "light") {
      material.scene_0.uniforms.t1.value = textures.scene_0[0];
      material.scene_0.uniforms.t2.value = textures.scene_0[1];
      material.scene_1.uniforms.t1.value = textures.scene_1[0];
      material.scene_1.uniforms.t2.value = textures.scene_1[1];
    } else {
      material.scene_0.uniforms.t1.value = textures.scene_0[1];
      material.scene_0.uniforms.t2.value = textures.scene_0[0];
      material.scene_1.uniforms.t1.value = textures.scene_1[1];
      material.scene_1.uniforms.t2.value = textures.scene_1[0];
    }
  };
  let tLoader = new THREE.TextureLoader(manager);
  let textures = {
    scene_0: [
      tLoader.load("/textures/inverted/scene_day_001.webp"),
      tLoader.load("/textures/inverted/scene_night_001.webp"),
    ],
    scene_1: [
      tLoader.load("/textures/inverted/scene_day_002.webp"),
      tLoader.load("/textures/inverted/scene_night_002.webp"),
    ],
  };

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
  let material = {
    scene_0: new THREE.ShaderMaterial({
      uniforms: {
        t1: { value: null },
        t2: { value: null },
        transition: { value: 0 },
      },
      vertexShader: vertexGlsl,
      fragmentShader: fragmentGlsl,
    }),
    scene_1: new THREE.ShaderMaterial({
      uniforms: {
        t1: { value: null },
        t2: { value: null },
        transition: { value: 0 },
      },
      vertexShader: vertexGlsl,
      fragmentShader: fragmentGlsl,
    }),
  };

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
        if (child.name.includes("hover")) {
          child.userData.initialScale = new THREE.Vector3().copy(child.scale);
          child.userData.initialPosition = new THREE.Vector3().copy(
            child.position
          );
          child.userData.initialRotation = new THREE.Euler().copy(
            child.rotation
          );
          child.userData.isHover = false;
        }
        if (child.name.includes("base")) {
          const baseMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
          child.material = baseMat;
        }
        if (child.name.includes("text")) {
          const baseMat = new THREE.MeshBasicMaterial({ visible: false }); //base mat
          const material = new THREE.MeshBasicMaterial({ color: "white" }); //base mat

          child.material = baseMat;
          if (child.children.length > 0) {
            child.children[0].material = material;
          }
        }
        if (child.name.includes("name")) {
          const baseMat = new THREE.MeshBasicMaterial({ color: "white" }); //base mat
          child.material = baseMat;
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
              sceneObjs[key].push(child);
              child.material = material[key];

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
      app.style.display = "revert";
      darkButton.style.opacity = "1";
    },

    // Loading process
    function (xhr) {
      loadingBar.style.transform = `scaleX(${xhr.loaded / xhr.total})`;

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
  // AUDIO

  const listener = new THREE.AudioListener();
  const sound = new THREE.Audio(listener);

  const audioLoader = new THREE.AudioLoader();

  //Load a sound and set it as the Audio object's buffer
  audioLoader.load(
    "sounds/ChasingDaylight.ogg",
    function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.5);
      sound.play();
      if (localSettings.sound === "false") sound.pause();
    },
    // onProgress callback
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },

    // onError callback
    function (err) {
      console.log("Un error ha ocurrido" + err);
    }
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
  controls.maxPolarAngle = Math.PI / 2;
  controls.minPolarAngle = 0;
  controls.minAzimuthAngle = 0;
  controls.maxAzimuthAngle = Math.PI / 2;
  controls.minDistance = -3;
  controls.maxDistance = 6;
  controls.target.set(
    -1.4689363583900092,
    1.366318717884619,
    -2.667293567183144
  );

  // Helper functions
  const hoverAnim = (raycastObj, isHover) => {
    gsap.killTweensOf(raycastObj.scale);
    if (isHover) {
      raycastObj.userData.isHover = isHover;
      gsap.to(raycastObj.scale, {
        x: raycastObj.userData.initialScale.x * 1.2,
        y: raycastObj.userData.initialScale.y * 1.2,
        z: raycastObj.userData.initialScale.z * 1.2,
        duration: 0.5,
        ease: "elastic.out(1.2)",
      });
    } else {
      raycastObj.userData.isHover = false;
      gsap.to(raycastObj.scale, {
        x: raycastObj.userData.initialScale.x,
        y: raycastObj.userData.initialScale.y,
        z: raycastObj.userData.initialScale.z,
        duration: 0.3,
      });
    }
  };
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

    interactionMove();
  });

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
  window.addEventListener("click", (e) => {
    if (e.target === modals.acerca || e.target === closeModal.acerca)
      hideModal(modals.acerca);
    if (e.target === modals.experiencia || e.target === closeModal.experiencia)
      hideModal(modals.experiencia);
    if (e.target === modals.contacto || e.target === closeModal.contacto)
      hideModal(modals.contacto);
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

  function interactionMove() {
    // calculate objects intersecting the picking ray
    intersectObj = raycaster.intersectObjects(targetList);

    if (intersectObj.length > 0) {
      const currObj = intersectObj[0].object;

      if (currObj.name.includes("hover")) {
        if (hoverStateObj !== null) {
          if (hoverStateObj.userData.isHover) return;
          if (hoverStateObj !== currObj) hoverAnim(hoverStateObj, false);
        }
        hoverStateObj = currObj;
        hoverAnim(hoverStateObj, true);
      }

      if (currObj.name.includes("target")) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    } else {
      if (hoverStateObj) {
        hoverAnim(hoverStateObj, false);
        hoverStateObj = null;
      }
      document.body.style.cursor = "default";
    }
  }

  window.addEventListener("touchmove", (event) => {
    pointer.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    interactionMove();
  });
  audioBtn.addEventListener("change", (e) => {
    document.documentElement.setAttribute(
      "data-sound",
      e.target.checked ? "true" : "false"
    );
    if (e.target.checked) {
      localStorage.setItem("sound", "true");
      sound.play();
    } else {
      localStorage.setItem("sound", "false");
      sound.pause();
    }
  });

  document
    .querySelector("input[name=theme_switch]")
    .addEventListener("change", (cb) => {
      if (!cb.target.checked) {
        startSequenceNight();
      } else {
        startSequenceDay();
      }
      localStorage.setItem("theme", cb.target.checked ? "dark" : "light");
      document.documentElement.setAttribute(
        "data-theme",
        cb.target.checked ? "dark" : "light"
      );
    });
  function startSequenceNight() {
    gsap.fromTo(
      material.scene_0.uniforms.transition,
      { value: 1 },
      {
        value: 0,
        duration: 1,
        // repeat: -1,
        // repeatRefresh: true,
        onRepat: () => {
          material.scene_0.uniforms.t1.value = textures.scene_0[0];
          material.scene_0.uniforms.t2.value = textures.scene_0[1];
        },
      }
    );

    gsap.fromTo(
      material.scene_1.uniforms.transition,
      { value: 1 },
      {
        value: 0,
        duration: 1,
        // repeat: -1,
        // repeatRefresh: true,
        onRepat: () => {
          material.scene_1.uniforms.t1.value = textures.scene_1[0];
          material.scene_1.uniforms.t2.value = textures.scene_1[1];
        },
      }
    );
  }
  function startSequenceDay() {
    gsap.fromTo(
      material.scene_0.uniforms.transition,
      { value: 0 },
      {
        value: 1,
        duration: 1,
        // repeat: -1,
        // repeatRefresh: true,
        onRepat: () => {
          material.scene_0.uniforms.t1.value = textures.scene_0[0];
          material.scene_0.uniforms.t2.value = textures.scene_0[1];
        },
      }
    );

    gsap.fromTo(
      material.scene_1.uniforms.transition,
      { value: 0 },
      {
        value: 1,
        duration: 1,
        // repeat: -1,
        // repeatRefresh: true,
        onRepat: () => {
          material.scene_1.uniforms.t1.value = textures.scene_1[0];
          material.scene_1.uniforms.t2.value = textures.scene_1[1];
        },
      }
    );
  }
};
init();
