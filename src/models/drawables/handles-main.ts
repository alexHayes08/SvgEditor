import * as d3 from 'd3';

import { calcConcentricPolygons } from '../../helpers/geometry-helpers';
import { toDegrees, toRadians } from '../../helpers/math-helpers';
import { NS } from '../../helpers/namespaces-helper';
import { CacheService } from '../../services/cache-service';
import {
    ICoords2D,
    IRotationMatrix,
    TransformType,
} from '../../services/svg-geometry-service';
import { ITransformable } from "../../models/itransformable";
import { Angle, IAngle } from './../angle';
import { InternalError } from './../errors';
import { IDrawable } from './../idrawable';
import { HandleMode, IMode } from './../ihandle-button';
import { Names } from './../names';
import { SvgCanvas } from './../svg-canvas-model';
import { SvgTransformString } from '../svg-transform-string';

const uniqid = require("uniqid");

interface IMainOverlayData {
    angle: IAngle;
    arcDataName: string;
    arcTransformData: ITransformable;
    buttonDataName: string;
    buttonPathArcDataName?: string;
    buttonTransformData: ITransformable;
    mainButtonIconUrl: string;
    modes: IMode[];

    handleMode?: HandleMode;
    middleAngle?: IAngle;
};

const buttonArcPathStartAngle = toRadians(270);
const buttonTransformOrder: TransformType[] = [
    TransformType.ROTATE,
    TransformType.TRANSLATE,
    TransformType.ROTATE
];
const buttonsTransform = new SvgTransformString([
        TransformType.ROTATE,
        TransformType.TRANSLATE,
        TransformType.ROTATE
    ]);
const arcTransformService: TransformType[] = [
    TransformType.ROTATE
];

export class HandlesMain implements IDrawable {
    //#region Fields

    private readonly elementDataMap: WeakMap<Element, ITransformable>;
    private readonly cache: CacheService<String>;
    private readonly htmlHandlesContainer: HTMLElement;
    private defaultWidth: number;
    private highlightData: ITransformable;
    private minRadius: number;
    private startAngleOffset: number;
    private lastUsedMode: HandleMode;

    private _collapseButtons: boolean;
    private _expandedMode?: IMainOverlayData;
    private _mode: HandleMode;
    private _radius: number;

    // private colorsOverlay: HandlesColorsOverlay;
    // private rotationOverlay: HandlesRotationOverlay;
    // private scaleOverlay: HandlesScaleOverlay;
    
    private arcsContainer: SVGGElement;
    private modeContainer: SVGGElement;
    private subModeContainer: SVGGElement;
    // private colorsOverlayContainer: SVGGElement;
    private mainOverlayContainer: SVGGElement;
    // private rotationOverlayContainer: SVGGElement;
    // private scaleOverlayContainer: SVGGElement;
    private selectionEl: SVGCircleElement;

    public container: SVGGElement;
    public center: ICoords2D;
    public animationDuration: number;
    public readonly onDeleteClickedHandlers: Function[];
    public readonly onRotationEventHandlers: Array<(angle: IRotationMatrix) => void>;

