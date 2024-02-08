/////////////////////////////////////////////////////////////////////////
///// IMPORT
import './main.css'
import * as THREE from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { threeToCannon, ShapeType } from 'three-to-cannon';
import * as CANNON from 'cannon-es'
import CannonDebugRenderer from './utils/cannonDebugRenderer.js'
import { Octree } from 'three/examples/jsm/math/Octree.js';
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper.js';

/////////////////////////////////////////////////////////////////////////
//// DRACO LOADER TO LOAD DRACO COMPRESSED MODELS FROM BLENDER
const dracoLoader = new DRACOLoader()
const loader = new GLTFLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
dracoLoader.setDecoderConfig({ type: 'js' })
loader.setDRACOLoader(dracoLoader)

/////////////////////////////////////////////////////////////////////////
///// DIV CONTAINER CREATION TO HOLD THREEJS EXPERIENCE
const container = document.createElement('div')
document.body.appendChild(container)

/////////////////////////////////////////////////////////////////////////
///// SCENE CREATION
const scene = new THREE.Scene()
scene.background = new THREE.Color('#c8f0f9')

/////////////////////////////////////////////////////////////////////////
///// CANNON PHYSICS WORLD
// const world = new CANNON.World({
//     gravity: new CANNON.Vec3(0, -9.82, 0),
// })

/////////////////////////////////////////////////////////////////////////
///// Octree for collision detection
const worldOctree = new Octree();

/////////////////////////////////////////////////////////////////////////
///// CANNON DEBUG RENDERER
// const debugRenderer = new CannonDebugRenderer(scene, world)

/////////////////////////////////////////////////////////////////////////
///// RENDERER CONFIG
const renderer = new THREE.WebGLRenderer({ antialias: true }) // turn on antialias
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //set pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight) // make it full screen
renderer.outputEncoding = THREE.sRGBEncoding // set color encoding
container.appendChild(renderer.domElement) // add the renderer to html div

/////////////////////////////////////////////////////////////////////////
///// CAMERAS CONFIG
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 1000)
camera.position.set(34, 16, -20)
scene.add(camera)

/////////////////////////////////////////////////////////////////////////
///// MAKE EXPERIENCE FULL SCREEN
window.addEventListener('resize', () => {
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    renderer.setPixelRatio(2)
})

/////////////////////////////////////////////////////////////////////////
///// CREATE ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement)

/////////////////////////////////////////////////////////////////////////
///// SCENE LIGHTS
const ambient = new THREE.AmbientLight(0xa0a0fc, 0.82)
scene.add(ambient)

const sunLight = new THREE.DirectionalLight(0xe8c37b, 1.96)
sunLight.position.set(-69, 44, 14)
scene.add(sunLight)

/////////////////////////////////////////////////////////////////////////
///// LOADING GLB/GLTF MODEL FROM BLENDER
console.log("loading model before")

// ！更改此路径可加载自定义模型
const modelUrl = 'models/gltf/starter-scene.glb'

loader.load(
    // resource URL
    modelUrl,
    // called when the resource is loaded
    function (gltf) {
        console.log("loading model");
        scene.add(gltf.scene);
        for (const child of gltf.scene.children) {
            /// 这里将选定的子节点都加入到八叉树中，可加判断条件
            // if(child.name.substring(0,10) == "BJYDDXTREE")
            worldOctree.fromGraphNode(child); // 加入八叉树结构
        }
        console.log(worldOctree.subTrees)
        /// 八叉树可视化
        const helper = new OctreeHelper(worldOctree);
        helper.visible = true;
        scene.add(helper);

        console.log('Load complete');
    },
    // called while loading is progressing
    function (xhr) {
        console.log('Model load progress: ' + (xhr.loaded / xhr.total * 100) + '%');
    },
    // called when loading has errors
    function (error) {
        console.log('An error happened', error);
    }
);

/////////////////////////////////////////////////////////////////////////
//// INTRO CAMERA ANIMATION USING TWEEN
function introAnimation() {
    controls.enabled = false //disable orbit controls to animate the camera

    new TWEEN.Tween(camera.position.set(26, 4, -35)).to({ // from camera position
        x: 16, //desired x position to go
        y: 50, //desired y position to go
        z: -0.1 //desired z position to go
    }, 6500) // time take to animate
        .delay(1000).easing(TWEEN.Easing.Quartic.InOut).start() // define delay, easing
        .onComplete(function () { //on finish animation
            controls.enabled = true //enable orbit controls
            setOrbitControlsLimits() //enable controls limits
            TWEEN.remove(this) // remove the animation from memory
        })
}

//introAnimation() // call intro animation on start

/////////////////////////////////////////////////////////////////////////
//// DEFINE ORBIT CONTROLS LIMITS
function setOrbitControlsLimits() {
    controls.enableDamping = true
    controls.dampingFactor = 0.04
    controls.minDistance = 35
    controls.maxDistance = 600
    controls.enableRotate = true
    controls.enableZoom = true
    controls.maxPolarAngle = Math.PI / 2.5
}

/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION
function rendeLoop() {

    //TWEEN.update() // update animations

    controls.update() // update orbit controls

    // world.step(1 / 60) // update physics world
    // debugRenderer.update() // update cannon debug renderer
    renderer.render(scene, camera) // render the scene using the camera

    requestAnimationFrame(rendeLoop) //loop the render function

}

rendeLoop() //start rendering