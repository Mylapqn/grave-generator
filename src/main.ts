import { EffectComposer, Line2, LineGeometry, LineMaterial, OutlinePass, RenderPass, ShaderPass } from 'three/examples/jsm/Addons.js';
import './style.css'
import { BoxGeometry, CatmullRomCurve3, Color, DirectionalLight, DoubleSide, ExtrudeGeometry, FrontSide, Group, Intersection, LessEqualDepth, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, Object3DEventMap, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, PointLight, Raycaster, RenderTarget, Scene, ShaderMaterial, Shape, SphereGeometry, Vector2, Vector3, WebGLArrayRenderTarget, WebGLRenderer } from 'three'
import { Input, MouseButton } from './input';
import { lerp } from 'three/src/math/MathUtils.js';
import { PolyMesh } from './polymesh/polyMesh';
import { Editing, EditingModes, Gizmo } from "./polymesh/editing";
import { Face } from './polymesh/face';
import { Vertex } from './polymesh/vertex';
import { PolyObject } from './polymesh/object';
import gridVertRaw from "./shader/grid.vert?raw";
import gridFragRaw from "./shader/grid.frag?raw";
const gridVert = gridVertRaw.substring(gridVertRaw.indexOf("//THREE HEADER END"));
const gridFrag = gridFragRaw.substring(gridFragRaw.indexOf("//THREE HEADER END"));
import outlineFragRaw from "./shader/outline.frag?raw";
const outlineFrag = outlineFragRaw.substring(outlineFragRaw.indexOf("//THREE HEADER END"));

import outlineVertRaw from "./shader/outline.vert?raw";
const outlineVert = outlineVertRaw.substring(outlineVertRaw.indexOf("//THREE HEADER END"));

const renderer = new WebGLRenderer({ canvas: document.getElementById("app") as HTMLCanvasElement, alpha: true, antialias: true});
const camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight);

