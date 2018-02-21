import {exec} from "child_process";

export class ExecPromised {
    public static exec(cmd: string): Promise<CmdResult> {
        return new Promise(((resolve, reject) =>
            exec(cmd, ((error, stdout, stderr) => {
                if (error) return reject({stdout, stderr, code: error['code']});
                return resolve({stdout, stderr, code: 0});
            }))))
    }
}

export interface CmdResult {
    stdout: string;
    stderr: string;
    code: number;
}
