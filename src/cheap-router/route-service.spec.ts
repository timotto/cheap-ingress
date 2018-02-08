import {DnsService} from "./dns-service";
import {IpService} from "./ip-service";
import {RouteService} from "./route-service";
import {NullBackend} from "../backend/util.spec";

describe('RouteService', () => {
    let unitUnderTest: RouteService;
    let dnsService: DnsService;
    let ipService: IpService;
    beforeEach(async () => {
        const backend = await new NullBackend().start();
        ipService = await new IpService(backend).start();
        dnsService = await new DnsService(backend, ipService).start();
        unitUnderTest = await new RouteService(backend, dnsService).start();
    });
    afterEach(async () => {
        await unitUnderTest.shutdown();
        await dnsService.shutdown();
        await ipService.shutdown();
    });
    it('rejects allocation of the same hostname:port twice', async () => {
        await unitUnderTest.allocate(1, 'host', 'tcp', 2);
        try {
            await unitUnderTest.allocate(2, 'host', 'tcp',  2);
            fail();
        } catch (e) {
        }
    });
    describe('release', () => {
        it('rejects if the given route is not allocated', async () => {
            await unitUnderTest.release(1, 'host', 'tcp', 2)
                .then(() => fail())
                .catch(e => expect(e).toEqual('route host:2/tcp is not allocated'));
        });
        it('rejects if the given route is allocated to a different nodePort', async () => {

            // given
            const sameHostname = 'host';
            const sameProtocol = 'tcp';
            const samePort = 2;

            const actualNodePort = 1000;
            const differentNodePort = 1;

            await unitUnderTest.allocate(actualNodePort, sameHostname, sameProtocol, samePort);

            // when
            await unitUnderTest.release(differentNodePort, sameHostname, sameProtocol, samePort)
                .then(() => fail())
                // then
                .catch(e =>
                    expect(e)
                        .toEqual('route host:2/tcp has different nodePort than 1'));
        });
        it('does not release the DNS entry if there are other routes to the same host with different ports', async () => {
            const spy = spyOn((unitUnderTest as any).dnsService, 'release');

            // given
            const sameHostname = 'host';
            const sameProtocol = 'tcp';
            const oneNodeport = 314;
            const anotherNodeport = 123;
            const onePort = 2;
            const anotherPort = 2000;

            await unitUnderTest.allocate(oneNodeport, sameHostname, sameProtocol, onePort);
            await unitUnderTest.allocate(anotherNodeport, sameHostname, sameProtocol, anotherPort);

            // when
            await unitUnderTest.release(oneNodeport, sameHostname, sameProtocol, onePort);

            // then
            expect(spy).toHaveBeenCalledTimes(0);
        });
    });
});