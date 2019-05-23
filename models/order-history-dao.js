const mongoClient = require('mongodb').MongoClient;
const baseClass = require('./dao');
const userDAO = require('../models/user-dao');

/**
 * 訂單資料存取
 */
class OrderHistoryDAO extends baseClass.DAO {
    constructor() {
        super("OrderHistory");
    }

    mapper(row) {
        if (row) {
            var d = {
                /* orderId: row.orderId, */
                fromStatus: row.fromStatus,
                toStatus: row.toStatus,
                userId: row.userId,
                userName: row.userName,
                ctime: new Date(row.ctime),
                note: row.note
            }
            d.ctimeStr = this.dateToString(d.ctime);
            return d;
        }
        return {};
    }

    values(entity) {
        return {
            orderId: Number(entity.orderId),
            fromStatus: entity.fromStatus,
            toStatus: entity.toStatus,
            userId: entity.userId,
            userName: entity.userName,
            ctime: entity.ctime.valueOf(),
            note: entity.note
        }
    }

    findByOrderId(orderId, callback) {
        let query = { orderId: Number(orderId) };
        let sortOpt = { ctime: 1 };
        this.open((err, client, db) => {
            if (err) {
                if (callback) callback(err, null);
                else throw err;
            }
            db.collection(this.collectionName).find(query).sort(sortOpt).toArray((err1, result) => {
                if (err1) {
                    console.error(err1);
                    return callback(err1, null);
                }
                let list = [];
                for (let i = 0; i < result.length; i++) {
                    list.push(this.mapper(result[i]));
                }
                callback(null, list);
                client.close();
            });
        });
    }

    insert(entity, callback) {
        userDAO.findByID(entity.userId, (err0, data) => {
            if (err0) {
                console.error(err0);
                if (callback) callback(err0, null);
            } else {
                entity.userName = data.name;
                entity = this.values(entity);
                this.open((err, client, db) => {
                    if (err) {
                        if (callback) callback(err, null);
                        else throw err;
                    }
                    db.collection(this.collectionName).insertOne(entity, (err1, result) => {
                        if (err1) {
                            console.error(err1);
                            if (callback) callback(err1, null);
                        } else if (callback) {
                            callback(null, entity);
                        } else {
                            console.log(result);
                        }
                        client.close();
                    });
                });
            }
        });
    }
}

module.exports = new OrderHistoryDAO();