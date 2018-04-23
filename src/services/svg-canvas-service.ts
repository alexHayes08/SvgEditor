import { AutoWired, Singleton } from 'typescript-ioc';

@Singleton
export default class SvgCanvasService {
    private svgCanvases: SVGElement[];

    constructor() {
        this.svgCanvases = [];
    }

    get canvas() {
        if (this.svgCanvases.length > 0) {
            return this.svgCanvases[0];
        } else {
            return null;
        }
    }

    public createNewCanvas(): void {

    }

    public registerCanvas(): void {

    }

    public unregisterCanvas(): void {

    }
}