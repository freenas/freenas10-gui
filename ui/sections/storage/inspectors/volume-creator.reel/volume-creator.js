var AbstractInspector = require("ui/abstract/abstract-inspector").AbstractInspector,
    EventDispatcherService = require("core/service/event-dispatcher-service").EventDispatcherService,
    RoutingService = require("core/service/routing-service").RoutingService,
    CascadingList = require("ui/controls/cascading-list.reel").CascadingList;

exports.VolumeCreator = AbstractInspector.specialize({
    _object: {
        value: null
    },

    object: {
        get: function() {
            return this._object;
        },
        set: function(object) {
            var self = this;
            if (this._object != object) {
                if (!object.topology) {
                    this._initializeTopology(object).then(function(_object) {
                        self.object = _object;
                    });
                } else {
                    self._object = object;
                }
            }
        }
    },

    _parentCascadingListItem: {
        value: null
    },


    _inspectorTemplateDidLoad: {
        value: function() {
            this._routingService = RoutingService.getInstance();
            this._eventDispatcherService = EventDispatcherService.getInstance();
        }
    },

    enterDocument: {
        value: function(isFirstTime) {
            this.super(isFirstTime);
            if (isFirstTime) {
                this.addPathChangeListener("topologySelectedDisk", this, "_handleSelectedDiskChange");
                this.addPathChangeListener("availableSelectedDisk", this, "_handleSelectedDiskChange");
            }
            var self = this;
            this._parentCascadingListItem = CascadingList.findCascadingListItemContextWithComponent(this);
            if (this._parentCascadingListItem) {
                this._parentCascadingListItem.classList.add("CascadingListItem-VolumeCreator");
            }
            this._sectionService.listAvailableDisks().then(function(availableDisks) {
                self.availableDisks = availableDisks;
            });
            this.availableDisksEventListener = this._eventDispatcherService.addEventListener('AvailableDisksChanged', this._handleAvailableDisksChange.bind(this));
        }
    },

    exitDocument: {
        value: function() {
            this.super();
            this._eventDispatcherService.removeEventListener('availableDisksChange', this.availableDisksEventListener);
            this._sectionService.clearReservedDisks();
            if (this._parentCascadingListItem) {
                this._parentCascadingListItem.classList.remove("CascadingListItem-VolumeCreator");
            }
        }
    },

    _handleAvailableDisksChange: {
        value: function(availableDisks) {
            this.availableDisks = availableDisks.valueSeq().toJS();
        }
    },

    _handleSelectedDiskChange: {
        value: function(value) {
            if (value) {
                var diskId = value._disk ? value._disk.id : value.id;
                this._routingService.navigate(this._parentCascadingListItem.data.path + '/disk/_/' + diskId);
            }
        }
    },

    _initializeTopology: {
        value: function (object) {
            object = object || this._object;
            var self = this;
            this._sectionService.clearReservedDisks();
            return this._sectionService.getNewTopology().then(function(topology) {
                object.topology = topology;

                if (self.disks) {
                    self.disks.map(function(x) {
                        if (x.volume == '/TEMP/') {
                            x.volume = null;
                        }
                    });
                }
                return object;
            })
        }
    },

    _getDefaultVdevType: {
        value: function(disksCount) {
            var type;
            if (disksCount >=3) {
                type = 'raidz1'
            } else if (disksCount == 2) {
                type = 'mirror'
            } else {
                type = 'disk'
            }
            return type;
        }
    },

    revert: {
        value: function() {
            this.topologizer.reset();
            this._initializeTopology();
        }
    },

    shouldScrollViewComputeBoundaries: {
        value: function () {
            return !this.topologizer._isMoving;
        }
    },

    save: {
        value: function() {
            var self = this;
            this.object.__isLocked = true;
            var creationPromise = this._sectionService.createVolume(this.object).then(function() {
                self.object.__isLocked = false;
            });
            this.inspector.clearObjectSelection();
            return creationPromise;
        }
    }

});
