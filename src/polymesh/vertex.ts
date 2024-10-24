import { Vector3 } from "three";
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
    select(selected?: Selectable): void {
        throw new Error("Method not implemented.");
    }
    hover(hovered?: Selectable): void {
        throw new Error("Method not implemented.");
    }
    setPosition(position: Vector3): void {
        this.position.copy(position);
        this.mesh.dirty = true;
        this.mesh.polyObject.recalculate();
    }
    getPosition(): Vector3 {
        return this.position.clone();
    }
    public getIndex() {
        return this.mesh.vertices.indexOf(this);
    }
}