    private readonly data: IMainOverlayData[] = [
        {
            angle: Angle.fromDegrees(45),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ColorsArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME,
            mainButtonIconUrl: "assets/color-bttn.svg",
            modes: [
                { 
                    label: "Colors (all)", 
                    selected: true, 
                    iconUrl: "assets/color-submode-all-bttn.svg"
                },
                { 
                    label: "Colors (non-empty)", 
                    selected: false, 
                    iconUrl: "assets/color-submode-non-empty-bttn.svg"
                },
                { 
                    label: "Colors (unique)", 
                    selected: false, 
                    iconUrl: "assets/color-submode-unique-bttn.svg"
                }
            ],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.ColorsBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.COLORS
        },
        {
            angle: Angle.fromDegrees(45),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.EditArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME,
            mainButtonIconUrl: "assets/edit-bttn.svg",
            modes: [{ label: "Edit", selected: true, iconUrl: "" }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.EditBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.EDIT
        },
        {
            angle: Angle.fromDegrees(90),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: "",
            mainButtonIconUrl: "",
            modes: [],
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.SELECT_MODE
        },
        {
            angle: Angle.fromDegrees(22.5),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.DeleteArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME,
            mainButtonIconUrl: "assets/delete-bttn.svg",
            modes: [{ label: "Delete", selected: true, iconUrl: "" }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.DeleteBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.DELETE
        },
        {
            angle: Angle.fromDegrees(22.5),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.PanArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME,
            mainButtonIconUrl: "assets/pan-bttn.svg",
            modes: [{ label: "Pan", selected: true, iconUrl: "" }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.PanBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.PAN
        },
        {
            angle: Angle.fromDegrees(22.5),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.RotateArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME,
            mainButtonIconUrl: "assets/rotate-bttn.svg",
            modes: [
                { label: "Rotate Collectivley", selected: true, iconUrl: "" }, 
                { label: "Rotate Individually", selected: false, iconUrl: "" },
                { label: "Test", selected: false, iconUrl: "" }
            ],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.RotateBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.ROTATE
        },
        {
            angle: Angle.fromDegrees(22.5),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.ScaleArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME,
            mainButtonIconUrl: "assets/scale-bttn.svg",
            modes: [{ label: "Scale", selected: true, iconUrl: "" }],
            buttonPathArcDataName: Names.Handles.SubElements.ButtonArcPathsContainer.SubElements.ScaleBtnArcPath.DATA_NAME,
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.SCALE
        },
        {
            angle: Angle.fromDegrees(90),
            arcDataName: Names.Handles.SubElements.ArcsContainer.SubElements.FillArc.DATA_NAME,
            arcTransformData: new SvgTransformString(arcTransformService),
            buttonDataName: Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME,
            mainButtonIconUrl: "",
            modes: [{ label: "Toggle", selected: true, iconUrl: "" }],
            buttonTransformData: new SvgTransformString(buttonTransformOrder),
            handleMode: HandleMode.SCALE
        }
    ];

    private readonly buttonsData: IMainOverlayData[];

    //#endregion

    //#region Ctor

    public constructor(
        container: SVGGElement, 
        canvas: SvgCanvas,
        htmlContainer: HTMLElement) 
    {
        let self = this;
        this.animationDuration = 200;
        this.cache = new CacheService();
        this.center = { x: 0, y: 0};
        this.container = container;
        this.defaultWidth = 4;
        this.elementDataMap = new WeakMap();
        this.highlightData = SvgTransformString.CreateDefaultTransform();
        this.htmlHandlesContainer = htmlContainer;
        this.lastUsedMode = HandleMode.PAN;
        this.minRadius = 120;
        this.onDeleteClickedHandlers = [];
        this.onRotationEventHandlers = [];
        this.startAngleOffset = 45 + 180;
        
        this._collapseButtons = true;
        this._mode = HandleMode.PAN;
        this._radius = 100;

        let d3_container = d3.select(this.container);

        this.mainOverlayContainer = <SVGGElement>document
            .createElementNS(NS.SVG, "g");
        d3.select(this.mainOverlayContainer)
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", "handles-main-section");
        this.container.appendChild(this.mainOverlayContainer);
        let d3_mainOverlayContainer = d3.select(this.mainOverlayContainer);

        let selectionContainerEl = <SVGGElement>document
            .createElementNS(NS.SVG, "g");
        d3.select(selectionContainerEl)
            .attr("data-name", "selected-section");
        this.mainOverlayContainer.appendChild(selectionContainerEl);

        this.selectionEl = <SVGCircleElement>document
            .createElementNS(NS.SVG, "circle");
        this.mainOverlayContainer.appendChild(this.selectionEl);
        d3.select(this.selectionEl)
            .data([self.highlightData])
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.HightlightSection.DATA_NAME)
            .attr("r", self.radius)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("transform", function(d) {
                return d.toTransformString();
            });

        this.arcsContainer = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.mainOverlayContainer.appendChild(this.arcsContainer);
        d3.select(this.mainOverlayContainer)
            .attr("id", uniqid())
            .attr("data-name", 
                Names.Handles.SubElements.ArcsContainer.DATA_NAME);

        this.modeContainer = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.mainOverlayContainer.appendChild(this.modeContainer);
        d3.select(this.modeContainer)
            .attr("id", uniqid())
            .attr("data-name",
                Names.Handles.SubElements.ButtonsContainer.DATA_NAME);

        this.subModeContainer = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.mainOverlayContainer.appendChild(this.subModeContainer);
        d3.select(this.subModeContainer)
            .attr("id", uniqid())
            .attr("data-name", "sub-mode-container");

        // this.colorsOverlayContainer = <SVGGElement>document.createElementNS(NS.SVG, "g");
        // this.container.append(this.colorsOverlayContainer)
        // this.container
        //     .append<SVGGElement>("g")
        //     .attr("id", uniqid())
        //     .attr("data-name",
        //         Names.Handles.SubElements.ColorsHelperContainer.DATA_NAME)
        //     .each(function() {
        //         SvgTransformServiceSingleton.standardizeTransforms(this);
        //         ActivatableServiceSingleton.register(this, false);
        //     });

        // this.rotationOverlayContainer = this.container
        //     .append<SVGGElement>("g")
        //     .attr("id", uniqid())
        //     .attr("data-name", 
        //         Names.Handles.SubElements.RotationHelpersContainer.DATA_NAME)
        //     .each(function() {
        //         SvgTransformServiceSingleton.standardizeTransforms(this);
        //         ActivatableServiceSingleton.register(this, false);
        //     });
        
        // this.scaleOverlayContainer = this.container
        //     .append<SVGGElement>("g")
        //     .attr("id", uniqid())
        //     .attr("data-name",
        //         Names.Handles.SubElements.ScaleHelpersContainer.DATA_NAME)
        //     .each(function() {
        //         SvgTransformServiceSingleton.standardizeTransforms(this);
        //         ActivatableServiceSingleton.register(this, false);
        //     });

        // this.colorsOverlay = new HandlesColorsOverlay(
        //     this.colorsOverlayContainer, 
        //     canvas, 
        //     this.htmlHandlesContainer);
        // this.rotationOverlay = new HandlesRotationOverlay(this.rotationOverlayContainer);
        // this.scaleOverlay = new HandlesScaleOverlay(this.scaleOverlayContainer);

        this.buttonsData = this.data
            .filter(d => d.modes.length > 0);
    }

    //#endregion

    //#region Properties

    private get expandedMode() {
        return this._expandedMode;
    }

    private set expandedMode(value: IMainOverlayData|undefined) {

        // Contract the old mode.
        if (this._expandedMode != undefined) {
            this.contractMode(this._expandedMode)
        }
        
        // Expand the new mode IF it's not the same as the old node.
        if (value != undefined && value != this._expandedMode) {
            this.expandMode(value);
        }

        // If the value and old value are equal, set the expanded mode to undefined.
        if (value == this._expandedMode) {
            this._expandedMode = undefined;
        } else {

            // Assign new value
            this._expandedMode = value;
        }
    }

    public get collapseButtons() {
        return this._collapseButtons;
    }

    public set collapseButtons(value: boolean) {
        if (value != this.collapseButtons) {

            // Make sure the expanded mode is collapsed.
            this.expandedMode = undefined;

            // Update the class on the container.
            if (value) {
                this.container.classList.add("collapsed");
            } else {
                this.container.classList.remove("collapsed");
            }
            this._collapseButtons = value;
            this.updateButtonsAndArcs();
        }
    }

    public get mode() {
        return this._mode;
    }

    public set mode(value: HandleMode) {
        let oldMode = this.mode;
        
        // The lastUsedMode cannot be the select mode.
        if (oldMode != HandleMode.SELECT_MODE) {
            this.lastUsedMode = oldMode;
        }

        if (oldMode == HandleMode.SELECT_MODE
            && value == HandleMode.SELECT_MODE)
        {
            this._mode = this.lastUsedMode;
        } else {
            this._mode = value;
        }
        
        this.modeChanged(this.lastUsedMode, this.mode);
        this.collapseButtons = !this.collapseButtons;
    }

    public get radius() {
        return this._radius
    }

    public set radius(value: number) {
        if (value < this.minRadius) {
            this._radius = this.minRadius;
        } else {
            this._radius = value;
        }
    }

    //#endregion

    //#region Functions

    private subModesTransition(selection: d3.Selection<SVGPathElement, IMainOverlayData, SVGGElement, {}>): void 
    {

    }

    private expandMode(mode: IMainOverlayData): void {
        d3.select(this.modeContainer)
            .selectAll(`g[data-name]:not([data-name='${mode.buttonDataName}']) > g[data-name='main-button-container']`)
            .classed("opacity-half", true);
        d3.select(`[data-name="sub-mode-container"] > [data-for='${mode.buttonDataName}']`)
            .classed("expanded", true);
    }

    private contractMode(mode: IMainOverlayData): void {
        d3.select(this.modeContainer)
            .selectAll(`g[data-name]:not([data-name='${mode.buttonDataName}']) > g[data-name='main-button-container']`)
            .classed("opacity-half", false);
        d3.select(`[data-name="sub-mode-container"] > [data-for='${mode.buttonDataName}']`)
            .classed("expanded", false);
    }

    private getSelectedSubMode(data: IMainOverlayData): IMode {
        let selectedMode = data.modes.find(m => m.selected);

        if (selectedMode == undefined) {
            throw new Error("There were no selected modes.");
        }

        return selectedMode;
    }

    private updateButtonsAndArcs() {
        let self = this;

        // Update arcs.
        d3.select(this.arcsContainer)
            .selectAll<SVGPathElement, IMainOverlayData>("path")
            .data(this.data)
            .call(arcOpacity)
            .call(arcTransforms);

        /**
         * Mode heirarchy
         * - Mode container (per mode)
         *  - Main button group
         *      - Main circle
         *  - Concentric polygon group
         *  - Sub-modes group
         */

        // Draw main buttons.
        d3.select(this.modeContainer)
            .selectAll<SVGGElement, IMainOverlayData>("g[data-name='handles-button-container'] > g[data-name]")
            .data(this.buttonsData)
            .call(bttnOpacity)
            .call(bttnTransform);

        d3.select(this.subModeContainer)
            .selectAll<SVGGElement, IMainOverlayData>("g[data-for]")
            .data(this.buttonsData)
            .call(bttnTransform);

        function arcTransforms(selection: d3.Selection<SVGPathElement, IMainOverlayData, SVGGElement, {}>) {
            selection.transition("arc-transform-transition")
                .duration(self.animationDuration)
                .attrTween("transform", function(d) {
                    let middleAngle:IAngle = (d.middleAngle || Angle.fromDegrees(0));
                    let handleMode = d.handleMode;

                    // This is to get the button to rotate from the right if it's
                    // also on the right.
                    middleAngle = middleAngle.asDegrees() > 180 
                        ? Angle.fromDegrees(-1 * (360 - middleAngle.asDegrees())) 
                        : middleAngle;

                    // How much to move the button.
                    let angleIncrement = 1 / middleAngle.asDegrees();

                    // Update the radius
                    d.arcTransformData.setRotation({ a: 0 });

                    // Return a function where the argument (t) is a value in the
                    // range [0-1].
                    if (self.collapseButtons) {
                        return function(t) {
                            d.arcTransformData.setRotation({
                                a: -1 * t * middleAngle.asDegrees() 
                            }, 0);
                            return d.arcTransformData.toTransformString();
                        }
                    } else {
                        return function(t) {
                            let offset = -1 * (middleAngle.asDegrees() 
                                - (t * middleAngle.asDegrees()));
                            d.arcTransformData.setRotation({ a: offset }, 0);
                            return d.arcTransformData.toTransformString();
                        }
                    }
                });
        }

        function arcOpacity(selection: d3.Selection<SVGPathElement, IMainOverlayData, SVGGElement, {}>) {
            selection.transition("arc-opacity-transition")
                .duration(self.animationDuration)
                .style("opacity", function(d) {
                    return self.collapseButtons ? 0 : 1;
                })
                .on("start", function(d) {
                    this.style.display = "unset";
                })
                .transition()
                .style("display", function(d) {
                    return self.collapseButtons ? "none" : "unset";
                });
        }
        
        function bttnTransform(selection: d3.Selection<SVGGElement, IMainOverlayData, SVGGElement, {}>) {
            selection.transition("button-transform-transition")
                .duration(self.animationDuration)
                .attrTween("transform", function(d) {
                    let middleAngle = (d.middleAngle || Angle.fromDegrees(0));
                    let handleMode = d.handleMode;

                    // This is to get the button to rotate from the right if it's
                    // also on the right.
                    middleAngle = middleAngle.asDegrees() > 180 
                        ? Angle.fromDegrees(-1 * (360 - middleAngle.asDegrees())) 
                        : middleAngle;

                    // How much to move the button.
                    let angleIncrement = 1 / middleAngle.asDegrees();

                    // Update the radius
                    d.buttonTransformData.setTranslate({ x: 0, y: self.radius });

                    // Return a function where the argument (t) is a value in the
                    // range [0-1].
                    if (self.collapseButtons) {
                        return function(t) {
                            let offset = middleAngle.asDegrees() 
                                - (t * middleAngle.asDegrees());
                            d.buttonTransformData.setRotation({ a: offset }, 0);
                            d.buttonTransformData.setRotation({ a: -1 * offset }, 1);
                            return d.buttonTransformData.toTransformString();
                        }
                    } else {
                        return function(t) {
                            d.buttonTransformData.setRotation({ 
                                a: t * middleAngle.asDegrees() 
                            }, 0);
                            d.buttonTransformData.setRotation({ 
                                a: t * -1 * middleAngle.asDegrees() 
                            }, 1);
                            return d.buttonTransformData.toTransformString();
                        }
                    }
                });
        }

        function bttnOpacity(selection: d3.Selection<SVGGElement, IMainOverlayData, SVGGElement, {}>) {            
            selection.transition("button-opacity-transition")
                .duration(self.animationDuration)
                .style("opacity", function(d) {
                    let currentMode = d.modes.find(m => {
                        return m.selected && (d.handleMode == self.mode)
                    });

                    if (d.buttonDataName == Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME) {
                        return 1;
                    } else if (currentMode) {
                        return 1;
                    } else {
                        return self.collapseButtons ? 0 : 1;
                    }
                })
                .on("start", function(d) {
                    this.style.display = "unset";
                })
                .transition()
                .style("display", function(d) {
                    let currentMode = d.modes.find(m => {
                        return m.selected && (d.handleMode == self.mode)
                    });

                    if (d.buttonDataName == Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME) {
                        return "unset";
                    } else if (currentMode) {
                        return "unset";
                    } else {
                        return self.collapseButtons ? "none" : "unset";
                    }
                });
        }
    }

    private modeChanged(oldMode: HandleMode, newMode: HandleMode): void {
        // console.log(`Mode changed to ${this.mode}`);
        // let oldName: string = "";
        // let newName: string = "";

        // switch(oldMode) {
        //     case HandleMode.SELECT_MODE:
        //         oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME;
        //         break;
        //     case HandleMode.COLORS:
        //         ActivatableServiceSingleton.deactivate(this.colorsOverlay.containerNode);
        //         oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME;
        //         break;
        //     case HandleMode.DELETE:
        //         oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME;
        //         break;
        //     case HandleMode.EDIT:
        //         // ActivatableServiceSingleton.deactivate(this.edit)
        //         oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME;
        //         break;
        //     case HandleMode.ROTATE:
        //         ActivatableServiceSingleton.deactivate(this.rotationOverlay.containerNode);
        //         oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME;
        //         break;
        //     case HandleMode.SCALE:
        //         ActivatableServiceSingleton.deactivate(this.scaleOverlay.containerNode);
        //         oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME;
        //         break;
        //     case HandleMode.PAN:
        //     default:
        //         oldName = Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME;
        //         break;
        // }

        // switch(newMode) {
        //     case HandleMode.SELECT_MODE:
        //         newName = Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME;
        //         break;
        //     case HandleMode.COLORS:
        //         ActivatableServiceSingleton.activate(this.colorsOverlay.containerNode);
        //         newName = Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME;
        //         this.colorsOverlay.radius = this.radius;
        //         this.data.find(d => {
        //             if (d.buttonDataName == Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME) {
        //                 let selectedMode = d.modes.find(_d => _d.selected);
        //                 console.log(selectedMode);
        //                 if (selectedMode != undefined) {
        //                     switch (selectedMode.label) {
        //                         case "Colors (all)":
        //                             this.colorsOverlay.mode = HandlesColorMode.ALL;
        //                             break;
        //                         case "Colors (non-empty)":
        //                             this.colorsOverlay.mode = HandlesColorMode.MUST_HAVE_FILL_OR_STROKE;
        //                             break;
        //                         case "Colors (unique)":
        //                             this.colorsOverlay.mode = HandlesColorMode.UNIQUE_COLORS_ONLY;
        //                             break;
        //                         default:
        //                             break;
        //                     }
        //                 }
        //                 return true;
        //             } else {
        //                 return false;
        //             }
        //         });
        //         this.colorsOverlay.update();
        //         break;
        //     case HandleMode.EDIT:
        //         newName = Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME;
        //         break;
        //     case HandleMode.ROTATE:
        //         this.rotationOverlay.radius = this.radius;
        //         this.rotationOverlay.update();
        //         ActivatableServiceSingleton.activate(this.rotationOverlay.containerNode);
        //         newName = Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME;
        //         break;
        //     case HandleMode.SCALE:
        //         ActivatableServiceSingleton.activate(this.scaleOverlay.containerNode);
        //         newName = Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME;
        //         break;
        //     // Delete should switch to Pan mode, it doesn't make much sense to
        //     // add object and have them be in the delete mode.
        //     case HandleMode.DELETE: 
        //     case HandleMode.PAN:
        //     default:
        //         newName = Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME;
        //         break;
        // }
        
        // // Only remove the old modes active class if the new mode isn't the
        // // select mode.
        // if (newMode != HandleMode.SELECT_MODE) {
        //     this.modeContainer
        //         .selectAll(`*.active:not([data-name='${newName}'])`)
        //         .classed("active", false);
        // }

        // this.modeContainer
        //     .select(`*[data-name='${newName}']`)
        //     .classed("active", true);
    }

    public draw(): void {
        let self = this;
        let rotateData = self.buttonsData.find(d => d.arcDataName == Names.Handles.SubElements.ArcsContainer.SubElements.RotateArc.DATA_NAME);
        let colorData = self.buttonsData.find(d => d.arcDataName == Names.Handles.SubElements.ArcsContainer.SubElements.ColorsArc.DATA_NAME);

        // Update the highlight element
        d3.select(this.selectionEl)
            .attr("r", self.radius - (self.defaultWidth/2));
        
        // Draw arcs
        let pieData = d3.pie<IMainOverlayData>()
            .startAngle(toRadians(self.startAngleOffset))
            .endAngle(toRadians(self.startAngleOffset - 360))
            .value(function(d) { return d.angle.asDegrees(); })
            .sortValues(function(a: number, b: number) {
                return a;
            })(this.data);

        d3.select(this.arcsContainer)
            .selectAll("path")
            .data(pieData)
            .enter()
            .append("path")
            .attr("id", () => uniqid())
            .attr("data-name", d => d.data.arcDataName)
            .attr("transform", d => d.data.arcTransformData.toTransformString());

        d3.select(this.modeContainer)
            .selectAll<SVGGElement, IMainOverlayData>("g")
            .data(this.buttonsData)
            .enter()
            .append<SVGGElement>("g")
            .attr("id", () => uniqid())
            .attr("data-name", function(d) { return d.buttonDataName })
            .attr("transform", function(d) {
                d.buttonTransformData.setTranslate({x: 0, y: self.radius}, 0);

                if (self.collapseButtons) {
                    d.buttonTransformData.setRotation({a: 0}, 0);
                    d.buttonTransformData.setRotation({a: 0}, 1);
                } else {
                    d.buttonTransformData.setRotation({
                        a: (d.middleAngle 
                            ? d.middleAngle.asDegrees() 
                            : 0)
                        }, 0);
                    d.buttonTransformData.setRotation({
                        a: -1 * (d.middleAngle 
                            ? d.middleAngle.asDegrees()
                            : 0)
                        }, 1);
                }

                return d.buttonTransformData.toTransformString();
            })
            .classed(Names.Handles.BTN_HANDLE_CLASS, true)
            .each(function(d) {

                // Draw the arcs
                let pieSlice = pieData.find(p => p.data.buttonDataName == d.buttonDataName);

                // Check that the slice exists and is NOT the toggle button
                if (pieSlice == undefined)
                {
                    return "";
                }

                // Find the angle halfway between the start and end angles
                d.middleAngle = Angle.fromDegrees(180 + toDegrees(pieSlice.startAngle 
                    + ((pieSlice.endAngle - pieSlice.startAngle) / 2)));

                d.buttonTransformData.setRotation({ 
                    a: d.middleAngle.asDegrees()
                });
                d.buttonTransformData.setRotation({ 
                    a: -1 * d.middleAngle.asDegrees() 
                }, 2)
                d.buttonTransformData.setTranslate({ x: 0, y: self.radius })
                d3.select(this)
                    .attr("transform", d.buttonTransformData
                        .toTransformString());
                self.update();

                // Draw the modes
                let modeContainer = d3.select(this);

                // First create each container
                // 1) Main button container
                // 2) Concentric container
                // 3) Submodes container
                let mainButtonContainer = modeContainer
                    .append<SVGGElement>("g")
                    .data([d.handleMode])
                    .attr("data-name", "main-button-container");
                let buttonOverlayContainer = d3.select(self.subModeContainer)
                    .append<SVGGElement>("g")
                    .attr("data-for", d.buttonDataName)
                let concentricContainer = buttonOverlayContainer
                    .append<SVGGElement>("g")
                    .attr("data-name", "concentric-container");
                let submodesContainer = buttonOverlayContainer
                    .append<SVGGElement>("g")
                    .attr("data-name", "submodes-button-container");

                // Append main button background
                mainButtonContainer
                    .append<SVGCircleElement>("circle")
                    .attr("r", 20)
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .classed("mode-button-bg", true);

                // Append main button
                mainButtonContainer
                    .append<SVGCircleElement>("circle")
                    .attr("r", 16)
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .attr("data-name", d.buttonDataName)
                    .classed("mode-button", true);

                // Append image
                mainButtonContainer
                    .append<SVGImageElement>("image")
                    .attr("x", "-16px")
                    .attr("y", "-16px")
                    .attr("width", "32px")
                    .attr("height", "32px")
                    // .attr("preserveAspectRatio", true)
                    .attr("href", d.mainButtonIconUrl);

                // Draw concentric polygons/circles IF there are sub modes.
                if (d.modes.length > 1) {

                    // Multiple sub-modes
                    // Calculate how many polygons are needed for each mode.
                    // let concentricPolygons = self.cache
                    //     .get<Polygon[]>(d.buttonDataName,
                    //         () => {
                    //             return calculateConcentricPolygons(
                    //                 d.modes.length, 20, 60, d.middleAngle);
                    //         });
                    let concentricPolygons = calcConcentricPolygons({
                        numberOfVerticies: d.modes.length, 
                        sideLength: 20, 
                        minCircumRadius: 50,
                        keepVerticiesEquidistant: true
                        // startAngle: d.middleAngle
                    });
                    let verticies: ICoords2D[] = [];
                    concentricPolygons.map(p => {
                        verticies = verticies.concat(p.verticies);
                    });

                    // Throw error if polygons is undefined.
                    if (concentricPolygons == undefined) {
                        throw new InternalError();
                    }

                    // Draw concentrics
                    let concentricPolygonsEls = concentricContainer
                        .selectAll<SVGCircleElement, {}>("circle")
                        .data(concentricPolygons)
                        .enter()
                        .append<SVGCircleElement>("circle")
                        .attr("r", function(d) { return d.circumRadius })
                        .classed("concentric-submode-ring", true);

                    // let concentricPolygonsElsV2 = concentricContainer
                    //     .selectAll<SVGPolygonElement, {}>("polygon")
                    //     .data(concentricPolygons)
                    //     .enter()
                    //     .append<SVGPolygonElement>("polygon")
                    //     .attr("points", function(d) {
                    //         return coordsToPointsStr(d.verticies);
                    //     })
                    //     .classed("concentric-submode-ring", true);

                    // Draw each sub-mode button if available
                    let modeButtons = submodesContainer
                        .selectAll<SVGGElement, {}>("g")
                        .data(d.modes)
                        .enter()
                        .append<SVGGElement>("g")
                        .attr("data-mode", function(_d) { return _d.label })
                        .attr("transform", function(_d, _i) {

                            // Check that there is a placement for this
                            // submode button.
                            if (_i >= verticies.length) {
                                return "";
                            } else {
                                let vertex = verticies[_i];
                                return `translate(${vertex.x},${vertex.y})`;
                            }
                        })
                        .classed("selected", function(d) { return d.selected })
                        .each(function(d) {
                            let subModeButtonContainer = d3.select(this);

                            // Append circle background
                            subModeButtonContainer
                                .append<SVGCircleElement>("circle")
                                .attr("r", 16)
                                .attr("cx", 0)
                                .attr("cy", 0)
                                .classed("mode-button", true);

                            // Append image
                            subModeButtonContainer
                                .append<SVGImageElement>("image")
                                .attr("href", function() { return d.iconUrl; })
                                .attr("x", -15)
                                .attr("y", -15)
                                .attr("width", 30)
                                .attr("height", 30);
                        });

                    // Add event listener to the main button to display the
                    // sub-modes.
                    mainButtonContainer.on("click", function(_d, _i) {
                        console.log(`Toggled display of sub-modes of mode ${d.buttonDataName}`);
                        self.expandedMode = d;
                        d3.event.stopPropagation();
                    });
                }
            });

        // Add event listeners to the buttons
        d3.select(this.modeContainer)
            .select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.DeleteBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.DELETE;
                self.onDeleteClickedHandlers.map(f => f())
            });

        d3.select(this.modeContainer)
            .select<Element>(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.ToggleControlsBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.SELECT_MODE;
                console.log(`Toggled collapse buttons: ${self.collapseButtons}`);
                d3.event.stopPropagation();
            });

