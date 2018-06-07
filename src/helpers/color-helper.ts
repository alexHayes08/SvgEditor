import * as $ from "jquery";
import * as d3 from "d3";

// function isIccColor(color: string) {
//     let reg = /icc-color(" name (comma-wsp number)+ ")/
    
// }

export function calcContrast(colorA: d3.Color, colorB: d3.Color): number {
    let colorA_hsl = d3.hsl(colorA.toString());
    let colorB_hsl = d3.hsl(colorB.toString());

    return colorA_hsl.l - colorB_hsl.l;
}

export function useBlackAsContrast(color: d3.Color): boolean {
    let color_hsl = d3.hsl(color.toString());
    return color_hsl.opacity > .5 && color_hsl.l > .5;
}

// export function calcContrast (color) {
//     // Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
//     var alpha = this.alpha;

//     if (alpha >= 1) {
//         if (color.alpha < 1) {
//             color = color.overlayOn(this);
//         }

//         var l1 = this.luminance + .05,
//             l2 = color.luminance + .05,
//             ratio = l1/l2;

//         if (l2 > l1) {
//             ratio = 1 / ratio;
//         }

//         ratio = floor(ratio, 2);

//         return {
//             ratio: ratio,
//             error: 0,
//             min: ratio,
//             max: ratio
//         };
//     }

//     // If we’re here, it means we have a semi-transparent background
//     // The text color may or may not be semi-transparent, but that doesn't matter

//     var onBlack = this.overlayOn(_.BLACK),
//         onWhite = this.overlayOn(_.WHITE),
//         contrastOnBlack = onBlack.contrast(color).ratio,
//         contrastOnWhite = onWhite.contrast(color).ratio;

//     var max = Math.max(contrastOnBlack, contrastOnWhite);

//     // This is here for backwards compatibility and not used to calculate
//     // `min`.  Note that there may be other colors with a closer luminance to
//     // `color` if they have a different hue than `this`.
//     var closest = this.rgb.map(function(c, i) {
//         return Math.min(Math.max(0, (color.rgb[i] - c * alpha)/(1-alpha)), 255);
//     });

//     closest = new _(closest);

//     var min = 1;
//     if (onBlack.luminance > color.luminance) {
//         min = contrastOnBlack;
//     }
//     else if (onWhite.luminance < color.luminance) {
//         min = contrastOnWhite;
//     }

//     return {
//         ratio: floor((min + max) / 2, 2),
//         error: floor((max - min) / 2, 2),
//         min: min,
//         max: max,
//         closest: closest,
//         farthest: onWhite == max? _.WHITE : _.BLACK
//     };
// }

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

// /**
//  * Returns the element pointed at by the attribute if it's value is a url(...).
//  * @param attrVal - Should match 'url(#...)'.
//  */
// export function getElementUrlPointsTo(attrVal: string): JQuery<Element> {
//     let reg = /url\((#.*)\)/;
//     let cssQuery = "";
//     let matches = reg.exec(attrVal);

//     if (matches != null) {

//         // Only need to use the first element
//         cssQuery = matches[1];
//     }

//     return $(cssQuery);
// }