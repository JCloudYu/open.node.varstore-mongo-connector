"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb = require("mongodb");
var _MongoConnector = new WeakMap();
var MongoConnector = /** @class */ (function () {
    function MongoConnector() {
    }
    MongoConnector.init = function (conn_info) {
        return __awaiter(this, void 0, void 0, function () {
            var connection, raw_uri, db_name, coll_name, instance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(conn_info.connection !== undefined)) return [3 /*break*/, 1];
                        connection = conn_info.connection;
                        return [3 /*break*/, 3];
                    case 1:
                        raw_uri = ('' + (conn_info.uri || '')).trim();
                        return [4 /*yield*/, mongodb.MongoClient.connect(raw_uri)];
                    case 2:
                        connection = _a.sent();
                        _a.label = 3;
                    case 3:
                        db_name = conn_info.db;
                        coll_name = ('' + (conn_info.collection || '')).trim();
                        if (!coll_name)
                            throw new SyntaxError("Bound collection name is required!");
                        instance = new MongoConnector();
                        _MongoConnector.set(instance, {
                            coll_name: coll_name,
                            conn: connection,
                            db: db_name ? connection.db() : connection.db(db_name)
                        });
                        return [2 /*return*/, instance];
                }
            });
        });
    };
    MongoConnector.prototype.list = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, coll_name, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = _MongoConnector.get(this), db = _a.db, coll_name = _a.coll_name;
                        return [4 /*yield*/, db.collection(coll_name).aggregate([
                                { $sort: { name: 1 } },
                                { $group: { _id: null, names: { $push: "$name" } } },
                                { $project: { _id: 0 } }
                            ]).toArray()];
                    case 1:
                        result = (_b.sent())[0];
                        return [2 /*return*/, result ? result.names : []];
                }
            });
        });
    };
    MongoConnector.prototype.get = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, coll_name, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = _MongoConnector.get(this), db = _a.db, coll_name = _a.coll_name;
                        return [4 /*yield*/, db.collection(coll_name).find({ name: name }).toArray()];
                    case 1:
                        data = (_b.sent())[0];
                        if (!data)
                            return [2 /*return*/, undefined];
                        if (data.value instanceof mongodb.Binary) {
                            return [2 /*return*/, Buffer.from(data.value.buffer)];
                        }
                        return [2 /*return*/, data.value];
                }
            });
        });
    };
    MongoConnector.prototype.set = function (name, value) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, coll_name, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = _MongoConnector.get(this), db = _a.db, coll_name = _a.coll_name;
                        if (Buffer.isBuffer(value) || value instanceof ArrayBuffer) {
                            value = Buffer.from(value);
                        }
                        else if (ArrayBuffer.isView(value)) {
                            value = Buffer.from(value.buffer);
                        }
                        return [4 /*yield*/, db.collection(coll_name).updateOne({ name: name }, { $set: { value: value }, $setOnInsert: { name: name } }, { upsert: true })];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (result.upsertedCount + result.matchedCount) > 0];
                }
            });
        });
    };
    MongoConnector.prototype.del = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, coll_name, value;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = _MongoConnector.get(this), db = _a.db, coll_name = _a.coll_name;
                        return [4 /*yield*/, db.collection(coll_name).findOneAndDelete({ name: name })];
                    case 1:
                        value = (_b.sent()).value;
                        if (value === null)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, value.value];
                }
            });
        });
    };
    return MongoConnector;
}());
exports.default = MongoConnector;
