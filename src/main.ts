import { EffectComposer, GLTFExporter, Line2, LineGeometry, LineMaterial, OutlinePass, RenderPass, ShaderPass } from 'three/examples/jsm/Addons.js';
import './style.css'
import "./ui.css"
import { BoxGeometry, CatmullRomCurve3, Color, DirectionalLight, DoubleSide, ExtrudeGeometry, FrontSide, Group, Intersection, LessEqualDepth, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, Object3DEventMap, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, PointLight, Raycaster, RenderTarget, Scene, ShaderMaterial, Shape, SphereGeometry, Vector2, Vector3, WebGLArrayRenderTarget, WebGLRenderer } from 'three'
import { Input, MouseButton } from './input';
import { lerp } from 'three/src/math/MathUtils.js';
import { PolyMesh } from './polymesh/polyMesh';
import { Editing, EditingModes, Gizmo, Selectable } from "./polymesh/editing";
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
import { AxisOperation, MoveOperation, Operation, RotateOperation, ScaleOperation } from './polymesh/operations';
import { UI, UIButton, UIContextMenu, UIDivider } from './ui';
import { remove } from 'three/examples/jsm/libs/tween.module.js';
const outlineVert = outlineVertRaw.substring(outlineVertRaw.indexOf("//THREE HEADER END"));

const renderer = new WebGLRenderer({ canvas: document.getElementById("app") as HTMLCanvasElement, alpha: true, antialias: true });
export const defaultMaterial = new MeshStandardMaterial({ color: 0xDDDDDD, flatShading: false, side: DoubleSide });
const exporter = new GLTFExporter();
export class SceneState {
    static scene: Scene;
    static objectGroup: Group;
    static camera: PerspectiveCamera;
    static composer: EffectComposer;
}

