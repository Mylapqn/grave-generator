import { BufferGeometry, FrontSide, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { PolyMesh } from "./polyMesh";
import { Face } from "./face";
import { Editing, Selectable } from "./editing";

export class PolyObject extends Object3D implements Selectable {
    public static hovered?: PolyObject;
    public static selected?: PolyObject;
    public polyMesh: PolyMesh;
    public geometry: BufferGeometry;
    public mesh: Mesh;
    public color = 0x44AA88;
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
        Face.fromPoints(this.polyMesh, [
            new Vector3(-.5, -.5, -.5),
            new Vector3(-.5, -.5, .5),
            new Vector3(.5, -.5, .5),
            new Vector3(.5, -.5, -.5),
        ]).extrude(-1);
        this.geometry = this.polyMesh.triangulate();
        this.mesh = new Mesh(this.geometry, new MeshStandardMaterial({ color: 0x44AA88, side: FrontSide, wireframe: false, flatShading: true }));
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.name = "object";
        this.add(this.mesh);
    }
    public recalculate() {
        if (this.polyMesh.dirty) {
            for (const face of this.polyMesh.faces) {
                face.calculateCenter();
            }
            this.geometry = this.polyMesh.triangulate();
            this.mesh.geometry = this.geometry;
        }
    }
    select(selected?: Selectable): void {
        throw new Error("Method not implemented.");
    }
    hover(hovered?: Selectable): void {
        throw new Error("Method not implemented.");
    }
    setPosition(position: Vector3): void {
        this.position.copy(position);
    }
    getPosition(): Vector3 {
        return this.position.clone();
    }
    setScale(scale: Vector3): void {
        this.scale.copy(scale);
    }
    getScale(): Vector3 {
        return this.scale.clone();
    }

    public static hover(hovered?: PolyObject) {
        if (this.hovered != hovered) {
            if (this.hovered != this.selected)
                (this.hovered?.mesh.material as MeshStandardMaterial)?.color.set(0x44AA88);
            this.hovered = hovered;
            if (this.hovered != this.selected)
                (this.hovered?.mesh.material as MeshStandardMaterial)?.color.set(0x66EEBB);
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