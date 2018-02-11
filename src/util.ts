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
}