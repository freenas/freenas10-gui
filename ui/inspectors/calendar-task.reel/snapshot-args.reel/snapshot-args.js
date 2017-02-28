/**
 * @module ui/inspectors/calendar-task.reel/snapshot-args.reel
 */
var Component = require("montage/ui/component").Component,
    Model = require("core/model/model").Model;

/**
 * @class SnapshotArgs
 * @extends Component
 */
exports.SnapshotArgs = Component.specialize(/** @lends SnapshotArgs# */ {

    enterDocument: {
        value: function() {
            this._resetObjectIfNeeded();
            this._loadArgs();

            if (this.datasetTreeController) {
                this.datasetTreeController.open();
            }
        }
    },


    _dataset:{
        value: null
    },

    dataset: {
        set: function (dataset) {
            if (dataset !== this._dataset) {
                //WORKAROUND: #21300
                //the treeview needs to be refactored.
                this._dataset = dataset.replace(/^\/mnt\/?/, '');
            }
        },
        get: function () {
            return this._dataset;
        }
    },

    _resetObjectIfNeeded: {
        value: function() {
            if (this.object.length != 5) {
                for (var i = 0, length = this.constructor.DEFAULT_VALUES.length; i < length; i++) {
                    this.object[i] = this.constructor.DEFAULT_VALUES[i];
                }
                while (this.object.length > 5) {
                    this.object.pop();
                }
            }
        }
    },

    _loadArgs: {
        value: function() {
            for (var i = 0; i < this.constructor.ARGUMENTS_LIST.length; i++) {
                this[this.constructor.ARGUMENTS_LIST[i]] = this.object[i];
            }
        }
    },

    save: {
        value: function() {
            for (var i = 0; i < this.constructor.ARGUMENTS_LIST.length; i++) {
                this.object[i] = this[this.constructor.ARGUMENTS_LIST[i]];
            }
            return this.object;
        }
    }

}, {
    ARGUMENTS_LIST: {
        value: ['dataset', 'recursive', 'lifetime', 'prefix', 'replicable']
    },

    DEFAULT_VALUES: {
        value: ['', false, 2592000, 'snap', false]
    }
});
