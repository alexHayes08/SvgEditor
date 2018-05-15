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

    addCircleEl: $("#addCircle"),

    addTriangleEl: $("#addTriangle"),

    addPathEl: $("#addPath"),

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
        // Aperture.SvgEditorControls.activeEditor.svgCanvas_el.classList.add("active");
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

    Aperture.SvgEditorControls.addCircleEl.on("click", function(e) {
        Aperture.SvgEditors.map(canvas => {

            // Create doc frag
            let frag = document.createDocumentFragment();

            // Create circle
            let circle = document.createElementNS(NS.SVG, "circle");
            $(circle).attr({
                cx: 0,
                cy: 0,
                r: 50,
                fill: colorService.randomColor,
                stroke: colorService.randomColor,
                strokeWidth: 1
            });

            frag.appendChild(circle);

            // Add fragment to the editor
            canvas.editor.add(frag);
        });
    });

    Aperture.SvgEditorControls.addTriangleEl.on("click", function(e) {

        // Create doc frag
        let frag = document.createDocumentFragment();

        // Create circle
        let path = document.createElementNS(NS.SVG, "path");
        $(path).attr({
            d: "M0 100 L100 100 50 0 Z",
            fill: colorService.randomColor,
            stroke: colorService.randomColor,
            strokeWidth: 1
        });

        frag.appendChild(path);

        // Add fragment to the editor
        canvas.editor.add(frag);
    });

    Aperture.SvgEditorControls.addPathEl.on("click", function(e) {

        // Create doc frag
        let frag = document.createDocumentFragment();

        // Create path
        let path = document.createElementNS(NS.SVG, "path");
        $(path).attr({
            d: "M446.348,0h37.391l1.823,2.128L487.404,0h1.825c4.258,0,9.527,50.574,15.81,151.73v18.852l1.824,8.504  h-1.824l1.824,2.137v25.209l1.844,27.364l-1.844,16.714c0,19.267,3.558,34.054,10.65,44.412c-7.093,9.102-10.65,16.824-10.65,23.107  c0,8.291,20.806,34.236,62.359,77.838c17.837,11.148,29.079,19.568,33.722,25.244l1.843,6.375l-5.474,31.623v14.594  c0,10.135-2.928,15.811-8.807,17.027l-1.825-2.139l-7.003,2.139c-168.464,9.73-252.676,17.432-252.676,23.109  c-20.05,4.273-53.209,6.375-99.435,6.375h-16.115l-8.835,1.842v-1.842l-5.474,1.842L85.439,534.809H67.491  c-36.682-2.82-55.043-9.822-55.043-20.953C12.245,506.561,8.108,491.762,0,469.465c1.825,0,7.786-10.561,17.92-31.621  c20.684-10.357,43.176-30.627,67.5-60.83c8.928-16.824,15.396-25.227,19.45-25.227l-5.15-141.089l-1.825-6.376h1.825l-1.825-2.136  v-2.129L96.08,98.798l-1.833-8.209l1.833-2.129l-1.833-10.622l5.474-41.97l-1.806-21.283l8.809-3.943l31.925,6.071h24.933L446.348,0 z",
            fill: "#231f20",
            stroke: "black"
        });

        frag.appendChild(path);

        // Add fragment to editor
        canvas.editor.add(frag);
    })

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
                // editor.svgCanvas_el.classList.add("active");
            } else {
                // editor.svgCanvas_el.classList.remove("active");
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