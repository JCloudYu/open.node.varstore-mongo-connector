import type {IStorageConnect, StoredTypes, AllowedInputTypes} from "varstore";
import mongodb = require("mongodb");


type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
type CommonOptions = { db?:string; collection:string; }
type InitOptions = XOR<{connection:mongodb.MongoClient}&CommonOptions, {uri:string}&CommonOptions>;
type VarRecord<ValueType> = {name:string; value:ValueType;}
type MongoConnectorPrivate = {conn:mongodb.MongoClient; db:mongodb.Db; coll_name:string;};


const _MongoConnector:WeakMap<MongoConnector, MongoConnectorPrivate> = new WeakMap();
class MongoConnector implements IStorageConnect {
	static async init(conn_info:InitOptions):Promise<MongoConnector> {
		let connection:mongodb.MongoClient;
		
		if ( conn_info.connection !== undefined ) {
			connection = conn_info.connection;
		}
		else {
			const raw_uri = (''+(conn_info.uri||'')).trim();
			connection = await mongodb.MongoClient.connect(raw_uri);
		}

		

		const db_name = conn_info.db;
		const coll_name = (''+(conn_info.collection||'')).trim();
		if ( !coll_name ) throw new SyntaxError("Bound collection name is required!");

		const instance = new MongoConnector();
		_MongoConnector.set(instance, {
			coll_name,
			conn:connection,
			db:db_name ? connection.db() : connection.db(db_name)
		});
		return instance;
	}
	async list():Promise<string[]> {
		const {db, coll_name} = _MongoConnector.get(this)!;
		const [result] = await db.collection(coll_name).aggregate<{names:string[]}>([
			{$sort:{name:1}},
			{$group:{_id:null, names:{$push:"$name"}}},
			{$project:{_id:0}}
		]).toArray();

		return result ? result.names : [];
	}
	async get<ReturnType extends StoredTypes>(name:string):Promise<ReturnType|undefined> {
		const {db, coll_name} = _MongoConnector.get(this)!;
		const [data] = await db.collection<VarRecord<StoredTypes>>(coll_name).find({name}).toArray();
		if ( !data ) return undefined;

		if ( data.value instanceof mongodb.Binary ) {
			return Buffer.from(data.value.buffer) as unknown as ReturnType;
		}
		return data.value as unknown as ReturnType;
	}
	async set<ValueType extends AllowedInputTypes>(name:string, value:ValueType):Promise<boolean> {
		const {db, coll_name} = _MongoConnector.get(this)!;
		if ( Buffer.isBuffer(value) || value instanceof ArrayBuffer ) {
			value = Buffer.from(value) as unknown as ValueType;
		}
		else
		if ( ArrayBuffer.isView(value) ) {
			value = Buffer.from(value.buffer) as unknown as ValueType;
		}

		const result = await db.collection(coll_name).updateOne({name}, {$set:{value}, $setOnInsert:{name}}, {upsert:true});
		return (result.upsertedCount + result.matchedCount) > 0;
	}
	async del<ReturnType extends StoredTypes>(name:string):Promise<ReturnType|undefined> {
		const {db, coll_name} = _MongoConnector.get(this)!;
		const {value} = await db.collection(coll_name).findOneAndDelete({name});
		if ( value === null ) return undefined;
		
		return value.value;
	}
}

export default MongoConnector;