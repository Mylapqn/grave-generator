import { BufferGeometry, Euler, FrontSide, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { PolyMesh } from "./polyMesh";
import { Face } from "./face";
import { Editing, Selectable } from "./editing";
import { defaultMaterial } from "../main";
import { Vertex } from "./vertex";

export type ObjectTransform = {
    position: Vector3
    scale: Vector3
    rotation: Euler
}

export class PolyObject extends Object3D implements Selectable {
    public static hovered?: PolyObject;
    public static selected?: PolyObject;
    public polyMesh: PolyMesh;
    public geometry: BufferGeometry;
    public mesh: Mesh;
    public color = 0xDDDDDD;
    public shadeSmooth = false;
    constructor() {
        super();
        this.polyMesh = new PolyMesh(this);
        /*Face.fromPoints(this.polyMesh, [
            new Vector3(1 - .5, 0, .25 * 3 - .5),
            new Vector3(1 - .5, 0, .25 - .5),
            new Vector3(.5 - .5, 0, 0 - .5),
            new Vector3(0 - .5, 0, .25 - .5),
            new Vector3(0 - .5, 0, .25 * 3 - .5),
            new Vector3(.5 - .5, 0, 1 - .5),
        ])*/

        this.geometry = new BufferGeometry();
        this.mesh = new Mesh(this.geometry, defaultMaterial.clone());
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.name = "object";
        this.add(this.mesh);
        //this.polyMesh.faces[0].setPosition(this.polyMesh.faces[0].captureState(), this.polyMesh.faces[0].normal.clone());
    }
    static cube() {
        const object = new PolyObject();
        Face.fromPoints(object.polyMesh, [
            new Vector3(.5, -.5, .5),
            new Vector3(.5, -.5, -.5),
            new Vector3(-.5, -.5, -.5),
            new Vector3(-.5, -.5, .5),
        ]).extrude(1, false);
        object.recalculate();
        object.name = "Cube";
        return object;
    }
    static circle() {
        const object = new PolyObject();
        const points: Vector3[] = [];
        const numPoints = 16;
        for (let i = 0; i < numPoints; i++) {
            points.push(new Vector3(Math.cos(-i * 2 * Math.PI / numPoints) * .5, 0, Math.sin(-i * 2 * Math.PI / numPoints) * .5));
        }
        Face.fromPoints(object.polyMesh, points);
        object.recalculate();
        object.name = "Circle";
        return object;
    }
    static sphere() {
        const object = new PolyObject();
        const latitudeBands = 6;
        const longitudeBands = 12;
        const radius = 0.5;

        const vertices: Vertex[] = [];

        for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            const theta = latNumber * Math.PI / latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                const phi = longNumber * 2 * Math.PI / longitudeBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                vertices.push(new Vertex(object.polyMesh, new Vector3(radius * x, radius * y, radius * z)));
            }
        }

        for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
                const first = (latNumber * (longitudeBands + 1)) + longNumber;
                const second = first + longitudeBands + 1;
                let verts = [];

                if (latNumber == 0) {
                    verts = [vertices[first], vertices[second + 1], vertices[second]];
                }
                else if (latNumber == latitudeBands - 1) {
                    verts = [vertices[first], vertices[first + 1], vertices[second]];
                }
                else {
                    verts = [vertices[first], vertices[first + 1], vertices[second + 1], vertices[second]];
                }
                Face.fromVertices(object.polyMesh, verts);


            }
        }
        object.shadeSmooth = true;
        object.recalculate();
        object.name = "Sphere";
        return object;
    }
    captureState() {
        return {
            position: this.position.clone(),
            scale: this.scale.clone(),
            rotation: this.rotation.clone(),
        }
    }
    restoreState(state: ObjectTransform): void {
        this.position.copy(state.position);
        this.scale.copy(state.scale);
        this.rotation.copy(state.rotation);
    }
    public recalculate(force=false) {
        if (this.polyMesh.dirty || force) {
            for (const face of this.polyMesh.faces) {
                face.calculateCenter();
                face.calculateNormal();
            }
            this.geometry = this.polyMesh.triangulate(!this.shadeSmooth);
            this.mesh.geometry = this.geometry;
        }
    }
    select(selected?: Selectable): void {
        throw new Error("Method not implemented.");
    }
    hover(hovered?: Selectable): void {
        throw new Error("Method not implemented.");
    }
    setPosition(state: ObjectTransform, position: Vector3): void {
        this.position.copy(state.position.clone().add(position));
    }
    getPosition(): Vector3 {
        return this.position.clone();
    }
    setScale(state: ObjectTransform, scale: Vector3): void {
        this.scale.copy(scale);
    }
    getScale(): Vector3 {
        return this.scale.clone();
    }
    setRotation(state: any, rotation: Euler): void {
        this.rotation.copy(rotation);
    }
    getRotation(): Euler {
        return this.rotation.clone();
    }

    destroy() {
        this.removeFromParent();
        this.geometry.dispose();
    }

    public static hover(hovered?: PolyObject) {
        if (this.hovered != hovered) {
            if (this.hovered != this.selected)
                (this.hovered?.mesh.material as MeshStandardMaterial)?.color.set(0xDDDDDD);
            this.hovered = hovered;
            if (this.hovered != this.selected)
                (this.hovered?.mesh.material as MeshStandardMaterial)?.color.set(0xFFFFFF);
        }
    }

    public static select(selected?: PolyObject) {
        if (selected != this.selected) {
            this.selected = this.hovered;
            if (this.selected) {
                Editing.selection = [];
                Editing.selection.push(this.selected);
            }
            else {
                Editing.selection = [];
            }
        }

    }
}