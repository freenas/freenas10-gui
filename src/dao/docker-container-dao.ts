import { AbstractDao } from './abstract-dao';
import {Model} from '../model';

export class DockerContainerDao extends AbstractDao {

    public constructor() {
        super(Model.DockerContainer, {
            eventName: 'entity-subscriber.docker.container.changed'
        });
    }

    public requestInteractiveConsole(containerId: string): Promise<string> {
        return this.middlewareClient.callRpcMethod('docker.container.request_interactive_console', [containerId]);
    }

    public requestSerialConsole(containerId: string): Promise<string> {
        return this.middlewareClient.callRpcMethod('docker.container.request_serial_console', [containerId]);
    }

    public start(container: any) {
        return this.middlewareClient.submitTask('docker.container.start', [container.id]);
    }

    public stop(container: any) {
        return this.middlewareClient.submitTask('docker.container.stop', [container.id]);
    }

    public restart(container: any) {
        return this.middlewareClient.submitTask('docker.container.restart', [container.id]);
    }

    public generateMacAddress() {
        return this.middlewareClient.callRpcMethod("vm.generate_mac");
    }
}