async function init() {
    const raycaster = new Raycaster();
    Input.init();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap
    renderer.autoClear = false;
    const scene = new Scene();
    const material = new MeshStandardMaterial({ color: 0x44AA88 });

    //const renderTarget = new WebGLArrayRenderTarget(window.innerWidth, window.innerHeight,6,{});
    const composer = new EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);
    const customOutlinePass = new ShaderPass(new ShaderMaterial({ fragmentShader: outlineFrag, vertexShader: outlineVert, uniforms: { "tDiffuse": { value: null }, "tOutlineMask": { value: null } } }));
    const renderPass = new RenderPass(scene, camera);
    const outlinePass = new OutlinePass(new Vector2(window.innerWidth, window.innerHeight), scene, camera);
    outlinePass.visibleEdgeColor = new Color(0, 0.3, .3);
    outlinePass.hiddenEdgeColor = outlinePass.visibleEdgeColor.clone().multiplyScalar(.9);
    outlinePass.edgeStrength = 5;
    outlinePass.edgeThickness = 1;
    outlinePass.edgeGlow = 0;
    composer.addPass(renderPass);
    composer.addPass(outlinePass);
    //composer.addPass(customOutlinePass);



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
    camera.lookAt(new Vector3(0, 0, 0));

    const cameraParent = new Group();
    cameraParent.add(camera);
    scene.add(cameraParent);

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

    const light2 = new DirectionalLight(0xFFFFFF, .3);

    light2.position.set(-3, -1, 1);
    cameraParent.add(light2);

    const light3 = new DirectionalLight(0xFFFFFF, .2);

    light3.position.set(3, 3, 3);
    cameraParent.add(light3);

    const obj = new PolyObject();
    group.add(obj);
    //group.add(wireframe);

    scene.add(new Line2(new LineGeometry().setPositions([-1000, 0, 0, 1000, 0, 0]), new LineMaterial({ color: 0x990000, linewidth: 2 })));
    scene.add(new Line2(new LineGeometry().setPositions([0, -1000, 0, 0, 1000, 0]), new LineMaterial({ color: 0x3344aa, linewidth: 2 })));
    scene.add(new Line2(new LineGeometry().setPositions([0, 0, -1000, 0, 0, 1000]), new LineMaterial({ color: 0x009900, linewidth: 2 })));

    let gridPlane = new Mesh(new PlaneGeometry(100, 100, 1, 1), new ShaderMaterial({ vertexShader: gridVert, fragmentShader: gridFrag, transparent: true, side: DoubleSide }));
    scene.add(gridPlane);
    gridPlane.rotateX(-Math.PI / 2);

    window.requestAnimationFrame(update);

    let rotVelocity = new Vector3(0, 0, 0);
    let hoverPoint = new Mesh(new SphereGeometry(.03), new MeshBasicMaterial());
    let faceSelectionOutline: Line2 | null;
    let currentExtrudedFace: Face;
    let extruding = false;
    let extrudeDistance = 0;
    let extrudingDirection: Vector2;
    scene.add(hoverPoint);
    let hoveredVertex: Vertex;
    let editingVerts = false;
    let editingMode: EditingModes = EditingModes.Object;

    const statsDiv = document.getElementById("stats") as HTMLDivElement;
    let stats = "";
    let fov = camera.fov;
    let targetFov = fov;
    let gizmoIntersect: Intersection | null;
    let groundIntersect: Intersection | null;
    Gizmo.init();
    function update() {
        if (Input.mouse.movedThisFrame() && !Editing.operation) {
            raycaster.setFromCamera(Input.mouse.position.clone().divide({ x: window.innerWidth / 2, y: -window.innerHeight / 2 }).add({ x: -1, y: 1 }), camera);
            if (Editing.selection.length > 0) {
                const gizmoIntersects = raycaster.intersectObjects(Gizmo.gizmoGroup.children, true);
                if (gizmoIntersects.length > 0) {
                    gizmoIntersect = gizmoIntersects[0];
                }
                else {
                    gizmoIntersect = null;
                }
            }
            let intersects = raycaster.intersectObjects(group.children, true);
            groundIntersect = raycaster.intersectObject(gridPlane, true)[0];
            //if (gizmoIntersect != null && Editing.selection.length > 0) {
            //    intersects = [];
            //}

            if (faceSelectionOutline) {
                faceSelectionOutline.removeFromParent();
                faceSelectionOutline.geometry.dispose();
                faceSelectionOutline = null;
            }
            if (extruding) Face.hovered = currentExtrudedFace;
            else if (intersects.length > 0) {

                if (editingMode == EditingModes.Object) {
                    if (intersects[0].object && intersects[0].object.parent && intersects[0].object.parent instanceof PolyObject) {
                        PolyObject.hover(intersects[0].object.parent);
                    }
                }
                else if (PolyObject.selected) {
                    Face.hovered = PolyObject.selected.polyMesh.raycastFace(intersects[0]);
                    Vertex.hovered = PolyObject.selected.polyMesh.getNearestPointOfFace(PolyObject.selected.worldToLocal(intersects[0].point), Face.hovered);
                    switch (editingMode) {
                        case EditingModes.Face: {
                            if (Input.mouse.getButton(MouseButton.Left)) {
                                Face.selected = Face.hovered;
                            }
                            const positionsArrays = Face.hovered.vertices.map(v => v.position.clone().addScaledVector(Face.hovered!.normal, -0.01).toArray());
                            positionsArrays.push(positionsArrays[0], positionsArrays[1], positionsArrays[2]);
                            const lineGeometry = new LineGeometry().setPositions(positionsArrays.flat());

                            faceSelectionOutline = new Line2(lineGeometry, new LineMaterial({ color: 0xffff44, linewidth: 3 }));
                            faceSelectionOutline.position.copy(PolyObject.selected.position);
                            faceSelectionOutline.rotation.copy(PolyObject.selected.rotation);
                            faceSelectionOutline.scale.copy(PolyObject.selected.scale);
                            scene.add(faceSelectionOutline);
                            break;
                        }
                        case EditingModes.Vertex: {
                            if (Input.mouse.getButton(MouseButton.Left)) {
                                Vertex.selected = Vertex.hovered;
                            }
                            hoverPoint.position.copy(Vertex.hovered.position);
                            break;
                        }

                    }
                }
            }
            else {
                PolyObject.hover();
                Face.hovered = undefined;
                Vertex.hovered = undefined;
            }
        }
        if (Input.mouse.getButtonUp(MouseButton.Left) && !gizmoIntersect) {
            switch (editingMode) {
                case EditingModes.Object: {
                    PolyObject.select(PolyObject.hovered);
                    outlinePass.selectedObjects = PolyObject.selected ? [PolyObject.selected] : [];
                    break;
                }
                case EditingModes.Vertex: {
                    Vertex.selected = Vertex.hovered;
                    Editing.selection = Vertex.selected ? [Vertex.selected] : [];
                    break;
                }
                case EditingModes.Face: {
                    Face.selected = Face.hovered;
                    Editing.selection = Face.selected ? [Face.selected] : [];
                    break;
                }
            }

        }
        stats += "Editing mode: " + ["Vertex", "Edge", "Face", "Object"][editingMode] + "\n";
        stats += "Selected Object: " + PolyObject.selected?.name + "\n";
        stats += "Hovered object: " + PolyObject.hovered?.name + "\n";
        stats += "Editing selection: " + Editing.selection.length + "\n";
        stats += "Gizmo move: " + Gizmo.moveInput.x + "\n";

        if (hoveredVertex) {
            //hoverPoint.position.copy(polyGeoMesh.localToWorld(hoveredVertex.position.clone()));
        }
        /*         if (Input.mouse.getButton(MouseButton.Left)) {
                    if (faceSelectionOutline && !extruding && !editingVerts) {
                        extruding = true;
                        extrudeDistance = 0;
                        currentExtrudedFace = hoveredFace.extrude(-.01).top;
                        const screenSpaceCenter = worldToScreen(polyGeoMesh.localToWorld(currentExtrudedFace.center.clone()));
                        const screenSpaceNormalTarget = worldToScreen(polyGeoMesh.localToWorld(currentExtrudedFace.center.clone().add(currentExtrudedFace.normal)));
                        extrudingDirection = screenSpaceNormalTarget.clone().sub(screenSpaceCenter).normalize();
                    }
                    else if (hoveredVertex && editingVerts && !extruding) {
                        extruding = true;
                    }
                }
                else {
                    extruding = false;
                }
         *//*         if (extruding) {
 if (!editingVerts) {
     const scale = Input.mouse.delta.dot(extrudingDirection);
     extrudeDistance += scale;
     for (const v of currentExtrudedFace.vertices) {
         v.position.addScaledVector(currentExtrudedFace.normal, scale * 0.01);
     }
 }
 else {
     hoveredVertex.position.addScaledVector(new Vector3(Input.mouse.delta.x, 0, Input.mouse.delta.y), 0.01);
 }
 for (const f of pMesh.faces) {
     f.calculateCenter();
 }
 polyGeoMesh.geometry = pMesh.triangulate();
} */
        if (Input.mouse.getButton(MouseButton.Wheel)) {
            if (Input.getKey("Shift")) {
                rotVelocity.x = 0;
                rotVelocity.z = 0;
                camera.translateX(-Input.mouse.delta.x * 0.01);
                camera.translateY(Input.mouse.delta.y * 0.01);
            }
            else {
                rotVelocity.x = (Input.mouse.delta.x * 0.003);
                rotVelocity.z = (Input.mouse.delta.y * 0.003);
            }
        }
        else {
            rotVelocity.x = lerp(rotVelocity.x, 0.00, 0.3);
            rotVelocity.z = lerp(rotVelocity.z, 0.00, 0.3);
        }
        if (Input.mouse.getButtonUp(MouseButton.Right)) {
            let obj = new PolyObject();
            if (groundIntersect) {
                obj.position.copy(groundIntersect.point);
            }
            group.add(obj);
        }
        if (Input.getKeyUp("+")) {
            editingMode = EditingModes.Vertex;
        }
        if (Input.getKeyUp("ě")) {
            editingMode = EditingModes.Edge;
        }
        if (Input.getKeyUp("š")) {
            editingMode = EditingModes.Face;
        }
        if (Input.getKeyUp("Tab")) {
            editingMode = (editingMode == EditingModes.Object && PolyObject.selected != undefined) ? EditingModes.Face : EditingModes.Object;
        }
        Editing.editMode = editingMode;

        targetFov += Input.mouse.getScroll() * targetFov * .1;
        targetFov = Math.max(10, Math.min(100, targetFov));
        fov = lerp(fov, targetFov, 0.1);

        camera.fov = fov;
        camera.updateProjectionMatrix();

        cameraParent.rotateOnWorldAxis(new Vector3(0, 1, 0), -rotVelocity.x);
        cameraParent.rotateX(-rotVelocity.z * 0.5);
        //removeText(group);
        //group.add(createText((Math.random() + 1).toString(36).substring(7) + "0", font, material));
        composer.render();
        if (PolyObject.selected) {
            renderer.clearDepth();
            renderer.render(Gizmo.gizmoGroup, camera);
            Gizmo.update(gizmoIntersect, camera);
        }

        statsDiv.innerText = stats;
        stats = "";
        Editing.update();
        Input.update();
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



