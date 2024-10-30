import { CoordinateSystem, Object3D, Quaternion, Vector2, Vector3 } from "three";
import { Input, MouseButton } from "../input";
import { Editing, Gizmo, Selectable } from "./editing";
import { SceneState, worldToScreen } from "../main";

export class Operation {
    public name: string = "Operation";
    public currentState: any[];
    public selection: Selectable[];
    public gizmoInput = false;
    constructor(selection: Selectable[]) {
        Editing.operation?.cancel();
        Editing.operation = this;
        this.selection = selection;
        this.currentState = [];
        for (let i = 0; i < selection.length; i++) {
            this.currentState.push(selection[i].captureState());
        }
        console.log("new operation");
    }
    cancel() {
        console.log("cancelled operation");
        Editing.operation = undefined;
        this.restoreState();
    }
    restoreState() {
        for (let i = 0; i < this.selection.length; i++) {
            this.selection[i].restoreState(this.currentState[i]);
        }
    }
    confirm() {
        console.log("confirmed operation");
        Editing.operation = undefined;
    }
    update() {
        if (Input.mouse.getButtonUp(MouseButton.Right)) {
            this.cancel();
        }
        if (this.gizmoInput && !Input.mouse.getButton(MouseButton.Left)) {
            this.confirm();
        }
        if (!this.gizmoInput && Input.mouse.getButtonUp(MouseButton.Left)) {
            this.confirm();
        }
    }
}

export class AxisOperation extends Operation {
    axis: Vector3;
    axisLock = false;
    constructor(selection: Selectable[]) {
        super(selection);
        this.axis = new Vector3(1, 1, 1);
    }
    update() {
        let axisSwitch = new Vector3();
        if (Input.getKeyUp("x")) {
            axisSwitch = new Vector3(1, 0, 0);
        }
        if (Input.getKeyUp("y")) {
            axisSwitch = new Vector3(0, 1, 0);
        }
        if (Input.getKeyUp("z")) {
            axisSwitch = new Vector3(0, 0, 1);
        }
        if (!axisSwitch.equals(new Vector3())) {
            if (this.axis.equals(axisSwitch)) {
                this.axis = new Vector3(1, 1, 1);
                this.axisLock = false;
            }
            else {
                this.axis = axisSwitch;
                this.axisLock = true;
                this.restoreState();
            }
        }
        super.update();
    }
}

export class MoveOperation extends AxisOperation {
    name = "Move"
    currentPosition: Vector3;
    constructor(selection: Selectable[]) {
        super(selection);
        let positionSum = new Vector3();
        for (let i = 0; i < selection.length; i++) {
            positionSum.add(selection[i].getPosition().clone());
        }
        this.currentPosition = new Vector3();
    }
    restoreState(): void {
        super.restoreState();
        this.currentPosition = new Vector3();
    }
    update() {
        if (this.gizmoInput) {
            this.currentPosition.add(Gizmo.moveInput)
        }
        else {
            if (this.axisLock) {
                this.currentPosition.addScaledVector(this.axis, Input.mouse.delta.x * .005);
            }
            else {
                this.currentPosition.add(Input.mouse.viewSpaceDelta);
            }
        }
        for (let i = 0; i < this.selection.length; i++) {
            this.selection[i].setPosition(this.currentState[i], this.currentPosition.clone());
        }
        super.update();
    }
}

export class ScaleOperation extends AxisOperation {
    name = "Scale"
    startPosition: Vector3;
    currentPosition: Vector3;
    startMousePosition: Vector2;
    startMouseDistance: number;
    constructor(selection: Selectable[]) {
        super(selection);
        this.startPosition = Editing.selection[0].getScale().clone();
        this.currentPosition = this.startPosition.clone();
        this.startMousePosition = worldToScreen(Editing.selection[0].getPosition());
        this.startMouseDistance = Input.mouse.position.distanceTo(this.startMousePosition);
    }
    restoreState(): void {
        super.restoreState();
        this.currentPosition = this.startPosition.clone();
    }
    update() {
        if (this.gizmoInput) {
            this.currentPosition.add(Gizmo.moveInput)
        }
        else {
            if (this.axisLock) {
                this.currentPosition.copy(this.startPosition.clone().multiply(this.axis.clone().multiplyScalar((Input.mouse.position.distanceTo(this.startMousePosition) / this.startMouseDistance)).add(new Vector3(1, 1, 1).sub(this.axis))));
                console.log(this.currentPosition);
            }
            else {
                this.currentPosition.copy(this.startPosition.clone().multiplyScalar(Input.mouse.position.distanceTo(this.startMousePosition) / this.startMouseDistance));
            }
        }
        for (let i = 0; i < this.selection.length; i++) {
            this.selection[i].setScale(this.currentState[i], this.currentPosition.clone());
        }
        super.update();
    }
}