import * as THREE from "https://threejs.org/build/three.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "./utils/OrbitControls.js";
import gsap from "gsap";

// Shader utility
const verte = `
				precision highp float;
        in vec3 position;
        in vec2 texcoord;
        out vec2 interpolatedTextCoord;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {
        interpolatedTexCoord = textcoord;
				}
			`;
const shadeFrag = `
				precision highp float;

				out vec4 outColor;
        in vec2 interpolatedTexCoord;
        uniform sampler2D myTexture;

				void main() {

					vec4 textColor = texture( myTexture );
					outColor = texColor;

				}
			`;
new THREE.MeshBasicMaterial();
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
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 100);
camera.position.set(-2, 0, 3);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x444444);
document.body.appendChild(renderer.domElement);

let manager = new THREE.LoadingManager();
manager.onLoad = () => {
  startSequence();
};

let tLoader = new THREE.TextureLoader(manager);
let textures = {
  scene_0: [
    tLoader.load("/textures/inverted/scene_day_001.webp"),
    tLoader.load("/textures/inverted/scene_night_001.webp"),
  ],
  scene_1: [
    tLoader.load("/textures/inverted/scene_night_002.webp"),
    tLoader.load("/textures/inverted/scene_day_002.webp"),
  ],
};
tLoader.flipY = false;
tLoader.colorSpace = THREE.SRGBColorSpace;

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
const newMat = new THREE.ShaderMaterial({
  vertexShader: verte,
  fragmentShader: shadeFrag,
});
gltfLoader.load(
  // Resource URL
  "room.glb",
  // Resource is loaded.
  function (gltf) {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        Object.keys(textures).forEach((key) => {
          if (child.name.includes(key)) {
            console.log(newMat, material[key]);
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

let counter = 0;

function startSequence() {
  gsap.fromTo(
    material.scene_0.uniforms.transition,
    { value: 0 },
    {
      value: 1,
      duration: 2,
      repeat: -1,
      repeatRefresh: true,
      onRepat: () => {
        let idx1 = counter % textures.scene_0.length;
        let idx2 = idx1 + 1 == textures.scene_0.length ? 0 : idx1 + 1;
        counter++;
        material.scene_0.uniforms.t1.value = textures.scene_0[idx1];
        material.scene_0.uniforms.t2.value = textures.scene_0[idx2];
      },
    }
  );
  gsap.fromTo(
    material.scene_1.uniforms.transition,
    { value: 0 },
    {
      value: 1,
      duration: 2,
      repeat: -1,
      repeatRefresh: true,
      onRepat: () => {
        let idx1 = counter % textures.scene_1.length;
        let idx2 = idx1 + 1 == textures.scene_1.length ? 0 : idx1 + 1;
        counter++;
        material.scene_1.uniforms.t1.value = textures.scene_1[idx1];
        material.scene_1.uniforms.t2.value = textures.scene_1[idx2];
      },
    }
  );
}

const controls = new OrbitControls(camera, renderer.domElement);
renderer.setAnimationLoop((_) => {
  controls.update();
  renderer.render(scene, camera);
});
