import * as $ from "jquery";

// import { ApertureSvgEditor } from "./models/aperture-svg-editor";
import { SvgCanvas } from "./models/svg-canvas-model";
import { SvgHandles } from "./models/svg-handles";

// This is only temporary, should be moved elsewhere...
import "./ui/scss/ui.styles.scss";

// export const SvgEditors: ApertureSvgEditor[] = [];
// let editorEls = $("aperture-svg-editor").each(function() {
//     SvgEditors.push(new ApertureSvgEditor(this));
// });

export const SvgEditors: SvgCanvas[] = [];
let $parentEl = $("#editorCavasContainer");
$("aperture-svg-editor").each(function() {
    let editor = new SvgCanvas(500, 
        500, 
        { 
            minX: 0, 
            minY: 0,  
            width: 500,
            height: 500
        }, 
        $parentEl[0]);
    let handles = new SvgHandles(editor);
    editor.handles = handles;
    SvgEditors.push(editor);
});
