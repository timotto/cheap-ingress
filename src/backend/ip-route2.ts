import {CmdResult, ExecPromised} from "./exec-promised";

export class IpRoute2 {
    public static Addr = {
        add: (ip: string, cidr: number, interfaceName: string): Promise<CmdResult> =>
            ExecPromised.exec(`ip addr show dev ${interfaceName}`)
                .then(result => result.stdout.indexOf(`inet ${ip}/${cidr} `) === -1
                    ? ExecPromised.exec(`ip addr add ${ip}/${cidr} dev ${interfaceName}`)
                    : Promise.resolve({stdout: '', stderr: '', code: 0})),

        del: (ip: string, cidr: number, interfaceName: string): Promise<CmdResult> =>
            ExecPromised.exec(`ip addr del ${ip}/${cidr} dev ${interfaceName}`)
    };

}