const uniqid = require("uniqid");

import * as d3 from "d3";
import * as $ from "jquery";

import { Names } from "./names";
import { isSvgElement } from "../helpers/svg-helpers";
import { InternalError } from "./errors";

export interface ISvgDefs {
    //#region Functions
    
    /**
     * Creates a new section.
     * @param sectionName
     * @returns - The created <g> element.
     */
    createSection(sectionName: string): SVGGElement;

    /**
     * Moves an element to the section.
     * @param element - The element being relocated. Will have its 'data-name'
     * attribute set to it's id.
     * @param sectionName - Name of the section to move the element to.
     */
   pushToSection(element: Element, sectionName: string): Element;

   /**
    * Removes an element from a section.
    * @param dataId - The data-id of the element.
    * @param sectionName - Name of the section.
    */
   pullFromSection(dataId: string, sectionName: string): Element;

    /**
     * Deletes a section and all elements in it.
     * @param sectionName 
     */
    removeSection(sectionName: string): void;

    /**
     * Retrieves all elements in a section.
     * @param sectionName - The name of the section.
     */
    getContentsOfSection(sectionName: string): HTMLElement[];

    /**
     * Returns the section <g> element
     * @param sectionName - Name of the seciton
     */
    getSectionElement(sectionName: string): SVGGElement;

    /**
     * Retrieves all sections.
     */
    getAllSections(): SVGGElement[];

    getUrlOfSectionItem(dataId: string, sectionName: string): string;
    //#endregion
}

export class SvgDefsV2 implements ISvgDefs {
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
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    private sectionExists(sectionName: string): boolean {
        
        // Check if a section by that name already exists
        return this.defsSelection.select(`[data-section-name='${sectionName}']`)
            .node() != null;
    }

    createSection(sectionName: string): SVGGElement {

        // Check if a section by that name already exists
        if (this.sectionExists(sectionName)) {
            throw new Error("A section by that name already exists.");
        }

        // Create section
        let section = this.defsSelection
            .append<SVGGElement>("g")
            .attr("id", () => uniqid())
            .attr("data-section-name", sectionName);

        let sectionNode = section.node();

        if (sectionNode == undefined) {
            throw new Error("Failed to create the section.");
        }

        return sectionNode;
    }

    pushToSection(element: Element, sectionName: string): Element {
        
        // Check that the section exists
        if (!this.sectionExists(sectionName)) {
            throw new Error("No such section exists.");
        }

        let node: Element = element;
        this.defsSelection
            .select(`g[data-section-name='${sectionName}']`)
            .append(function() {
                let el = d3.select(element).remove();

                // If the element has no id create one for it
                if (el.attr("id") == undefined) {
                    el.attr("id", () => uniqid());
                }

                // Store old id in data-id
                el.attr("data-id", el.attr("id"));

                // Assign new unique id
                el.attr("id", () => uniqid());

                let _node = el.node();
                if (_node == null) {
                    throw new Error("Internal error occurred.");
                }
                node = _node;
                return node;
            });

        return node;
    }

    pullFromSection(dataId: string, sectionName: string): Element {
        
        // Check if section exists
        if (!this.sectionExists(sectionName)) {
            throw new Error(`Failed to find section named ${sectionName}.`);
        }

        let el = this.defsSelection
            .select<Element>(`g[data-section-name='${sectionName}'] *[data-id='${dataId}']`)
            .remove();

        // Reassign old id
        el.attr("id", el.attr("data-id"));

        // Remove the data-id attribute
        el.attr("data-id", null);

        let node = el.node();
        if (node == undefined) {
            throw new Error("Internal error occurred.");
        }

        return node;
    }

    removeSection(sectionName: string): void {

        // Check if section exists
        if (!this.sectionExists(sectionName)) {
            throw new Error(`Failed to find section with name ${sectionName}`);
        }

        this.defsSelection
            .select(`g[data-section-name='${sectionName}']`)
            .remove();
    }

    getContentsOfSection(sectionName: string): HTMLElement[] {

        // Check if section exists
        if (!this.sectionExists(sectionName)) {
            throw new Error(`Failed to find section with name ${sectionName}`);
        }

        let elements: HTMLElement[] = [];
        let sectionNode = this.defsSelection
            .select<SVGGElement>(`g[data-section-name='${sectionName}']`)
            .node();

        if (sectionNode == undefined) {
            throw new Error("Internal error occurred.");
        }

        for (let i = 0; i < sectionNode.childElementCount; i++) {
            elements.push(<any>sectionNode.children.item(i));
        }

        return elements;
    }

    getSectionElement(sectionName: string): SVGGElement {

        // Check if section exists
        if (!this.sectionExists(sectionName)) {
            throw new Error(`Failed to find section with the name "${sectionName}".`);
        }

        let sectionEl = this.defsSelection
            .select<SVGGElement>(`g[data-section-name='${sectionName}']`)
            .node();

        if (sectionEl == undefined) {
            throw new InternalError();
        }

        return sectionEl;
    }

    getAllSections(): SVGGElement[] {
        let sections: SVGGElement[] = [];
        let nodes = this.defsSelection
            .selectAll("g")
            .nodes();

        for (let node of nodes) {
            sections.push(<any>node);
        }

        return sections;
    }

    getUrlOfSectionItem(dataId: string, sectionName: string): string {

        // Check if section exists
        if (!this.sectionExists(sectionName)) {
            throw new Error(`Failed to find any section with the name '${sectionName}'.`);
        }

        let node = this.defsSelection
            .select(`g[data-section-name='${sectionName}']`)
            .select<Element>(`*[data-id='${dataId}']`)
            .node();

        if (node == undefined) {
            throw new Error(`Failed to find item with data-id of '${dataId}'.`);
        }

        return `url(#${node.id})`
    }

    //#endregion
}

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
            .append("g")
            .attr("id", section);
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