import { Aperture, EVT_NAMES } from "./aperture.main";
import { NS } from "../helpers/namespaces-helper";
import { SvgColorService } from "../services/svg-color-service";
import { SvgEditors } from "../index";

export { Aperture } from "./aperture.main";

// [Private]

let colorService = new SvgColorService();

function lookupModeByNumber(num) {
    var result = null;

    for (var mode in Apreture.SvgEditorControls.MODES) {
        var modeName = mode;
        if (MODES[mode] == num) {
            result = mode;
        }
    }

    return result;
}

// [End Private]

// Define svg editors module
Aperture.register("SvgEditors", SvgEditors);

// Define Aperture.SvgEditorControls module
Aperture.register("SvgEditorControls", {
    
    /**
     * All elements will be emitted from here.
     */
    editorEl: $("#editor"),

    /**
     * Map of all events
     */
    EVT_NAMES: Object.freeze({

        /**
         * Emitted on mode changed (IE: from Select to Zoom).
         */
        MODE_CHANGED: "mode_changed",

        /**
         * Emitted on controls loading, this is emitted for when the editor
         * starts and stops loading something. The data property of the event
         * should have a property isLoading which is a boolean that should determine
         */
        LOADING: "loading"
    }),

    /**
     * This will contain a reference to the 'active' svg element. Inactive
     * editors will be hidden from view.
     */
    activeEditor: null,

    addRectEl: $("#addSquare"),

    changeCanvasEl: $("#changeEditor"),

    loading: function(value) {
        if (value != null) {
            var command = value == true ? "add" : "remove";
            var classList = Aperture
                .SvgEditorControls
                .editorEl[0]
                .classList;
            var emit = classList.contains("loading-on");
            classList[command]("loading-on");
            
            if (emit) {
                Aperture
                    .SvgEditorControls
                    .editorEl
                    .trigger(Aperture.SvgEditorControls.EVT_NAMES.LOADING,
                        { isLoading: Boolean(value) });
            }
        } else {
            return Aperture
                .SvgEditorControls
                .editorEl[0]
                .classList
                .contains("loading");
        }
    },

    maskSelectorEl: $("#changeCurrentEditorMask"),

    modeSelectEl: $("#changeMode"),

    mode: function(value) {
        if (value) {

            // Check that value is in range
            if (lookupModeByNumber(value)) {

                // Check that the current mode is different
                if (Aperture.SvgEditorControls.modeSelectEl.val() != value) {
                    Aperture.SvgEditorControls.modeSelectEl.val(value);
                    Aperture.SvgEditorControls.editorEl.trigger(
                        Aperture.SvgEditorControls.EVT_NAMES.MODE_CHANGED,
                        { mode: value });
                }
            } else {
                throw new Error(`Value '${value}' wasn't in range.`);
            }
        } else {
            return Aperture.SvgEditorControls.val();
        }
    },

    /**
     * Enum of modes the editor can be in.
     */
    MODES: Object.freeze({
        SELECT: 1,
        ZOOM: 2,
        DRAW: 3
    })
});

// Wait for the SvgEditors to be resolved
Aperture.resolve(["SvgEditors"]).then(() => {

    // Set the first SvgCanvas to be the active one
    if (Aperture.SvgEditors.length > 0) {
        Aperture.SvgEditorControls.activeEditor = Aperture.SvgEditors[0];
        Aperture.SvgEditorControls.activeEditor.svgCanvas_el.classList.add("active");
    }
        
    // Init controls (add evt listeners, populate options, etc...)
    Aperture.SvgEditorControls.addRectEl.on("click", function(e) {
        Aperture.SvgEditors.map(canvas => {
            
            // Create doc fragment
            let frag = document.createDocumentFragment();

            // Create rectangle
            let rect = document.createElementNS(NS.SVG, "rect");
            $(rect).attr({
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                fill: colorService.randomColor,
                stroke: colorService.randomColor,
                strokeWidth: 1
            });
            
            // Compose elements in frag
            frag.appendChild(rect);

            // Add the fragment to the editor
            canvas.editor.add(frag);
        });
    });

    Aperture.SvgEditorControls.modeSelectEl.on("change", function() {
        console.log("TODO");
    });

    // var canvas = Aperture.SvgEditors[0].canvases[0];
    // Aperture.SvgEditors[0].svgCanvasService.magnifyCanvas(canvas, {
    //     minX: 10, 
    //     minY: 10,
    //     width: 480,
    //     height: 480
    // }, 500);

    // Setup what happens on mask select el change evt
    Aperture.SvgEditorControls.maskSelectorEl.on("change", function(e) {        
        var val = Number(e.target.value) == -1 ? null : e.target.value;
        for (var editor of Aperture.SvgEditors) {
            editor.switchMaskTo(val);
        }
    });
    
    // Populate mask select el
    var editableAreaMasks = $(".editableAreaRect");
    for (var areaMask of editableAreaMasks) {
        var optionEl = document.createElement("option");
        optionEl.textContent = areaMask.id;
        Aperture.SvgEditorControls.maskSelectorEl.append(optionEl);
    }

    // Setup what happens on canvas select el change evt
    Aperture.SvgEditorControls.changeCanvasEl.on("change", function(e) {
        var val = e.target.value;
        for (var editor of Aperture.SvgEditors) {
            if (editor.svgCanvas_el.id == val) {
                Aperture.SvgEditorControls.activeEditor = editor;
                editor.svgCanvas_el.classList.add("active");
            } else {
                editor.svgCanvas_el.classList.remove("active");
            }
        }
    });

    // Populate canvas select el
    for (var canvas of Aperture.SvgEditors) {
        var optionEl = document.createElement("option");
        optionEl.textContent = canvas.svgCanvas_el.id;
        Aperture.SvgEditorControls.changeCanvasEl.append(optionEl);
    }

    // Finished loading
    Aperture.SvgEditorControls.loading(false);
}).catch(e => {
    console.error(e);
    Aperture.SvgEditorControls.loading(false);
});

// Testing event listeners
$("#editor").on(
    Aperture.SvgEditorControls.EVT_NAMES.MODE_CHANGED, 
    function(e) {
        console.log(e)
    });

// $("aperture-svg-editor").on("")