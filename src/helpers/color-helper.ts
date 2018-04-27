import * as $ from "jquery";

import { getAllGroups } from "./regex-helper";

function isIccColor(color: string) {
    let reg = /icc-color(" name (comma-wsp number)+ ")/
    
}

/**
 * NOTE: This will most likely not be used and just deleted. I got the regex
 * from https://www.w3.org/TR/SVG/types.html#DataTypeICCColor
 * @param colorName 
 */
export function isValidColorName(colorName: string): boolean {
    let result = false;

    if (colorName != "") {
        let reg_name = /[^,()#x20#x9#xD#xA]/g;
        result = reg_name.test(colorName);
    }

    return result;
}

/**
 * Checks that the attribute isn't null, empty, or 'inherit', or another
 * value that uses doesn't translate directly to a color. This doesn't validate
 * the attr if it is a color, just helps identify when it's definantly not a
 * color.
 * @param attr
 */
export function isAssignedColor(attr?: string): boolean {
    let result = false;
    
    // Check for null/empty
    if (attr != null && attr != "") {

        // Check for the following
        const ignore = [
            "none",
            "currentColor",
            "inherit"
            // "url" // Not sure if I should ignore url's... probably?
        ];

        if (ignore.indexOf(attr) == -1) {
            
            // It may be a valid color
            result = true;
        }
    }

    return result;
}

export function getGradient(attrVal: string): any {

    let blah = $(`#${attrVal}`);
}

/**
 * Returns the element pointed at by the attribute if it's value is a url(...).
 * @param attrVal - Should match 'url(#...)'.
 */
export function getElementUrlPointsTo(attrVal: string): JQuery<Element> {
    let reg = /url\((#.*)\)/;
    let cssQuery = "";
    let matches = reg.exec(attrVal);

    if (matches != null) {

        // Only need to use the first element
        cssQuery = matches[1];
    }

    return $(cssQuery);
}