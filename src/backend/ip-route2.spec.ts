import {IpRoute2} from "./ip-route2";
import {ExecPromised} from "./exec-promised";

describe('Class: IpRoute2', () => {
    describe('Addr', () => {
        describe('add', () => {
            it('runs "ip addr add ip/cidr dev interfaceName"', async () => {
                spyOn(ExecPromised, 'exec')
                    .and
                    .returnValue(Promise.resolve({stdout:'', stderr: ''}));
                const expectedIp = '1.2.3.4';
                const expectedCidr = 24;
                const expectedInterface = 'abc0';

                // when
                await IpRoute2.Addr.add(expectedIp, expectedCidr, expectedInterface);

                // then
                expect(ExecPromised.exec)
                    .toHaveBeenCalledWith(`ip addr add ${expectedIp}/${expectedCidr} dev ${expectedInterface}`);
            });
            it('does not add the address if it is already assigned', async () => {
                const expectedIp = '192.168.2.50';
                const expectedCidr = 24;
                const expectedInterface = 'ens3';
                spyOn(ExecPromised, 'exec')
                    .and
                    .callFake(cmd => cmd === `ip addr show dev ${expectedInterface}`
                        ? Promise.resolve({
                            stderr: '',
                            stdout: '3: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000\n' +
                            '    link/ether 52:54:00:fe:91:e4 brd ff:ff:ff:ff:ff:ff\n' +
                            '    inet 192.168.2.1/24 brd 255.255.255.0 scope global ens3\n' +
                            '       valid_lft forever preferred_lft forever\n' +
                            '    inet 192.168.2.50/24 scope global secondary ens3\n' +
                            '       valid_lft forever preferred_lft forever\n'
                        })
                        : Promise.resolve({stderr: '', stdout: ''}));

                // when
                await IpRoute2.Addr.add(expectedIp, expectedCidr, expectedInterface);

                // then
                expect(ExecPromised.exec)
                    .not
                    .toHaveBeenCalledWith(`ip addr add ${expectedIp}/${expectedCidr} dev ${expectedInterface}`);
            });
        });
        describe('del', () => {
            it('runs "ip addr del ip/cidr dev interfaceName"', async () => {
                spyOn(ExecPromised, 'exec')
                    .and
                    .returnValue(Promise.resolve());
                const expectedIp = '1.2.3.4';
                const expectedCidr = 24;
                const expectedInterface = 'abc0';

                // when
                await IpRoute2.Addr.del(expectedIp, expectedCidr, expectedInterface);

                // then
                expect(ExecPromised.exec)
                    .toHaveBeenCalledWith(`ip addr del ${expectedIp}/${expectedCidr} dev ${expectedInterface}`);
            });
        });
    });
});