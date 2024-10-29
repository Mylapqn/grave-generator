import { BoxGeometry, Intersection, Mesh, MeshBasicMaterial, Vector3, Group, Camera, PerspectiveCamera } from "three";
import { MoveOperation, Operation, ScaleOperation } from "./operations";
import { Input, MouseButton } from "../input";
import { PolyObject } from "./object";

export enum DataTypes {
    Vertex,
    Edge,
    Face
}

export enum EditingModes {
    Vertex,
    Edge,
    Face,
    Object
}

export class Editing {
    public static selection: Selectable[] = [];
    public static hovered?: Selectable;
    public static editMode: EditingModes;
    public static operation?: Operation;
    public static update() {
        if (this.operation) {
            this.operation.update();
        }
    }
}

export interface Selectable {

    select(selected?: Selectable): void;
    hover(hovered?: Selectable): void;
    setPosition(position: Vector3): void;
    getPosition(): Vector3;
    setScale(scale: Vector3): void;
    getScale(): Vector3;
}

export class Gizmo {
    public static gizmoGroup: Group;
    public static moveInput: Vector3 = new Vector3();
    static moveGizmo: Group;
    static xMove: Mesh;
    static yMove: Mesh;
    static zMove: Mesh;
    public static init() {
        this.gizmoGroup = new Group();
        this.moveGizmo = new Group();
        this.gizmoGroup.add(this.moveGizmo);

        const gizmoThickness = 0.04;

        const gizmoLength = 0.2;

        this.xMove = new Mesh(new BoxGeometry(gizmoLength, gizmoThickness, gizmoThickness), new MeshBasicMaterial({ color: 0xff0000 }));
        this.xMove.position.x = gizmoLength / 2;

        this.yMove = new Mesh(new BoxGeometry(gizmoThickness, gizmoLength, gizmoThickness), new MeshBasicMaterial({ color: 0x00ff00 }));
        this.yMove.position.y = gizmoLength / 2;

        this.zMove = new Mesh(new BoxGeometry(gizmoThickness, gizmoThickness, gizmoLength), new MeshBasicMaterial({ color: 0x0000ff }));
        this.zMove.position.z = gizmoLength / 2;

        this.moveGizmo.add(this.xMove);
        this.moveGizmo.add(this.yMove);
        this.moveGizmo.add(this.zMove);
    }
    public static update(intersect: Intersection | null, camera: PerspectiveCamera) {
        this.moveInput = new Vector3();
        const sensitivity = .1;
        if (intersect && intersect.object && Input.mouse.getButton(MouseButton.Left)) {
            if (intersect.object == this.xMove) {
                this.moveInput.x = Input.mouse.delta.x * sensitivity;
            }
            if (intersect.object == this.yMove) {
                this.moveInput.y = -Input.mouse.delta.y * sensitivity;
            }
            if (intersect.object == this.zMove) {
                this.moveInput.z = -Input.mouse.delta.x * sensitivity;
            }
        }
        if (this.moveInput.length() > 0 && Editing.operation == null) {
            new MoveOperation();
        }
        if (Editing.selection.length > 0) {
            if (Editing.editMode != EditingModes.Object) {
                this.gizmoGroup.position.copy(PolyObject.selected!.localToWorld(Editing.selection[0].getPosition()));
            }
            else {
                this.gizmoGroup.position.copy(Editing.selection[0].getPosition());
            }
        }
        this.gizmoGroup.scale.copy(new Vector3(1, 1, 1)).multiplyScalar(Math.pow(this.gizmoGroup.position.distanceTo(camera.position.clone().multiplyScalar(1)),1) * (camera.fov/70)*.2);
    }
}