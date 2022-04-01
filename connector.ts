import type {IStorageConnect, StoredTypes, AllowedInputTypes} from "varstore";
import mongodb = require("mongodb");

type InitOptions = { connection:mongodb.MongoClient; uri:string; db?:string; collection:string; };
type VarRecord<ValueType> = {name:string; value:ValueType;}
type MongoConnectorPrivate = {conn:mongodb.MongoClient; db:mongodb.Db; coll_name:string;};


const _MongoConnector:WeakMap<MongoConnector, MongoConnectorPrivate> = new WeakMap();
class MongoConnector implements IStorageConnect {
	static async init(conn_info:InitOptions):Promise<MongoConnector> {
		let connection:mongodb.MongoClient;
		
		if ( conn_info.connection ) {
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
		CheckConn(this);

		const {db, coll_name} = _MongoConnector.get(this)!;
		const [result] = await db.collection(coll_name).aggregate<{names:string[]}>([
			{$sort:{name:1}},
			{$group:{_id:null, names:{$push:"$name"}}},
			{$project:{_id:0}}
		]).toArray();

		return result ? result.names : [];
	}
	async get(name:string):Promise<StoredTypes|undefined> {
		CheckConn(this);
		
		const {db, coll_name} = _MongoConnector.get(this)!;
		const [data] = await db.collection<VarRecord<StoredTypes>>(coll_name).find({name}).toArray();
		if ( !data ) return undefined;
		if ( data.value instanceof mongodb.Binary ) {
			return data.value.buffer;
		}
		return data.value;
	}
	async set(name:string, value:AllowedInputTypes):Promise<boolean> {
		CheckConn(this);

		const {db, coll_name} = _MongoConnector.get(this)!;
		if ( Buffer.isBuffer(value) || value instanceof ArrayBuffer ) {
			value = Buffer.from(value);
		}
		else
		if ( ArrayBuffer.isView(value) ) {
			value = Buffer.from(value.buffer);
		}

		const result = await db.collection(coll_name).updateOne({name}, {$set:{value}, $setOnInsert:{name}}, {upsert:true});
		return (result.upsertedCount + result.matchedCount) > 0;
	}
	async del(name:string):Promise<StoredTypes|undefined> {
		CheckConn(this);
		
		const {db, coll_name} = _MongoConnector.get(this)!;
		const {value} = await db.collection(coll_name).findOneAndDelete({name});
		if ( value === null ) return undefined;
		
		return value.value;
	}
	async release() {
		const {conn} = _MongoConnector.get(this)!;
		return conn.close();
	}
}

function CheckConn(inst:MongoConnector) {
	const {conn} = _MongoConnector.get(inst)!;
	if ( !conn.isConnected() ) {
		throw new Error("Database connection has been lost!");
	}
}

export default MongoConnector;