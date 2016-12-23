"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var system_repository_1 = require("../../repository/system-repository");
var service_repository_1 = require("../../repository/service-repository");
var abstract_section_service_ng_1 = require("./abstract-section-service-ng");
var ServiceSectionService = (function (_super) {
    __extends(ServiceSectionService, _super);
    function ServiceSectionService() {
        _super.apply(this, arguments);
    }
    ServiceSectionService.prototype.init = function () {
        this.systemRepository = system_repository_1.SystemRepository.getInstance();
        this.serviceRepository = service_repository_1.ServiceRepository.getInstance();
    };
    ServiceSectionService.prototype.getSystemGeneral = function () {
        return this.systemRepository.getGeneral();
    };
    ServiceSectionService.prototype.saveService = function (service) {
        return this.serviceRepository.saveService(service);
    };
    ServiceSectionService.prototype.loadEntries = function () {
        return this.serviceRepository.listServicesCategories();
    };
    ServiceSectionService.prototype.loadExtraEntries = function () {
        return undefined;
    };
    ServiceSectionService.prototype.loadSettings = function () {
        return undefined;
    };
    ServiceSectionService.prototype.loadOverview = function () {
        return undefined;
    };
    return ServiceSectionService;
}(abstract_section_service_ng_1.AbstractSectionService));
exports.ServiceSectionService = ServiceSectionService;
