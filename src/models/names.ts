/**
 * This should contain ALL class names, data-* attribute names and values for
 * all models in SvgEditor project.
 */
export const Names = {
    SvgCanvas: {
        DATA_NAME: "svg-canvas-editor",
        CLASS: "svg-canvas-editor",
        Events: {
            ON_VIEWBOX_CHANGE_EVT_NAME: "canvas-viewbox-change",
            ON_WIDTH_CHANGE_EVT_NAME: "canvas-width-change",
            ON_HEIGHT_CHANGE_EVT_NAME: "canvas-height-change"
        }
    },
    SvgDefs: {
        DATA_NAME: "defs-container",
        CLASS: "defs-container",
        Events: {
            ON_DEFS_CHANGED_EVT_NAME: "defs-changed"
        },
        SubElements: {
            SymbolContainer: {
                DATA_NAME: "symbols-container"
            },
            CachedElementsContainer: {
                DATA_NAME: "elements-cache"
            },
            EditorOnlyDefsContainer: {
                DATA_NAME: "editor-only-defs"
            }
        }
    },
    SvgEditor: {
        Editor: {
            DATA_NAME: "editor-container"
        },
        OverEditor: {
            DATA_NAME: "over-editor-container"
        },
        UnderEditor: {
            DATA_NAME: "under-editor-container"
        }
    },
    Handles: {
        DATA_NAME: "handles-area",
        BTN_HANDLE_CLASS: "btn-handle",
        SubElements: {
            HightlightRect: {
                DATA_NAME: "highlight-area"
            },
            RotationHelpersContainer: {
                DATA_NAME: "rotation-helpers-container",
                SubElements: {
                    DialLine: {
                        DATA_NAME: "dial-line"
                    },
                    DashedOuterCircle: {
                        DATA_NAME: "dashed-outer-circle"
                    },
                    PivotPoint: {
                        DATA_NAME: "pivot-point"
                    },
                    DialPivot: {
                        DATA_NAME: "dial-pivot-point"
                    }
                }
            }
        }
    }
};