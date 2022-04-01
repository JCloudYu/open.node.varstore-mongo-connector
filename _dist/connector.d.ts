import type { IStorageConnect, StoredTypes, AllowedInputTypes } from "varstore";
import mongodb = require("mongodb");
declare type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
declare type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
declare type CommonOptions = {
    db?: string;
    collection: string;
};
declare type InitOptions = XOR<{
    connection: mongodb.MongoClient;
} & CommonOptions, {
    uri: string;
} & CommonOptions>;
declare class MongoConnector implements IStorageConnect {
    static init(conn_info: InitOptions): Promise<MongoConnector>;
    list(): Promise<string[]>;
    get(name: string): Promise<StoredTypes | undefined>;
    set(name: string, value: AllowedInputTypes): Promise<boolean>;
    del(name: string): Promise<StoredTypes | undefined>;
    release(): Promise<void>;
}
export default MongoConnector;
