import * as $ from "jquery";

import { ApertureSvgEditor } from "./models/aperture-svg-editor";
import { SvgCanvas } from "./models/svg-canvas-model";

// This is only temporary, should be moved elsewhere...
import "./ui/scss/ui.styles.scss";

// export const SvgEditors: ApertureSvgEditor[] = [];
// let editorEls = $("aperture-svg-editor").each(function() {
//     SvgEditors.push(new ApertureSvgEditor(this));
// });

export const SvgEditors: SvgCanvas[] = [];
let $parentEl = $("#editorCavasContainer");
let editorEls = $("aperture-svg-editor").each(function() {
    SvgEditors.push(new SvgCanvas(500, 
        500, 
        { 
            minX: 0, 
            minY: 0,  
            width: 500,
            height: 500
        }, 
        $parentEl[0]));
});
