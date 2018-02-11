import {Util} from "./util";

export class Persistence {
    public state: PersistedState[] = [];
    constructor(private filename: string) {
    }

    public load(): Promise<void> {
        return Util.readFilePromise(this.filename)
            .then(JSON.parse)
            .then(data => data.map(storedItem =>
                new PersistedState(
                    storedItem.hostname,
                    storedItem.protocol,
                    storedItem.port,
                    storedItem.nodePort)))
            .then(state => this.state = state);
    }


    private store(): Promise<void> {
        return Util.writeFilePromise(this.filename, JSON.stringify(this.state));
    }

    public remove(hostname:string, protocol: string, port: number, nodePort: number): Promise<void> {
        const thisItem = new PersistedState(hostname, protocol, port, nodePort);
        this.state = this.state.filter(item => !item.equals(thisItem));
        return this.store();
    };

    public add(hostname:string, protocol: string, port: number, nodePort: number): Promise<void> {
        const thisItem = new PersistedState(hostname, protocol, port, nodePort);
        if (this.state.filter(item => item.equals(thisItem)).length>0) return Promise.resolve();
        this.state.push(thisItem);
        return this.store();
    };

}

export class PersistedState {
    constructor(public hostname: string,
                public protocol: string,
                public port: number,
                public nodePort: number) {
    }

    public equals(o: PersistedState): boolean {
        return this.hostname === o.hostname
            && this.protocol === o.protocol
            && this.port === o.port
            && this.nodePort === o.nodePort;
    }
}
