import {DnsServer} from "./dns-server";

const dnsServerPort = 10053;
const dnsDomain = 'test.domain';

describe('DnsServer', () => {

    let unitUnderTest: DnsServer;

    beforeEach(async () => {
        unitUnderTest = new DnsServer(dnsDomain, dnsServerPort);
        await unitUnderTest.start();
    });

    afterEach(async () => {
        await unitUnderTest.shutdown();
    });

    describe('addRecord', () => {
        it('appends the domain if the hostname does not have it', () => {
            const hostname = 'hostname';
            const ip = '1.2.3.4';
            const expectedDomain = `${hostname}.${dnsDomain}`;

            const actualDomain = unitUnderTest.addRecord(hostname, ip);
            expect(actualDomain).toBe(expectedDomain);
        });

        it('does not append the domain if the hostname already has it', () => {
            const ip = '1.2.3.4';
            const expectedDomain = `expected.${dnsDomain}`;

            const actualDomain = unitUnderTest.addRecord(expectedDomain, ip);
            expect(actualDomain).toBe(expectedDomain);
        });
    });
});