        d3.select(this.subModeContainer)
            .selectAll<SVGGElement, {}>(`[data-for='${Names.Handles.SubElements.ButtonsContainer.SubElements.ColorsBtn.DATA_NAME}'] *[data-mode]`)
            .on("click", function() {

                if (colorData == undefined) {
                    throw new InternalError();
                }

                let thisDataMode = this.getAttribute("data-mode");
                colorData.modes.map(mode => {
                    mode.selected = mode.label == thisDataMode;
                    d3.select(`[data-mode='${mode.label}']`)
                        .classed("selected", mode.selected);
                });

                self.mode = HandleMode.COLORS;
                d3.event.stopPropagation();
            });

        d3.select(this.modeContainer)
            .select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.EditBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.EDIT;
                d3.event.stopPropagation();
            });

        d3.select(this.modeContainer)
            .select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.PanBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.PAN;
                d3.event.stopPropagation();
            });

        d3.select(this.modeContainer)
            .selectAll<Element, {}>(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.RotateBtn.DATA_NAME}'] > *[data-mode]`)
            .on("click", function() {

                if (rotateData == undefined) {
                    throw new InternalError();
                }

                let thisDataMode = this.getAttribute("data-mode");
                rotateData.modes.map(mode => {
                    mode.selected = mode.label == thisDataMode;
                });

                self.mode = HandleMode.ROTATE;
                d3.event.stopPropagation();
            });

        d3.select(this.modeContainer)
            .select(`[data-name='${Names.Handles.SubElements.ButtonsContainer.SubElements.ScaleBtn.DATA_NAME}']`)
            .on("click", function() {
                self.mode = HandleMode.SCALE;
                d3.event.stopPropagation();
            });

        // this.colorsOverlay.draw();
        // this.rotationOverlay.draw();
        // this.scaleOverlay.draw();
        // this.rotationOverlay.onRotation = this.onRotationEventHandlers;
        this.modeChanged(HandleMode.DELETE, HandleMode.PAN);
    }

    public update(): void {
        const self = this;

        switch(this.mode) {
            case HandleMode.COLORS:
                // this.colorsOverlay.radius = this.radius;
                // this.colorsOverlay.update();
                break;

            case HandleMode.ROTATE:
                // this.rotationOverlay.radius = this.radius;
                // this.rotationOverlay.update();
                break;

            case HandleMode.SCALE:
                // this.scaleOverlay.update();
                break;
        }

        // Update the highlight element
        d3.select(this.selectionEl)
            .attr("r", self.radius - (self.defaultWidth/2));
        
        // Draw arcs
        let pieData = d3.pie<IMainOverlayData>()
            .startAngle(toRadians(self.startAngleOffset))
            .endAngle(toRadians(self.startAngleOffset - 360))
            .value(function(d) { return d.angle.asDegrees(); })
            .sortValues(function(a: number, b: number) {
                return a;
            })(this.data);

        d3.select(this.arcsContainer)
            .selectAll("path")
            .data(pieData)
            .attr("d", function(d) {
                let w = self.defaultWidth;

                return d3.arc()({
                    innerRadius: self._radius,
                    outerRadius: self._radius - w,
                    startAngle: d.startAngle,
                    endAngle: d.endAngle
                });
            })
            .transition()
            .attrTween("transform", function(d) {
                let middleAngle = (d.data.middleAngle || Angle.fromDegrees(0));
                let angleIncrement = 1 / middleAngle.asDegrees();

                if (self.collapseButtons) {
                    return function(t) {
                        return "";
                    }
                } else {
                    return function(t) {
                        return "";
                    }
                }
            });

        let buttons = d3.select(this.modeContainer)
            .selectAll<SVGGElement, IMainOverlayData>("g[data-name='handles-button-container'] > g")
            .data(this.buttonsData)
            .attr("transform", function(d) {
                d.buttonTransformData.setTranslate({ x: 0, y: self.radius })
                return d.buttonTransformData.toTransformString();
            });
    }

    public erase(): void {
        // this.colorsOverlay.erase();
        // this.rotationOverlay.erase();
        // this.scaleOverlay.erase();
    }

    //#endregion
}