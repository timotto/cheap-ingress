import {CheapIpPool} from "../cheap-router/ip-service";

export interface CheapBackend {

    start(): Promise<CheapBackend>;
    shutdown(): Promise<void>;

    getIpPool(): Promise<CheapIpPool>;

    allocateIp(ip: string): Promise<any>;
    releaseIp(ip: string): Promise<any>;

    associateIp(ip: string, hostname: string): Promise<string>;
    disassociateIp(ip: string, hostname: string): Promise<any>;

    enableRoute(ip: string, port: number, nodePort: number, protocol: string): Promise<any>;
    disableRoute(ip: string, port: number, nodePort: number, protocol: string): Promise<any>;
}
