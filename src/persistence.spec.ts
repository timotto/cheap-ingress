import {PersistedState, Persistence} from "./persistence";
import {Util} from "./util";

const ImplementationFactory = (): Persistence => new Persistence('state.json');

const hostname = 'valid-hostname';
const protocol = 'tcp';
const port = 12345;
const nodePort = 54321;

describe('Persistence', () => {
    let unitUnderTest: Persistence;
    beforeEach(() => {
        unitUnderTest = ImplementationFactory();
    });
    describe('load()', () => {
        it('returns the stored data', async () => {
            const expectedState = new PersistedState(hostname, protocol, port, nodePort);

            // given
            await unitUnderTest.add(hostname, protocol, port, nodePort);

            // when
            await unitUnderTest.load();

            // then
            expect(unitUnderTest.state).toContain(expectedState);
            expect(unitUnderTest.state.length).toEqual(1);
        });
        it('returns the stored data from a second instance', async () => {
            const expectedState = new PersistedState(hostname, protocol, port, nodePort);

            // given
            await unitUnderTest.add(hostname, protocol, port, nodePort);

            // when
            const secondInstance = ImplementationFactory();
            await secondInstance.load();

            // then
            expect(secondInstance.state).toContain(expectedState);
            expect(secondInstance.state.length).toEqual(1);
        });
    });
    describe('add', () => {
        it('adds a matching PersistedState item to the state property and calls store', async () => {
            spyOn(Util, 'writeFilePromise')
                .and.returnValue(Promise.resolve());

            const expectedState = new PersistedState(hostname, protocol, port, nodePort);

            await unitUnderTest.add(hostname, protocol, port, nodePort);

            expect(unitUnderTest.state).toContain(expectedState);
        });
        it('does not add the same item more than once', async () => {
            spyOn(Util, 'writeFilePromise')
                .and.returnValue(Promise.resolve());

            const expectedState = new PersistedState(hostname, protocol, port, nodePort);

            await unitUnderTest.add(hostname, protocol, port, nodePort);
            await unitUnderTest.add(hostname, protocol, port, nodePort);

            expect(unitUnderTest.state).toContain(expectedState);
            expect(unitUnderTest.state.length).toEqual(1);
        });
    });
    describe('remove', () => {
        it('removes an item', async () => {
            spyOn(Util, 'writeFilePromise')
                .and.returnValue(Promise.resolve());

            const expectedState = new PersistedState(hostname, protocol, port, nodePort);

            await unitUnderTest.add(hostname, protocol, port, nodePort);

            await unitUnderTest.remove(hostname, protocol, port, nodePort);

            expect(unitUnderTest.state).not.toContain(expectedState);
            expect(unitUnderTest.state.length).toEqual(0);
        });
    });
});

describe('PersistedState', () => {
    describe('equals', () => {
        it('returns true if all properties are equal', () => {
            const hostname = 'same hostname';
            const protocol = 'same protocol';
            const port = 12345;
            const nodePort = 54321;
            const differentValue = 'different value';
            const differentNumberValue = 1;

            const reference = new PersistedState(hostname, protocol, port, nodePort);
            const sameAsReference = new PersistedState(hostname, protocol, port, nodePort);
            const differentHostname = new PersistedState(differentValue, protocol, port, nodePort);
            const differentProtocol = new PersistedState(hostname, differentValue, port, nodePort);
            const differentPort = new PersistedState(hostname, protocol, differentNumberValue, nodePort);
            const differentNodePort = new PersistedState(hostname, protocol, port, differentNumberValue);
            const allDifferent = new PersistedState(differentValue, differentValue, differentNumberValue, differentNumberValue);

            expect(reference.equals(sameAsReference)).toBeTruthy();
            expect(reference.equals(differentHostname)).toBeFalsy();
            expect(reference.equals(differentProtocol)).toBeFalsy();
            expect(reference.equals(differentPort)).toBeFalsy();
            expect(reference.equals(differentNodePort)).toBeFalsy();
            expect(reference.equals(allDifferent)).toBeFalsy();
        });
    });
});