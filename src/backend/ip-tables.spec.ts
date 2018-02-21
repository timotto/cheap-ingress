import {IpTables, IpTablesRule} from "./ip-tables";
import {ExecPromised} from "./exec-promised";

describe('Class: IpTables', () => {
    let unitUnderTest: IpTables;
    beforeEach(() => {
        unitUnderTest = new IpTables();
    });

    describe('Static Function: add', () => {
        it('adds a spec, checks if the spec already exists first', async () => {
            spyOn(ExecPromised, 'exec')
                .and.returnValues(
                Promise.reject(undefined),
                Promise.resolve(undefined));
            // given
            const expectedTable = 'expected-table';
            const expectedChain = 'expected-chain';
            const expectedSpec = 'expected-spec';
            const givenRule: IpTablesRule = {
                table: expectedTable,
                chain: expectedChain,
                spec: expectedSpec
            };

            // when
            await IpTables.add(givenRule);

            // then
            expect(ExecPromised.exec).toHaveBeenCalledTimes(2);
            expect(ExecPromised.exec).toHaveBeenCalledWith(`iptables -t ${expectedTable} -C ${expectedChain} ${expectedSpec}`);
            expect(ExecPromised.exec).toHaveBeenCalledWith(`iptables -t ${expectedTable} -A ${expectedChain} ${expectedSpec}`);
        });
    });
    describe('Static Function: delete', () => {
        it('deletes a spec', async () => {
            spyOn(ExecPromised, 'exec')
                .and.returnValues(
                Promise.resolve(undefined));
            // given
            const expectedTable = 'expected-table';
            const expectedChain = 'expected-chain';
            const expectedSpec = 'expected-spec';
            const givenRule: IpTablesRule = {
                table: expectedTable,
                chain: expectedChain,
                spec: expectedSpec
            };

            // when
            await IpTables.delete(givenRule);

            // then
            expect(ExecPromised.exec).toHaveBeenCalledTimes(1);
            expect(ExecPromised.exec).toHaveBeenCalledWith(`iptables -t ${expectedTable} -D ${expectedChain} ${expectedSpec}`);
        });
    });
    describe('Static Function: tableChainCommand', () => {
        it('runs the matching iptables command', async () => {
            spyOn(ExecPromised, 'exec')
                .and.returnValues(
                Promise.resolve(undefined));

            // given
            const expectedCommand = 'expected-command';
            const expectedTable = 'expected-table';
            const expectedChain = 'expected-chain';
            const expectedSpec = 'expected-spec';

            // when
            await IpTables.tableChainCommand(expectedCommand, expectedTable, expectedChain, expectedSpec);

            expect(ExecPromised.exec)
                .toHaveBeenCalledWith(`iptables -t ${expectedTable} -${expectedCommand} ${expectedChain} ${expectedSpec}`);
        });
    });
});