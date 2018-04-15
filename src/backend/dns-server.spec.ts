import {DnsServer} from "./dns-server";
import * as dnsd from 'dnsd';

import any = jasmine.any;

const dnsServerPort = 10053;
const dnsDomain = 'test.domain';
const givenHostname = 'given-hostname';
const givenIp = '1.2.3.4';

describe('DnsServer', () => {

    let unitUnderTest: DnsServer;
    let mockDnsdServer: dnsd.Server;

    beforeEach( () => {
        unitUnderTest = new DnsServer(dnsDomain, dnsServerPort);
        mockDnsdServer = jasmine.createSpyObj<dnsd.Server>('Server', ['listen', 'close']);
        spyOn(dnsd, 'createServer')
            .and.returnValue(mockDnsdServer);
    });

    describe('started server', () => {
        beforeEach(async () => {
            await unitUnderTest.start();
        });
        afterEach(async () => {
            await unitUnderTest.shutdown();
        });
        describe('addRecord', () => {
            it('does not add the hostname with the domain to the in-memory database', () => {
                // given

                // when
                unitUnderTest.addRecord(givenHostname, givenIp);

                // then
                expect((unitUnderTest as any).records[givenHostname]).toBeDefined();
                expect((unitUnderTest as any).records[`${givenHostname}.${dnsDomain}`]).not.toBeDefined();
            });

            it('does not append the domain if the hostname does not have it', () => {
                const hostname = 'hostname';
                const ip = '1.2.3.4';

                const actualDomain = unitUnderTest.addRecord(hostname, ip);
                expect(actualDomain).toBe(hostname);
            });

            it('strips the domain if the hostname already has it', () => {
                const ip = '1.2.3.4';
                const expectedDomain = 'expected';
                const givenDomain = `${expectedDomain}.${dnsDomain}`;

                const actualDomain = unitUnderTest.addRecord(givenDomain, ip);
                expect(actualDomain).toBe(expectedDomain);
            });
        });

        describe('removeRecord', () => {
            it('removes the entry for the given hostname', () => {
                // given
                unitUnderTest.addRecord(givenHostname, givenIp);

                // when
                unitUnderTest.removeRecord(givenHostname, givenIp);

                // then
                expect((unitUnderTest as any).records[givenHostname]).not.toBeDefined();
            });
            it('removes the entry for the given FQDN hostname', () => {
                // given
                unitUnderTest.addRecord(givenHostname, givenIp);

                // when
                unitUnderTest.removeRecord(`${givenHostname}.${dnsDomain}`, givenIp);

                // then
                expect((unitUnderTest as any).records[givenHostname]).not.toBeDefined();
            });
        });

        describe('resolveDns', () => {
            let actualCallback: (req,res) => void;
            let stubAnswer: { answer: any[]; end: () => any };
            beforeEach(async () => {
                stubAnswer = {
                    answer: [], end: () => {
                    }
                };
                dnsd.createServer
                    .and.callFake((cb: (req, res) => void) => {
                    actualCallback = cb;
                    return mockDnsdServer;
                });
                await unitUnderTest.start();
            });
            afterEach(async () => {
                await unitUnderTest.shutdown();
            });
            it('resolves a FQDN', async () => {
                // given
                unitUnderTest.addRecord(givenHostname, givenIp);

                // when
                const queriedHostname = `${givenHostname}.${dnsDomain}`;
                const stubAnswer = {answer: [], end: () => {}};
                actualCallback(buildMockQuery(queriedHostname, 'A'), stubAnswer);

                // then
                expect(stubAnswer.answer.length).toEqual(1);
                expect(stubAnswer.answer[0].name).toEqual(queriedHostname);
                expect(stubAnswer.answer[0].data).toEqual(givenIp);
            });
            it('resolves "host" to "host.domain"', async () => {
                // given
                unitUnderTest.addRecord(givenHostname, givenIp);

                // when
                const queriedHostname = `${givenHostname}`;
                const expectedHostname = `${givenHostname}.${dnsDomain}`;
                const stubAnswer = {answer: [], end: () => {}};
                actualCallback(buildMockQuery(queriedHostname, 'A'), stubAnswer);

                // then
                expect(stubAnswer.answer.length).toEqual(1);
                expect(stubAnswer.answer[0].name).toEqual(expectedHostname);
                expect(stubAnswer.answer[0].data).toEqual(givenIp);
            });
            it('resolves "host." to "host" for "host.domain"', async () => {
                // given
                unitUnderTest.addRecord(givenHostname, givenIp);

                // when
                const queriedHostname = `${givenHostname}.`;
                const expectedHostname = givenHostname;
                actualCallback(buildMockQuery(queriedHostname, 'A'), stubAnswer);

                // then
                expect(stubAnswer.answer.length).toEqual(1);
                expect(stubAnswer.answer[0].name).toEqual(expectedHostname);
                expect(stubAnswer.answer[0].data).toEqual(givenIp);
            });
            it('returns an empty answer section for non matches', () => {
                // when
                actualCallback(buildMockQuery('does-not-exist', 'A'), stubAnswer);

                // then
                expect(stubAnswer.answer.length).toEqual(0);
            });
        });
    });

    describe('start', () => {
        it('creates a new dnsd server', async () => {
            // when
            await unitUnderTest.start();

            // then
            expect(dnsd.createServer).toHaveBeenCalled();
        });
        it('creates a new dnsd server with the resolveDns() function as callback', async () => {
            let actualCallback = undefined;
            dnsd.createServer.and.callFake(cb => {
                actualCallback = cb;
                return mockDnsdServer;
            });
            spyOn(unitUnderTest as any, 'resolveDns')
                .and.stub();

            // given
            await unitUnderTest.start();

            // when
            actualCallback();

            // then
            expect((unitUnderTest as any).resolveDns).toHaveBeenCalled();
        });
        it('calls listen with the configured port on the dnsd.Server', async () => {
            // given
            // when
            await unitUnderTest.start();

            // then
            expect(mockDnsdServer.listen)
                .toHaveBeenCalledWith(dnsServerPort, any(Function));
        });
        it('rejects the promise if the dnsd.Server fails to listen', async () => {
            const expectedReason = 'expected reason';
            (mockDnsdServer.listen as jasmine.Spy)
                .and.callFake((port,cb) => {
                cb(expectedReason);
            });

            // when
            await unitUnderTest.start()
                .then(() => fail())
                // then
                .catch(e => expect(e).toEqual(expectedReason));
        });
    });
});

const buildMockQuery = (hostname, type) => ({
    question: [
        {name: hostname, type: type}
    ]
});