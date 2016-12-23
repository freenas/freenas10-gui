"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_repository_ng_1 = require('./abstract-repository-ng');
var share_dao_1 = require('core/dao/share-dao');
var ShareRepository = (function (_super) {
    __extends(ShareRepository, _super);
    function ShareRepository(shareDao) {
        _super.call(this, ['Share']);
        this.shareDao = shareDao;
    }
    ShareRepository.getInstance = function () {
        if (!ShareRepository.instance) {
            ShareRepository.instance = new ShareRepository(new share_dao_1.ShareDao());
        }
        return ShareRepository.instance;
    };
    ShareRepository.prototype.listShares = function () {
        return this.shareDao.list();
    };
    ShareRepository.prototype.getNewShare = function () {
        return this.shareDao.getNewInstance();
    };
    ShareRepository.prototype.saveShare = function (object, isServiceEnabled) {
        return this.shareDao.save(object, object._isNew ? [null, isServiceEnabled] : [isServiceEnabled]);
    };
    ShareRepository.prototype.handleStateChange = function (name, state) {
        var self = this;
        switch (name) {
            case 'Share':
                this.eventDispatcherService.dispatch('sharesChange', state);
                state.forEach(function (share, id) {
                    if (!self.shares || !self.shares.has(id)) {
                        self.eventDispatcherService.dispatch('shareAdd.' + id, share);
                    }
                    else if (self.shares.get(id) !== share) {
                        self.eventDispatcherService.dispatch('shareChange.' + id, share);
                    }
                });
                if (this.shares) {
                    this.shares.forEach(function (share, id) {
                        if (!state.has(id) || state.get(id) !== share) {
                            self.eventDispatcherService.dispatch('shareRemove.' + id, share);
                        }
                    });
                }
                this.shares = state;
                break;
            default:
                break;
        }
    };
    return ShareRepository;
}(abstract_repository_ng_1.AbstractRepository));
exports.ShareRepository = ShareRepository;
