const mongoClient = require('mongodb').MongoClient;
const baseClass = require('./dao');
const orderItemDAO = require('../models/order-item-dao');
const orderHistoryDAO = require('../models/order-history-dao');

/**
 * 訂單資料存取
 */
class OrderDAO extends baseClass.DAO {
    constructor() {
        super("Orders");
    }

    /**
     * 訂單狀態名稱
     */
    get STATUS() {
        return ['新訂單', '已調製', '已出貨', '已送達', '已結清', '已取消'];
    }

    findAll(callback) {
        let sortOpt = { id: 1 };
        this.open((err, client, db) => {
            if (err) {
                if (callback) callback(err, null);
                else throw err;
            }
            db.collection(this.collectionName).find({}).sort(sortOpt).toArray((err1, result) => {
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

    findByID(value, callback) {
        let query = { id: Number(value) };
        this.open((err, client, db) => {
            if (err) {
                if (callback) callback(err, null);
                else throw err;
            }
            db.collection(this.collectionName).findOne(query, (err1, result) => {
                if (err1) {
                    console.error(err1);
                    return callback(err1, null);
                }
                callback(null, this.mapper(result));
                client.close();
            });
        });
    }

    mapper(row) {
        if (row) {
            var d = {
                id: row.id,
                custName: row.custName,
                custTel: row.custTel,
                custAddr: row.custAddr,
                qty: row.qty,
                total: row.total,
                orderDate: new Date(row.orderDate),
                userId: row.userId,
                status: row.status,
                items: [],
                history: []
            }
            d.orderDateStr = this.dateToString(d.orderDate);
            return d;
        }
        return {};
    }

    valuesWithoutId(entity) {
        return {
            custName: entity.custName,
            custTel: entity.custTel,
            custAddr: entity.custAddr,
            qty: entity.qty,
            total: entity.total,
            orderDate: entity.orderDate.valueOf(),
            userId: entity.userId,
            status: entity.status
        }
    }

    valuesWithId(entity) {
        return {
            id: entity.id,
            custName: entity.custName,
            custTel: entity.custTel,
            custAddr: entity.custAddr,
            qty: entity.qty,
            total: entity.total,
            orderDate: entity.orderDate.valueOf(),
            userId: entity.userId,
            status: entity.status
        }
    }

    update(entity, callback) {
        let query = { id: entity.id };
        let newValues = this.valuesWithoutId(entity);
        this.open((err, client, db) => {
            if (err) {
                if (callback) callback(err, null);
                else throw err;
            }
            db.collection(this.collectionName).updateOne(query, { $set: newValues }, (err1, result) => {
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

    insert(entity, callback) {
        this.open((err, client, db) => {
            if (err) {
                if (callback) callback(err, null);
                else throw err;
            }
            db.collection(this.collectionName).countDocuments({}, {}, (err1, count) => {
                if (err1) {
                    if (callback) callback(err1, null);
                    else throw err1;
                } else {
                    entity.id = count + 1;
                    db.collection(this.collectionName).insertOne(this.valuesWithId(entity), (err1, result) => {
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
                }
            });

        });
    }

    findByUserId(userId, callback) {
        let query = { userId: userId };
        let sortOpt = { id: 1 };
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

    loadItems(entity, callback) {
        orderItemDAO.findByOrderId(entity.id, (err, data) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                entity.items = data;
                callback(null, entity);
            }
        });
    }

    loadHistory(entity, callback) {
        orderHistoryDAO.findByOrderId(entity.id, (err, data) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                entity.history = data;
                callback(null, entity);
            }
        });
    }
}

module.exports = new OrderDAO();