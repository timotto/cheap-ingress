import {DnsEntry, DnsService} from "./dns-service";

import * as debugLog from 'debug';
import {CheapBackend} from "../backend/index";
const debug = debugLog('cheap-ingress:route-service');

export class RouteService {

    private routes = {};

    constructor(private backend: CheapBackend,
                private dnsService: DnsService) {
    }

    public start(): Promise<RouteService> {
        debug('started');
        return Promise.resolve(this);
    }

    public shutdown(): Promise<void> {
        debug(`shutting down ${Object.keys(this.routes).length} allocations`);
        return Promise.all(Object.keys(this.routes)
            .map(key => this.routes[key])
            .map((route: CheapRoute) =>
                this.release(route.nodePort, route.target.dnsEntry.fqdn, route.target.protocol, route.target.port)))
            .then(() => undefined);
    }

    public allocate(nodePort: number, hostname: string, protocol: string, port: number): Promise<CheapRoute> {
        return this.dnsService.resolve(hostname)
            .then(dnsEntry => {
                if (dnsEntry === undefined)
                    return this.dnsService.allocate(hostname);
                return dnsEntry;
            })
            .then(dnsEntry => {
                const target = `${dnsEntry.fqdn}:${port}/${protocol}`;
                if (this.routes[target] !== undefined) throw new Error(`route ${target} is already in use`);

                const cheapTarget = new CheapTarget(dnsEntry, protocol, port);
                const cheapRoute = new CheapRoute(nodePort, cheapTarget);

                return this.backend.enableRoute(cheapTarget.dnsEntry.ip.ip, cheapTarget.port, nodePort, cheapTarget.protocol)
                    .then(() => {
                        this.routes[target] = cheapRoute;

                        debug(`allocated ${target} to ${nodePort}`);
                        return cheapRoute;
                    });
            });
    }

    public release(nodePort: number, hostname: string, protocol: string, port: number): Promise<void> {
        const target = `${hostname}:${port}/${protocol}`;
        if(this.routes[target] === undefined) return Promise.reject(`route ${target} is not allocated`);

        const route: CheapRoute = this.routes[target];
        if (route.nodePort !== nodePort) return Promise.reject(`route ${target} has different nodePort than ${nodePort}`);

        return this.backend.disableRoute(route.target.dnsEntry.ip.ip, route.target.port, nodePort, protocol)
            .then(() => {
                delete this.routes[target];

                debug(`released ${target} to ${nodePort}`);
                const alternatePorts = Object.keys(this.routes)
                    .map(key => key.split(':')[0])
                    .filter(routeHost => routeHost === hostname)
                    .length > 0;
                if (alternatePorts) return undefined;

                return this.dnsService.release(route.target.dnsEntry);
            });
    }
}

export class CheapRoute {
    constructor(readonly nodePort: number,
                readonly target: CheapTarget) {

    }
}

export class CheapTarget {
    constructor(readonly dnsEntry: DnsEntry,
                readonly protocol: string,
                readonly port: number) {

    }
}