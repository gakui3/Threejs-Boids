import * as THREE from 'three';
import { FBXLoader } from '../node_modules/three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls';
import { SkeletonUtils } from '../node_modules/three/examples/jsm/utils/SkeletonUtils';
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
let camera, canvas, renderer, clock, fbxLoader, mixer, boids, mousePos, target: Mesh;

let _tes: Vector3 = new THREE.Vector3(1, 1, 1);

function init() {
  canvas = document.querySelector('#c');
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(800, 600);
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

  var geometry = new THREE.SphereGeometry(0.5);
  target = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial());
  scene.add(target);

  const vOA = new THREE.Vector2(2, 0);
  const vOB = new THREE.Vector2(1, 1);
  const vOC = vOA.sub(vOB);
}
function update() {
  requestAnimationFrame(update);

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
  camera.position.set(0, 0, 5);
  const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();
}
async function addFish() {
  console.log(`load start`);
  var baseObj;

  await fbxLoader.loadAsync('./assets/fish.fbx').then((group) => {
    baseObj = group;
  });

  for (let i = 0; i < 30; i++) {
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
  await addFish();
  update();
})();
