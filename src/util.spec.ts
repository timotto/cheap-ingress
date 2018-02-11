import {Util} from "./util";

describe('Class Util', () => {
    describe('envOrDefault', () => {
        const testKeys = ['TEST_ENV1', 'TEST_ENV2'];
        const cleanup = () => testKeys.forEach(key => delete process.env[key]);
        beforeEach(cleanup);
        afterEach(cleanup);
        it('returns the value of the environment variable named "envKey"', () => {
            const testKey = testKeys[0];
            const expectedValue = 'expected value';
            const unexpectedValue = 'unexpected value';

            // given
            process.env[testKey] = expectedValue;

            // when
            const actualResult = Util.envOrDefault(testKey, unexpectedValue);

            // then
            expect(actualResult).toEqual(expectedValue);
        });
        it('returns the defaultValue if the value of the environment variable named "envKey" is not defined', () => {
            const testKey = testKeys[0];
            const expectedValue = 'expected value';

            // given

            // when
            const actualResult = Util.envOrDefault(testKey, expectedValue);

            // then
            expect(actualResult).toEqual(expectedValue);
        });
    });
});