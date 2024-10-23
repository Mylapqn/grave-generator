import { Vector3 } from "three";
import { PolyMesh } from "./polyMesh";

export class Vertex {
    public static selected?: Vertex;
    public static hovered?: Vertex;
    public position = new Vector3();
    public mesh: PolyMesh;
    constructor(mesh: PolyMesh, position: Vector3) {
        this.position = position;
        this.mesh = mesh;
        this.mesh.vertices.push(this);
    }
    public getIndex() {
        return this.mesh.vertices.indexOf(this);
    }
}