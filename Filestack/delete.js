const csv = require("csv-parse");
const fs = require("fs");
const axios = require("axios");
const APIKEY = "AFr2KJdocT16BQBQZYFWcz";
const secret = "VEMEOZCSGVEMBAIITG3WHREGSE";
const hmacsig =
  "9e298172f6c12244b0994c76780eb77c92a89339bc4592d15ad749074a6bdac2";
var crypto = require("crypto");
const { syncBuiltinESMExports } = require("module");

// Initialize the parse

var hmac = crypto.createHmac("sha256", APIKEY);

var policy = {
  expiry: Date.now() / 1000 + 60 * 60 * 24,
};

//var policyBase64 = Buffer(JSON.stringify(policy)).toString('base64');
//var signature = hmac.update(policyBase64).digest('base64');
var policyBase64 =
  "eyJleHBpcnkiOjE3MTcxOTI4MDAsImNhbGwiOlsicGljayIsInJlYWQiLCJzdGF0Iiwid3JpdGUiLCJ3cml0ZVVybCIsInN0b3JlIiwiY29udmVydCIsInJlbW92ZSIsImV4aWYiLCJydW5Xb3JrZmxvdyJdfQ==";
var signature = hmacsig;
var numberOfErrors = 0;
var csvData = [];
fs.createReadStream("./handles.csv")
  .pipe(csv.parse({ delimiter: "," }))
  .on("data", function (csvrow) {
    csvData.push(csvrow);
    // filter data to last year
    // if (new Date(csvrow[3]) < new Date('2021-01-01')) {
    //
    //     // run delete for each row
    // }
    //do something with csvrow
  })
  .on("end", async function () {
    //do something with csvData
    for (var i = 16972; i < csvData.length; i++) {
      let row = csvData[i];
      let HANDLE = row[0];
      console.log('sending..', HANDLE);
      let res = await axios
        .delete(
          `https://www.filestackapi.com/api/file/${HANDLE}?key=${APIKEY}&policy=${policyBase64}&signature=${signature}&skip_storage=false`,
          {
            username: "app",
            password: APIKEY,
          }
        ).then((res) => {
          console.log('success', res.status);
        })
        .catch((err) => {
          if (!err.response || err.response.status !== 404) {
            console.error(err);
            numberOfErrors++;
          }
        });
      if (res && res.status !== 200) {
        console.error(res.status);
        numberOfErrors++;
      }
    }

    console.log("number of errors ", numberOfErrors);
  });
