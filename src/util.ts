import * as debugLog from 'debug';
import * as fs from "fs";

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

    public static writeFilePromise(filename: string, content: string): Promise<void> {
        return new Promise(((resolve, reject) =>
            fs.writeFile(filename, content, err =>
                err ? reject(err) : resolve())));
    }

    public static readFilePromise(filename: string): Promise<string> {
        return new Promise(((resolve, reject) =>
            fs.readFile(filename, 'utf-8', (err,data) =>
                err ? reject(err) : resolve(data))));
    }

    public static pserial<T>(promiseMakerFunctions: ((T) => Promise<T>)[]): Promise<T> {

        const chainFunction = (p: Promise<T>, fn: (T) => Promise<T>) => p.then(fn);

        return promiseMakerFunctions.reduce(chainFunction, Promise.resolve(undefined));
    }


}