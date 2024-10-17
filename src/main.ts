import { Line2, LineGeometry, LineMaterial } from 'three/examples/jsm/Addons.js';
import './style.css'
import { CatmullRomCurve3, ExtrudeGeometry, FrontSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PCFSoftShadowMap, PerspectiveCamera, PointLight, Raycaster, Scene, Shape, SphereGeometry, Vector2, Vector3, WebGLRenderer } from 'three'
import { Input, MouseButton } from './input';
import { lerp } from 'three/src/math/MathUtils.js';
import { PolyMesh } from './polymesh/polyMesh';
import { Face } from './polymesh/face';
import { Vertex } from './polymesh/vertex';

const renderer = new WebGLRenderer({ canvas: document.getElementById("app") as HTMLCanvasElement, alpha: true, antialias: true })
const camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight);


async function init() {
    const raycaster = new Raycaster();

    Input.init();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap
    const scene = new Scene();
    const material = new MeshStandardMaterial({ color: 0x44AA88 });
    const group = new Group();
    scene.add(group);

    //group.add(cube);
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, 0.1);
    shape.lineTo(.2, .1);
    shape.lineTo(.2, .4);
    shape.lineTo(.3, .4);
    shape.lineTo(.3, 0);
    const path = new CatmullRomCurve3([
        new Vector3(0, 0, 0),
        new Vector3(0, .4, 0),
        new Vector3(0, .5, 0),
        new Vector3(.4, .5, 0),
        new Vector3(.4, .8, 0),
        new Vector3(.6, 1, 0),
        new Vector3(1, 1, 0),
    ]);
    const extrudeGeometry = new ExtrudeGeometry(shape, { extrudePath: path, steps: 32 });
    let extrude = new Mesh(extrudeGeometry, material);
    extrude.receiveShadow = true;
    extrude.castShadow = true;
    //group.add(extrude);
    //const fontloader = new FontLoader();
    //let font: Font;
    //font = await fontloader.loadAsync('node_modules/three/examples/fonts/helvetiker_regular.typeface.json');

    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.position.z = 5;
    camera.position.y = 3;
    camera.lookAt(new Vector3(0, 1, 0));

    //scene.background = new Color(100,0,0);


    //scene.add(cube);


    //group.add(createText("ere", font, material));

    const light = new PointLight(0xFFFFFF, 10);

    light.position.set(3, 1, 0);
    light.castShadow = true;
    light.shadow.autoUpdate = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.near = 0.01;
    light.shadow.camera.far = 10

    scene.add(light);

    const light2 = new PointLight(0xFFFFFF, 3);

    light2.position.set(-3, -1, 0);
    scene.add(light2);

    const pMesh = new PolyMesh();
    Face.fromPoints(pMesh, [
        new Vector3(1 - .5, 0, .25 * 3 - .5),
        new Vector3(1 - .5, 0, .25 - .5),
        new Vector3(.5 - .5, 0, 0 - .5),
        new Vector3(0 - .5, 0, .25 - .5),
        new Vector3(0 - .5, 0, .25 * 3 - .5),
        new Vector3(.5 - .5, 0, 1 - .5),
    ])
    const polyGeometry = pMesh.triangulate();
    const polyGeoMesh = new Mesh(polyGeometry, new MeshStandardMaterial({ color: 0x44AA88, side: FrontSide, wireframe: false, flatShading: true }));
    polyGeoMesh.castShadow = true;
    polyGeoMesh.receiveShadow = true;
    group.add(polyGeoMesh);
    //group.add(wireframe);
    console.log(pMesh);
    console.log(polyGeometry);

    window.requestAnimationFrame(update);

    let rotVelocity = 0;
    let hoverPoint = new Mesh(new SphereGeometry(.03), new MeshBasicMaterial());
    let selectedFace: Line2 | null;
    let selectedOgFace: Face;
    let currentExtrudedFace: Face;
    let extruding = false;
    let extrudeDistance = 0;
    let extrudingDirection: Vector2;
    scene.add(hoverPoint);
    let selectedVertex: Vertex;
    let editingVerts = false;
    function update() {
        if (Input.mouse.movedThisFrame()) {
            raycaster.setFromCamera(Input.mouse.position.clone().divide({ x: window.innerWidth / 2, y: -window.innerHeight / 2 }).add({ x: -1, y: 1 }), camera);
            const intersects = raycaster.intersectObjects([polyGeoMesh]);
            if (selectedFace) {
                selectedFace.removeFromParent();
                selectedFace.geometry.dispose();
                selectedFace = null;
            }
            if (intersects.length > 0 || extruding) {
                if (extruding) selectedOgFace = currentExtrudedFace;
                else {
                    if (editingVerts)
                        selectedVertex = pMesh.getNearestPoint(polyGeoMesh.worldToLocal(intersects[0].point.clone()));
                    selectedOgFace = pMesh.getNearestFace(polyGeoMesh.worldToLocal(intersects[0].point.clone()));
                }
                if (!editingVerts) {
                    const positionsArrays = selectedOgFace.vertices.map(v => v.position.clone().addScaledVector(selectedOgFace.normal, -0.01).toArray());
                    positionsArrays.push(positionsArrays[0], positionsArrays[1], positionsArrays[2]);
                    const lineGeometry = new LineGeometry().setPositions(positionsArrays.flat());

                    selectedFace = new Line2(lineGeometry, new LineMaterial({ color: 0xffff44, linewidth: 3 }));
                    group.add(selectedFace);
                }
            }
        }
        if (selectedVertex) {
            hoverPoint.position.copy(polyGeoMesh.localToWorld(selectedVertex.position.clone()));
        }
        if (Input.mouse.getButton(MouseButton.Left)) {
            if (selectedFace && !extruding && !editingVerts) {
                extruding = true;
                extrudeDistance = 0;
                currentExtrudedFace = selectedOgFace.extrude(-.01).top;
                const screenSpaceCenter = worldToScreen(polyGeoMesh.localToWorld(currentExtrudedFace.center.clone()));
                const screenSpaceNormalTarget = worldToScreen(polyGeoMesh.localToWorld(currentExtrudedFace.center.clone().add(currentExtrudedFace.normal)));
                extrudingDirection = screenSpaceNormalTarget.clone().sub(screenSpaceCenter).normalize();
            }
            else if (selectedVertex && editingVerts && !extruding) {
                extruding = true;
            }
        }
        else {
            extruding = false;
        }
        if (extruding) {
            if (!editingVerts) {
                const scale = Input.mouse.delta.dot(extrudingDirection);
                extrudeDistance += scale;
                for (const v of currentExtrudedFace.vertices) {
                    v.position.addScaledVector(currentExtrudedFace.normal, scale * 0.01);
                }
            }
            else {
                selectedVertex.position.addScaledVector(new Vector3(Input.mouse.delta.x, 0, Input.mouse.delta.y), 0.01);
            }
            for (const f of pMesh.faces) {
                f.calculateCenter();
            }
            polyGeoMesh.geometry = pMesh.triangulate();
        }
        if (Input.mouse.getButton(MouseButton.Right)) {
            rotVelocity = (Input.mouse.delta.x * 0.01);
        }
        else {
            rotVelocity = lerp(rotVelocity, 0.003, 0.05);
        }
        if (Input.getKey("q")) {
            editingVerts = true;
        }
        if (Input.getKey("w")) {
            editingVerts = false;
        }
        group.rotateY(rotVelocity);
        //removeText(group);
        //group.add(createText((Math.random() + 1).toString(36).substring(7) + "0", font, material));
        renderer.render(scene, camera);

        Input.mouse.update();
        window.requestAnimationFrame(update);
    }
}

function worldToScreen(v: Vector3) {
    const projected = v.project(camera);
    const vec = new Vector2();
    vec.x = (projected.x + 1) * window.innerWidth / 2;
    vec.y = - (projected.y - 1) * window.innerHeight / 2;
    return vec;
}

/* function createText(content: string, font: Font, material: Material) {
    const textGeometry = new TextGeometry(content, {
        font: font,
        size: .1,
        depth: .1,
        curveSegments: 12,
        bevelEnabled: false,
        bevelSize: 0.03,
        bevelThickness: 0.03,
        bevelOffset: -0.03,
        bevelSegments: 1,
    });
    textGeometry.computeBoundingBox();
    textGeometry.center();
    const text = new Mesh(textGeometry, material);
    text.name = "text";
    text.position.z = .5;
    text.castShadow = true;
    text.receiveShadow = true;
    return text;
}

function removeText(group: Group) {
    const text = group.getObjectByName("text") as Mesh;
    text?.removeFromParent();
    text?.geometry.dispose();
    //renderer.renderLists.dispose();
} */

init();

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
})

window.addEventListener("mousedown", () => { })



