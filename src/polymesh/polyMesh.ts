import { HalfEdge } from "./halfEdge";
import { Face } from "./face";
import { Vertex } from "./vertex";
import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";

export type VertTriangle = [Vertex, Vertex, Vertex];

export class PolyMesh {
    public vertices: Vertex[];
    public faces: Face[];
    public edges: HalfEdge[];
    constructor() {
        this.vertices = new Array();
        this.faces = new Array();
        this.edges = new Array();
    }
    public triangulate() {
        const geometry = new BufferGeometry();

        //get triangles from each face
        const indexTriangles = [];
        for (const face of this.faces) {
            indexTriangles.push(...face.triangulate());
        }
        const points = this.vertices.map(v => v.position.toArray());
        geometry.setAttribute('position', new Float32BufferAttribute(points.flat(), 3));
        geometry.setIndex(indexTriangles);
        geometry.computeVertexNormals();
        return geometry;

    }
    public getNearestPoint(point: Vector3) {
        let minDistance = Infinity;
        let nearestVertex: Vertex = this.vertices[0];
        for (const vertex of this.vertices) {
            const distance = point.distanceTo(vertex.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestVertex = vertex;
            }
        }
        return nearestVertex;
    }
    public getNearestFace(point: Vector3) {
        let minDistance = Infinity;
        let nearestFace: Face = this.faces[0];
        for (const face of this.faces) {
            const distance = point.distanceTo(face.center);
            if (distance < minDistance) {
                minDistance = distance;
                nearestFace = face;
            }
        }
        return nearestFace;
    }
}