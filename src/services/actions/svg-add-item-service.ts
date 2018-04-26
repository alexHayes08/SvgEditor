const uniqid = require("uniqid");

// import { Singleton } from 'typescript-ioc';

// @Singleton
export default class SvgAddItemService {
    // private svgCanvas: SVGElement;
    private svgItems: SVGGraphicsElement[];

    constructor() {
        // this.svgCanvas = new SVGElement();
        this.svgItems = [];
    }

    /**
     * Returns all items on the canvas.
     */
    get items() {

        // Returns a copy of the items
        return [ ...this.svgItems ];
    }

    public addItem(item: SVGGraphicsElement) {

        // Check for a uniqueId
        if (item.id == null || item.id == "") {
            item.id = uniqid();
        }

        this.svgItems.push(item);
    }

    public removeItem(item: SVGGraphicsElement) {
        this.svgItems = this.svgItems.filter(val => val != item);
    }
}