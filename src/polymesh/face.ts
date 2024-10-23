import { Vector2Tuple, Vector3 } from "three";
import { HalfEdge } from "./halfEdge";
import { PolyMesh, VertTriangle } from "./polyMesh";
import { Vertex } from "./vertex";
import { Earcut } from "three/src/extras/Earcut.js";

export class Face {
    public static selected?:Face;
    public static hovered?:Face;

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
    public static fromVertices(mesh: PolyMesh, vertices: Vertex[]) {
        const face = new Face(mesh);
        const edges = new Array<HalfEdge>();
        for (let i = 0; i < vertices.length; i++) {
            edges.push(new HalfEdge(vertices[i], vertices[(i + 1) % vertices.length], face));
        }
        face.vertices = vertices;
        face.edges = edges;
        const p0 = vertices[0].position.clone().sub(vertices[1].position);
        const p1 = vertices[2].position.clone().sub(vertices[1].position);
        face.normal = p0.clone().cross(p1).normalize();
        face.calculateCenter();
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
    //triangulate with ear clipping
    public triangulate() {

        const d3verts = this.vertices.map(v => v.position);
        const u = d3verts[1].clone().sub(d3verts[0]).normalize();
        const v = u.clone().cross(this.normal).normalize();
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
    public extrude(distance: number) {
        const newVertices = [];
        for (const vertex of this.vertices) {
            newVertices.push(new Vertex(this.mesh, vertex.position.clone().add(this.normal.clone().multiplyScalar(distance))));
            console.log(vertex.position);
            console.log(newVertices[newVertices.length - 1].position);
        }
        const sideFaces = [];
        for (let i = 0; i < this.vertices.length; i++) {
            const prev = i > 0 ? i - 1 : this.vertices.length - 1;
            const sideVerts = [this.vertices[i], this.vertices[prev], newVertices[prev], newVertices[i]];
            if(distance < 0) sideVerts.reverse();
            sideFaces.push(Face.fromVertices(this.mesh,sideVerts));
        }
        this.remove();
        return {
            top: Face.fromVertices(this.mesh, newVertices),
            sides: sideFaces
        }
    }
    public remove(){
        this.mesh.faces.splice(this.mesh.faces.indexOf(this),1);
    }
}