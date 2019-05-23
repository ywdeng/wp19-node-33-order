const mongoClient = require('mongodb').MongoClient;
const baseClass = require('./dao');

/**
 * 訂單資料存取
 */
class OrderItemDAO extends baseClass.DAO {
    constructor() {
        super("OrderItems");
    }

    findByOrderId(orderId, callback) {      
        let query = { orderId: orderId };
        this.open((err, client, db) => {
            if (err) {
                if (callback) callback(err, null);
                else throw err;
            }
            db.collection(this.collectionName).find(query).toArray((err1, result) => {
                if (err1) {
                    console.error(err1);
                    return callback(err1, null);
                }
                callback(null, result);
                client.close();
            });
        });
    }

    insertWithOrderId(orderId, entities, callback) {
        for (let i = 0; i < entities.length; i++) {
            entities[i].orderId = Number(orderId);
        }
        this.open((err, client, db) => {
            if (err) {
                if (callback) callback(err, null);
                else throw err;
            }
            db.collection(this.collectionName).insertMany(entities, (err1, result) => {
                if (err1) {
                    console.error(err1);
                    if (callback) callback(err1, null);
                } else if (callback) {
                    callback(null, result);
                } else {
                    console.log(result);
                }
                client.close();
            });
        });
    }
}

module.exports = new OrderItemDAO();