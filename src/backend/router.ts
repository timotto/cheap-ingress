import {createServer, createConnection, Server, Socket} from "net";
import {NodeService} from "./node-service";

import * as debugLog from 'debug';
const debug = debugLog('cheap-ingress:cheap-router');

export class CheapRouter {
    private server: Server;
    private proxySockets: Socket[] = [];

    constructor(private ip: string,
                private port: number,
                private nodePort: number,
                private protocol: string,
                private nodeService: NodeService) {
    }

    public start(): Promise<void> {
        return new Promise(((resolve, reject) => {
            this.server = createServer(socket => this.socketHandler(socket));
            this.server.listen(this.port);
            // this.server.listen(this.port, this.ip);
            this.server.on('listening', () => {
                debug(`listening on ${this.ip}:${this.port} to [${this.nodeService.backends.join(',')}]:${this.nodePort}`);
                resolve();
            });
            this.server.on('error', error => reject(error));
        }));
    }

    public shutdown(): Promise<void> {
        debug(`shutting down ${this.ip}:${this.port} to [${this.nodeService.backends.join(',')}]:${this.nodePort}`);
        return Promise.all(this.proxySockets.map(socket => this.terminateSocket(socket)))
            .then(() => new Promise<void>(resolve => this.server.close(resolve)));
    }

    private terminateSocket(socket: Socket): Promise<void> {
        debug(`terminating ${socket.address().address}:${socket.address().port} via ${this.ip}:${this.port} to [${this.nodeService.backends}]:${this.nodePort}`);
        return new Promise(resolve => socket.end(undefined, () => resolve()));
    }
    private socketHandler(socket: Socket) {
        const backend = this.nodeService.nextBackend;
        debug(`opening tunnel to ${backend}:${this.nodePort}`);
        const connection: Socket = createConnection(this.nodePort, backend);
        connection.on('end', () => {
            this.proxySockets = this.proxySockets.filter(proxySocket => proxySocket !== connection);
            socket.end();
        });
        connection.on('error', error => {
            console.log(`tunnel to ${backend}:${this.port} failed: ${error.message}`);
            socket.end();
        });
        socket.on('end', () => {
            connection.end();
        });
        connection.pipe(socket);
        socket.pipe(connection);
        this.proxySockets.push(connection);
    }
}