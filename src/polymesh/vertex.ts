import { Euler, Vector3 } from "three";
import { PolyMesh } from "./polyMesh";
import { Selectable } from "./editing";

export class Vertex implements Selectable {
    public static selected?: Vertex;
    public static hovered?: Vertex;
    public position = new Vector3();
    public mesh: PolyMesh;
    constructor(mesh: PolyMesh, position: Vector3) {
        this.position = position;
        this.mesh = mesh;
        this.mesh.vertices.push(this);
    }
    getFacesOfVertex() {
        return this.mesh.faces.filter(f => f.vertices.indexOf(this) !== -1);
    }
    captureState() {
        return this.position.clone();
    }
    restoreState(state: Vector3): void {
        this.position.copy(state);
        this.mesh.dirty = true;
        this.mesh.polyObject.recalculate();
    }
    select(selected?: Selectable): void {
    }
    hover(hovered?: Selectable): void {
    }
    setPosition(state: Vector3, position: Vector3): void {
        this.position.copy(state.clone().add(position));
        this.mesh.dirty = true;
        this.mesh.polyObject.recalculate();
    }
    getPosition(): Vector3 {
        return this.position.clone();
    }
    setScale(state: Vector3, scale: Vector3): void {
    }
    getScale(): Vector3 {
        return new Vector3(1, 1, 1);
    }
    getRotation(): Euler {
        return new Euler();
    }
    setRotation(state: any, rotation: Euler): void {

    }
    destroy() {
        this.mesh.vertices.splice(this.mesh.vertices.indexOf(this), 1);
        const faces = this.getFacesOfVertex();
        for (const face of faces) {
            face.vertices.splice(face.vertices.indexOf(this), 1);
            if (face.vertices.length < 3) face.destroy();
        }
        this.mesh.dirty = true;
        this.mesh.polyObject.recalculate();
    }
    removeIfUnused(limit = 0) {
        const faces = this.getFacesOfVertex();
        if (faces.length > limit) return;
        this.mesh.vertices.splice(this.mesh.vertices.indexOf(this), 1);
        for (const face of faces) {
            face.vertices.splice(face.vertices.indexOf(this), 1);
        }
        this.mesh.dirty = true;
    }
    public getIndex() {
        return this.mesh.vertices.indexOf(this);
    }
}