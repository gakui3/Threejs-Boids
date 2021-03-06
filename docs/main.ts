import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import testVert from './shaders/test.vert';
import testFrag from './shaders/test.frag';
import {
  Group,
  Mesh,
  MeshPhongMaterial,
  Object3D,
  ShaderChunk,
  ShaderMaterial,
  SkinnedMesh,
  SphereGeometry,
  UniformsLib,
  Vector3,
} from 'three';
import { boidElement } from './boidElement';

const scene = new THREE.Scene();
let camera, canvas, renderer, clock, fbxLoader, mixer, boids, mousePos, gui: GUI, target: Mesh;

let _tes: Vector3 = new THREE.Vector3(1, 1, 1);

function init() {
  canvas = document.querySelector('#c');
  renderer = new THREE.WebGLRenderer({ canvas });
  clock = new THREE.Clock();
  fbxLoader = new FBXLoader();
  boids = new Array();
  document.body.appendChild(renderer.domElement);

  canvas.addEventListener(
    'mousemove',
    function (evt) {
      mousePos = getMousePosition(canvas, evt);
    },
    false
  );

  const gridHelper = new THREE.GridHelper(100, 100);
  scene.add(gridHelper);

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  scene.background = new THREE.Color(0xa0a0a0);

  var geometry = new THREE.SphereGeometry(0.25);
  target = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial());
  scene.add(target);

  const vOA = new THREE.Vector2(2, 0);
  const vOB = new THREE.Vector2(1, 1);
  const vOC = vOA.sub(vOB);
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function update() {
  requestAnimationFrame(update);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  const delta = clock.getDelta();
  for (const fish of boids) {
    fish.update(delta, target.position, boids);
  }

  renderer.render(scene, camera);
}
function addLight() {
  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.camera.left = -120;
  dirLight.shadow.camera.right = 120;
  scene.add(dirLight);
}
function addCamera() {
  camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
  camera.position.set(0, 18, 0);
  camera.rotateX(Math.PI * 0.5);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();
}
function addGUI() {
  const param = {
    showVector: false,
    showScopeOfForce: false,
    separatioWeight: 10.0,
    alignmentWeight: 5.0,
    cohesionWeight: 5.0,
    toTargetWeight: 0.2,
    scopeRadius: 2.0,
    velocityRangeMin: 0.3,
    velocityRangeMax: 4.0,
  };
  gui = new GUI();
  gui.width = 300;
  gui.add(param, 'showVector').onChange(() => {
    boids.forEach((element) => {
      element.switchShowVector();
    });
  });
  gui.add(param, 'showScopeOfForce').onChange(() => {
    boids.forEach((element) => {
      element.switchShowScopeOfForce();
    });
  });
  gui.add(param, 'separatioWeight', 1, 50).onChange((value) => {
    boids.forEach((element) => {
      element.separatioWeight = value;
    });
  });
  gui.add(param, 'alignmentWeight', 1, 50).onChange((value) => {
    boids.forEach((element) => {
      element.alignmentWeight = value;
    });
  });
  gui.add(param, 'cohesionWeight', 1, 50).onChange((value) => {
    boids.forEach((element) => {
      element.cohesionWeight = value;
    });
  });
  gui.add(param, 'toTargetWeight', 0.1, 5).onChange((value) => {
    boids.forEach((element) => {
      element.toTargetWeight = value;
    });
  });
  gui.add(param, 'scopeRadius', 1, 10).onChange((value) => {
    boids.forEach((element) => {
      element.scopeRadius = value;
    });
  });
  gui.add(param, 'velocityRangeMin', 0.1, 2).onChange((value) => {
    boids.forEach((element) => {
      element.velocityRange.min = value;
    });
  });
  gui.add(param, 'velocityRangeMax', 2, 10).onChange((value) => {
    boids.forEach((element) => {
      element.velocityRange.max = value;
    });
  });
}
async function addFish() {
  console.log(`load start`);
  var baseObj;

  await fbxLoader.loadAsync('./assets/models/fish.fbx').then((group) => {
    baseObj = group;
  });

  for (let i = 0; i < 150; i++) {
    var fish = new boidElement();
    await fish.init(baseObj);
    scene.add(fish.rootObj);
    boids.push(fish);
  }
}
function getMousePosition(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  };
}

(async function () {
  init();
  addCamera();
  addLight();
  addGUI();
  await addFish();
  update();
})();
