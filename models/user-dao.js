const mongoClient = require('mongodb').MongoClient;
const baseClass = require('./dao');
const crypto = require('crypto');

/**
 * 帳號資料存取
 */
class UserDAO extends baseClass.DAO {
    constructor() {
        super("Users");
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
                callback(null, result);
                client.close();
            });
        });
    }

    findByID(value, callback) {
        let query = { id: value };
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
                callback(null, result);
                client.close();
            });
        });
    }

    valuesWithoutId(entity) {
        return {
            name: entity.name,
            tel: entity.tel,
            addr: entity.addr,
            password: entity.passwd,
            isAdmin: entity.isAdmin
        }
    }

    valuesWithId(entity) {
        return {
            id: entity.id,
            name: entity.name,
            tel: entity.tel,
            addr: entity.addr,
            password: entity.passwd,
            isAdmin: entity.isAdmin
        }
    }

    valuesWithoutIdPassword(entity) {
        return {
            name: entity.name,
            tel: entity.tel,
            addr: entity.addr,
            isAdmin: entity.isAdmin
        }
    }

    update(entity, callback) {
        let query = { id: entity.id };
        let newValues = this.valuesWithoutIdPassword(entity);
        if (entity.password) { // 更新資料包含改密碼
            newValues.password = this.passwordHash(entity.id, entity.password);
        }
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

    /**
     * 增加使用者
     */
    insert(entity, callback) {
        entity.password = this.passwordHash(entity.id, entity.password);
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

    delete(entity, callback) {
        let query = { id: entity.id };
        this.open((err, client, db) => {
            if (err) {
                if (callback) callback(err, null);
                else throw err;
            }
            db.collection(this.collectionName).deleteOne(query, (err1, result) => {
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

    /**
     * 將電話號碼轉換成 ID：只取數字，去除 ()-+，前置補 0，長度 10 碼
     * @param {*} tel 
     */
    tel2ID(tel) {
        var id = '';
        var n = tel.match(/\d+/g); // extract digits
        if (n) {
            id = Array.isArray(n) ? n.join('') : n;
        }
        if (id.length < 10) {
            id = "00000000000" + id;
        }
        id = id.substr(id.length - 10);
        return id;
    }

    /**
     * 建立用戶密碼的雜湊值
     * @param {*} userId 
     * @param {*} passwordPlaintext 
     */
    passwordHash(userId, passwordPlaintext) {
        var hash = crypto.createHash('sha256');
        var salted = userId + passwordPlaintext;
        hash.update(salted);
        var cipher = hash.digest('hex');
        return cipher;
    }

    /**
     * 驗證帳號密碼
     * @param {*} id 帳號
     * @param {*} passwd 密碼
     * @param {*} callback 後續處理函式
     */
    authenticate(id, passwd, callback) {
        this.findByID(id, (err, u) => {
            if (err) return callback(err);
            let pwd = this.passwordHash(id, passwd);
            if (u && u.password && (pwd === u.password)) {
                return callback(null, u);
            }
            return callback(new Error("帳號或密碼錯誤!"));
        });
    }

    /**
     * 進入受管制的頁面前，強制用戶登入
     * @param {*} req Request
     * @param {*} res Response
     * @param {*} next Next
     */
    forceLogin(req, res, next) {
        if (req.session && req.session.user) {
            //console.log('User ' + req.session.user.id + ' already login.');
            next();
        } else {
            req.session.pageAfterLogin = req.originalUrl;
            res.redirect("/login");
        }
    }
}

module.exports = new UserDAO();