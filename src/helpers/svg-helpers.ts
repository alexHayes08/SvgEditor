/**
 * https://www.w3.org/TR/SVG2/struct.html#TermGraphicsElement
 */
export const GraphicsElements = [
    "audio", 
    "canvas", 
    "circle", 
    "ellipse",
    "foreignObject", 
    "iframe", 
    "image", 
    "line", 
    "mesh", 
    "path", 
    "polygon", 
    "polyline", 
    "rect", 
    "text", 
    "textPath", 
    "tspan",
    "video"
];

export function isSvgElement(element: any): element is SVGElement {
    return element!= undefined && element.ownerSVGElement;
}

export function isSvgGraphicsElement(element: any): element is SVGGraphicsElement {
    return element.transform != undefined;
}

export function getAllSubElementWhichInheritColors(parentElement: SVGElement) {

    // Get all child nodes
    let sub_elements: SVGElement[] = [];

    // First check if the parent element has a fill/stroke

    for (let i = 0; i < parentElement.childElementCount; i++) {
        let element = sub_elements[i];
    }

    return sub_elements;
}

/**
 * Will attempt to locate the element specified in the id.
 * @param element 
 * @param attr - Will check both the attr and xlink:attr.
 */
export function getElementAttrPointsTo(element: JQuery<HTMLElement>, attr: string = "href"): JQuery<HTMLElement>|null {
    let result: JQuery<HTMLElement>|null = null;

    // Checks for a url() in the attribute
    let regex = /url\((#.*)\)/;

    // Need to check href and xlink:href (not all clipart has been updated
    // to use href yet)
    let matches = regex.exec(element.attr(attr) 
        || element.attr(`xlink:${attr}`) 
        || "");

    if (matches != null && matches.length >= 2) {
        let otherId = matches[1];
        let parentSvg = element.closest("svg").first();
        result = parentSvg.find(otherId);
    }

    return result;
}
