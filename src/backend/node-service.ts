import {Util} from "../util";

const staticBackends = Util.envOrDefault(
    'NODES',
    ['169.254.123.125','169.254.123.126','169.254.123.127'].join(' '))
    .split(' ');

export class NodeService {

    private backendIndex = 0;

    public start(): Promise<NodeService> {
        return Promise.resolve(this);
    }

    public shutdown(): Promise<void> {
        return Promise.resolve();
    }

    public get backends(): string[] {
        return staticBackends;
    }

    public get nextBackend(): string {
        const backend = this.backends[this.backendIndex];
        this.backendIndex = (this.backendIndex+1)%this.backends.length;
        return backend;
    }
}