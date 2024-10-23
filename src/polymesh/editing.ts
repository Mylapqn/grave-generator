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
    public static selection: Selectable[];
    public static hovered: Selectable;
    public static editMode:EditingModes;
}

export interface Selectable {

    select(selected?: Selectable): void;
    hover(hovered?: Selectable): void;
}

