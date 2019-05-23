const mongoClient = require('mongodb').MongoClient;
const mongodbConfig = require('../mongodb-config.json');

class DAO {
    constructor(collectionName) {
        this._collectionName = collectionName;
        mongoClient.connect(this.connectionUri, { useNewUrlParser: true }, (err, db) => {
            if (err) throw err;
            console.log("Database " + mongodbConfig.db + " OK.");
            db.close();
        });
    }

    open(callback) {
        mongoClient.connect(mongodbConfig.url, { useNewUrlParser: true }, (err, client) => {
            if (err) {
                console.error(err);
                callback(err, null);
            } else {
                let db = client.db(mongodbConfig.db);
                callback(null, client, db);
            }
        });
    }

    get documentCount() {
        this.open((err, client, db) => {
            if (err) throw err;
            db.collection(this.collectionName).countDocuments({}, {}, (err2, count) => {
                if (err2) throw err2;
                if (0 === Number(count)) {
                    console.log("Create an administrator account for empty system.");
                    this.insert({
                        id: "0000000000",
                        name: "店長",
                        tel: "02-8662-1688",
                        addr: "台北市羅斯福路六段218號10樓",
                        password: "1qaz@WSX",
                        isAdmin: true
                    });
                }
            });
            client.close();
        });
    }

    get connectionUri() {
        return mongodbConfig.url + mongodbConfig.db;
    }

    get collectionName() {
        return this._collectionName;
    }

    dateToString(d) {
        var options = {
            timeZone: 'Asia/Taipei',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };
        return d.toLocaleDateString('zh-Tw', options);
    }
}

module.exports.DAO = DAO;