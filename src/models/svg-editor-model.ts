/**
 * Used for managing the underEditor, editor, and overEditor group elements
 * on a SvgCanvas object.
 */
export class SvgEditor {

    // [Fields]

    private underEditor_el: SVGGElement;
    private editor_el: SVGGElement;
    private overEditor_el: SVGGElement;

    // [End Fields]

    // [Ctor]

    public constructor(underEditor: SVGGElement,
        editor: SVGGElement,
        overEditor: SVGGElement)
    {
        this.underEditor_el = underEditor;
        this.editor_el = editor;
        this.overEditor_el = editor;
    }

    // [End Ctor]

    // [Properties]

    // [End Properties]

    // [Functions]

    private cleanSvgString(svgString: string): string {

        // IE9 also adds extra namespaced attributes for some reason, this
        // removes the bad attributes.
        let reg1 = /([^\s]+:\w+="")/g; // Removes emtpy namespaced attr (ns1:attr="")
        let reg2 = /([^\s]+:[^\s]+:[^\s]+="[^"']*")/g; // Removes multiple namespace attr (ns1:xsi:attrName="attrval")

        return svgString
            .replace(reg1, "")
            .replace(reg2, "");
    }

    /**
     * Exports the svg as a string.
     */
    public export(): string
    {
        let result = "";
        let ownerSvg = this.editor_el.ownerSVGElement;

        // Since IE9 doesn't support outerHTML for svg elements, have to use
        // the innerHTML of the svg parents element.
        if (ownerSvg != null) {
            result = this.cleanSvgString($(ownerSvg).html());
        }

        return result;
    }

    /**
     * Replaces or appends a stringified svg to the editor.
     * @param svgString 
     */
    public import(svgString: string, 
        replaceExistingContent: boolean = true): void 
    {
        let $editor = $(this.editor_el);
        let cleanedStr = this.cleanSvgString(svgString);

        if (replaceExistingContent) {
            $editor.empty();
        }

        let parser = new DOMParser();
        parser.parseFromString(cleanedStr, "image/svg+xml");

        if ($xml.nodeName == "svg") {

           let $xml = $.parseXML(svgString);
        }
    }

    // [End Functions]
}