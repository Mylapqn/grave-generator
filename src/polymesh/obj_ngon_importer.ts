import { Vector3 } from "three";
import { PolyObject } from "./object";
import { PolyMesh } from "./polyMesh";
import { Vertex } from "./vertex";
import { Face } from "./face";

export class PolyMeshObjImporter {
    fileReader;
    constructor() {
        this.fileReader = new FileReader();
    }
    public async import(path: string) {
        try {
            const response = await window.fetch(path);
            console.log(response.statusText)
            const text = await response.text();
            return this.parseText(text);
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    public parseText(text: string) {
        const polyObject = new PolyObject();
        const polyMesh = polyObject.polyMesh;

        //console.log(text);
        const lines = text.split("\n")
        //console.log(lines);
        for (const line of lines) {
            if (line[0] == "v") {
                const posArray = line.substring(2).split(" ").map(x => parseFloat(x))
                new Vertex(polyMesh, new Vector3(...posArray))
            }
            else if (line[0] == "f") {
                const indexArray: number[] = line.substring(2).split(" ").map(x => parseInt(x));
                const vertexArray = indexArray.map(x => polyMesh.vertices[x-1]);
                Face.fromVertices(polyMesh, vertexArray);
            }
            else if (line[0] == "o") {
                polyObject.name = line.substring(2);
            }
        }
        console.log(`Imported mesh ${polyObject.name} with ${polyMesh.vertices.length} vertices and ${polyMesh.faces.length} faces.`)
        polyObject.recalculate(true);
        return polyObject;
    }
}