import {CheapIp, CheapIpPool, IpService} from "./ip-service";
import {CheapBackend, } from "../backend";
import {NullBackend} from "../backend/util.spec";

describe('IpService', () => {
    const hostMin = 10;
    const hostMax = 20;
    const expected = hostMax-hostMin;
    let unitUnderTest: IpService;
    let backend: CheapBackend;
    beforeEach(async () => {
        backend = await new NullBackend().start();
        unitUnderTest = await new IpService(backend).start();
    });
    afterEach(async () => {
        await unitUnderTest.shutdown();
    });
    it('is able to allocate 10 IPs for a pool of hostMin=10 and hostMax=20', async () => {
        const actualAllocations = [];
        for(let i=0;i<expected;i++) {
            const ip = await unitUnderTest.allocate();
            actualAllocations.push(ip);
        }
        expect(actualAllocations.length).toEqual(expected);
    });
    it('rejects an allocation if the pool is exhausted', async () => {
        for(let i=0;i<expected;i++) {
            await unitUnderTest.allocate();
        }

        try {
            await unitUnderTest.allocate();
            fail();
        } catch (e) {
        }
    });
    it('returns different IPs', async () => {
        const ip1 = await unitUnderTest.allocate();
        const ip2 = await unitUnderTest.allocate();

        expect(ip1.ip).not.toEqual(ip2.ip);
    });
    describe('release', () => {
        it('rejects if the ip is not allocated', async () => {
            await unitUnderTest.release(new CheapIp('10.2.3.11'))
                .then(() => fail())
                .catch(e =>
                    expect(e)
                        .toEqual('ip 10.2.3.11 is not allocated'));
        });
    });
});

describe('IpPool', () => {
    let unitUnderTest: CheapIpPool;
    beforeEach(() => {
        unitUnderTest = new CheapIpPool('10.2.3.', 10, 20);
    });

    it('throws an exception if hostMax is smaller than hostMin', () => {
        const test = () => new CheapIpPool(undefined, 1, 0);
        expect(test).toThrow();
    });
    it('throws an exception if hostMin or hostMax is not between 0 - 255', () => {
        const makeTest = (min,max) => () => new CheapIpPool(undefined, min, max);
        [
            makeTest(-100, -1),
            makeTest(-1, 100),
            makeTest(0, 300),
            makeTest(300, 400),
        ].forEach(test => {
            expect(test).toThrow()
        });
    });
    describe('ipStringToHostNum(ip)', () => {
        it('rejects if the given ip does not match the constructor prefixString', async () => {
            await unitUnderTest.ipStringToHostNum('99.88.77.5')
                .then(() => fail())
                .catch(e => expect(e).toEqual('invalid ipString: 99.88.77.5'));
        });
    });
    describe('networkSize', () =>
        it('always returns 24 for now', () =>
            expect(unitUnderTest.networkSize).toEqual(24)));
});