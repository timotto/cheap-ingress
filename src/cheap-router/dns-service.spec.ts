import {DnsEntry, DnsService} from "./dns-service";
import {CheapIp, IpService} from "./ip-service";
import {NullBackend} from "../backend/util.spec";

describe('DnsService', () => {
    let unitUnderTest: DnsService;
    let ipService: IpService;
    beforeEach(async () => {
        const backend = await new NullBackend().start();
        ipService = await new IpService(backend).start();
        unitUnderTest = await new DnsService(backend, ipService).start();
    });
    afterEach(async () => {
        await unitUnderTest.shutdown();
        await ipService.shutdown();
    });
    it('allocates different IPs for different hosts', async () => {
        const result1 = await unitUnderTest.allocate('host1');
        const result2 = await unitUnderTest.allocate('host2');

        expect(result1.ip.ip).not.toEqual(result2.ip.ip);
    });
    it('rejects allocation of the same host twice', async () => {
        await unitUnderTest.allocate('test-host');
        try {
            await unitUnderTest.allocate('test-host');
            fail();
        } catch (e) {
        }
    });
    describe('release', () => {
        it('rejects if the hostname is not allocated', async () => {
            await unitUnderTest.release(new DnsEntry(new CheapIp('1.2.3.4'), 'undefined'))
                .then(() => fail('expected rejection but got resolved'))
                .catch(e => expect(e).toEqual('hostname undefined is not allocated'));
        })
    });
});