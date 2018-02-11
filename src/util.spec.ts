import {Util} from "./util";
import * as fs from 'fs';
import any = jasmine.any;

describe('Class Util', () => {
    describe('writeFilePromise', () => {
        it('calls fs.writeFile with the given arguments', async () => {
            const expectedFilename = 'expected filename';
            const expectedContent = 'expected content';

            spyOn(fs, 'writeFile')
                .and.callFake((n,c,cb)=>cb());

            // when
            await Util.writeFilePromise(expectedFilename, expectedContent);

            // then
            expect(fs.writeFile)
                .toHaveBeenCalledWith(expectedFilename, expectedContent, any(Function));
        });
        it('rejects if fs.writeFile returns an error', async () => {
            const expectedReason = 'expected reason';

            const givenFilename = 'expected filename';
            const givenContent = 'expected content';

            // given
            spyOn(fs, 'writeFile')
                .and.callFake((n,c,cb)=>cb(expectedReason));

            // when
            await Util.writeFilePromise(givenFilename, givenContent)
                .then(() => fail())
                // then
                .catch(e => expect(e).toEqual(expectedReason));
        });
    });
    describe('readFilePromise', () => {
        it('calls fs.readFile with the filename and "utf-8"', async () => {
            const expectedFilename = 'expected filename';

            spyOn(fs, 'readFile')
                .and.callFake((n,e,cb)=>cb());

            // when
            await Util.readFilePromise(expectedFilename);

            // then
            expect(fs.readFile)
                .toHaveBeenCalledWith(expectedFilename, 'utf-8', any(Function));
        });
        it('resolves to the result of fs.readFile', async () => {
            const expectedContent = 'expected content';

            const givenFilename = 'expected filename';

            spyOn(fs, 'readFile')
                .and.callFake((n,e,cb)=>cb(undefined, expectedContent));

            // when
            const actualResult = await Util.readFilePromise(givenFilename);

            // then
            expect(actualResult).toEqual(expectedContent);
        });
        it('rejects if fs.readFile returns an error', async () => {
            const expectedReason = 'expected reason';

            const givenFilename = 'expected filename';

            // given
            spyOn(fs, 'readFile')
                .and.callFake((n,e,cb)=>cb(expectedReason));

            // when
            await Util.readFilePromise(givenFilename)
                .then(() => fail())
                // then
                .catch(e => expect(e).toEqual(expectedReason));
        });
    });
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
    describe('Function: pserial', () => {
        it('executes all the promises', done => {
            const promiseMakers: RecordingPromiseFunctionMaker[] = [
                new RecordingPromiseFunctionMaker(),
                new RecordingPromiseFunctionMaker(),
                new RecordingPromiseFunctionMaker()
            ];
            const promiseFunctions = promiseMakers.map(pm => pm.makePromiseMakerFunction());

            Util.pserial(promiseFunctions)
                .then(() => {
                    promiseMakers.forEach(fn => expect(fn.called).toBeTruthy());
                    done();
                });
        });

        it('stops the execution with the first rejection', done => {
            const expected = new RecordingPromiseFunctionMaker();
            const unexpected = new RecordingPromiseFunctionMaker();
            const promiseFunctions = [
                expected.makePromiseMakerFunction(),
                rejectingPromiseFunction,
                unexpected.makePromiseMakerFunction()
            ];

            Util.pserial(promiseFunctions)
                .catch(() => {
                    expect(expected.called).toBeTruthy();
                    expect(unexpected.called).toBeFalsy();
                    done();
                })
        });
    });
});

class RecordingPromiseFunctionMaker {
    public called: boolean = false;
    public makePromiseMakerFunction(): (() => Promise<any>) {
        return () => {
            return new Promise(resolve => {
                this.called = true;
                resolve();
            });
        }
    }
}

const rejectingPromiseFunction = () => Promise.reject(false);