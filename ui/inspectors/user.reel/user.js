var Component = require("montage/ui/component").Component,
    Model = require("core/model/model").Model,
    Converter = require("montage/core/converter/converter").Converter,
    Validator = require("montage/core/converter/converter").Validator;

/**
 * @class User
 * @extends Component
 */
exports.User = Component.specialize({

    _object: {
        value: null
    },

    object: {
        get: function () {
            return this._object;
        },
        set: function (object) {
            if (this._object != object) {
                this._object = object;
                this._loadGroups(object);
                if (typeof object.uid != 'number') {
                    this._getNextAvailableUserId();
                }
            }
        }
    },

    additionalGroups: {
        value: null
    },

    groupOptions: {
        value: null
    },

    enterDocument: {
        value: function() {
            var self = this;
            this.treeController.open(this._object.home).then(function() {
                self._object.home = self.treeController.selectedPath;
            });
        }
    },

    save: {
        value: function() {
            this.object.groups = this.additionalGroups.map(function(x) { return x.id; });
            return this.application.dataService.saveDataObject(this.object);
        }
    },

    _loadGroups: {
        value: function() {
            var self = this;
            this.application.dataService.fetchData(Model.Group).then(function (groups) {
                self.groupOptions = groups;
                self.additionalGroups = self._object.groups ? groups.filter(function (x) { return self.object.groups.indexOf(x.id) > -1; }) : [];
            });
        }
    },

    _getNextAvailableUserId: {
        value: function() {
            var self = this;
            return Model.populateObjectPrototypeForType(Model.User).then(function (User) {
                return User.constructor.services.nextUid();
            }).then(function(userId) {
                self.nextUserId = self.object.uid = userId;
            });
        }
    }
});

exports.AdditionalGroupsConverter = Converter.specialize({
    convert: {
        value: function (groupId) {
            return this.groupOptions.find(function(x){ return x.id === groupId; });
        }
    },

    revert: {
        value: function (name) {
            var newGroupValue = this.groupOptions.find(function(x) { return x.name === name; });
            return newGroupValue ? newGroupValue.id : null;
        }
    }
});

exports.AdditionalGroupsValidator = Validator.specialize({
    validate: {
        value: function (name) {
            return !!this.groupOptions.find(function(x) { return x.name === name; });
        }
    }
});
