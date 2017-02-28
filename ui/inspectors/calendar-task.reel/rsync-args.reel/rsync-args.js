var AbstractInspector = require("ui/abstract/abstract-inspector").AbstractInspector,
    RsyncCopyRsyncdirection = require('core/model/enumerations/rsync-copy-rsyncdirection').RsyncCopyRsyncdirection,
    RsyncCopyRsyncmode = require('core/model/enumerations/rsync-copy-rsyncmode').RsyncCopyRsyncmode;



exports.RsyncArgs = AbstractInspector.specialize({
    _inspectorTemplateDidLoad: {
        value: function() {
            var self = this;

            this.rsyncDirections = this.cleanupEnumeration(RsyncCopyRsyncdirection).map(function(x) {
                return {
                    label: x.toLowerCase().toCapitalized(),
                    value: x
                };
            });

            this.rsyncModes = this.cleanupEnumeration(RsyncCopyRsyncmode).map(function(x) {
                return {
                    label: x.toLowerCase().toCapitalized(),
                    value: x
                };
            });

            this._sectionService.listUsers().then(function(users) {
                self.users = users;
            });
        }
    },

    enterDocument: {
        value: function(isFirstTime) {
            this.super(isFirstTime);
            if (!this.object || this.object.length !== 1) {
                this.object = [{rsync_properties: {}}];
                this.object.__type = this.type;
            }
            this._extra = this.object[0].rsync_properties.extra;
        }
    },

    save: {
        value: function() {
            this.object[0].rsync_properties.extra = this._extra;
            return this.object;
        }
    }
});
