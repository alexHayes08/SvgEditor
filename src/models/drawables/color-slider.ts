import * as d3 from "d3";

import { IDOMDrawable } from "../idom-drawable";

export class ColorSlider implements IDOMDrawable<HTMLElement> {
    //#region Fields

    private readonly container: HTMLElement;
    private readonly element: HTMLElement;
    private readonly sliderEl: HTMLElement;

    private _maxValue: number;
    private _minValue: number;
    private _sliderPercentage: number;

    public startColor: d3.Color;
    public endColor: d3.Color;
    public onDragStart: Array<() => void>;
    public onDrag: Array<() => void>;
    public onDragEnd: Array<() => void>;

    //#endregion

    //#region Ctor

    public constructor(container: HTMLElement) {
        this.container = container;
        this.startColor = d3.color("rgb(0,0,0)");
        this.endColor = d3.color("rgb(0,0,0)");
        this.onDrag = [];
        this.onDragEnd = [];
        this.onDragStart = [];
        this._maxValue = 100;
        this._minValue = 0;
        this._sliderPercentage = 0;

        // Create the element
        this.element = document.createElement("div");
        this.element.classList.add("color-slider");
        this.element.style.background = ColorSlider.CreateCssLinearGradientString([
            this.startColor,
            this.endColor
        ]);

        // Create slider element
        this.sliderEl = document.createElement("div");
        this.sliderEl.classList.add("slider");

        // Compose elements
        this.element.appendChild(this.sliderEl);
    }

    //#endregion

    //#region Properties

    public get value(): number {
        return this._sliderPercentage;
    }

    public set value(value: number) {
        this._sliderPercentage = value;
    }

    //#endregion

    //#region Functions

    private static CreateCssLinearGradientString(colors: d3.Color[]): string {
        let colorStr = "";
        colors.map(c => colorStr += ` ${c.toString()}`);
        return `linear-gradient(to left,${colorStr})`;
    }

    public draw(): void {
        this.getContainer().appendChild(this.getElement());
    }

    public update(): void {

    }

    public erase(): void {

    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getContainer(): Element {
        return this.container;
    }

    //#endregion
}