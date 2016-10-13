var Component = require("montage/ui/component").Component,
    Model = require("core/model/model").Model,
    CryptoCertificateType = require("core/model/enumerations/crypto-certificate-type").CryptoCertificateType,
    CryptoCertificateDigestalgorithm = require("core/model/enumerations/crypto-certificate-digestalgorithm").CryptoCertificateDigestalgorithm;

exports.CryptoCertificate = Component.specialize({
    enterDocument: {
        value: function () {
            if (!this.object._action && !this.object._isNew) {
                this.object._action = 'creation';
            }
        }
    },
    save: {
        value: function () {
            if (this.object._action === 'import') {
                this.application.cryptoCertificateService.import(this.object);
            } else {
                this.inspector.save();
            }
        }
    }
});
