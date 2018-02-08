import * as debugLog from 'debug';
import {CheapBackend} from "../backend";
const debug = debugLog('cheap-ingress:ip-service');

export class IpService {

    private ipPool: CheapIpPool;
    private allocated: number[] = [];

    constructor(private backend: CheapBackend) {
    }

    public start(): Promise<IpService> {
        return this.backend.getIpPool()
            .then(ipPool => {
                this.ipPool = ipPool;
                debug('started');
                return this;
            })
    }

    public shutdown(): Promise<void> {
        debug(`shutting down ${this.allocated.length} allocations`);
        return Promise.all(this.allocated.map(port => this.release(new CheapIp(this.ipPool.hostNumToIpString(port)))))
            .then(() => undefined);
    }

    public allocate(): Promise<CheapIp> {
        for(let host: number = this.ipPool.hostMin; host < this.ipPool.hostMax; host++) {
            const alreadyAllocated = this.allocated.filter(allocatedHost => allocatedHost === host).length > 0;
            if(!alreadyAllocated) {
                const ip = new CheapIp(this.ipPool.hostNumToIpString(host));

                return this.backend.allocateIp(ip.ip)
                    .then(() => {
                        this.allocated.push(host);
                        debug(`allocated ip ${ip.ip}`);
                        return ip;
                    });
            }
        }
        return Promise.reject('pool exhausted');
    }

    public release(ip: CheapIp): Promise<void> {
        debug(`release ip ${ip.ip}`);
        return this.ipPool.ipStringToHostNum(ip.ip)
            .then(hostNum => {
                const alreadyAllocated = this.allocated.filter(allocatedHost => allocatedHost === hostNum).length > 0;
                if (!alreadyAllocated)
                    throw `ip ${ip.ip} is not allocated`;
                return this.backend.releaseIp(ip.ip)
                    .then(() => this.allocated = this.allocated.filter(allocatedHost => allocatedHost !== hostNum))
                    .then(() => undefined);
            });
    }
}

export class CheapIp {
    constructor(readonly ip: string) {

    }
}

export class CheapIpPool {
    constructor(readonly prefixString: string,
                readonly hostMin: number,
                readonly hostMax: number) {
        if (hostMax < 0) throw new Error('histMin must be >= 0 and <= 255');
        if (hostMin < 0) throw new Error('histMin must be >= 0 and <= 255');
        if (hostMax < hostMin) throw new Error('hostMax cannot be smaller than hostMin');
        if (hostMin > 255) throw new Error('histMin must be >= 0 and <= 255');
        if (hostMax > 255) throw new Error('histMin must be >= 0 and <= 255');
    }

    public hostNumToIpString(hostNum: number): string {
        return `${this.prefixString}${hostNum}`;
    }

    public ipStringToHostNum(ipString: string): Promise<number> {
        if(ipString.indexOf(this.prefixString)!==0) return Promise.reject(`invalid ipString: ${ipString}`);

        return Promise.resolve(parseInt(ipString.substr(this.prefixString.length)));
    }

    public get networkSize(): number {
        return 24;
    }
}