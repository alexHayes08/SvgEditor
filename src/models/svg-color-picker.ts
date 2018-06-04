const uniqid = require("uniqid");

import * as d3 from "d3";

import { IDrawable } from "./idrawable";
import { SvgDefs } from "./svg-defs-model";

export enum ColorPickerMode {
    RGB,
    HSL,
    CMYK,
    WHEEL,
    CMS
};

enum ColorRefType {
    
    // Element defines its own color
    SOLID,

    // References a linear gradient in the defs.
    LINEAR_GRADIENT,

    // References a radial gradient element in the defs.
    RADIAL_GRADIENT,

    // Reference a element in the defs.
    URL
}

interface ColorMode {
    name: string;
    type: ColorPickerMode;
}

interface ColorRef {
    type: ColorRefType;
}

const COLOR_MODES: ColorMode[] = [
    {
        name: "RGB",
        type: ColorPickerMode.RGB
    },
    {
        name: "HSL",
        type: ColorPickerMode.HSL
    },
    {
        name: "CYMK",
        type: ColorPickerMode.CMYK
    },
    {
        name: "Wheel",
        type: ColorPickerMode.WHEEL
    },
    {
        name: "CMS",
        type: ColorPickerMode.CMS
    }
];

export class SvgColorPicker implements IDrawable {
    //#region Fields

    private static DATA_NAME: string = "color-picker-name";
    private static RecentlyUsedColors: d3.Color[];
    
    private readonly container: d3.Selection<HTMLDivElement, {}, null, undefined>;
    private readonly defs: SvgDefs;
    
    private color: d3.Color;
    private element?: d3.Selection<HTMLDivElement, {}, null, undefined>;

    //#endregion

    //#region Ctor

    public constructor(
        container: d3.Selection<HTMLDivElement, {}, null, undefined>,
        defs: SvgDefs)
    {

        // Assign static usedColors a property if not set
        if (SvgColorPicker.RecentlyUsedColors == undefined) {
            SvgColorPicker.RecentlyUsedColors = [];
        }

        this.color = d3.color("rgb(0,0,0)");
        this.container = container;
        this.defs = defs;
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    private drawRgb(tab: d3.Selection<HTMLDivElement, ColorMode, HTMLDivElement, {}>): void
    {
        console.log("Drawing RGB tab.");
    }

    private drawHSL(tab: d3.Selection<HTMLDivElement, ColorMode, HTMLDivElement, {}>): void
    {
        console.log("Drawing HSL tab.");
    }

    private drawCYMK(tab: d3.Selection<HTMLDivElement, ColorMode, HTMLDivElement, {}>): void
    {
        console.log("Drawing CYMK tab.");
    }

    private drawCMS(tab: d3.Selection<HTMLDivElement, ColorMode, HTMLDivElement, {}>): void
    {
        console.log("Drawing CMS tab.");
    }

    private drawWheel(tab: d3.Selection<HTMLDivElement, ColorMode, HTMLDivElement, {}>): void
    {
        console.log("Drawing Wheel tab.");
    }

    public draw(): void {
        let self = this;
        this.element = this.container
            .append<HTMLDivElement>("div")
            .attr("data-name", SvgColorPicker.DATA_NAME);

        // Update
        let tabs = this.element
            .selectAll<HTMLDivElement, {}>("div")
            .data(COLOR_MODES);

        // Enter
        tabs.enter()
            .append<HTMLDivElement>("div")
            .attr("data-name", function(d) { return d.name; })
            .each(function(d) {
                switch (d.type) {
                    case ColorPickerMode.CMS:
                        self.drawCMS(tabs)
                        break;
                    case ColorPickerMode.CMYK:
                        self.drawCYMK(tabs);
                        break;
                    case ColorPickerMode.HSL:
                        self.drawHSL(tabs);
                        break;
                    case ColorPickerMode.RGB:
                        self.drawRgb(tabs);
                        break;
                    case ColorPickerMode.WHEEL:
                        self.drawWheel(tabs);
                        break;
                }
            });

        // Exit
        tabs.exit()
            .remove();
    }

    public update(): void {

        // Verify the element isn't undefined.
        if (this.element == undefined) {
            return;
        }
    }

    public erase(): void {
        
        // Verify the element isn't undefined.
        if (this.element == undefined) {
            return;
        }

        this.element.remove();
    }

    //#endregion
}