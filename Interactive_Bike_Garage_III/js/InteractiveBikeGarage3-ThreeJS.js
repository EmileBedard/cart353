// THREE.JS imports ----
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// setup ---- 

//// gltf loader ----
const gltfLoader = new GLTFLoader();

// initial sizes
let sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

//sets new sizes based on html container dimensions
setupContainer();
function setupContainer() {
    let container = document.querySelector('#canvas-container');
    sizes.width = container.clientWidth;
    sizes.height = container.clientHeight;
}

//// scene and canvas ---
const scene = new THREE.Scene();
let canvas = document.querySelector("canvas#three-ex");

//// camera (before attaching to blenderCamera)----
let camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(0, 5, 10);
scene.add(camera);

//// renderer ----
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Good for sharp text/edges
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//// effects composer ----
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

//effects
const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
const bloomPass = new UnrealBloomPass(resolution, 0.04, 0.2, 0.2);
composer.addPass(bloomPass);

const outputPass = new OutputPass()
composer.addPass(outputPass);

// used to resize blendercamera in browser if resizing occurs
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// Main Scene ----
// add gltf model

let workbenchModel = null;

loadAndRunModels();
async function loadAndRunModels() {
    try {

        //load blender scene from gltf
        const gltf = await gltfLoader.loadAsync('assets/workbench-gltf-IBGIII/InteractiveBikeGarageIII-CART353.glb');
        console.log(gltf);
        workbenchModel = gltf.scene // places the scene in the array and not the raw gltf data

        let objs = []
        objs.push(workbenchModel);

        addAndRun(objs)
        console.log(objs);
    }
    catch (error) {
        console.log(error.message)
    }
}

const originalBlenderPos = new THREE.Vector3();


//// main run function ----
function addAndRun(loadedObjsArray) {

    //workbench main scene
    const workbenchScene = loadedObjsArray[0];

    if (workbenchScene) {
        scene.add(workbenchScene);
    }

    ////camera from blender----
    let blenderCamera = workbenchScene.children.find(child => child.isCamera);

    //change between initial and blender cam here
    let usedCam = blenderCamera;
    if (usedCam === blenderCamera) {
        blenderCamera.name = "blenderCamera";
        camera = blenderCamera;

        const isRegistryPage = window.location.pathname.includes('parts_registry.html');
        if (isRegistryPage) {
            const registryPos = new THREE.Vector3(-17, 15, 40);
            camera.position.copy(registryPos);
            originalBlenderPos.copy(registryPos);
        } else {
            originalBlenderPos.copy(blenderCamera.position);
        }

        // Update the aspect ratio to match the current html container dimensions stated in the setup container function
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();
        renderPass.camera = camera;
    }
    else {
        console.log("camera not loaded:error")
    }



    let elapsedTime = 0;
    window.requestAnimationFrame(animate);

    function animate(timer) {

        //calculate the difference since last frame
        let deltaTime = (timer - elapsedTime) / 1000; //put in secs
        elapsedTime = timer; //update  new elapsedTime

        composer.render();
        window.requestAnimationFrame(animate);
    }
}


