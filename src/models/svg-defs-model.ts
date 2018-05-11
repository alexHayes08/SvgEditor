const uniqid = require("uniqid");

import * as d3 from "d3";
import * as $ from "jquery";

import { Names } from "./names";
import { isSvgElement } from "../helpers/svg-helpers";

export class SvgDefs {
    //#region Fields

    private readonly defsSelection: d3.Selection<SVGDefsElement, {}, null, undefined>;

    //#endregion

    //#region Ctor

    public constructor(parent: SVGSVGElement) {
        
        // Create the defs element
        this.defsSelection = d3.select(parent)
            .append<SVGDefsElement>("defs")
            .attr("id", uniqid())
            .attr("data-name", Names.SvgDefs.DATA_NAME)
            .attr("class", Names.SvgDefs.CLASS);

        // Create section for storing symbols
        let symbolsContainer = this.defsSelection
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", Names.SvgDefs.SubElements.SymbolContainer.DATA_NAME)
            .attr("class", Names.SvgDefs.SubElements.SymbolContainer.DATA_NAME);

        // Create section for storing elments not meant to be seen
        let elementCacheContainer = this.defsSelection
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", Names.SvgDefs.SubElements.CachedElementsContainer.DATA_NAME);

        // Create section for storing definitions used solely by the editor
        let editorOnlyContainer = this.defsSelection
            .append<SVGGElement>("g")
            .attr("id", uniqid())
            .attr("data-name", Names.SvgDefs.SubElements.EditorOnlyDefsContainer.DATA_NAME);
    }

    //#endregion

    //#region Properties

    get editorOnlyContainerName() {
        return this.defsSelection
            .select(`*[data-name='${Names.SvgDefs.SubElements.EditorOnlyDefsContainer.DATA_NAME}']`)
            .attr("id");
    }

    get elementCacheContainerName() {
        return this.defsSelection
            .select(`*[data-name='${Names.SvgDefs.SubElements.CachedElementsContainer.DATA_NAME}']`)
            .attr("id");
    }

    get symbolsContainerName() {
        return this.defsSelection
            .select(`*[data-name='${Names.SvgDefs.SubElements.SymbolContainer.DATA_NAME}']`)
            .attr("id");
    }

    //#endregion

    //#region Functions

    /**
     * 
     * @param section Must be a unique id on the page.
     * @throws - If the section name wasn't unique
     */
    public createSection(section: string): void {
        
        // Check if the section already exists
        if (document.getElementById(section) != null) {
            throw new Error(`The argument 'section' (${section} was not a unique id.`);
        }
        
        this.defsSelection
            .append(`g#${section}`);
    }

    public removeSection(section: string): void {
        this.defsSelection
            .select(`g#${section}`)
            .remove();
    }

    /**
     * Moves an element into the section.
     * @param id - The id of an element to move to the section
     * @param section - The name/id of the section
     */
    public pushToSection(id: string, section: string): void {
        d3.select(`#${section}`).append(function() {
            return d3.select(`#${id}`).remove().node();
        });
    }

    /**
     * Removes an element from a section and returns it.
     * @param id - The id of the elemnt to retrieve.
     * @param section - The name/id of the section.
     */
    pullFromSection(id: string, section: string): d3.BaseType {
        return d3.select(`#${id}`).remove().node();
    }

    //#endregion
}