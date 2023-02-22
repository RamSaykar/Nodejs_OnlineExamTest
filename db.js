    var mysql = require('mysql')
    var dbconnection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'McqTest'
    });

    module.exports = {
        dbconnection
    }