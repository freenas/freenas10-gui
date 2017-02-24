import {UserDao} from '../dao/user-dao';
import {GroupDao} from '../dao/group-dao';
import {DirectoryServicesDao} from '../dao/directory-services-dao';
import {AccountSystemDao} from '../dao/account-systems-dao';
import {DirectoryserviceConfigDao} from '../dao/directoryservice-config-dao';
import {AbstractRepository} from './abstract-repository';
import {DirectoryDao} from '../dao/directory-dao';
import {Map} from 'immutable';
import {ModelEventName} from '../model-event-name';
import {Model} from '../model';
import {DatastoreService} from '../service/datastore-service';
import * as _ from 'lodash';
import {FreeipaDirectoryParamsDao} from '../dao/FreeipaDirectoryParamsDao';
import {User} from '../model/User';
import {SubmittedTask} from '../model/SubmittedTask';
import {Group} from '../model/Group';
import {DirectoryServices} from '../model/DirectoryServices';
import {AbstractDao} from '../dao/abstract-dao';
import {AbstractDataObject} from '../model/AbstractDataObject';
import {LdapDirectoryParams} from '../model/LdapDirectoryParams';
import {LdapDirectoryParamsDao} from '../dao/LdapDirectoryParamsDao';
import {NisDirectoryParamsDao} from '../dao/NisDirectoryParamsDao';
import {WinbindDirectoryParamsDao} from '../dao/WinbindDirectoryParamsDao';

export class AccountRepository extends AbstractRepository {
    private static instance: AccountRepository;

    private users: Map<string, Map<string, any>>;
    private groups: Map<string, Map<string, any>>;
    private directories: Map<string, Map<string, any>>;
    private groupsStreamId: string;
    private parametersDao: Map<string, AbstractDao<AbstractDataObject>>;

    private usersStreamId: string;
    public static readonly DIRECTORY_TYPES_LABELS = {
        winbind: 'Active Directory',
        freeipa: 'FreeIPA',
        ldap: 'LDAP',
        nis: 'NIS'
    };

    private constructor(private userDao: UserDao,
                        private groupDao: GroupDao,
                        private datastoreService: DatastoreService,
                        private directoryServicesDao: DirectoryServicesDao,
                        private directoryserviceConfigDao: DirectoryserviceConfigDao,
                        private directoryDao: DirectoryDao,
                        private accountSystemDao: AccountSystemDao,
                        freeipaDirectoryParamsDao: FreeipaDirectoryParamsDao,
                        ldapDirectoryParamsDao: LdapDirectoryParamsDao,
                        nisDirectoryParamsDao: NisDirectoryParamsDao,
                        winbindDirectoryParamsDao: WinbindDirectoryParamsDao
    ) {
        super([
            Model.User,
            Model.Group,
            Model.Directory
        ]);
        this.parametersDao = Map<string, AbstractDao<AbstractDataObject>>().asMutable()
            .set('freeipa', freeipaDirectoryParamsDao)
            .set('ldap',    ldapDirectoryParamsDao)
            .set('nis',     nisDirectoryParamsDao)
            .set('winbind', winbindDirectoryParamsDao)
            .asImmutable();
    }

    public static getInstance() {
        if (!AccountRepository.instance) {
            AccountRepository.instance = new AccountRepository(
                new UserDao(),
                new GroupDao(),
                DatastoreService.getInstance(),
                new DirectoryServicesDao(),
                new DirectoryserviceConfigDao(),
                new DirectoryDao(),
                new AccountSystemDao(),
                new FreeipaDirectoryParamsDao(),
                new LdapDirectoryParamsDao(),
                new NisDirectoryParamsDao(),
                new WinbindDirectoryParamsDao()
            );
        }
        return AccountRepository.instance;
    }

    public loadUsers(): Promise<Array<any>> {
        return this.userDao.list();
    }

    public loadGroups(): Promise<Array<any>> {
        return this.groupDao.list();
    }

    public listUsers(): Promise<Array<any>> {
        return this.users ? Promise.resolve(this.users.toSet().toJS()) : this.userDao.list();
    }

