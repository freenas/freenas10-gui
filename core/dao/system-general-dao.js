"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_dao_ng_1 = require('./abstract-dao-ng');
var cleaner_1 = require('../service/data-processor/cleaner');
var diff_1 = require('../service/data-processor/diff');
var null_1 = require('../service/data-processor/null');
var SystemGeneralDao = (function (_super) {
    __extends(SystemGeneralDao, _super);
    function SystemGeneralDao() {
        _super.call(this, 'SystemGeneral', {
            queryMethod: 'system.general.get_config',
            createMethod: 'system.general.update'
        });
    }
    SystemGeneralDao.prototype.save = function (object, args) {
        var update = null_1.processor.process(diff_1.processor.process(cleaner_1.processor.process(object, this.propertyDescriptors), 'SystemGeneral', object.id));
        if (update || (args && args.length > 0)) {
            return this.middlewareClient.submitTask('system.general.update', [update]);
        }
    };
    SystemGeneralDao.prototype.listTimezones = function () {
        return this.middlewareClient.callRpcMethod('system.general.timezones');
    };
    SystemGeneralDao.prototype.listKeymaps = function () {
        return this.middlewareClient.callRpcMethod('system.general.keymaps');
    };
    return SystemGeneralDao;
}(abstract_dao_ng_1.AbstractDao));
exports.SystemGeneralDao = SystemGeneralDao;
