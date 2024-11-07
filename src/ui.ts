import { Vector2 } from "three";
import { Input } from "./input";
import { addObject, saveScene } from "./main";

export class UI {
    static container: HTMLDivElement;
    static init() {
        this.container = document.getElementById("ui") as HTMLDivElement;
    }
    static update() {
        if (Input.mouse.movedThisFrame()) {
            if (UIContextMenu.current) {
                if (UIContextMenu.currentLocation.distanceTo(Input.mouse.position) > 50 && UIContextMenu.current.mouseLeft) {
                    UIContextMenu.current.remove();
                }
            }
        }
    }
    static mouseOverUI = 0;
    static lastHoveredElement?: UIElement;
}

export class UIElement {
    public htmlElement: HTMLElement;
    public parent?: UIElement;
    public children: UIElement[] = [];
    constructor(type: string, ...classes: string[]) {
        this.htmlElement = document.createElement(type);
        this.htmlElement.classList.add(...classes);
        this.htmlElement.addEventListener("mouseenter", () => {
            UI.mouseOverUI++;
            UI.lastHoveredElement = this;
        });
        this.htmlElement.addEventListener("mouseleave", () => {
            UI.mouseOverUI = UI.mouseOverUI > 0 ? UI.mouseOverUI - 1 : 0;
            console.log("mouse leave", UI.mouseOverUI);
            if (UI.mouseOverUI == 0)
                UI.lastHoveredElement = undefined;
        });
    }
    remove() {
        while (this.children.length > 0) {
            this.children[0].remove();
        }
        if (this == UI.lastHoveredElement) {
            UI.lastHoveredElement = this.parent;
            UI.mouseOverUI--;
        }
        if (this.parent) {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
        }
        this.htmlElement.remove();
    }
    addChild(...uielement: UIElement[]) {
        for (const element of uielement) {
            this.htmlElement.appendChild(element.htmlElement);
            element.parent = this;
            this.children.push(element);
        }
    }
}

export class UIPanel extends UIElement {

    constructor() {
        super("div");
    }
}

export class UIButton extends UIElement {
    constructor(label: string = "Button", onclick?: () => void) {
        super("button");
        this.htmlElement.classList.add("basic");
        this.htmlElement.innerText = label;
        if (onclick) {
            this.onClick = onclick;
        }
        this.htmlElement.addEventListener("click", this.onClick.bind(this));
    }
    public onClick: () => void = () => { };
}

export class UIContextMenu extends UIPanel {
    static current?: UIContextMenu;
    static currentLocation: Vector2 = new Vector2();
    public mouseLeft = true;
    constructor(...uielement: UIElement[]) {
        super();

        if (UIContextMenu.current) {
            UIContextMenu.current.remove();
        }
        UIContextMenu.current = this;

        UI.container.appendChild(this.htmlElement);
        this.htmlElement.classList.add("drop-menu", "basic");
        this.htmlElement.style.position = "absolute";
        this.htmlElement.style.top = Input.mouse.position.y + "px";
        this.htmlElement.style.left = Input.mouse.position.x + "px";
        UIContextMenu.currentLocation = Input.mouse.position.clone();
        this.htmlElement.style.zIndex = "10";

        this.htmlElement.addEventListener("mouseleave", () => {
            this.mouseLeft = true;
        });
        this.htmlElement.addEventListener("mouseenter", () => {
            this.mouseLeft = false;
        });

        this.htmlElement.addEventListener("click", () => {
            this.remove();
        });

        if (uielement.length > 0) {
            this.addChild(...uielement);
            this.addChild(new UIDivider());
        }

        this.addChild(new UIButton("Save Scene",saveScene), new UIButton("Launch Revenant Earth",()=>{window.location.href = "https://mylapqn.github.io/revenant-earth/"}));
        
        this.addChild(new UIButton("Open Presentation",()=>{window.location.href = "https://www.canva.com/design/DAGSeJQGOy0/o6m0KIGwBaScX1zH0ojz_A/edit?utm_content=DAGSeJQGOy0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton"}));
    }
    remove() {
        UIContextMenu.current = undefined;
        super.remove();
    }
}

export class UIDivider extends UIElement {
    constructor() {
        super("div","divider");
    }
}