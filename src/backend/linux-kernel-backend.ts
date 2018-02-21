import {CheapBackend} from "./index";
import {CheapIpPool} from "../cheap-router/ip-service";
import {NodeService} from "./node-service";

import {DnsServer} from "./dns-server";
import {Util} from "../util";
import {IpTables, IpTablesRule} from "./ip-tables";
import {IpRoute2} from "./ip-route2";

export class LinuxKernelBackend implements CheapBackend {

    private staticRules: IpTablesRule[];
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

        this.staticRules = [
            {table: 'filter', chain: 'FORWARD', spec: `-i ${this.interfaceName} -j ACCEPT`},
            {table: 'filter', chain: 'FORWARD', spec: `-o ${this.interfaceName} -j ACCEPT`},
            {table: 'nat', chain: 'POSTROUTING', spec: '-j MASQUERADE'},
        ];
    }

    start(): Promise<CheapBackend> {
        return Util.writeFilePromise('/proc/sys/net/ipv4/ip_forward', '1')
            .then(() => this.nodeService.start())
            .then(() => this.dnsServer.start())
            .then(() => Promise.all(this.staticRules.map(rule => IpTables.add(rule))))
            .then(() => this);
    }

    shutdown(): Promise<void> {
        return Promise.all(this.staticRules.map(rule => IpTables.delete(rule)))
            .then(() => this.dnsServer.shutdown())
            .then(() => this.nodeService.shutdown());
    }

    getIpPool(): Promise<CheapIpPool> {
        return Promise.resolve(this.ipPool);
    }

    allocateIp(ip: string): Promise<any> {
        return IpRoute2.Addr.add(ip, this.ipPool.networkSize, this.interfaceName);
    }

    releaseIp(ip: string): Promise<any> {
        return IpRoute2.Addr.del(ip, this.ipPool.networkSize, this.interfaceName);
    }

    associateIp(ip: string, hostname: string): Promise<string> {
        return Promise.resolve(this.dnsServer.addRecord(hostname, ip));
    }

    disassociateIp(ip: string, hostname: string): Promise<any> {
        this.dnsServer.removeRecord(hostname, ip);
        return Promise.resolve();
    }

    enableRoute(ip: string, port: number, nodePort: number, protocol: string): Promise<any> {
        return this.manipulateRoute(IpTables.add, ip, port, nodePort, protocol);
    }

    disableRoute(ip: string, port: number, nodePort: number, protocol: string): Promise<any> {
        return this.manipulateRoute(IpTables.delete, ip, port, nodePort, protocol);
    }

    manipulateRoute(cmd: (rule: IpTablesRule) => Promise<any>,
                    ip: string, port: number, nodePort: number, protocol: string): Promise<any> {
        return Promise.all(this.nodeService.backends
            .map((backend, index, all) =>
                cmd(LinuxKernelBackend.makeForwardingRule(
                    backend, index, all, ip, port, nodePort, protocol))));
    }

    private static makeForwardingRule(backend: string, index: number, all: string[], ip: string, port: number, nodePort: number, protocol: string): IpTablesRule {
        const filter = index === all.length-1
            ?''
            :`-m statistic --mode nth --every ${all.length - index} --packet 1 `;

        const spec = `-p ${protocol} -d ${ip} --dport ${port} -m state --state NEW ${filter} -j DNAT --to-destination ${backend}:${nodePort}`;

        return {
            table: 'nat',
            chain: 'PREROUTING',
            spec: spec
        };
    }
}