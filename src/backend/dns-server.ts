import * as dnsd from 'dnsd';

import * as debugLog from 'debug';
const debug = debugLog('cheap-ingress:dns-server');

export class DnsServer {

    private dnsServer;

    private records = {};

    constructor(private domain: string,
                private port: number) {}

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
        const name = hostname.length > (2 + this.domain.length) && hostname.endsWith(`.${this.domain}`)
            ? hostname.substr(0, hostname.length - this.domain.length - 1)
            : hostname;
        this.records[name] = ip;
        return name;
    }

    public removeRecord(hostname: string, ip: string) {
        const name = hostname.length > (2 + this.domain.length) && hostname.endsWith(`.${this.domain}`)
            ? hostname.substr(0, hostname.length - this.domain.length - 1)
            : hostname;
        delete this.records[name];
    }

    private resolveDns(req, res) {
        const q = req.question[0];
        const dotEndQuery = q.name.endsWith('.');

        const qName = dotEndQuery
            ? q.name.substr(0, q.name.length - 1)
            : q.name;
        const fqdnQuery = qName.indexOf('.') !== -1;

        const qNames = fqdnQuery
            ? [qName]
            : [qName, `${qName}.${this.domain}`];

        const hits = Object.keys(this.records)
            .filter(key => qNames.filter(qName => qName === `${key}.${this.domain}`).length > 0);

        debug(`query type ${q.type} for ${q.name}: dotEndQuery=${dotEndQuery} qName=${qName} fqdnQuery=${fqdnQuery} qNames=${qNames.join(',')} hits=${hits.join(',')}`);

        if (hits.length === 0) {
            res.end();
            return;
        }

        const answers = hits.map(hit => ({
            type: 'A',
            ttl: 1,
            data: this.records[hit],
            name: dotEndQuery
                ? qName
                : `${hit}.${this.domain}`
        }));
        res.answer.push(...answers);
        res.end();
    }
}