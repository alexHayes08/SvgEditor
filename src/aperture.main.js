// import * as $ from "jquery"; -- This is behaving funny...

// [Private]

const $document = $(document);

// [End Private]

export const EVT_NAMES = Object.freeze({
    LOADED_MODULE: "loaded_prop",
    LOADED_MODULE_PREFIX: "loaded_prop_"
});

export function loadedModule(moduleName) {
    $(document).trigger(EVT_NAMES.LOADED_MODULE_PREFIX + moduleName, {
        module: moduleName
    });
}

// Create proxy that returns Promises as new objects are added
// export const Aperture = new ProxyPolyFill({
export const Aperture = {
    
    /**
     * @function
     * @param {string[]} names - The name(s) of the module to wait for. None of
     * the entries can have spaces in them.
     * @returns {Promise<null>}
     */
    resolve: function(names, timeoutMS) {
        return new Promise(function(resolve, reject) {
            var foundAllModules = true;
            $.each(names, function(index, value) {
                if (Aperture[value] == null) {
                    foundAllModules = false;
                    return;
                }
            });
            
            if (foundAllModules) {
                resolve();
            }

            var resolvedModules = {};
            var evtNames = "";
            $.each(names, function(index, value) {
                var newName = EVT_NAMES.LOADED_MODULE_PREFIX + value.replace(" ", "_");
                resolvedModules[newName] = false;
                evtNames += " " + newName;
            });
            evtNames = $.trim(evtNames);
            
            /**
             * Checks to see if all needed modules were loaded before
             * resolving. This will also remove the extra event listeners as
             * each module is resolved.
             * @param {*} e 
             */
            var moduleResolvedEvtHandler = function (e) {
                if (Aperture[e.type] != null) {
                    resolvedModules[e.type] = Aperture[e.type];
                    $(document).off(e.type, moduleResolvedEvtHandler);
                }

                var resolvedAllModules = true;
                $.each(resolvedModules, function(key, value) {
                    if (value == false) {
                        resolvedAllModules = false;
                        return;
                    }
                });

                if (resolvedAllModules) {
                    resolve();

                    // Clear the timeout
                    clearTimeout(timeout);
                }
            }
    
            // Check if the timoutMS is valid
            if (timeoutMS == null || !Number.isNaN(timeoutMS)) {
    
                // Default wait is ten seconds for object to load.
                timeoutMS = 10 * 1000;
            }
            var timeout = setTimeout(function() {
                
                // Check to see if everything was already resolved
                var alreadyResolvedAllModules = true;
                $.each(resolvedModules, function(key, value) {
                    if (value == false) {
                        alreadyResolvedAllModules = false;
                        return;
                    }
                });

                if (alreadyResolvedAllModules) {

                    // Don't need to bother with removing evt handlers, they
                    // should already have been removed.
                    return;
                }

                // Modules weren't all resolved, at least in the evt handler
                // One last final check (maybe the evt handler was bypassed?)
                alreadyResolvedAllModules = true;
                $.each(names, function(index, value) {
                    
                    // Check if not resolved
                    if (Aperture[value] == null) {
                        
                        // Break out
                        return;
                    }
                });

                if (alreadyResolvedAllModules) {
                    resolve();
                } else {
                    reject(`The module '${name}' wasn't loaded.`);
                }

                // Remove all event listeners still active
                $.each(resolvedModules, function(key, value) {
                    if (value == false) {
                        $document.off(key, moduleResolvedEvtHandler);
                    }
                });
            }, timeoutMS)
            
            $(document).on(evtNames, moduleResolvedEvtHandler);
        });
    },

    register: function (name, module) {
        Aperture[name] = module;
        $(document).trigger(EVT_NAMES.LOADED_MODULE_PREFIX + name);
        console.log(name);
        return true;
    }
}
