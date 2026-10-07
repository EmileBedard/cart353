// THREE.JS imports ----
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

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



// Main Scene ----
// add gltf model
let garageModel = null;
let cabinetModel = null;
let workbenchModel = null;

loadAndRunModels();
async function loadAndRunModels(objectsGroup) {
    try {

        //Load HDR file
        const loader = new HDRLoader();
        const hdrTexture = await loader.loadAsync('assets/drakensberg_solitary_mountain_1k.hdr');
        console.log(hdrTexture);
        //map a 360 image
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = hdrTexture;

        //load blender scene from gltf
        garageModel = await gltfLoader.loadAsync('assets/garage-v0/garage.glb');
        //load cabinet gltf
        cabinetModel = await gltfLoader.loadAsync('assets/garage-v0/cabinet.glb');
        //load workbench gltf
        workbenchModel = await gltfLoader.loadAsync('assets/garage-v0/workbench.glb');

        let objs = []
        objs.push(garageModel, cabinetModel, workbenchModel);

        addAndRun(objs)

    }
    catch (error) {
        console.log(error.message)
    }
}


//// mouse and parallax for blender camera ----
const mouse = { x: 0, y: 0 };
const targetPos = new THREE.Vector2(0, 0);
const originalBlenderPos = new THREE.Vector3();
const movementLimit = 5; // Maximum units the camera shifts
const dampening = 0.02;    // Smoothness (lower = silkier)


////// event listeners for mouse and parallax ----
window.addEventListener('mousemove', (event) => {
    // Normalize mouse to -1 to +1
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});
// used to resize blendercamera
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


//// main run function ----
function addAndRun(loadedObjsArray) {
    console.log(loadedObjsArray)
    //garage
    const garageScene = loadedObjsArray[0].scene; //load blender data and place in the scene
    scene.add(garageScene);

    //cabinet
    const cabinetObj = loadedObjsArray[1].scene; //load blender data and place in the scene
    scene.add(cabinetObj);

    //workbench
    const workbenchObj = loadedObjsArray[2].scene; //load blender data and place in the scene
    scene.add(workbenchObj);

    ////camera from blender----
    let blenderCamera = garageScene.children.find(child => child.isCamera);

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

        // Update the aspect ratio to match the current html container dimensions stated in the setup cntainer function
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();
        renderPass.camera = camera;
    }
    else {
        console.log("camera not loaded:error")
    }

    // animation mixers ----
    const mixer1 = new THREE.AnimationMixer(cabinetObj);
    const mixer2 = new THREE.AnimationMixer(workbenchObj);

    // Access open door animation for cabinet
    const cabinetClip = loadedObjsArray[1].animations[0];
    const openDoor = mixer1.clipAction(cabinetClip);
    openDoor.setLoop(THREE.LoopOnce);
    openDoor.repetitions = 1000;
    openDoor.clampWhenFinished = true;
    console.log(openDoor);

    let rpButton = document.getElementById("registerPartsButton");

    rpButton.addEventListener("mouseover", function () {
        openDoor.timeScale = 1;
        openDoor.paused = false
        openDoor.play();
    })

    rpButton.addEventListener("mouseout", function () {
        openDoor.timeScale = -1;
        openDoor.paused = false
        openDoor.play();
    })

    // Access open toolbox animation for workbench
    const workbenchClip = loadedObjsArray[2].animations[0];
    const openToolbox = mixer2.clipAction(workbenchClip);
    openToolbox.setLoop(THREE.LoopOnce);
    openToolbox.repetitions = 1000;
    openToolbox.clampWhenFinished = true;
    console.log(openToolbox);

    let mButton = document.getElementById("maintenanceButton");
    console.log(mButton);

    mButton.addEventListener("mouseover", function () {
        openToolbox.timeScale = 1;
        openToolbox.paused = false
        openToolbox.play();
    })

    mButton.addEventListener("mouseout", function () {
        openToolbox.timeScale = -1;
        openToolbox.paused = false
        openToolbox.play();
    })



    let elapsedTime = 0;
    window.requestAnimationFrame(animate);

    function animate(timer) {

        //calculate the difference since last frame
        let deltaTime = (timer - elapsedTime) / 1000; //put in secs
        elapsedTime = timer; //update  new elapsedTime

        //controls camera parallax
        if (camera.name === "blenderCamera") {

            // calculate offset
            targetPos.x = mouse.x * movementLimit;
            targetPos.y = mouse.y * movementLimit;

            // Target position
            const targetX = originalBlenderPos.x + targetPos.x;
            const targetY = originalBlenderPos.y + targetPos.y;

            // smooth translation on fictional x/y rectangle
            camera.position.x += (targetX - camera.position.x) * dampening;
            camera.position.y += (targetY - camera.position.y) * dampening;

            camera.lookAt(0, 0, 0); // look at bike
        }

        //animation mixer
        if (mixer1 || mixer2) {
            mixer1.update(deltaTime);
            mixer2.update(deltaTime);
        }

        composer.render();
        window.requestAnimationFrame(animate);
    }
}


