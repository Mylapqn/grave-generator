import { BufferGeometry, FrontSide, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { PolyMesh } from "./polyMesh";
import { Face } from "./face";

export class PolyObject extends Object3D {
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
            if (this.selected)
                (this.selected?.mesh.material as MeshStandardMaterial)?.color.set(this.selected.color);
            this.selected = this.hovered;
            (this.selected?.mesh.material as MeshStandardMaterial)?.color.set(0xff0000);
        }

    }
}