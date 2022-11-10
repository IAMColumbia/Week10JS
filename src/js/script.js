import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import * as CANNON from "cannon-es"
import { DstColorFactor } from "three";
import { Vec3 } from "cannon-es";

var width = window.innerWidth - 20;
var height = window.innerHeight - 50;

const scene = new THREE.Scene();
const world = new CANNON.World({gravity: new CANNON.Vec3(0, -10, 0)});
const camera = new THREE.PerspectiveCamera(50, width / height, .1, 1000);

camera.position.z = 10;
camera.position.y = 5;
camera.position.x = 0;
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setClearColor("#89cfe8");
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
document.body.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);

const axesHelpers = new THREE.AxesHelper();
scene.add(axesHelpers);

const directionalLight = new THREE.DirectionalLight({color: 0x00000, intensity: 0.6})
directionalLight.castShadow = true;
directionalLight.position.set( 0, 20, 0 );
scene.add(directionalLight);

const mousePos = new THREE.Vector2();
const intersectPt = new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const plane = new THREE.Plane();
const raycaster = new THREE.Raycaster();
const spheres = [];
const bodies = [];
var doSphere = true;

const planeGeo = new THREE.PlaneGeometry(10, 10);
const planeMat = new THREE.MeshStandardMaterial({color: 0x63d681, side:THREE.DoubleSide});
const ground = new THREE.Mesh(planeGeo, planeMat);
ground.receiveShadow = true;
scene.add(ground);

const planePMat = new CANNON.Material();
const planeBody = new CANNON.Body(
{
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(5,5,.1)),
    material: planePMat
});
planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(planeBody);

CreateBox(new Vec3(5, 1.25, 0), new Vec3(1, 2.5, 10));
CreateBox(new Vec3(-5, 1.25, 0), new Vec3(1, 2.5, 10));
CreateBox(new Vec3(0, 1.25, 5), new Vec3(10, 2.5, 1));
CreateBox(new Vec3(0, 1.25, -5), new Vec3(10, 2.5, 1));

timeStep = 1/60;
function animate()
{
    world.step(timeStep);
    ground.position.copy(planeBody.position);
    ground.quaternion.copy(planeBody.quaternion);

    for(let i = 0; i < bodies.length; i++)
    {
        spheres[i].position.copy(bodies[i].position);
        spheres[i].quaternion.copy(bodies[i].quaternion);
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("click", function(e)
{
    var objGeo;
    var objMat;
    var obj;
    const objPMat = new CANNON.Material();
    var objBody;

    if (doSphere) {
        objGeo = new THREE.SphereGeometry(.25, 30, 30);
        objMat = new THREE.MeshStandardMaterial({color: 0xFFFFFF * Math.random()});
        obj = new THREE.Mesh(objGeo, objMat);
        objBody = new CANNON.Body(
            {
                material: objPMat,
                shape: new CANNON.Sphere(.125),
                mass: 3,
                position: new CANNON.Vec3(intersectPt.x, intersectPt.y, intersectPt.z)
            });
    }
    else
    {
        objGeo = new THREE.BoxGeometry(.5, .5, .5);
        objMat = new THREE.MeshStandardMaterial({color: 0xFFFFFF * Math.random()});
        obj = new THREE.Mesh(objGeo, objMat);
        objBody = new CANNON.Body(
            {
                material: objPMat,
                shape: new CANNON.Box(new CANNON.Vec3(.25, .25, .25)),
                mass: 3,
                position: new CANNON.Vec3(intersectPt.x, intersectPt.y, intersectPt.z)
            });
    }

    obj.castShadow = true;
    obj.receiveShadow = true;

    doSphere = !doSphere;

    scene.add(obj);
    obj.position.copy(intersectPt);
    world.addBody(objBody);

    const planeSphereContact = new CANNON.ContactMaterial(planePMat, objPMat, { restitution: 0.9 });
    world.addContactMaterial(planeSphereContact);

    spheres.push(obj);
    bodies.push(objBody);
});

function CreateBox(pos, size)
{
    const boxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const boxMat = new THREE.MeshStandardMaterial({color: 0xffffff * Math.random()});
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(pos.x, pos.y, pos.z);
    const body = new CANNON.Body(
    {    type: CANNON.Body.STATIC,
        shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)),
        position: new CANNON.Vec3(pos.x, pos.y, pos.z)
    });
    scene.add(box);
    world.addBody(body);
}

window.addEventListener("mousemove", function(e)
{
    mousePos.x = (e.clientX / this.window.innerWidth) * 2 - 1;
    mousePos.y = -(e.clientY / this.window.innerHeight) * 2 + 1;

    planeNormal.copy(camera.position).normalize();

    plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);

    raycaster.setFromCamera(mousePos, camera);
    raycaster.ray.intersectPlane(plane, intersectPt);
});

window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});