import {CheapBackend} from "./index";
import {CheapRouter} from "./router";
import {CheapIpPool} from "../cheap-router/ip-service";
import {NodeService} from "./node-service";

import * as debugLog from 'debug';
const debug = debugLog('cheap-ingress:fake-userspace-backend');

export class FakeUserspaceBackend implements CheapBackend {

    private routers = {};

    private nodeService: NodeService = new NodeService();
    private ipPool: CheapIpPool = new CheapIpPool('127.0.1.', 10, 20);

    start(): Promise<CheapBackend> {
        debug('starting');
        return this.nodeService.start()
            .then(() => this);
    }

    shutdown(): Promise<void> {
        debug('shutting down');
        return this.nodeService.shutdown();
    }

    getIpPool(): Promise<CheapIpPool> {
        return Promise.resolve(this.ipPool);
    }

    allocateIp(ip: string): Promise<any> {
        return Promise.resolve();
    }

    releaseIp(ip: string): Promise<any> {
        return Promise.resolve();
    }

    associateIp(ip: string, hostname: string): Promise<any> {
        return Promise.resolve();
    }

    disassociateIp(ip: string, hostname: string): Promise<any> {
        return Promise.resolve();
    }

    enableRoute(ip: string, port: number, nodePort: number, protocol: string): Promise<any> {
        const target = `${ip}:${port}/${protocol}`;
        const cheapRouter = new CheapRouter(ip, port, nodePort, protocol, this.nodeService);
        this.routers[target] = cheapRouter;

        return cheapRouter.start();
    }

    disableRoute(ip: string, port: number, nodePort: number, protocol: string): Promise<any> {
        const target = `${ip}:${port}/${protocol}`;
        const router: CheapRouter = this.routers[target];
        if (router === undefined) {
            return Promise.reject(`router not found for route ${target}`);
        }

        return router.shutdown();
    }

}