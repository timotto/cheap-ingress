import * as dnsd from 'dnsd';

import * as debugLog from 'debug';
const debug = debugLog('cheap-ingress:dns-server');

export class DnsServer {

    private dnsServer;

    private records = {};

    constructor(private domain: string,
                private port: number = 53) {}

    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dnsServer = dnsd.createServer((req, res) => this.resolveDns(req, res));
            this.dnsServer.listen(this.port, (err) => reject(err));
            resolve();
        });
    }

    public shutdown(): Promise<void> {
        this.dnsServer.close();
        return Promise.resolve()
    }

    public addRecord(hostname: string, ip: string): string {
        const name = (
            hostname.length > ( 2 + this.domain.length )
            && hostname.lastIndexOf(`.${this.domain}`)
            === hostname.length - 1 - this.domain.length)
            ? hostname
            : `${hostname}.${this.domain}`;
        this.records[name] = ip;
        return name;
    }

    public removeRecord(hostname: string, ip: string) {
        delete this.records[`${hostname}.${this.domain}`];
    }

    private resolveDns(req, res) {
        const q = req.question[0];
        const name = q.name.charAt(q.name.length-1) === '.'
            ?`${q.name}${this.domain}`
            :q.name;
        debug(`query type ${q.type} for ${name} (${q.name})`);
        if (q.type === 'A' && this.records[name] !== undefined) {
            res.answer.push({name:q.name, type:'A', data:this.records[name], 'ttl': 1})
        }
        res.end();
    }
}