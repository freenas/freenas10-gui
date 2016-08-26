/**
 * @module ui/debug.reel
 */
var Component = require("montage/ui/component").Component,
    Model = require("core/model/model").Model;

/**
 * @class Debug
 * @extends Component
 */
exports.Debug = Component.specialize(/** @lends Debug# */ {
    consoleData: {
        value: null
    },

    enterDocument: {
        value: function(isFirstTime) {
            var self = this;
            if (isFirstTime) {
                this.isLoading = true;
                this.application.systemAdvancedService.getSerialConsoleData().then(function(consoleData) {
                    self.object = consoleData;
                    self._snapshotDataObjectsIfNecessary();
                });
            }
        }
    },

    save: {
        value: function() {
            return this.application.systemAdvancedService.saveAdvanceData(this.object);
        }
    },

    handleDownloadDebugAction: {
        value: function() {
            var self = this;
            this.application.systemAdvancedService.getDebugCollectAddress().then(function(debugObject) {
                var downloadLink = document.createElement("a");
                    downloadLink.href = debugObject[1][0];
                    downloadLink.download = "debug.dat";
                    downloadLink.click();
            });
        }
    },

    revert: {
        value: function() {
            this.object.debugkernel = this._object.debugkernel;
            this.object.uploadcrash = this._object.uploadcrash;
        }
    },

    _snapshotDataObjectsIfNecessary: {
        value: function() {
            if (!this._object) {
                this._object = this.application.dataService.clone(this.object);
            }
        }
    }
});
