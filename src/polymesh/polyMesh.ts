import { HalfEdge } from "./halfEdge";
import { Face } from "./face";
import { Vertex } from "./vertex";
import { BufferGeometry, Float32BufferAttribute, Intersection, Vector3 } from "three";
import { PolyObject } from "./object";

export type VertTriangle = [Vertex, Vertex, Vertex];

export class PolyMesh {
    public static selected:PolyMesh;
    public static hovered:PolyMesh;
    public vertices: Vertex[];
    public faces: Face[];
    public edges: HalfEdge[];
    public polyObject: PolyObject;
    public dirty = true;
    constructor(polyObject:PolyObject) {
        this.vertices = new Array();
        this.faces = new Array();
        this.edges = new Array();
        this.polyObject = polyObject;
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
        this.dirty = false;
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
    public raycastFace(intersect: Intersection) {
        if (intersect.faceIndex == undefined) return (this.faces[0]);
        const triIndex = intersect.faceIndex;
        let currentIndex = 0;
        for (let i = 0; i < this.faces.length; i++) {
            if (currentIndex + (this.faces[i].vertices.length - 2) > triIndex) {
                return (this.faces[i]);
            }
            currentIndex += this.faces[i].vertices.length - 2;
        }
        return (this.faces[0]);
    }
    public getNearestPointOfFace(point: Vector3,face:Face) {
        let minDistance = Infinity;
        let nearestVertex: Vertex = this.vertices[0];
        for (const vertex of face.vertices) {
            const distance = point.distanceTo(vertex.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestVertex = vertex;
            }
        }
        return nearestVertex;
    }
}
