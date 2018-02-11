import {CheapBackend} from "./index";
import {CheapIpPool} from "../cheap-router/ip-service";
import {NodeService} from "./node-service";

import {exec} from "child_process";
import {DnsServer} from "./dns-server";
import {Util} from "../util";
import * as fs from 'fs';

class CmdResult { constructor(readonly stdout: string, readonly stderr: string) {} }

const syncAsyncExec = (cmd): Promise<CmdResult> => new Promise(((resolve, reject) => exec(cmd, ((error, stdout, stderr) => {
    if (error) return reject(error);
    return resolve(new CmdResult(stdout, stderr));
}))));

const writeFilePromise = (filename: string, content: string): Promise<void> =>
    new Promise(((resolve, reject) =>
        fs.writeFile(filename, content, err =>
            err !== undefined ? reject(err) : resolve())));

export class LinuxKernelBackend implements CheapBackend {

    private nodeService: NodeService = new NodeService();
    private dnsServer: DnsServer = new DnsServer(
        Util.envOrDefault('DOMAIN', 'cheap-ingress.local'),
        parseInt(Util.envOrDefault('DNS_PORT', '53')));
    private ipPool: CheapIpPool;

    private interfaceName: string;

    constructor() {
        this.interfaceName = Util.envOrDefault('INTERFACE', 'eth0');
        this.ipPool = new CheapIpPool(
            Util.envOrDefault('IPPOOL_PREFIX', '169.254.123.'),
            parseInt(Util.envOrDefault('IPPOOL_HOSTMIN', '100')),
            parseInt(Util.envOrDefault('IPPOOL_HOSTMAX', '200')));
    }

    start(): Promise<CheapBackend> {
        return writeFilePromise('/proc/sys/net/ipv4/ip_forward', '1')
            .then(() => this.nodeService.start())
            .then(() => this.dnsServer.start())
            .then(() => syncAsyncExec('iptables -t nat -A POSTROUTING -j MASQUERADE'))
            .then(() => this);
    }

    shutdown(): Promise<void> {
        return syncAsyncExec('iptables -t nat -D POSTROUTING -j MASQUERADE')
            .then(() => this.dnsServer.shutdown())
            .then(() => this.nodeService.shutdown());
    }

    getIpPool(): Promise<CheapIpPool> {
        return Promise.resolve(this.ipPool);
    }

    allocateIp(ip: string): Promise<any> {
        return syncAsyncExec(`ip addr add ${ip}/${this.ipPool.networkSize} dev ${this.interfaceName}`);
    }

    releaseIp(ip: string): Promise<any> {
        return syncAsyncExec(`ip addr del ${ip}/${this.ipPool.networkSize} dev ${this.interfaceName}`);
    }

    associateIp(ip: string, hostname: string): Promise<string> {
        return Promise.resolve(this.dnsServer.addRecord(hostname, ip));
    }

    disassociateIp(ip: string, hostname: string): Promise<any> {
        this.dnsServer.removeRecord(hostname, ip);
        return Promise.resolve();
    }

    enableRoute(ip: string, port: number, nodePort: number, protocol: string): Promise<any> {
        return Promise.all(this.nodeService.backends
            .map((backend, index, all) => this.makeIpTablesRule('A', backend, index, all, ip, port, nodePort, protocol))
            .map(syncAsyncExec));
    }

    disableRoute(ip: string, port: number, nodePort: number, protocol: string): Promise<any> {
        return Promise.all(this.nodeService.backends
            .map((backend, index, all) => this.makeIpTablesRule('D', backend, index, all, ip, port, nodePort, protocol))
            .map(syncAsyncExec));
    }

    private makeIpTablesRule(command: string, backend: string, index: number, all: string[], ip: string, port: number, nodePort: number, protocol: string): string {
        const filter = index===all.length-1?'':`-m statistic --mode nth --every ${all.length - index} --packet 1 `;
        return `iptables -t nat -${command} PREROUTING -p ${protocol} -d ${ip} --dport ${port} -m state --state NEW ${filter} -j DNAT --to-destination ${backend}:${nodePort}`;
    }

}