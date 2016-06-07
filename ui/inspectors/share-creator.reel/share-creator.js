var Component = require("montage/ui/component").Component,
    Model = require("core/model/model").Model;

/**
 * @class ShareCreator
 * @extends Component
 */
exports.ShareCreator = Component.specialize({
    newSmbShare: {
        value: null
    },

    newNfsShare: {
        value: null
    },

    newAfpShare: {
        value: null
    },

    _createNewShare: {
        value: function (shareType, propertiesModel) {
            var self = this,
                newShare;
            return this.application.dataService.getNewInstanceForType(Model.Share).then(function(share) {
                newShare = share;
                newShare._isNewObject = true;
                newShare.type = shareType;
                newShare.enabled = true;
                newShare.description = '';
                newShare.volume = self._getCurrentVolume();
                return self.application.dataService.getNewInstanceForType(propertiesModel);
            }).then(function(properties) {
                newShare.properties = properties;
                newShare.properties.type = 'share-' + shareType;
                return self.application.dataService.getNewInstanceForType(Model.Permissions);
            }).then(function(permissions) {
                newShare.permissions = permissions;
                return newShare;
            });
        }
    },

    _getCurrentVolume: {
        value: function() {
            var currentSelection = this._selectionService.getCurrentSelection();
            for (var i = this.context.columnIndex - 1; i >= 0; i--) {
                if (Object.getPrototypeOf(currentSelection.path[i]).Type == Model.Volume) {
                    return currentSelection.path[i];
                }
            }
        }
    },

    enterDocument: {
        value: function(isFirstTime) {
            if (isFirstTime) {
                this._selectionService = this.application.selectionService;
            }
            var self = this;
            this._createNewShare('smb', Model.ShareSmb).then(function(smbShare) {
                self.newSmbShare = smbShare;
                self.newSmbShare.properties.vfs_objects = [];
                self.newSmbShare.properties._browseable = true;
            });
            this._createNewShare('nfs', Model.ShareNfs).then(function(nfsShare) {
                self.newNfsShare = nfsShare;
            });
            this._createNewShare('afp', Model.ShareAfp).then(function(afpShare) {
                self.newAfpShare = afpShare;
            });
        }
    }
});
