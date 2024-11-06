import { Euler, Vector2Tuple, Vector3 } from "three";
import { HalfEdge } from "./halfEdge";
import { PolyMesh, VertTriangle } from "./polyMesh";
import { Vertex } from "./vertex";
import { Earcut } from "three/src/extras/Earcut.js";
import { Selectable } from "./editing";

export class Face implements Selectable {
    public static selected?: Face;
    public static hovered?: Face;

    public vertices: Vertex[];
    public edges: HalfEdge[];
    public mesh: PolyMesh;
    public normal: Vector3 = new Vector3();
    public center: Vector3 = new Vector3();
    constructor(mesh: PolyMesh) {
        mesh.faces.push(this);
        this.mesh = mesh;
        this.vertices = [];
        this.edges = [];
    }
    select(selected?: Selectable): void {
    }
    hover(hovered?: Selectable): void {
    }
    setPosition(state: Vector3[], position: Vector3): void {
        const oldCenter = state.reduce((a, b) => a.add(b), new Vector3()).divideScalar(state.length);
        this.center.copy(oldCenter.clone().add(position));
        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i].position.copy(state[i].clone().add(position));
        }
        this.mesh.dirty = true;
        this.mesh.polyObject.recalculate();
    }
    getPosition(): Vector3 {
        return this.center.clone();
    }

    setScale(state: Vector3[], scale: Vector3): void {
        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i].position.copy(state[i].clone().sub(this.center).multiply(scale).add(this.center));
        }
        this.mesh.dirty = true;
        this.mesh.polyObject.recalculate();
    }
    getScale(): Vector3 {
        return new Vector3(1, 1, 1);
    }

    captureState() {
        return this.vertices.map(v => v.position.clone());
    }

    restoreState(state: Vector3[]) {
        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i].position.copy(state[i]);
        }
        this.mesh.dirty = true;
        this.mesh.polyObject.recalculate();
        this.calculateCenter();
    }
    getRotation(): Euler {
        return new Euler();
    }
    setRotation(state: any, rotation: Euler): void {
        
    }

    public static fromVertices(mesh: PolyMesh, vertices: Vertex[]) {
        const face = new Face(mesh);
        const edges = new Array<HalfEdge>();
        for (let i = 0; i < vertices.length; i++) {
            edges.push(new HalfEdge(vertices[i], vertices[(i + 1) % vertices.length], face));
        }
        face.vertices = vertices;
        face.edges = edges;
        face.calculateCenter();
        face.calculateNormal();
        return face;
    }
    public static fromPoints(mesh: PolyMesh, points: Vector3[]) {
        const vertices = [];
        for (const point of points) {
            vertices.push(new Vertex(mesh, point));
        }
        return Face.fromVertices(mesh, vertices);
    }
    public calculateCenter() {
        this.center = this.vertices.reduce((a, b) => a.add(b.position), new Vector3()).divideScalar(this.vertices.length);
    }
    public calculateNormal() {
        const p0 = this.vertices[0].position.clone().sub(this.vertices[1].position);
        const p1 = this.vertices[2].position.clone().sub(this.vertices[1].position);
        this.normal = p1.clone().cross(p0).normalize();
    }
    public flip(){
        this.vertices.reverse();
        this.calculateCenter();
        this.calculateNormal();
    }
    //triangulate with ear clipping
    public triangulate() {

        const d3verts = this.vertices.map(v => v.position);
        const u = d3verts[1].clone().sub(d3verts[0]).normalize();
        const v = this.normal.clone().cross(u).normalize();
        const d2verts: Vector2Tuple[] = [];
        for (let i = 0; i < d3verts.length; i++) {
            d2verts.push([d3verts[i].dot(u), d3verts[i].dot(v)]);
        }
        const indices = Earcut.triangulate(d2verts.flat(), [], 2);
        return indices.map(i => this.vertices[i].getIndex());

        const vertices = this.vertices.slice();
        const triangles: VertTriangle[] = [];
        let limit = 0;
        while (vertices.length > 3) {
            limit++;
            if (limit > vertices.length * 2 + 4) break;
            console.log(vertices.length);
            for (let i = 0; i < vertices.length; i++) {
                const prev = vertices[(i + vertices.length - 1) % vertices.length];
                const v = vertices[i];
                const next = vertices[(i + 1) % vertices.length];
                if (this.isEar(v, prev, next, vertices)) {
                    console.log("found ear", i);
                    triangles.push([prev, v, next]);
                    vertices.splice(i, 1);
                    break;
                }
                else {
                    console.log("not ear", i);
                }
            }
        }
        triangles.push(vertices as VertTriangle);
        //return triangles;
    }
    private isEar(v: Vertex, prev: Vertex, next: Vertex, vertices: Vertex[]) {
        //is v a convex vertex (an "ear")?
        const p0 = prev.position.clone().sub(v.position);
        const p1 = next.position.clone().sub(v.position);
        const cross = p0.clone().cross(p1).dot(this.normal);
        if (cross <= 0) return false;
        for (const vertex of vertices) {
            if (vertex === prev || vertex === v || vertex === next) continue;
            const p2 = vertex.position.clone().sub(v.position);
            const cross2 = p0.clone().cross(p2).dot(this.normal);
            if (cross2 <= 0) return false;
        }
        return true;
    }
    public extrude(distance: number,remove: boolean = true) {
        const newVertices = [];
        for (const vertex of this.vertices) {
            newVertices.push(new Vertex(this.mesh, vertex.position.clone().add(this.normal.clone().multiplyScalar(distance))));
            //console.log(vertex.position);
            //console.log(newVertices[newVertices.length - 1].position);
        }
        const sideFaces = [];
        for (let i = 0; i < this.vertices.length; i++) {
            const prev = i > 0 ? i - 1 : this.vertices.length - 1;
            const sideVerts = [this.vertices[i], newVertices[i], newVertices[prev], this.vertices[prev]];
            //const sideVerts = [this.vertices[i], this.vertices[prev], newVertices[prev], newVertices[i]];
            //if (distance < 0) sideVerts.reverse();
            sideFaces.push(Face.fromVertices(this.mesh, sideVerts));
        }
        if(remove){
            this.destroy();
        }
        else {
            this.flip();
        }
        return {
            top: Face.fromVertices(this.mesh, newVertices),
            sides: sideFaces
        }
    }
    public destroy() {
        this.mesh.faces.splice(this.mesh.faces.indexOf(this), 1);
        for(const vertex of this.vertices){
            vertex.removeIfUnused();
        }
        this.mesh.dirty = true;
        this.mesh.polyObject.recalculate();
    }
}