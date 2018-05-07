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
    }
};