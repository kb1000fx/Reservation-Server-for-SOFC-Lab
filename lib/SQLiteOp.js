const sqlite3 = require('sqlite3');
const tableList = {
    Item :
        "ItemID      INT PRIMARY KEY NOT NULL," +
        "Item        TEXT            NOT NULL," +
        "Tab         TEXT            NOT NULL," +
        "Description TEXT ," +
        "UserName    TEXT ," +
        "UserID      TEXT ," +
        "Attach      TEXT ," +
        "Rented      TEXT ," +
        "Expired     TEXT " ,
    History:
        "Time        TEXT  PRIMARY KEY  NOT NULL," +
        "ItemID      INT  NOT NULL," +
        "UserName    TEXT ," +
        "UserID      TEXT ," +
        "Attach      TEXT ," +
        "Rented      TEXT ," +
        "Expired     TEXT " ,
    Account:
        "UserID     TEXT PRIMARY KEY NOT NULL ," +
        "UserName   TEXT             NOT NULL ," +
        "IsAdmin    INT              NOT NULL ," +
        "PassWord   TEXT             NOT NULL ",
};
var Op ={ };


Op.dbList = [ ];
Op.itemList = [ ];

Op.connectDB = function(dbFileName){
    try {
        if(dbFileName) {
            var length = Op.dbList.push({
                name: dbFileName ,
                db: new sqlite3.Database(dbFileName, (err) => {
                    if (err) {
                        throw err;
                    } else { 
                        console.log('\x1b[32mDatabase \x1B[36m' + dbFileName + '\x1b[32m has been connected.\x1B[0m');
                        initDB(length-1);
                    }
                })
            });
            return length-1
        } else {
            throw new Error("Database name expected!");
        }
    } catch (error) {
        console.error('\x1B[31mError: \x1B[35m' + error + '\x1B[0m')
        process.exit()
    }
};

Op.getItemHistory = function(db, id){
    return allSQL(db, "SELECT * FROM History WHERE ItemID = " + id)
};

Op.selectAllByItemID = function(db, id){
    return getSQL(db, "SELECT * FROM Item WHERE ItemID = " + id)
};

Op.getNameByID = function(db, id){
    return getSQL(db, "SELECT UserName, IsAdmin FROM Account WHERE UserID = '" + id + "'").then((resolve)=>{
        return {
            UserName: resolve.UserName,
            IsAdmin:  resolve.IsAdmin, 
        }   
    });
};

Op.isExist = function(db, id){
    return getSQL(db, "SELECT UserName FROM Account WHERE UserID = '" + id + "'").then((resolve)=>{
        return (resolve != undefined)
    });
};

Op.isIdle = function(db, obj){  
    var index;
    Op.itemList.forEach((e,i)=>{
        if(e.tab==obj.Tab){
            index = i
        }
    });
    if(Op.itemList[index].showTimeInfo){
        return getSQL(db, "SELECT Expired FROM Item WHERE ItemID = " + obj.ItemID).then((resolve)=>{
            var expiredTime = new Date(resolve.Expired);
            var newRented = new Date(obj.Rented);   
            if (resolve.Expired == "无") {
                return true
            } else if (expiredTime > newRented) {
                return false
            } else {
                return true
            }
        });
    }else{
        return Promise.resolve(true)
    }
};

Op.UpdateData = async function(db, obj){
    await runSQL(db, 
        "UPDATE Item SET UserName = '" + obj.UserName + "', UserID = '" + obj.UserID + 
        "', Attach = '" + (obj.Attach?JSON.stringify(obj.Attach):'{}') + "', Rented = '" + obj.Rented + "', Expired = '" + obj.Expired + "' WHERE ItemID = " + obj.ItemID); 
    
    await runSQL(db,
        "INSERT INTO History (ItemID, UserID, UserName, Attach, Rented, Expired, Time) "+
        "VALUES ( " + obj.ItemID + ", '" +  obj.UserID + "', '" + obj.UserName + "', '" + (obj.Attach?JSON.stringify(obj.Attach):'{}') + "', '" + obj.Rented + "', '" + obj.Expired + "', '" + new Date().toLocaleString('chinese',{hour12:false}) + "' )"
    );
        
    return true
};

Op.deleteHistory = function(db, history){
    return runSQL(db, "DELETE FROM History WHERE Time = '" + String(history).replace(',', "' OR Time = '") + "' ")
};

