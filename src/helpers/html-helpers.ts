import { IBBox } from "../services/svg-geometry-service";

/**
 * Calculates the bbox which covers the elements passed in. The bbox will be
 * relative to the pages upper left hand corner.
 * @param elements - A list of elements.
 */
export function getBBox(...elements: HTMLElement[]): IBBox {

    // Check for any elements.
    if (elements.length == 0) {
        throw new Error("No elements were passed in.");
    }

    let firstElBBox = elements[0].getBoundingClientRect();

    let bbox = {
        top: firstElBBox.top,
        bottom: firstElBBox.bottom,
        left: firstElBBox.left,
        right: firstElBBox.right
    };

    for (let i = 1; i < elements.length; i++) {
        let element = elements[i];
        let elBBox = element.getBoundingClientRect();

        // Check the top
        if (elBBox.top < bbox.top) {
            bbox.top = elBBox.top;
        }

        // Check the bottom
        if (elBBox.bottom > bbox.bottom) {
            bbox.bottom = elBBox.bottom;
        }

        // Check the left
        if (elBBox.left < bbox.left) {
            bbox.left = elBBox.left;
        }

        // Check right
        if (elBBox.right > bbox.right) {
            bbox.right = elBBox.right;
        }
    }

    return {
        x: bbox.left,
        y: bbox.top,
        width: bbox.right - bbox.left,
        height: bbox.bottom - bbox.top
    };
}