var Component = require("montage/ui/component").Component,
    VmRepository = require("core/repository/vm-repository").VmRepository,
    DiskRepository = require("core/repository/disk-repository").DiskRepository,
    SystemService = require("core/service/system-service").SystemService,
    moment = require("moment");

exports.SystemInfo = Component.specialize({
    systemInfo: {
        value: null
    },

    templateDidLoad: {
        value: function() {
            var self = this;

            this._systemService = SystemService.getInstance();
            this._vmRepository = VmRepository.getInstance();
            this._diskRepository = DiskRepository.getInstance();

            this._dataPromise = Promise.all([
                this._systemService.getVersion(),
                this._systemService.getHardware(),
                this._systemService.getGeneral(),
                this._diskRepository.listDisks(),
                this._systemService.getLoad(),
                this._vmRepository.getHardwareCapabilities()
            ]).spread(function (version, hardware, general, disks, load, vm) {
                self.systemInfo = {
                    version: version,
                    hardware: hardware,
                    general: general,
                    disks: disks,
                    load: load,
                    vmSupport: vm.vtx_enabled ?
                        vm.unrestricted_guest ? "Full" : "Partial" :
                        vm.svm_features ? "Partial" : "None"
                };
            })
        }
    },

    enterDocument: {
        value: function () {
            var self = this;
            return Promise.all([
                this._systemService.getTime(),
                this._dataPromise
            ]).spread(function(time) {
                return self._startTimer(time);
            });
        }
    },

    exitDocument: {
        value: function() {
            this._stopTimer();
        }
    },

    _startTimer: {
        value: function(time) {
            var self = this,
                startTime = new Date().getTime(),
                startSystemTime = +(moment(time.system_time['$date']).format("X"));

            this._stopTimer();
            this._timer = setInterval(function () {
                var elapsed = new Date().getTime() - startTime;
                self.systemInfo.time = {
                    uptime: time.uptime + elapsed / 1000,
                    system_time: new Date(startSystemTime + elapsed).toISOString()
                };
            }, 500);
        }
    },

    _stopTimer: {
        value: function() {
            if (this._timer) {
                clearInterval(this._timer);
                this._timer = 0;
            }
        }
    }

});
