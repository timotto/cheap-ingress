import {CheapIp, IpService} from "./ip-service";

import * as debugLog from 'debug';
import {CheapBackend} from "../backend";
const debug = debugLog('cheap-ingress:dns-service');

export class DnsService {

    private dnsRecords: any = {};

    constructor(private backend: CheapBackend,
                private ipService: IpService) {
    }

    public start(): Promise<DnsService> {
        debug('started');
        return Promise.resolve(this);
    }

    public shutdown(): Promise<void> {
        const keys = Object.keys(this.dnsRecords);
        debug(`shutting down ${keys.length} allocations`);
        return Promise.all(keys
            .map(key => this.dnsRecords[key])
            .map(dnsEntry => this.release(dnsEntry)))
            .then(() => undefined);
    }

    public allocate(hostname: string): Promise<DnsEntry> {
        if (this.dnsRecords[hostname] !== undefined) return Promise.reject(`hostname ${hostname} already taken`);
        return this.ipService.allocate()
            .then(ip => {

                return this.backend.associateIp(ip.ip, hostname)
                    .then(allocatedHostname => {

                        const dnsEntry = new DnsEntry(ip, allocatedHostname);
                        this.dnsRecords[allocatedHostname] = dnsEntry;
                        debug(`allocated ${dnsEntry.fqdn} to ${dnsEntry.ip.ip}`);
                        return dnsEntry;
                    });
            });
    }

    public resolve(hostname: string): Promise<DnsEntry|undefined> {
        return Promise.resolve(this.dnsRecords[hostname]);
    }

    public release(dnsEntry: DnsEntry): Promise<void> {
        if(this.dnsRecords[dnsEntry.fqdn] === undefined) return Promise.reject(`hostname ${dnsEntry.fqdn} is not allocated`);

        return this.backend.disassociateIp(dnsEntry.ip.ip, dnsEntry.fqdn)
            .then(() => {
                delete this.dnsRecords[dnsEntry.fqdn];
                debug(`released ${dnsEntry.fqdn} to ${dnsEntry.ip.ip}`);})
            .then(() => this.ipService.release(dnsEntry.ip));
    }
}

export class DnsEntry {
    constructor(public ip: CheapIp,
                public fqdn: string) {
    }
}