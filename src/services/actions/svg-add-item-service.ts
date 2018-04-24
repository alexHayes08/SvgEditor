import { Singleton } from 'typescript-ioc';

@Singleton
export default class SvgAddItemService {
    // private svgCanvas: SVGElement;
    private svgItems: SVGElement[];

    constructor() {
        // this.svgCanvas = new SVGElement();
        this.svgItems = [];
    }

    public addItem(item: SVGGraphicsElement) {
        this.svgItems.push(item);
    }

    public removeItem(item: SVGGraphicsElement) {
        this.svgItems = this.svgItems.filter(val => val != item);
    }
}