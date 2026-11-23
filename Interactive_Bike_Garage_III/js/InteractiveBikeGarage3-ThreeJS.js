// THREE.JS imports ----
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';



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
camera.rotation.set(0, 0, 0);
scene.add(camera);

//// renderer ----
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Good for sharp text/edges
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

//// effects composer ----
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

//effects
const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
// const bloomPass = new UnrealBloomPass(resolution, 0.04, 0.2, 0.2);
// composer.addPass(bloomPass);


const outputPass = new OutputPass()
composer.addPass(outputPass);

// used to resize blendercamera in browser if resizing occurs
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// prototyping orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// lighting

const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(0, 15, 3); // XYZ X:left to right Y: bottom to up Z: background to foreground
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -30;
keyLight.shadow.camera.right = 30;
keyLight.shadow.camera.top = 30;
keyLight.shadow.camera.bottom = -30;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 60;
keyLight.shadow.bias = -0.0001;
keyLight.shadow.normalBias = 0.02;
keyLight.shadow.radius = 8;
scene.add(keyLight);


// Main Scene ----
// add gltf model

let workbenchModel = null;

loadAndRunModels();
async function loadAndRunModels() {
    try {

        //load blender scene from gltf
        const gltf = await gltfLoader.loadAsync('assets/workbench-gltf-IBGIII/workbenchIIIscenes.glb');
        workbenchModel = gltf.scene // places the scene in the array and not the raw gltf data

        let objs = []
        objs.push(workbenchModel);

        addAndRun(objs);
    }
    catch (error) {
        console.log(error.message)
    }
}

const originalBlenderPos = new THREE.Vector3();

function convertToStandardMaterial(material) {
    if (material.isMeshStandardMaterial) {
        return material;
    }

    const standardMaterial = new THREE.MeshStandardMaterial({
        name: material.name,
        map: material.map,
        normalMap: material.normalMap,
        bumpMap: material.bumpMap,
        roughnessMap: material.roughnessMap,
        metalnessMap: material.metalnessMap,
        aoMap: material.aoMap,
        emissiveMap: material.emissiveMap,
        alphaMap: material.alphaMap,
        envMap: material.envMap,
        side: material.side,
        transparent: material.transparent,
        opacity: material.opacity,
        alphaTest: material.alphaTest,
        depthWrite: material.depthWrite,
        depthTest: material.depthTest,
        vertexColors: material.vertexColors,
        fog: material.fog,
        wireframe: material.wireframe,
    });

    if (material.color) {
        standardMaterial.color.copy(material.color);
    }
    if (material.emissive) {
        standardMaterial.emissive.copy(material.emissive);
        standardMaterial.emissiveIntensity = material.emissiveIntensity;
    }

    standardMaterial.roughness = 0.75;
    standardMaterial.metalness = 0.1;
    standardMaterial.bumpScale = material.bumpScale;
    standardMaterial.userData = material.userData;

    material.dispose();
    return standardMaterial;
}


//// main run function ----
function addAndRun(loadedObjsArray) {

    //workbench main scene
    const workbenchScene = loadedObjsArray[0];

    if (workbenchScene) {
        let workbenchMesh = workbenchScene.children.find(child => child.isMesh);
        workbenchScene.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
                if (Array.isArray(object.material)) {
                    object.material = object.material.map(convertToStandardMaterial);
                } else if (object.material) {
                    object.material = convertToStandardMaterial(object.material);
                }
            }
        });

        workbenchScene.traverse((object) => {
            if (object.isLight) {
                object.castShadow = true;
                object.receiveShadow = true;
                object.intensity = 1;
                object.decay = 2;
                object.distance = 4;
            }
        });



        scene.add(workbenchScene);
    }

    ////camera from blender----
    let blenderCamera = workbenchScene.children.find(child => child.isCamera);

    //change between initial and blender cam here
    //prototyping camera enter: camera
    //scene camera enter: blenderCamera
    let usedCam = blenderCamera;
    if (usedCam === blenderCamera) {
        blenderCamera.name = "blenderCamera";
        camera = blenderCamera;

        //these trigger quick page navigation for prototyping
        const isIDpage = window.location.pathname.includes('bike_id.html');
        if (isIDpage) {
            const IDPos = new THREE.Vector3(-24, 1.1, 9);
            camera.position.copy(IDPos);
            originalBlenderPos.copy(IDPos);
        } else {
            originalBlenderPos.copy(blenderCamera.position);
        }

        const isMaintenancepage = window.location.pathname.includes('maintenance.html');
        if (isMaintenancepage) {
            const maintenancePos = new THREE.Vector3(28, 1.1, 8);
            camera.position.copy(maintenancePos);
            originalBlenderPos.copy(maintenancePos);
        } else {
            originalBlenderPos.copy(blenderCamera.position);
        }

        // Update the aspect ratio to match the current html container dimensions stated in the setup container function
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();
        renderPass.camera = camera;
    }
    else {
        console.log("camera not loaded: switching to orbit controlled prototyping camera")
    }


    //camera animation triggered by triggerdwellclick function in pointer.js
    window.addEventListener("three-camera-move", ({ detail }) => {
        const start = camera.position.clone();
        const end = new THREE.Vector3(...detail.position);
        const startTime = performance.now();
        const duration = 5000;

        function animateCamera(now) {
            const t = Math.min((now - startTime) / duration, 1);
            const eased = t * t * (3 - 2 * t);

            camera.position.lerpVectors(start, end, eased);

            if (t < 1) {
                requestAnimationFrame(animateCamera);
            } else {
                detail.onComplete?.();
            }
        }

        requestAnimationFrame(animateCamera);
    });





    let elapsedTime = 0;
    window.requestAnimationFrame(animate);

    function animate(timer) {

        //calculate the difference since last frame
        let deltaTime = (timer - elapsedTime) / 1000; //put in secs
        elapsedTime = timer; //update  new elapsedTime
        controls.update();
        composer.render();
        window.requestAnimationFrame(animate);
    }
}