    public streamUsers(): Promise<Array<Object>> {
        let promise;

        if (this.usersStreamId) {
            promise = Promise.resolve(
                this.datastoreService.getState().get('streams').get(this.usersStreamId)
            );
        } else {
            promise = this.userDao.stream(true);
        }

        return promise.then((stream) => {
            let dataArray = stream.get('data').toJS();

            this.userDao.register();
            this.usersStreamId = stream.get('streamId');
            dataArray._objectType = this.userDao.objectType;

            // FIXME!!
            // DTM montage
            dataArray._stream = stream;

            return dataArray;
        });
    }

    public getUserEmptyList() {
        return this.userDao.getEmptyList();
    }

    public getGroupEmptyList() {
        return this.groupDao.getEmptyList();
    }

    public getDirectoryServicesEmptyList() {
        return this.directoryServicesDao.getEmptyList();
    }

    public getAccountSystemEmptyList() {
        return this.accountSystemDao.getEmptyList();
    }

    // need discussion
    public getNextSequenceForStream (streamId) {
        return this.groupDao.getNextSequenceForStream(streamId);
    }

    public findUserWithName(name: string): Promise<User> {
        return this.userDao.findSingleEntry({username: name});
    }

    public saveUser(user: User): Promise<SubmittedTask> {
        return this.userDao.save(user);
    }

    public listGroups(): Promise<Array<Group>> {
        return this.groups ? Promise.resolve(this.groups.toSet().toJS()) : this.groupDao.list();
    }

    // TODO: ask only ids? (improvements)
    public streamGroups(): Promise<Array<Group>> {
        let promise;

        if (this.groupsStreamId) {
            promise = Promise.resolve(
                this.datastoreService.getState().get('streams').get(this.groupsStreamId)
            );
        } else {
            promise = this.groupDao.stream(true);
        }

        return promise.then((stream) => {
            let dataArray = stream.get('data').toJS();

            // TODO: register to events add/remove
            this.groupsStreamId = stream.get('streamId');
            dataArray._objectType = this.groupDao.objectType;

            // FIXME!!
            // DTM montage
            dataArray._stream = stream;

            return dataArray;
        });
    }

    public getNextUid() {
        return this.userDao.getNextUid();
    }

    public getNewUser() {
        return this.userDao.getNewInstance();
    }

    public getNextGid() {
        return this.groupDao.getNextGid();
    }

    public getNewGroup() {
        return this.groupDao.getNewInstance();
    }

    public getNewDirectoryServices(): Promise<DirectoryServices> {
        return this.directoryServicesDao.getNewInstance();
    }

    public getDirectoryServiceConfig(): Promise<Object> {
        return this.directoryserviceConfigDao.get();
    }

    public listDirectories(): Promise<Array<any>> {
        let promise = this.directories ? Promise.resolve(this.directories.valueSeq().toJS()) : this.directoryDao.list();
        return promise.then(directories => {
            _.forEach(directories, directory => {
                directory.label = AccountRepository.DIRECTORY_TYPES_LABELS[directory.type];
            });
            return directories;
        });
    }

    public getNewDirectoryForType(type: string) {
        return Promise.all([
            this.directoryDao.getNewInstance(),
            this.parametersDao.get(type).getNewInstance()
        ]).spread((directory, parameters) => {
            directory.type = type;
            directory._tmpId = type;
            directory.parameters = parameters;
            directory.label = AccountRepository.DIRECTORY_TYPES_LABELS[type];

            return directory;
        });
    }

    public searchUser(value) {
        return this.userDao.stream(false, {username: [['~', value]]}).then(function (results) {
            let users = results.get('data').toJS();
            return users.map(user => {
                return {label: user.username, value: user.username};
            });
        });
    }

    public searchGroup(value) {
        return this.groupDao.stream(false, {name: [['~', value]]}).then(function (results) {
            let groups = results.get('data').toJS();
            return groups.map(group => {
                return {label: group.name, value: group.name};
            });
        });
    }

    protected handleStateChange(name: string, state: any) {
        switch (name) {
            case Model.User:
                this.users = this.dispatchModelEvents(this.users, ModelEventName.User, state);
                break;
            case Model.Group:
                this.groups = this.dispatchModelEvents(this.groups, ModelEventName.Group, state);
                break;
            case Model.Directory:
                this.directories = this.dispatchModelEvents(this.directories, ModelEventName.Directory, state);
                break;
            default:
                break;
        }
    }

    protected handleEvent(name: string, data: any) {
    }
}


