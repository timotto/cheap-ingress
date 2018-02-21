import {CmdResult, ExecPromised} from "./exec-promised";

export interface IpTablesRule {
    table: string;
    chain: string;
    spec: string;
}

export class IpTables {
    public static add(rule: IpTablesRule): Promise<CmdResult> {
        return IpTables.tableChainCommand(
            'C', rule.table, rule.chain, rule.spec)
            .catch(() =>
                IpTables.tableChainCommand(
                    'A', rule.table, rule.chain, rule.spec));
    }
    public static delete(rule: IpTablesRule): Promise<CmdResult> {
        return IpTables.tableChainCommand(
            'D', rule.table, rule.chain, rule.spec);
    }
    static tableChainCommand(command: string, table: string, chain: string, spec: string): Promise<CmdResult> {
        return ExecPromised
            .exec(`iptables -t ${table} -${command} ${chain} ${spec}`);
    }
}