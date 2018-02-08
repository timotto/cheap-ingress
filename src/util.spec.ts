import {PretryOptions, Util} from "./util";

describe('Class Util', () => {
    describe('Function: pretry', () => {

        it('executes the given promiseFunction', done => {
            const doneFunction = () => {
                expect(promiseExecuted).toBeTruthy();
                done();
            };

            let promiseExecuted = false;
            Util.pretry(() => new Promise(resolve => {
                promiseExecuted = true;
                resolve();
            }), {times: 1})
                .then(doneFunction)
                .catch(doneFunction);
        });

        it('executes the given promiseFunction as long as it rejects the promise', done => {
            const resolveAfterCall = 5;
            const doneFunction = () => {
                expect(promiseExecutions).toBe(5);
                done();
            };

            let promiseExecutions = 0;

            Util.pretry(() => new Promise((resolve, reject) => {
                promiseExecutions++;
                if (promiseExecutions < resolveAfterCall) return reject(false);
                else resolve(true);
            }), {times: 10})
                .then(doneFunction)
                .catch(doneFunction);
        });

        it('throws the error if the promiseFunction rejects as often as the "times" property value', done => {
            const options = {times: 2};
            const expectedError = 'this is expected';
            let actualExecutions = 0;

            Util.pretry(() => {
                actualExecutions++;
                return Promise.reject(expectedError);
            }, options)
                .then(() => {
                    expect(undefined).toBe(expectedError);
                    done();
                })
                .catch(actualError => {
                    expect(actualExecutions).toBe(options.times);
                    expect(actualError).toBe(expectedError);
                    done();
                })
        });

        it('does not wait before retrying by default', done => {
            const options: PretryOptions = {times: 2};
            let timeOfFirstAttempt = undefined;
            let timeOfSecondAttempt = undefined;

            let actualExecutions = 0;

            Util.pretry(() => {
                actualExecutions++;
                switch (actualExecutions) {
                    case 1:
                        timeOfFirstAttempt = new Date().getTime();
                        return Promise.reject('nope');
                    default:
                        timeOfSecondAttempt = new Date().getTime();
                        return Promise.resolve('ok');
                }
            }, options)
                .then(() => {
                    expect(timeOfSecondAttempt/1000).toBeCloseTo(timeOfFirstAttempt/1000, 1);
                    done();
                })
        });

        it('waits before retrying if specified by the "wait" property', done => {
            const options: PretryOptions = {times: 2, wait: 500};
            let timeOfFirstAttempt = undefined;
            let timeOfSecondAttempt = undefined;

            let actualExecutions = 0;

            Util.pretry(() => {
                actualExecutions++;
                switch (actualExecutions) {
                    case 1:
                        timeOfFirstAttempt = new Date().getTime();
                        return Promise.reject('nope');
                    default:
                        timeOfSecondAttempt = new Date().getTime();
                        return Promise.resolve('ok');
                }
            }, options)
                .then(() => {
                    expect((timeOfSecondAttempt-timeOfFirstAttempt)/1000).toBeCloseTo(options.wait/1000, 1);
                    done();
                })
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
