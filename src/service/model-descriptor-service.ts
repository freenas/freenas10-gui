// DTM
import {AbstractDataObject} from '../model/AbstractDataObject';
declare let require: any;
import { MiddlewareClient } from './middleware-client';
import { AbstractDao } from '../dao/abstract-dao';
import * as _ from 'lodash';

export class ModelDescriptorService {
    private static instance: ModelDescriptorService;
    private uiCache: Map<string, Object>;
    private daoCache: Map<string, Promise<AbstractDao>>;
    private schema: Map<string, any>;
    private taskSchemaCache: Map<string, Map<string, any>>;
    private taskSchemaPromise: Promise<Map<string, Map<string, any>>>;

    private readonly UI_DESCRIPTOR_PREFIX = 'ui-descriptors/';
    private readonly UI_DESCRIPTOR_SUFFIX = '-user-interface-descriptor.mjson';
    private readonly DAO_PREFIX = 'core/dao/';
    private readonly DAO_SUFFIX = '-dao';

    public constructor(private middlewareClient: MiddlewareClient) {
        this.uiCache = new Map<string, Object>();
        this.daoCache = new Map<string, Promise<AbstractDao<AbstractDataObject>>>();
    }

    public static getInstance(): ModelDescriptorService {
        if (!ModelDescriptorService.instance) {
            ModelDescriptorService.instance = new ModelDescriptorService(MiddlewareClient.getInstance());
        }
        return ModelDescriptorService.instance;
    }

    public getUiDescriptorForObject(this: ModelDescriptorService, object: Object): Promise<any> {
        let type = this.getObjectType(object),
            result;
        if (type) {
            result = this.getUiDescriptorForType(type);
        }
        return Promise.resolve(result);
    }

    public getUiDescriptorForType(type: string): Promise<any> {
        let self = this;
        if (type) {
            let uiDescriptorPath = this.UI_DESCRIPTOR_PREFIX + _.kebabCase(type) + this.UI_DESCRIPTOR_SUFFIX;
            return Promise.resolve(
                this.uiCache.has(type) ?
                    this.uiCache.get(type) :
                    SystemJS.import(uiDescriptorPath).then((uiDescriptor) => {
                        self.uiCache.set(type, uiDescriptor.root.properties);
                        return uiDescriptor.root.properties;
                    }, () => { debugger; })
            );
        }
    }

    public getDaoForObject(object: Object): Promise<any> {
        let type = this.getObjectType(object),
            result;
        if (type) {
            result = this.getDaoForType(type);
        }
        return result;
    }

    public getDaoForType(type: string): Promise<any> {
        let daoPath = this.DAO_PREFIX + _.kebabCase(type) + this.DAO_SUFFIX;
        if (!this.daoCache.has(type)) {
            this.daoCache.set(type,
                Promise.resolve(
                    require.async(daoPath).then((daoModule) => new (daoModule[type + 'Dao'])(), () => { debugger; })
                )
            );
        }
        return this.daoCache.get(type);
    }

    public getObjectType(object: any): string {
        return  (Array.isArray(object._objectType) && object._objectType[0]) ||
                object._objectType ||
                (Array.isArray(object) && object.length > 0 && object[0]._objectType);
    }

    public getPropertyType(type: string, property: string): Promise<string> {
        return this.loadRemoteSchema().then(function(schema) {
            let result;
            if (schema.has(type)) {
                let propertyDescriptor = schema.get(type).properties[property];
                if (propertyDescriptor) {
                    if (propertyDescriptor.type) {
                        result = propertyDescriptor.type;
                    } else if (propertyDescriptor['$ref']) {
                        result = _.upperFirst(_.camelCase(propertyDescriptor['$ref']));
                    }
                }
            }
            return result;
        });
    }

    public getTaskDescriptor(taskPath: string): Promise<Map<string, any>> {
        return this.loadTasksDescriptors().then((descriptors) => descriptors.has(taskPath) ? descriptors.get(taskPath) : null);
    }

    public getPropertyDescriptorsForType(type: string): Promise<any> {
        return this.loadRemoteSchema().then((schema) => schema.has(type) ? schema.get(type).properties : null);
    }

    private loadTasksDescriptors(): Promise<Map<string, any>> {
        return this.taskSchemaCache ?
            Promise.resolve(this.taskSchemaCache) :
                this.taskSchemaPromise ?
                    this.taskSchemaPromise :
                    this.taskSchemaPromise = this.middlewareClient.callRpcMethod('discovery.get_tasks').then((tasks) => {
                        this.taskSchemaCache = new Map<string, any>();
                        _.forEach(tasks, (task, taskName) => {
                            this.taskSchemaCache.set(taskName, new Map<string, any>()
                                .set('description', task.description)
                                .set('abortable',   task.abortable)
                                .set('mandatory',   this.getMandatoryProperties(task.schema))
                                .set('forbidden',   this.getForbiddenProperties(task.schema)));
                        });
                        return this.taskSchemaCache;
                    });
    }

    private getMandatoryProperties(schema: Array<any>): Array<string> {
        let object = _.get(_.find(schema, (arg) => _.has(arg, 'allOf')), 'allOf', []);
        return _.get(_.find(object, (restriction) => _.has(restriction, 'required')), 'required', []);
    }

    private getForbiddenProperties(schema: Array<any>): Array<string> {
        let object = _.get(_.find(schema, (arg) => _.has(arg, 'allOf')), 'allOf', []);
        return _.get(_.find(object, (restriction) => _.has(restriction, 'not.required')), 'not.required', []);
    }

    private loadRemoteSchema(): Promise<Map<string, any>> {
        let self = this;
        return this.schema ?
            Promise.resolve(this.schema) :
            this.middlewareClient.callRpcMethod('discovery.get_schema').then(function(schema: any) {
                self.schema = new Map<string, any>();
                _.forIn(schema.definitions, (definition, type) => {
                    self.schema.set(_.upperFirst(_.camelCase(type)), definition);
                });
                return self.schema;
            });
    }
}
