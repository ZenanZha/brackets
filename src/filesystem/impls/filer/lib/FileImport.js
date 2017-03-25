
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define*/

define(function (require, exports, module) {
    "use strict";

    var LegacyFileImport     = require("filesystem/impls/filer/lib/LegacyFileImport"),
        WebKitFileImport     = require("filesystem/impls/filer/lib/WebKitFileImport"),
        FileSystemCache      = require("filesystem/impls/filer/FileSystemCache"),
        BrambleStartupState  = brackets.getModule("bramble/StartupState");

    /**
     * XXXBramble: the Drag and Drop and File APIs are a mess of incompatible
     * standards and implementations.  This tries to deal with the fact that some
     * browsers allow you to drag-and-drop folders, and some don't.  All
     * browsers we support will do file drag-and-drop, so we want to make sure
     * we always allow that.
     *
     * Currently, dragging folders works in Chrome (13), Edge, Firefox (50)
     * but not in IE, Opera, or Safari.
     *
     * See:
     *  - https://html.spec.whatwg.org/#the-datatransferitem-interface
     *  - https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
     *  - https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItemList
     *  - https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem
     *  - https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry
     */
    var _create = (function() {
        if(window.DataTransferItem                            &&
           window.DataTransferItem.prototype.webkitGetAsEntry &&
           window.DataTransferItemList) {
               return WebKitFileImport.create;
        }
        return LegacyFileImport.create;
    }());

    // 3MB size limit for imported files. If you change this, also change the
    // error message we generate in rejectImport() below!
    var byteLimit = 3145728;

    // Support passing a DataTransfer object, or a FileList
    exports.import = function(source, parentPath, callback) {
        if(!(source instanceof FileList || source instanceof DataTransfer)) {
            callback(new Error("[Bramble] expected DataTransfer or FileList to FileImport.import()"));
            return;
        }

        // If we are given a sub-dir within the project, use that.  Otherwise use project root.
        parentPath = parentPath || BrambleStartupState.project("root");

        var strategy = _create(byteLimit);
        return strategy.import(source, parentPath, function(err) {
            FileSystemCache.refresh(callback);
        });
    };
});
