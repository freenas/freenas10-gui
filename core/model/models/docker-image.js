var AbstractModel = require("core/model/abstract-model").AbstractModel;

exports.DockerImage = AbstractModel.specialize({
    _created_at: {
        value: null
    },
    created_at: {
        set: function (value) {
            if (this._created_at !== value) {
                this._created_at = value;
            }
        },
        get: function () {
            return this._created_at;
        }
    },
    _host: {
        value: null
    },
    host: {
        set: function (value) {
            if (this._host !== value) {
                this._host = value;
            }
        },
        get: function () {
            return this._host;
        }
    },
    _id: {
        value: null
    },
    id: {
        set: function (value) {
            if (this._id !== value) {
                this._id = value;
            }
        },
        get: function () {
            return this._id;
        }
    },
    _names: {
        value: null
    },
    names: {
        set: function (value) {
            if (this._names !== value) {
                this._names = value;
            }
        },
        get: function () {
            return this._names;
        }
    },
    _presets: {
        value: null
    },
    presets: {
        set: function (value) {
            if (this._presets !== value) {
                this._presets = value;
            }
        },
        get: function () {
            return this._presets;
        }
    },
    _size: {
        value: null
    },
    size: {
        set: function (value) {
            if (this._size !== value) {
                this._size = value;
            }
        },
        get: function () {
            return this._size;
        }
    }
}, {
    propertyBlueprints: {
        value: [{
            mandatory: false,
            name: "created_at",
            valueType: "String"
        }, {
            mandatory: false,
            name: "host",
            valueType: "String"
        }, {
            mandatory: false,
            name: "id",
            valueType: "String"
        }, {
            mandatory: false,
            name: "names",
            valueType: "array"
        }, {
            mandatory: false,
            name: "presets",
            valueType: "object"
        }, {
            mandatory: false,
            name: "size",
            valueType: "number"
        }]
    }
});