async function init() {
    UI.init();
    const camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight);
    const raycaster = new Raycaster();
    Input.init();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap
    renderer.autoClear = false;
    const scene = new Scene();
    SceneState.scene = scene;
    SceneState.camera = camera;


    //const renderTarget = new WebGLArrayRenderTarget(window.innerWidth, window.innerHeight,6,{});
    const composer = new EffectComposer(renderer);
    SceneState.composer = composer;
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
    SceneState.objectGroup = group;
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
    let extrude = new Mesh(extrudeGeometry, defaultMaterial);
    extrude.receiveShadow = true;
    extrude.castShadow = true;
    //group.add(extrude);
    //const fontloader = new FontLoader();
    //let font: Font;
    //font = await fontloader.loadAsync('node_modules/three/examples/fonts/helvetiker_regular.typeface.json');

    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.position.z = 5;
    //camera.position.y = 3;
    //camera.lookAt(new Vector3(0, 0, 0));

    const cameraParent = new Group();
    cameraParent.lookAt(new Vector3(0, 3, 5));
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

    //scene.add(light);

    const light2 = new DirectionalLight(0xFFFFFF, 1);

    light2.position.set(-3, 0, 0);
    scene.add(light2);

    const light3 = new DirectionalLight(0xFFFFFF, 2);

    light3.position.set(0, 3, 0);
    scene.add(light3);

    const light4 = new DirectionalLight(0xFFFFFF, 2);

    light4.position.set(2, 0, 3);
    scene.add(light4);

    const obj = new PolyObject();
    group.add(obj);
    //group.add(wireframe);

    scene.add(new Line2(new LineGeometry().setPositions([-1000, 0, 0, 0, 0, 0]), new LineMaterial({ color: 0x990000, linewidth: 2 })));
    scene.add(new Line2(new LineGeometry().setPositions([0, -1000, 0, 0, 0, 0]), new LineMaterial({ color: 0x009900, linewidth: 2 })));
    scene.add(new Line2(new LineGeometry().setPositions([0, 0, -1000, 0, 0, 0]), new LineMaterial({ color: 0x3344aa, linewidth: 2 })));

    scene.add(new Line2(new LineGeometry().setPositions([-0, 0, 0, 1000, 0, 0]), new LineMaterial({ color: 0xff0000, linewidth: 2 })));
    scene.add(new Line2(new LineGeometry().setPositions([0, -0, 0, 0, 1000, 0]), new LineMaterial({ color: 0x00ff00, linewidth: 2 })));
    scene.add(new Line2(new LineGeometry().setPositions([0, 0, -0, 0, 0, 1000]), new LineMaterial({ color: 0x3344ff, linewidth: 2 })));

    let tempLineX: Line2, tempLineY: Line2, tempLineZ: Line2;
    scene.add(tempLineX = new Line2(new LineGeometry().setPositions([-1000, 0, 0, 1000, 0, 0]), new LineMaterial({ color: 0xff0000, linewidth: 2 })));
    scene.add(tempLineY = new Line2(new LineGeometry().setPositions([0, -1000, 0, 0, 1000, 0]), new LineMaterial({ color: 0x00ff00, linewidth: 2 })));
    scene.add(tempLineZ = new Line2(new LineGeometry().setPositions([0, 0, -1000, 0, 0, 1000]), new LineMaterial({ color: 0x3344ff, linewidth: 2 })));

    let gridPlane = new Mesh(new PlaneGeometry(100, 100, 1, 1), new ShaderMaterial({ vertexShader: gridVert, fragmentShader: gridFrag, transparent: true, side: DoubleSide }));
    scene.add(gridPlane);
    gridPlane.rotateX(-Math.PI / 2);

    window.requestAnimationFrame(update);

    let rotVelocity = new Vector3(0, 0, 0);
    const hoverGeo = new SphereGeometry(.025);
    const vertGeo = new SphereGeometry(.015);
    const hoverMat = new MeshBasicMaterial();
    const selectMat = new MeshBasicMaterial({ color: 0xffff00 });
    const vertexMat = new MeshBasicMaterial({ color: 0xaaaaaa });
    let faceSelectionOutline: Line2 | null;
    let currentExtrudedFace: Face;
    let extruding = false;
    let extrudeDistance = 0;
    let extrudingDirection: Vector2;
    let hoveredVertex: Vertex;
    let editingVerts = false;
    let editingMode: EditingModes = EditingModes.Object;

    const statsDiv = document.getElementById("stats") as HTMLDivElement;
    let stats = "";
    let fov = camera.fov;
    let targetFov = fov;
    let gizmoIntersect: Intersection | null;
    let groundIntersect: Intersection | null;
    let customWireframe: (Line2 | Mesh)[] = [];
    Gizmo.init();
    function update() {
        UI.update();
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

                            break;
                        }
                        case EditingModes.Vertex: {
                            if (Input.mouse.getButton(MouseButton.Left)) {
                                Vertex.selected = Vertex.hovered;
                            }
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

        for (const obj of customWireframe) {
            obj.removeFromParent();
            obj.geometry.dispose();
        }
        tempLineX.visible = false;
        tempLineY.visible = false;
        tempLineZ.visible = false;
        if (Editing.operation && Editing.operation instanceof AxisOperation) {
            if (Editing.operation.axisLock) {
                if (Editing.operation.axis.x == 1) {
                    tempLineX.visible = true;
                    tempLineX.position.copy(Editing.selection[0].getPosition());
                }
                if (Editing.operation.axis.y == 1) {
                    tempLineY.visible = true;
                    tempLineY.position.copy(Editing.selection[0].getPosition());
                }
                if (Editing.operation.axis.z == 1) {
                    tempLineZ.visible = true;
                    tempLineZ.position.copy(Editing.selection[0].getPosition());
                }
            }
        }
        customWireframe = [];
        if (Editing.editMode != EditingModes.Object) {
            if (PolyObject.selected) {
                if (Editing.editMode == EditingModes.Vertex) {
                    for (const vertex of PolyObject.selected.polyMesh.vertices) {
                        let hoverVert;
                        if (Editing.selection.includes(vertex)) {
                            hoverVert = new Mesh(hoverGeo, selectMat);
                        }
                        else if (vertex == Vertex.hovered) {
                            hoverVert = new Mesh(hoverGeo, hoverMat);
                        }
                        else {
                            hoverVert = new Mesh(vertGeo, hoverMat);
                        }
                        hoverVert.position.copy(vertex.getPosition().add(PolyObject.selected.position));
                        scene.add(hoverVert);
                        customWireframe.push(hoverVert);
                    }
                }

                const mat = new LineMaterial({ color: 0xeeeeee, linewidth: 1 });
                for (const face of PolyObject.selected.polyMesh.faces) {
                    let wire;
                    if (Editing.selection.includes(face) && Editing.editMode == EditingModes.Face) {
                        wire = wireFace(face, new LineMaterial({ color: 0xffff44, linewidth: 3 }), 0.01);
                    }
                    else if (face == Face.hovered && Editing.editMode == EditingModes.Face) {
                        wire = wireFace(face, new LineMaterial({ color: 0xffffff, linewidth: 3 }), 0.01);
                    }
                    else {
                        wire = wireFace(face, mat, 0.001);
                    }
                    scene.add(wire);
                    customWireframe.push(wire);
                }

            }
        }
        stats += "Editing mode: " + ["Vertex", "Edge", "Face", "Object"][editingMode] + "\n";
        //stats += "Selected Object: " + PolyObject.selected?.name + "\n";
        //stats += "Hovered object: " + PolyObject.hovered?.name + "\n";
        //stats += "Editing selection: " + Editing.selection.length + "\n";
        //stats += "Gizmo move: " + Gizmo.moveInput.x + "\n";
        //stats += "Operation:" + Editing.operation + "\n";
        stats += "\n";
        stats += "[Tab] Switch Edit Mode\n";
        if (Editing.editMode == EditingModes.Object) {
            stats += "[G] Move  [R] Rotate  [S] Scale  [RMB] Add Object" + "\n";
        }
        else {
            stats += "[G] Move  [S] Scale  [E] Extrude  [I] Inset  \n[1] Edit Verts  [2] Edit Edges  [3] Edit Faces" + "\n";
        }

        if (Editing.operation) {
            stats += "\nCurrent Operation: " + Editing.operation.name;
            if (Editing.operation instanceof AxisOperation && Editing.operation.axisLock) {
                stats += " on " + (Editing.operation.axis.x >= 1 ? "X" : "") + (Editing.operation.axis.y >= 1 ? "Y" : "") + (Editing.operation.axis.z >= 1 ? "Z" : "");
            }
            stats += "\n";
            stats += "[X][Y][Z] Axis Lock\n[LMB] Confirm  [RMB] Cancel" + "\n";
        }
        else {
            stats += "[X] Delete" + "\n";
        }

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

        if (UI.mouseOverUI == 0) {
            if ((Input.mouse.getButtonUp(MouseButton.Left) || Input.mouse.getButtonUp(MouseButton.Right)) && !gizmoIntersect && Editing.operation == null) {
                switch (editingMode) {
                    case EditingModes.Object: {
                        PolyObject.select(PolyObject.hovered);
                        outlinePass.selectedObjects = PolyObject.selected ? [PolyObject.selected] : [];
                        break;
                    }
                    case EditingModes.Vertex: {
                        Vertex.selected = Vertex.hovered;
                        if (Vertex.selected) {
                            if (Input.getKey("Shift")) {
                                Editing.selection.push(Vertex.selected);
                            }
                            else {
                                Editing.selection = [Vertex.selected];
                            }
                        }
                        else {
                            Editing.selection = [];
                        }
                        break;
                    }
                    case EditingModes.Face: {
                        Face.selected = Face.hovered;
                        if (Face.selected) {
                            if (Input.getKey("Shift")) {
                                Editing.selection.push(Face.selected);
                            }
                            else {
                                Editing.selection = [Face.selected];
                            }
                        }
                        else {
                            Editing.selection = [];
                        }
                        break;
                    }
                }

            }
            if (Input.mouse.getButton(MouseButton.Wheel)) {
                if (Input.getKey("Shift")) {
                    rotVelocity.x = 0;
                    rotVelocity.z = 0;
                    cameraParent.translateX(-Input.mouse.delta.x * 0.01);
                    cameraParent.translateY(Input.mouse.delta.y * 0.01);
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
            if (Input.mouse.getButtonUp(MouseButton.Right) && Editing.operation == null) {
                const buttonArray = [];
                if (Editing.editMode == EditingModes.Object) {
                    buttonArray.push(new UIButton("Add Cube", () => objectToScene(PolyObject.cube(), groundIntersect?.point, group)));
                    buttonArray.push(new UIButton("Add Circle", () => objectToScene(PolyObject.circle(), groundIntersect?.point, group)));
                    buttonArray.push(new UIButton("Add Sphere", () => objectToScene(PolyObject.sphere(), groundIntersect?.point, group)));
                }
                if (Editing.selection.length > 0) {
                    if (buttonArray.length > 0) buttonArray.push(new UIDivider());
                    if (Editing.editMode == EditingModes.Object && PolyObject.selected) {
                        let tempObj = PolyObject.selected;
                        buttonArray.push(new UIButton("Shade Smooth", () => { tempObj.shadeSmooth = true; tempObj.recalculate(true); }));
                        buttonArray.push(new UIButton("Shade Flat", () => { tempObj.shadeSmooth = false; tempObj.recalculate(true); }));
                    }
                    buttonArray.push(new UIButton("Remove", () => { removeSelectables(...Editing.selection) }));
                }
                const contextMenu = new UIContextMenu(...buttonArray);
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
                if (editingMode == EditingModes.Object && PolyObject.selected) {
                    Editing.selection = [PolyObject.selected];
                }
                else {
                    Editing.selection = [];
                }
            }
            if (Editing.selection.length > 0) {
                if (Input.getKeyUp("g")) {
                    new MoveOperation(Editing.selection);
                }
                if (Input.getKeyUp("s")) {
                    new ScaleOperation(Editing.selection);
                }
                if (Input.getKeyUp("r")) {
                    new RotateOperation(Editing.selection);
                }
                if (Input.getKeyUp("Delete") || Input.getKeyUp("x") && Editing.operation == null) {
                    removeSelectables(...Editing.selection);
                }
                if (Editing.editMode == EditingModes.Face) {
                    if (Input.getKeyUp("e")) {
                        if (Face.selected) {
                            let newFace = Face.selected.extrude(0.01).top;
                            Face.selected = newFace;
                            Editing.selection = [newFace];
                            let op = new MoveOperation(Editing.selection);
                            op.axis = newFace.normal;
                            op.axisLock = true;
                        }
                    }
                    if (Input.getKeyUp("i")) {
                        if (Face.selected) {
                            let newFace = Face.selected.extrude(0).top;
                            Face.selected = newFace;
                            Editing.selection = [newFace];
                            let op = new ScaleOperation(Editing.selection);
                        }
                    }
                }
                else if (Editing.editMode == EditingModes.Vertex) {
                    if (Input.getKeyUp("f") && PolyObject.selected) {
                        if (Editing.selection.length >= 3) {
                            Face.fromVertices(PolyObject.selected.polyMesh, Editing.selection as Vertex[]);
                            PolyObject.selected.polyMesh.dirty = true;
                            PolyObject.selected.recalculate();
                        }
                    }
                }
            }
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

export function addObject(position = new Vector3(), parent: Object3D = SceneState.scene) {
    let obj = PolyObject.cube();
    parent.add(obj);
    obj.position.copy(position);
}

export function objectToScene(object: Object3D, position = new Vector3(), parent: Object3D = SceneState.scene) {
    parent.add(object);
    object.position.copy(position);
}

export function removeSelectables(...selectables: Selectable[]) {
    selectables.forEach(s => s.destroy());
}

export function saveScene() {
    console.log("saveScene");
    exporter.parseAsync(SceneState.objectGroup).then((result: any) => {

        //result = processGLTF(result);
        //DOESN'T PRODUCE VALID GLTF

        console.log("Saving scene...");
        const blob = new Blob([JSON.stringify(result)], { type: "model/gltf+json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "scene.gltf";
        a.click();
    }).catch((error) => {
        console.error(error);
    });
}

function processGLTF(result: any) {
    const newNodes = [];
    for (const node of result.nodes) {
        if (Object.keys(node).length > 0 && node.children) {
            if (node.children.length == 1 && !node.mesh && result.nodes[node.children[0]].mesh != undefined) {
                node.mesh = result.nodes[node.children[0]].mesh;
                node.children = [];
                newNodes.push(node);
            }
            else if (node.children.length > 1) {
                newNodes.push(node);
            }
        }
    }
    for (const newNode of newNodes) {
        const newChildren = [];
        for (const childIndex of newNode.children) {
            const oldChild = result.nodes[childIndex];
            const ind = newNodes.indexOf(oldChild);
            if (ind != -1) {
                newChildren.push(ind);
            }
        }
        newNode.children = newChildren;
    }
    result.nodes = newNodes;
    result.scenes[0].nodes = [result.nodes.length];
    return result;
}


export function worldToScreen(v: Vector3) {
    const projected = v.project(SceneState.camera);
    const vec = new Vector2();
    vec.x = (projected.x + 1) * window.innerWidth / 2;
    vec.y = - (projected.y - 1) * window.innerHeight / 2;
    return vec;
}

function wireFace(face: Face, material: LineMaterial, offset: number): Line2 {
    const positionsArrays = face.vertices.map(v => v.position.clone().addScaledVector(face.normal, offset).toArray());
    positionsArrays.push(positionsArrays[0], positionsArrays[1], positionsArrays[2]);
    const lineGeometry = new LineGeometry().setPositions(positionsArrays.flat());

    const wireFace = new Line2(lineGeometry, material);
    wireFace.position.copy(face.mesh.polyObject.position);
    wireFace.rotation.copy(face.mesh.polyObject.rotation);
    wireFace.scale.copy(face.mesh.polyObject.scale);
    return wireFace;
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
    SceneState.camera.aspect = window.innerWidth / window.innerHeight;
    SceneState.camera.updateProjectionMatrix();
    SceneState.composer.setSize(window.innerWidth, window.innerHeight);
})

window.addEventListener("mousedown", () => { })



