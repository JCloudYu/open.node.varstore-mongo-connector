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
    get<ReturnType extends StoredTypes>(name: string): Promise<ReturnType | undefined>;
    set<ValueType extends AllowedInputTypes>(name: string, value: ValueType): Promise<boolean>;
    del<ReturnType extends StoredTypes>(name: string): Promise<ReturnType | undefined>;
}
export default MongoConnector;