Op.refreshItem = async function(db){
    for(let e of Op.itemList){
        for (let obj of e.list) {
            let UserName, UserID, Attach, Rented, Expired;
            let resolve = await getSQL(db, "SELECT * FROM History WHERE ItemID = " + obj.ItemID + " ORDER BY Time DESC");
            if (resolve!=undefined) {
                UserName = resolve.UserName;
                UserID = resolve.UserID;
                Attach = resolve.Attach;
                Rented = resolve.Rented;
                Expired = resolve.Expired;
            } else {
                UserName = '无';
                UserID = '无';
                Attach = '{}';
                Rented = '1970-01-01 00:00:00';
                Expired = '1970-01-01 00:00:01';
            }
    
            await runSQL(db, 
                "UPDATE Item SET UserName = '" + UserName + "', UserID = '" + UserID + 
                "', Attach = '" + Attach + "', Rented = '" + Rented + "', Expired = '" + Expired + "' WHERE ItemID = " + obj.ItemID
            )
        }
    }  
    return true
};

Op.addAccount = function(db, obj){
    var id = obj.id;
    var name = obj.name;
    var pwd = obj.pwd;

    runSQL(db, 
        "INSERT INTO Account (UserID, UserName, IsAdmin, PassWord) " +
        "VALUES ( '" + id + "', '" + name + "', 0, '" + pwd + "' )"
    ).then((resolve)=>{
        console.log('\x1b[36mAccount \x1B[32m' + name + ' (' + id + ')\x1b[36m has been added.\x1B[0m');
    });
};

Op.loginAuth = function(db, obj){
    var id = String(obj.id);
    var pwd = String(obj.pwd);

    return getSQL(db, "SELECT PassWord FROM Account WHERE UserID = '" + id + "'").then((resolve)=>{
        if (resolve==undefined) {
            return {isAccountExist:false}
        } else if (pwd==resolve.PassWord) {
            return {isAccountExist:true, isPWDCorrect:true}
        } else {
            return {isAccountExist:true, isPWDCorrect:false}
        }
    });
};

function runSQL(index, sql){
    return new Promise((resolve)=>{
        Op.dbList[index].db.run(sql, (err)=>{
            resolve(err)
        })
    })
};

function allSQL(index, sql){
    return new Promise((resolve)=>{
        Op.dbList[index].db.all(sql, (err,res)=>{
            resolve(res)
        })
    })
};

function getSQL(index, sql){
    return new Promise((resolve)=>{
        Op.dbList[index].db.get(sql, (err,res)=>{
            resolve(res)
        })
    })
};

async function initDB(db){
    for (let table in tableList) {
        await runSQL(db, "CREATE TABLE IF NOT EXISTS  '" + table    + "'  (" + tableList[table]    + ") ");
        console.log('\x1b[32mTable\x1b[36m ' + table + ' \x1b[32mhas been created.\x1B[0m')
    }

    try {
        if(Op.itemList.length) {
            for (let element of Op.itemList) {
                for (let e of element.list) {        
                    let attach = {}; 
                    if(element.header){
                        element.header.forEach(t=>{
                            attach[t] = null
                        }); 
                    }  
                    await runSQL(db, 
                        "INSERT INTO Item (ItemID, Item, Tab, Description, UserName, UserID, Attach, Rented, Expired) " +
                        "VALUES (" + e.ItemID + ", '" + e.Item + "', '" + element.tab + "', " + ((e.Description)?("'"+e.Description+"'"):('NULL')) + ", NULL, NULL, '" + JSON.stringify(attach) + "', '1970-01-01 00:00:00', '1970-01-01 00:00:01' )"
                    );
                }
            }
            console.log('\x1b[32mTables has been inited\x1B[0m');
        } else {
            throw new Error("Item list empty! Please check config.yaml");
        }
    } catch (error) {
        console.error('\x1B[31mError: \x1B[35m' + error + '\x1B[0m')
        process.exit()
    }
}




process.on('SIGINT', function () {
    Op.dbList.forEach((e)=>{
      e.db.close();
      console.log('\x1b[32mDatabase \x1B[36m' + e.name + '\x1b[32m has been closed.\x1B[0m')
    });
    process.exit();
});


module.exports = function(config){
    Op.itemList = config;
    return Op
};