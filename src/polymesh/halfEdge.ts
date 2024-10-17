import { Face } from "./face";
import { Vertex } from "./vertex";

export class HalfEdge {
    from: Vertex;
    to: Vertex;
    face: Face;
    twin?: HalfEdge;
    constructor(from: Vertex, to: Vertex, face: Face) {
        this.from = from;
        this.to = to;
        this.face = face;
    }
}