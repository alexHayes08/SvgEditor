import * as d3 from "d3";

import { IDOMDrawable } from "../idom-drawable";
import { ColorSlider } from "./color-slider";

export class ColorControlRgb implements IDOMDrawable<HTMLElement> {
    //#region Fields

    private readonly element: HTMLElement;
    private readonly container: HTMLElement;
    private readonly r_inputEl: HTMLElement;
    private readonly r_slider: ColorSlider;
    private readonly g_inputEl: HTMLElement;
    private readonly g_slider: ColorSlider;
    private readonly b_inputEl: HTMLElement;
    private readonly b_slider: ColorSlider;
    private readonly a_inputEl: HTMLElement;
    private readonly a_slider: ColorSlider;
    
    private _color: d3.Color;

    //#endregion

    //#region Ctor

    public constructor(container: HTMLElement) {
        this._color = d3.color("rgb(0,0,0)");
        this.container = container;

        // Create element
        this.element = document.createElement("div");
        this.element.classList.add("rgb-controls");

        // Create and compose elements controlling R
        let r_label = document.createElement("label");
        let r_text = document.createElement("span");
        let r_slider_container = document.createElement("div");
        this.r_inputEl = document.createElement("input");
        r_text.innerText = "R";
        r_label.appendChild(r_text);
        r_label.appendChild(r_slider_container);
        r_label.appendChild(this.r_inputEl);
        this.r_slider = new ColorSlider(r_slider_container);

        // Create and compose elements controlling G
        let g_label = document.createElement("label");
        let g_text = document.createElement("span");
        let g_slider_container = document.createElement("div");
        this.g_inputEl = document.createElement("input");
        g_text.innerText = "G";
        g_label.appendChild(g_text);
        g_label.appendChild(g_slider_container);
        g_label.appendChild(this.g_inputEl);
        this.g_slider = new ColorSlider(g_slider_container);

        // Create and compose elements controlling B
        let b_label = document.createElement("label");
        let b_text = document.createElement("span");
        let b_slider_container = document.createElement("div");
        this.b_inputEl = document.createElement("input");
        b_text.innerText = "B";
        b_label.appendChild(b_text);
        b_label.appendChild(b_slider_container);
        b_label.appendChild(this.b_inputEl);
        this.b_slider = new ColorSlider(b_slider_container);

        // Create and compose elements controlling A
        let a_label = document.createElement("label");
        let a_text = document.createElement("span");
        let a_slider_container = document.createElement("div");
        this.a_inputEl = document.createElement("input");
        a_text.innerText = "A";
        a_label.appendChild(a_text);
        a_label.appendChild(a_slider_container);
        a_label.appendChild(this.a_inputEl);
        this.a_slider = new ColorSlider(a_slider_container);

        // Compose elements
        this.element.appendChild(r_label);
        this.element.appendChild(g_label);
        this.element.appendChild(b_label);
        this.element.appendChild(a_label);
    }

    //#endregion

    //#region Properties

    public get color(): d3.Color {
        return this._color;
    }

    public set color(value: d3.Color) {
        this._color = value;
    }

    //#endregion
    
    //#region Functions

    public draw(): void {
        this.r_slider.draw();
        this.g_slider.draw();
        this.b_slider.draw();
        this.a_slider.draw();
        this.getContainer().appendChild(this.getElement());
    }

    public update(): void {
        this.r_slider.update();
        this.g_slider.update();
        this.b_slider.update();
        this.a_slider.update();
    }

    public erase(): void {

    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getContainer(): HTMLElement {
        return this.container;
    }

    //#endregion
}