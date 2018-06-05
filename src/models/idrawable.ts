export interface IDrawable {

    /**
     * Used to add/setup elements
     */
    draw(): void;

    /**
     * Used to update positions/colors/etc...
     */
    update(): void;

    /**
     * Used to remove/undo everything added in draw.
     */
    erase(): void;
}
