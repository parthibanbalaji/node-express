const express = require('express');
const app = express();
const mySql = require('mysql');
const fs = require('fs');
const http = require('https');
var Client = require('node-rest-client').Client;
var client = new Client();
const port = 3001;

// Database connection
var connection = mySql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mysql"
});

// Set EJS as templating engine 
app.set('view engine', 'ejs'); 
app.use('/public', express.static('public'));

//Creating table
createConnectionAndTableIfNotExists();

//Route to get data form api and to store in db
//dowload file
//Show data in the db
app.get('/', (req, res) => {
    var args = {
        parameters: { zipcode: "33186"},
        headers: { access_token: 'ZiPcoDeDetAiLs' } 
    };
    
    //calling api
    client.get('http://lms.labyrinthelab.com/api/ws_get_zipcode_details.php', args,
        function (data, response) {
            // parsed response body as js object
            console.log(data);
            if(data.MESSAGE == 'Success') {
                insertData(data.RESPONSE_DATA);
                downloadFile(data.RESPONSE_DATA.file_url);
                getRecords().then((records)=>{
                    res.render('home',{records:records});
                })
            }

    });

    
})

app.listen(port, () => console.log(`App listening at http://localhost:${port}`))

// function to create a connection and a table if it is not exists in the database
function createConnectionAndTableIfNotExists() {
    connection.connect(function(err) {
        if (err) throw err;
        connection.query("SELECT * FROM zipcodes", function (err, result, fields) {
            if (err) {
                var sql = "CREATE TABLE zipcodes (state_id VARCHAR(255), city_name VARCHAR(255),city_id VARCHAR(255),state_name VARCHAR(255), country_id VARCHAR(255), country_name VARCHAR(255), file_url VARCHAR(255))";
                connection.query(sql, function (err, result) {
                    if (err) throw err;
                    console.log("Table created");
                });
            }     
        });
    });
}

//function to insert response into db
function insertData(responseData) {
    var sql = "INSERT INTO zipcodes (state_id, city_name, city_id, state_name, country_id, country_name, file_url) VALUES ?";
    var values = [ [responseData.state_id,responseData.city_name,responseData.city_id,responseData.state_name,responseData.country_id,responseData.country_name,responseData.file_url] ];
    connection.query(sql,[values], function (err, result) {
        if (err) throw err;
        console.log("1 record inserted, ID: " + result.insertId);
    });
}

//function to download file form the response url
function downloadFile(url) {
    const file = fs.createWriteStream('test.pdf');
    const request = http.get(url, function(response) {
    response.pipe(file);
    });
}

//function to get all the stored records
function getRecords() {
    return new Promise((resolve,reject) => {
        var sql = 'SELECT * from zipcodes';
        connection.query(sql, function (err, result) {
            if (err) reject(err);
            resolve(result);
        });
    })
}
