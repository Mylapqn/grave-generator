import { Vector3 } from "three";
import { Input, MouseButton } from "../input";
import { Editing, Gizmo } from "./editing";

export class Operation {
    constructor(){
        Editing.operation?.cancel();
        Editing.operation = this;
    }
    cancel(){
        Editing.operation = undefined;
    }
    confirm(){
        Editing.operation = undefined;
    }
    update(){
        if(Input.mouse.getButton(MouseButton.Right)){
            this.cancel();
        }
        if(!Input.mouse.getButton(MouseButton.Left)){
            this.confirm();
        }
    }
}

export class MoveOperation extends Operation {
    originalPosition: Vector3;
    currentPosition: Vector3;
    constructor(){
        super();
        this.originalPosition = Editing.selection[0].getPosition().clone();
        this.currentPosition = this.originalPosition.clone();
    }
    update(){
        Editing.selection[0].setPosition(this.currentPosition.add(Gizmo.moveInput));
        super.update();
    }
}