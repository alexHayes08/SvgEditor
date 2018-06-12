import * as d3 from "d3";

import { IDOMDrawable } from "../idom-drawable";
import { ColorSlider } from "./color-slider";
import { Input } from "./input";
import { createEl } from "../../helpers/html-helper";
import { normalizeColor } from "../../helpers/color-helper";

const white = d3.rgb("white");
const black = d3.rgb("black");

export class ColorControlRgb implements IDOMDrawable<HTMLElement> {
    //#region Fields

    private readonly element: HTMLElement;
    private readonly emitter: d3.Dispatch<EventTarget>;
    private readonly container: HTMLElement;

    private readonly r_input: Input;
    private readonly r_slider: ColorSlider;
    private readonly g_input: Input;
    private readonly g_slider: ColorSlider;
    private readonly b_input: Input;
    private readonly b_slider: ColorSlider;
    private readonly a_input: Input;
    private readonly a_slider: ColorSlider;
    
    private _color: d3.Color;

    //#endregion

    //#region Ctor

    public constructor(container: HTMLElement) {
        let self = this;
        this._color = d3.color("rgb(0,0,0)");
        this.container = container;

        // Create element
        this.element = createEl("div");
        this.element.classList.add("rgb-controls");

        // Create event emitter
        this.emitter = d3.dispatch("change");

        // Create and compose elements controlling R
        let r_label = createEl("label");
        let r_text = createEl("span", r_label);
        r_text.innerText = "R";
        let r_slider_container = createEl("div", r_label);
        this.r_input = new Input(r_label);
        this.r_input.getElement().classList.add("flex-shrink", "width-5-em");
        this.r_input.validator = this.colorChannelValidator;
        this.r_slider = new ColorSlider(r_slider_container);
        this.r_slider.startColor = d3.color("black");
        this.r_slider.endColor = d3.color("red");
        this.r_slider.setValue(.5, false);

        // Create and compose elements controlling G
        let g_label = createEl("label");
        let g_text = createEl("span", g_label);
        g_text.innerText = "G";
        let g_slider_container = createEl("div", g_label);
        this.g_input = new Input(g_label);
        this.g_input.validator = this.colorChannelValidator;
        this.g_slider = new ColorSlider(g_slider_container);
        this.g_slider.startColor = d3.color("black");
        this.g_slider.endColor = d3.color("green");
        this.g_slider.setValue(.5, false);

        // Create and compose elements controlling B
        let b_label = createEl("label");
        let b_text = createEl("span", b_label);
        b_text.innerText = "B";
        let b_slider_container = createEl("div", b_label);
        this.b_input = new Input(b_label);
        this.b_input.validator = this.colorChannelValidator;
        this.b_slider = new ColorSlider(b_slider_container);
        this.b_slider.startColor = d3.color("black");
        this.b_slider.endColor = d3.color("blue");
        this.b_slider.setValue(.5, false);

        // Create and compose elements controlling A
        let a_label = createEl("label");
        let a_text = createEl("span", a_label);
        a_text.innerText = "A";
        let a_slider_container = createEl("div", a_label);
        this.a_input = new Input(a_label);
        this.a_input.validator = this.opacityValidator;
        this.a_slider = new ColorSlider(a_slider_container);
        let a_start_color = d3.color("black");
        a_start_color.opacity = 0;
        this.a_slider.startColor = a_start_color;
        this.a_slider.endColor = d3.rgb("black");
        this.a_slider.setValue(.5, false);

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

    private opacityValidator(value: string): string|undefined {
        let val = Number(value);
        
        // Check if the value is a number
        if (Number.isNaN(val)) {
            return "Must be a number."
        } else if (val > 1 || val < 0) {
            return "Value must be greater than or equal to zero and less than or equal to one.";
        } else {

            // No error.
            return undefined;
        }
    }

    private colorChannelValidator(value: string): string|undefined {
        let val = Number(value);
        
        // Check if the value is a number
        if (Number.isNaN(val)) {
            return "Must be a number."
        } else if (val > 255 || val < 0) {
            return "Value must be greater than or equal to zero and less than or equal to 255.";
        } else {

            // No error.
            return undefined;
        }
    }

    public draw(): void {
        this.getContainer().appendChild(this.getElement());
        let self = this;
        // Set common properties/classes/attributes/evt listeners.
        [
            {
                input: this.r_input,
                slider: this.r_slider,
                letter: "r"
            },
            {
                input: this.g_input,
                slider: this.g_slider,
                letter: "g"
            },
            {
                input: this.b_input,
                slider: this.b_slider,
                letter: "b"
            },
            {
                input: this.a_input,
                slider: this.a_slider,
                letter: "a"
            }
        ].map(function(obj) {
            obj.input.discardInvalidValues = true;
            obj.input.draw();
            obj.slider.draw()
            
            d3.select(obj.input.getElement())
                .classed("flex-shrink", true)
                .classed("width-5-em", true);
            d3.select(obj.input.getInputElement())
                .attr("type", "number")
                .classed("width-100", true);
            d3.select(obj.slider.getContainer())
                .classed("flex-grow", true);
            
            let { letter } = obj;
            [
                obj.input,
                obj.slider
            ].map(eventEmitter => {
                
            });

            obj.input.getEventEmitter().on("change", function() {
                let newVal = Number(obj.input.getValue());
                let color = d3.rgb(self.color.toString());
                switch(letter) {
                    case "r":
                        color.r = newVal;
                        break;
                    case "g":
                        color.g = newVal;
                        break;
                    case "b":
                        color.b = newVal;
                        break;
                    case "a":
                        color.opacity = newVal;
                        break;
                }
                self.color = color;
                self.update();
                self.emitter.call("change", self.getElement());
            });

            obj.slider.getEventEmitter().on("change", function() {
                let newVal = Number(obj.slider.getValue());
                if (letter != "a") {
                    newVal *= 255;
                    newVal = newVal > 255 ? 255 : newVal;
                    newVal = newVal < 0 ? 0 : newVal;
                }
                let color = d3.rgb(self.color.toString());
                switch(letter) {
                    case "r":
                        color.r = newVal;
                        break;
                    case "g":
                        color.g = newVal;
                        break;
                    case "b":
                        color.b = newVal;
                        break;
                    case "a":
                        color.opacity = newVal;
                        break;
                }
                self.color = color;
                self.update();
                self.emitter.call("change", self.getElement());
            });
        });
        this.update();
    }

    public update(): void {
        let color = d3.rgb(this.color.toString());
        normalizeColor(color);

        this.r_slider.setValue(color.r / 255, false);
        this.r_slider.update();
        this.r_input.setValue(color.r.toPrecision(6), false);
        this.r_input.update();

        this.g_slider.setValue(color.g / 255, false);
        this.g_slider.update();
        this.g_input.setValue(color.g.toPrecision(6), false);
        this.g_input.update();

        this.b_slider.setValue(color.b / 255, false);
        this.b_slider.update();
        this.b_input.setValue(color.b.toPrecision(6), false);
        this.b_input.update();

        this.a_slider.setValue(color.opacity, false);
        this.a_slider.update();
        this.a_input.setValue(color.opacity.toPrecision(6), false);
        this.a_input.update();
    }

    public erase(): void {
        this.getElement().remove();
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getContainer(): HTMLElement {
        return this.container;
    }

    public getEventEmitter(): d3.Dispatch<EventTarget> {
        return this.emitter;
    }

    //#endregion
}