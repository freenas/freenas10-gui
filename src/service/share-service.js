var Montage = require("montage").Montage,
    ShareTargettype = require("core/model/enumerations/share-targettype").ShareTargettype,
    application = require("montage/core/application").application,
    FreeNASService = require("core/service/freenas-service").FreeNASService,
    BytesService = require("core/service/bytes-service").BytesService,
    ShareRepository = require("core/repository/share-repository").ShareRepository,
    ShareIscsiTargetRepository = require("core/repository/ShareIscsiTargetRepository").ShareIscsiTargetRepository,
    VolumeRepository = require("core/repository/volume-repository").VolumeRepository,
    Promise = require("montage/core/promise").Promise,
    Model = require("core/model/model").Model,
    urlJoin = require("url-join"),
    _ = require("lodash");

var ShareService = exports.ShareService = Montage.specialize({

    _instance: {
        value: null
    },

    _dataService: {
        value: null
    },

    createSmbShare: {
        value: function (volume) {
            return this._createNewShare(this.constructor.SHARE_TYPES.SMB, volume);
        }
    },

    createAfpShare: {
        value: function (volume) {
            return this._createNewShare(this.constructor.SHARE_TYPES.AFP, volume);
        }
    },

    createNfsShare: {
        value: function (volume) {
            return this._createNewShare(this.constructor.SHARE_TYPES.NFS, volume);
        }
    },

    createIscsiShare: {
        value: function (volume) {
            return this._createNewShare(this.constructor.SHARE_TYPES.ISCSI, volume);
        }
    },

    createWebdavShare: {
        value: function (volume) {
            return this._createNewShare(this.constructor.SHARE_TYPES.WEBDAV, volume);
        }
    },

    populateShareObjectIfNeeded: {
        value: function (shareObject) {
            var self = this,
                populatedSharePromise;
            if (!shareObject.properties) {
                var shareTypes = this.constructor.SHARE_TYPES;

                shareObject.properties = {};
                shareObject.properties["%type"] = 'Share' + _.capitalize(shareObject.type);
                populatedSharePromise = this.shareRepository.getNewUnixPermissions().then(function(unixPermissions) {
                    if (shareTypes.SMB === shareObject.type) {
                        shareObject.properties.vfs_objects = [];
                        shareObject.properties.browseable = true;
                        shareObject.properties.hosts_allow = [];
                        shareObject.properties.hosts_deny = [];
                        shareObject.properties.previous_versions = true;
                    } else if (shareTypes.NFS === shareObject.type) {
                        shareObject.properties.hosts = [];
                        shareObject.properties.security = [];
                    } else if (shareTypes.ISCSI === shareObject.type) {
                        shareObject.properties.block_size = 512;
                        shareObject.properties.size = 0;
                        shareObject.__extent = {
                            id: null,
                            lun: 0
                        };
                    } else if (shareTypes.AFP === shareObject.type) {
                        shareObject.properties.afp3_privileges = true;
                        shareObject.properties.default_file_perms = _.defaultsDeep(_.cloneDeep(unixPermissions), self.constructor.DEFAULT_FILE_PERMISSIONS);
                        shareObject.properties.default_directory_perms = _.defaultsDeep(_.cloneDeep(unixPermissions), self.constructor.DEFAULT_DIRECTORY_PERMISSIONS);
                        shareObject.properties.default_umask = _.cloneDeep(unixPermissions);
                    }

                    return shareObject;
                });

            } else {
                populatedSharePromise = Promise.resolve(shareObject);
            }

            return populatedSharePromise.then(function(populatedShareObject) {
                return self.ensureDefaultPermissionsAreSet(populatedShareObject);
            });
        }
    },

    ensureDefaultPermissionsAreSet: {
        value: function(share) {
            var self = this;

            share.permissions_type = share.permissions_type || this.constructor.DEFAULT_PERM_TYPES[share.type];
            return share.permissions ?
                Promise.resolve(share) :
                this.shareRepository.getNewPermissions().then(function (permissions) {
                    share.permissions = _.defaults(permissions, self.constructor.DEFAULT_PERMISSIONS);
                    return share;
                });
        }
    },

    save: {
        value: function (shareObject, isServiceEnabled) {
            var saveSharePromise;

            // Clear up permissions
            if (shareObject.permissions) {
                if (shareObject.permissions.modes && (shareObject.permissions_type !== 'PERM' || shareObject.target_type !== 'DATASET')) {
                    delete shareObject.permissions.modes;
                }
                delete shareObject.permissions.acl;
            }
            delete shareObject.permissions_type;

            if (shareObject.target_type === 'DIRECTORY' && !_.startsWith('/mnt', shareObject.target_path)) {
                shareObject.target_path = urlJoin('/mnt', shareObject.target_path);
            }

            //FIXME: workaround for the SELECT component. Future dead code.
            if (shareObject.type === this.constructor.SHARE_TYPES.NFS) {
                saveSharePromise = this._saveNfsShareObject(shareObject, isServiceEnabled);
            } else if (shareObject.type === this.constructor.SHARE_TYPES.ISCSI) {
                saveSharePromise = this._saveIscsiShareObject(shareObject, isServiceEnabled);
            } else if (shareObject.type === this.constructor.SHARE_TYPES.AFP) {
                saveSharePromise = this._saveAfpShareObject(shareObject, isServiceEnabled);
            } else {
                saveSharePromise = this.shareRepository.saveShare(shareObject);
            }
            return saveSharePromise;
        }
    },

    _saveNfsShareObject: {
        value: function(shareObject, isServiceEnabled) {
            var properties = shareObject.properties;
            properties.maproot_user = properties.maproot_user != ' - ' ? properties.maproot_user : null;
            properties.maproot_group = properties.maproot_group != ' - ' ? properties.maproot_group : null;
            properties.mapall_user = properties.mapall_user != ' - ' ? properties.mapall_user : null;
            properties.mapall_group = properties.mapall_group != ' - ' ? properties.mapall_group : null;

            return this.shareRepository.saveShare(shareObject);
        }
    },

    _saveAfpShareObject: {
        value: function(shareObject, isServiceEnabled) {
            if (shareObject._isNew) {
                shareObject.properties.default_file_perms = this._isPermissionsDefined(shareObject.properties.default_file_perms) ?
                    shareObject.properties.default_file_perms : null;
                shareObject.properties.default_directory_perms = this._isPermissionsDefined(shareObject.properties.default_directory_perms) ?
                    shareObject.properties.default_directory_perms : null;
                shareObject.properties.default_umask = this._isPermissionsDefined(shareObject.properties.default_umask) ?
                    shareObject.properties.default_umask : null;
            }
            return this.shareRepository.saveShare(shareObject);
        }
    },

    _isPermissionsDefined: {
        value: function(permissions) {
            return _.some(
                _.map(
                    _.at(permissions, ['user', 'group', 'others']),
                    function(scope) {
                        return _.some(_.at(scope, ['read', 'write', 'execute']));
                    }
                )
            );
        }
    },

    _saveIscsiShareObject: {
        value: function (shareObject) {
            var self = this,
                isNewShareObject = shareObject._isNew,
                blockSize = shareObject.properties.block_size,
                size = shareObject.properties.size,
                targetId = shareObject.__extent ? shareObject.__extent.id : null,
                datasetProperties = null;

            if (typeof blockSize === "string") {
                shareObject.properties.block_size = this._bytesService.convertStringToSize(blockSize);
            }

            if (typeof size === "string") {
                shareObject.properties.size = this._bytesService.convertStringToSize(size);
            }

            if (isNewShareObject && shareObject.target_type === 'ZVOL' && !shareObject.properties.refreservation) {
                datasetProperties = {
                    refreservation: {
                        parsed: 0
                    }
                };
            }
            delete shareObject.properties.refreservation;

            return this.shareRepository.saveShare(shareObject, datasetProperties)
                .then(function() {
                    if (isNewShareObject) {
                        return self._dataService.getNewInstanceForType(Model.ShareIscsiTarget).then(function(target) {
                            var extentObject = {
                                name: shareObject.name,
                                number: shareObject.__extent ? shareObject.__extent.lun : 0
                            };

                            target.id = targetId;

                            if (Array.isArray(target.extents)) {
                                target.extents.push(extentObject);
                            } else {
                                target.extents = [extentObject];
                            }

                            return self.shareIscsiTargetRepository.save(target);
                        });
                    }
                });
        }
    },

    _createNewShare: {
        value: function (shareType, volume) {
            return this.shareRepository.getNewShare(volume, shareType);
        }
    },

    fetchShareIscsiTarget: {
        value: function () {
            var self = this;

            return this._dataService.fetchData(Model.ShareIscsiTarget).then(function (shareIscsiTargetCollection) {
                return (self.shareIscsiTargetCollection = shareIscsiTargetCollection);
            });
        }
    }

}, {

    //FIXME: could probably be an enum
    SHARE_TYPES: {
        value: {
            AFP: "afp",
            SMB: "smb",
            NFS: "nfs",
            ISCSI: "iscsi",
            WEBDAV: "webdav"
        }
    },

    DEFAULT_PERM_TYPES: {
        value: {
            afp: 'PERM',
            smb: 'ACL',
            nfs: 'PERM',
            iscsi: null,
            webdav: 'PERM'
        }
    },

    TARGET_TYPES: {
        get: function () {
            return ShareTargettype;
        }
    },

    DEFAULT_PERMISSIONS: {
        value: {
            user: 'root',
            group: 'wheel',
            modes: {
                user: {
                    read: true,
                    write: true,
                    execute: true
                },
                group: {
                    read: true,
                    write: false,
                    execute: true
                },
                others: {
                    read: true,
                    write: false,
                    execute: true
                }
            }
        }
    },

    DEFAULT_FILE_PERMISSIONS: {
        value: {
            user: {
                read: true,
                write: true,
                execute: false
            },
            group: {
                read: true,
                write: false,
                execute: false
            },
            others: {
                read: true,
                write: false,
                execute: false
            }
        }
    },

    DEFAULT_DIRECTORY_PERMISSIONS: {
        value: {
            user: {
                read: true,
                write: true,
                execute: true
            },
            group: {
                read: true,
                write: false,
                execute: true
            },
            others: {
                read: true,
                write: false,
                execute: true
            }
        }
    },

    instance: {
        get: function() {
            if (!this._instance) {
                this._instance = new ShareService();
                this._instance._dataService = FreeNASService.instance;
                this._instance._bytesService = BytesService.instance;
                this._instance.shareRepository = ShareRepository.getInstance();
                this._instance.shareIscsiTargetRepository = ShareIscsiTargetRepository.getInstance();
                this._instance.volumeRepository = VolumeRepository.getInstance();
            }

            return this._instance;
        }
    }
});
