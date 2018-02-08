import {CheapBackend} from "./index";
import {CheapIpPool} from "../cheap-router/ip-service";

export class NullBackend implements CheapBackend {

    start(): Promise<CheapBackend> {
        return Promise.resolve(this);
    }

    shutdown(): Promise<void> {
        return Promise.resolve();
    }

    private ipPool: CheapIpPool = new CheapIpPool('10.2.3.', 10, 20);

    getIpPool(): Promise<CheapIpPool> {
        return Promise.resolve(this.ipPool);
    }

    allocateIp(ip: string): Promise<any> {
        return Promise.resolve('dummy');
    }

    releaseIp(ip: string): Promise<any> {
        return Promise.resolve('dummy');
    }

    associateIp(ip: string, hostname: string): Promise<any> {
        return Promise.resolve(hostname);
    }

    disassociateIp(ip: string, hostname: string): Promise<any> {
        return Promise.resolve('dummy');
    }

    enableRoute(ip: string, port: number, nodePort: number, protocol: string): Promise<any> {
        return Promise.resolve('dummy');
    }

    disableRoute(ip: string, port: number, nodePort: number, protocol: string): Promise<any> {
        return Promise.resolve('dummy');
    }

}
