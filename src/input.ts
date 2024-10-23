import { Vector2 } from "three";

export class Input {
    static mouse: Mouse;
    static heldKeys: Map<string, boolean>;
    static keysUp: Map<string, boolean>;
    static keysDown: Map<string, boolean>;
    public static init() {
        this.mouse = new Mouse();
        this.heldKeys = new Map<string, boolean>();
        this.keysUp = new Map<string, boolean>();
        this.keysDown = new Map<string, boolean>();
        window.addEventListener("keydown", e=>this.keyDown(e));
        window.addEventListener("keyup", e=>this.keyUp(e));
    }
    static keyDown(e: KeyboardEvent) {
        this.heldKeys.set(e.key, true);
        this.keysDown.set(e.key, true);
        switch (e.key) {
            case "Tab":
                e.preventDefault();
        }
    }
    static keyUp(e: KeyboardEvent) {
        this.heldKeys.set(e.key, false);
        this.keysUp.set(e.key, true);
    }
    public static getKey(key: string) {
        return this.heldKeys.get(key) ?? false;
    }
    public static getKeyUp(key: string) {
        return this.keysUp.get(key) ?? false;
    }
    public static getKeyDown(key: string) {
        return this.keysDown.get(key) ?? false;
    }
    public static update() {
        this.mouse.update();
        this.keysUp = new Map<string, boolean>();
        this.keysDown = new Map<string, boolean>();
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
    public scroll = 0;
    public getButton(button: MouseButton) {
        return this.buttonsHeld & (1 << (button));
    }
    public getScroll(){
        return this.scroll;
    }
    constructor() {
        this.position = new Vector2();
        this.delta = new Vector2();
        window.addEventListener("mousedown", e => this.mouseButtons(e));
        window.addEventListener("mouseup", e => this.mouseButtons(e));
        window.addEventListener("mousemove", e => this.mouseMove(e));
        window.addEventListener("wheel", e => this.mouseScroll(e));
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
    mouseScroll(e: WheelEvent) {
        this.scroll = e.deltaY/100;
    }
    movedThisFrame(){
        return (this.delta.x !== 0 || this.delta.y !== 0);
    }
    public update() {
        this.delta.x = 0;
        this.delta.y = 0;
        this.scroll = 0;
    }
}
