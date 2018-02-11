import {Router} from 'express';
import {RouteService} from "../cheap-router/route-service";
import {DnsService} from "../cheap-router/dns-service";
import {IpService} from "../cheap-router/ip-service";
import {CheapBackend} from "../backend";

import * as debugModule from 'debug';
import {LinuxKernelBackend} from "../backend/linux-kernel-backend";
const debug = debugModule('cheap-ingress:route-handler');

const handler: Router = Router();

let backend: CheapBackend;
let ipService: IpService;
let dnsService: DnsService;
let routeService: RouteService;

const startup = async () => {
    // backend = await new FakeUserspaceBackend().start();
    backend = await new LinuxKernelBackend().start();
    ipService = await new IpService(backend).start();
    dnsService = await new DnsService(backend, ipService).start();
    routeService = await new RouteService(backend, dnsService).start();

    handler.post('/route', postHandler);
    handler.delete('/route', deleteHandler);
};

const shutdown = async () => {
    await routeService.shutdown();
    await dnsService.shutdown();
    await ipService.shutdown();
    await backend.shutdown();
};

const postHandler = (req,res) => {
    const hostname = req.body.hostname;
    const port = req.body.port;
    const protocol = req.body.protocol.toLowerCase();
    const nodePort = req.body.nodePort;

    if (hostname === undefined || nodePort === undefined || port === undefined || protocol === undefined) {
        return reportError(res, 'need hostname, port, protocol, and nodePort');
    }

    routeService.allocate(nodePort, hostname, protocol, port)
        .then(allocation => res.json({status: 'ok', allocation: allocation}))
        .catch(error => reportError(res, error));
};

const deleteHandler = (req, res) => {
    const hostname = req.body.hostname;
    const port = req.body.port;
    const protocol = req.body.protocol.toLowerCase();
    const nodePort = req.body.nodePort;

    if (hostname === undefined || nodePort === undefined || port === undefined || protocol === undefined) {
        return reportError(res, 'need hostname, port, protocol, and nodePort');
    }

    routeService.release(nodePort, hostname, protocol, port)
        .then(() => res.json({status: 'ok'}))
        .catch(error => reportError(res, error));
};

const reportError = (res, error: Error | string) => {
    console.error(error);
    res.status(500).json({error: (error instanceof Error) ? error.message : error});
};

startup()
    .then(() => debug('router started'))
    .catch(error => {
        debug(`router startup failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    });

handler['shutdown'] = shutdown;

export default handler;
