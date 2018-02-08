import * as debugLog from 'debug';

const debug = debugLog('util');

export class Util {
    public static envOrDefault(envKey: string, defaultValue: string): string {
        let value = process.env[envKey];
        if (value === undefined) {
            debug(`environment variable ${envKey} is not defined, using default value: ${defaultValue}`);
            return defaultValue;
        }

        debug(`environment variable ${envKey} is defined with value: ${value}`);

        return value;
    }

    public static pretry(promiseFunction, options: PretryOptions): Promise<any> {
        return new Promise(((resolve, reject) => {
            let attempts = 0;

            const resolution = result => resolve(result);

            const attempt = () => {
                attempts++;
                return promiseFunction()
                    .then(resolution)
                    .catch(retry);
            };

            const retry = error => {
                if (attempts >= options.times) {
                    return reject(error);
                }
                if (options.wait) {
                    return new Promise(resolve => setTimeout(() => resolve(
                        attempt()),
                        options.wait));
                }
                return attempt();
            };

            return attempt();
        }));
    }

    public static pserial<T>(promiseMakerFunctions: ((T) => Promise<T>)[], initialValue?: Promise<T>): Promise<T> {
        const _initialValue = initialValue !== undefined
            ? initialValue
            : Promise.resolve(undefined);

        const chainFunction = (p: Promise<T>, fn: (T) => Promise<T>) => p.then(fn);

        return promiseMakerFunctions.reduce(chainFunction, _initialValue);
    }
}

export class PretryOptions {
    times?: number = 5;
    wait?: number = 0;
}