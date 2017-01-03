"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_dao_1 = require('./abstract-dao');
var VmDao = (function (_super) {
    __extends(VmDao, _super);
    function VmDao() {
        _super.call(this, 'Vm');
    }
    VmDao.prototype.requestSerialConsole = function (vmId) {
        return this.middlewareClient.callRpcMethod('vm.request_serial_console', [vmId]);
    };
    VmDao.prototype.getHardwareCapabilities = function () {
        return this.middlewareClient.callRpcMethod("vm.get_hw_vm_capabilities");
    };
    VmDao.prototype.start = function (vm) {
        return this.middlewareClient.submitTask('vm.start', [vm.id]);
    };
    VmDao.prototype.stop = function (vm) {
        return this.middlewareClient.submitTask('vm.stop', [vm.id]);
    };
    VmDao.prototype.reboot = function (vm) {
        return this.middlewareClient.submitTask('vm.reboot', [vm.id]);
    };
    return VmDao;
}(abstract_dao_1.AbstractDao));
exports.VmDao = VmDao;
