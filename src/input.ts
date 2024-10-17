import { Vector2 } from "three";

export class Input {
    static mouse: Mouse;
    static heldKeys: Map<string, boolean>;
    public static init() {
        this.mouse = new Mouse();
        this.heldKeys = new Map<string, boolean>();
        window.addEventListener("keydown", e=>this.keyDown(e));
        window.addEventListener("keyup", e=>this.keyUp(e));
    }
    static keyDown(e: KeyboardEvent) {
        this.heldKeys.set(e.key, true);
    }
    static keyUp(e: KeyboardEvent) {
        this.heldKeys.set(e.key, false);
    }
    public static getKey(key: string) {
        return this.heldKeys.get(key) ?? false;
    }
}

export enum MouseButton {
    Left,
    Right,
    Wheel,
    Mouse4,
    Mouse5,
}

class Mouse {
    public position;
    public delta;
    public buttonsHeld = 0;
    public getButton(button: MouseButton) {
        return this.buttonsHeld & (1 << (button));
    }
    constructor() {
        this.position = new Vector2();
        this.delta = new Vector2();
        window.addEventListener("mousedown", e => this.mouseButtons(e));
        window.addEventListener("mouseup", e => this.mouseButtons(e));
        window.addEventListener("mousemove", e => this.mouseMove(e));
        document.addEventListener('contextmenu', event => event.preventDefault());
    }
    mouseButtons(e: MouseEvent) {
        this.buttonsHeld = e.buttons;
    }
    mouseMove(e: MouseEvent) {
        this.position.x = e.clientX;
        this.position.y = e.clientY;
        this.delta.x = e.movementX;
        this.delta.y = e.movementY;
    }
    movedThisFrame(){
        return (this.delta.x !== 0 || this.delta.y !== 0);
    }
    public update() {
        this.delta.x = 0;
        this.delta.y = 0;
    }
}
