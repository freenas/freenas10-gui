var AbstractInspector = require("ui/abstract/abstract-inspector").AbstractInspector,
    Units = require('core/Units'),
    RoutingService = require("core/service/routing-service").RoutingService;

exports.ContainerCreator = AbstractInspector.specialize({

    _inspectorTemplateDidLoad: {
        value: function () {
            var self = this;

            this.memoryUnits = Units.MEGABYTE_SIZES;
            this._environment = {};
            this._routingService = RoutingService.getInstance();

            return Promise.all([
                this._sectionService.listDockerHosts(),
                this._sectionService.listDockerNetworks()
            ]).spread(function (hostDockers, networks) {
                self._hostDockers = hostDockers;
                self._networks = networks;
            });
        }
    },

    _object: {
        value: null
    },

    object: {
        set: function (object) {
            if (this._object !== object) {
                if (object) {
                    this._object = object;
                    this._object.primary_network_mode = this.constructor.DEFAULT_PRIMARY_NETWORK;
                } else {
                    this._object = null;
                }
            }
        },
        get: function () {
            return this._object;
        }
    },

    enterDocument: {
        value: function (isFirstTime) {
            this.super(isFirstTime);
            var self = this;
            this._reset();

            if (isFirstTime) {
                this.addEventListener("action", this);
            }

            if (!this._loadDataPromise) {
                this.isLoading = true;

                this._loadDataPromise = this._sectionService.getDockerSettings()
                .then(function (dockerSettings) {
                    self._dockerSettings = dockerSettings;
                }).finally(function () {
                    self.isLoading = false;
                    self._loadDataPromise = null;
                });
            }

            if (this.object) {
                this._sectionService.getNewDockerContainerBridge().then(function(bridge) {
                    self.object.bridge = bridge;
                });
            }
        }
    },

    handleGenerateAction: {
        value: function () {
            var self = this;
            this._sectionService.generateMacAddress().then(function(macAddress) {
                self.object.bridge.macaddress = macAddress;
            });
        }
    },

    exitDocument: {
        value: function () {
            this.super();
            self._loadDataPromise = null;
        }
    },

    _reset: {
        value: function () {
            if (this._environment) {
                this._environment.clear();
            }

            if (this._volumesComponent.values) {
                this._volumesComponent.values.clear();
            }

            if (this._portsComponent.values) {
                this._portsComponent.values.clear();
            }

            if (this._environmentComponent.values) {
                this._environmentComponent.values.clear();
            }

            this._nameComponent.value = null;
            this._commandComponent.value = null;
        }
    },

    save: {
        value: function () {
            var environmentComponentValues = this._environmentComponent.values,
                commandString = this._commandComponent.value,
                portsValues = this._portsComponent.values,
                volumesValues = this._volumesComponent.values,
                settingsValues = this._settingsComponent.values,
                environments = [],
                self = this;

            if (commandString) {
                this.object.command = commandString.split(" ");
            }

            if (this.object.memory_limit) {
                var memoryLimit = this.application.bytesService.convertStringToSize(this.object.memory_limit, this.application.bytesService.UNITS.M);
                this.object.memory_limit = memoryLimit || void 0;
            }

            if (settingsValues && settingsValues.length) {
                try {
                    environments = this._getVariablesFromArray(settingsValues);
                } catch (e) {
                    //TODO
                }
            }

            if (environmentComponentValues && environmentComponentValues.length) {
                environments = environments.concat(this._getVariablesFromArray(environmentComponentValues));
            }

            if (environments.length) {
                this.object.environment = environments;
            }

            if (portsValues && portsValues.length) {
                this.object.ports = portsValues.filter(function (entry) {
                    return entry.host_port && entry.container_port;
                });
            }

            if (volumesValues && volumesValues.length) {
                this.object.volumes = this._extractValidVolumes(volumesValues);
            }

            if (this.object.primary_network_mode !== this.constructor.PRIMARY_NETWORK_MODE_BRIDGED) {
                this.object.bridge.address = null;
                this.object.bridge.macaddress = null;
                this.object.bridge.dhcp = false;
            }

            return this._sectionService.saveContainer(this.object).then(function () {
                self._reset();
            });
        }
    },

    _extractValidVolumes: {
        value: function(values) {
            var volumes = [],
                entry;

            for (var i = values.length - 1; i >= 0; i--) {
                entry = values[i];

                if (entry.host_path && entry.container_path) {
                    delete entry.isLocked;
                    volumes.push(entry);
                }
            }

            return volumes;
        }
    },

    _getVariablesFromArray: {
        value: function (array) {
            return array.filter(function (entry) {
                var shouldKeep = !!(entry.variable && entry.value);

                if (!shouldKeep && entry.optional !== void 0 && entry.optional === true) {
                    throw new Error("missing setting");
                }

                return shouldKeep;
            }).map(function (entry) {
                return entry.variable + "=" + entry.value;
            });
        }
    }

}, {

    primaryNetWorkModes: {
        value: [
            {label: 'Bridged', value: 'BRIDGED'},
            {label: 'NAT', value: 'NAT'},
            {label: 'Host', value: 'HOST'},
            {label: 'None', value: 'NONE'}
        ]
    },

    DEFAULT_PRIMARY_NETWORK: {
        value: 'NAT'
    },

     PRIMARY_NETWORK_MODE_BRIDGED: {
        value: 'BRIDGED'
    }

});
