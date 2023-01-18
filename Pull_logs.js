import fetch from 'node-fetch'
import fs from 'fs'
import {LocalStorage} from "node-localstorage"
var localStorage = new LocalStorage('./scratch');


//Main:

requestData(); //Only call for the first time to setup localStorage or when updating log data
// const my_log_all = filter_logs('lfy55-test1-12881323', 0, 0, 0, 0, 0); //my_log_all here contains all the logs of userID "lfy55-test1-12881323"
// console.log(my_log_all); //Have a quick look of what the logs look like, but won't print the full log
// writeArrayToFile(my_log_all); //write the array(my_log_all) to a file called dataArray.txt to see all details
// printAllUserId(); //print out all the userId




//Helper functions below:

// Every time this function is called, it will send a request to the API, fetch all the logs data
// and store them in a localStorage object, which has all the userId as keys and all the logs of
// the corresponding userId as values.
// Only have to call this function for the FIRST time or whenever you want to UPDATE the data in localStorage, Otherwise
// just use the data stored in localStorage for testing. (Requesting all the logs every time you run the program will be time-consuming)
function requestData() {
  const PULL_URL = "https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/get-cyverse-log";
  var help_data = {
    body: {
      "log_type": "Bash",
      "password": "password",
      "limit": 6000,
      "skip": 0,
      "course_id": "Cyverse_Cloud_Tutorial"
    }
  }
  var headers = {
      "Content-Type": "application/json"
  }
  fetch(PULL_URL, {method: 'POST', headers: headers, body: JSON.stringify(help_data)})
    .then(checkStatus)
    .then(resp => resp.json())
    .then(printLog)
    //.then(filter_resp)
    //.then(local_storage_setup)
    //.then(select_Id)
}

function printLog(logs) {
  console.log(logs);
}

function checkStatus(response) {
  if (response.ok) {
    return response;
  } else {
    throw Error("Error in request: " + response.statusText);
  }
}

function filter_resp(data) {
  const data_arr = data.logs;
  const filtered = data_arr.filter(data => !(data.log_id + "").includes("CyVerseDefaultUser"));
  return filtered;
}

function local_storage_setup(user_log_arr) {
  var arr = [];
  arr = user_log_arr.logs;
  //console.log(arr);
  writeArrayToFile(arr);
  // arr.forEach(user_arr => {
  //   var log_id = user_arr.log_id;
  //   var log_list = user_arr.log.logArray;
  //   localStorage.setItem(log_id, JSON.stringify(log_list));
  //});
}

 /**
 * Read data from localStorage object and filters the log data based on
 * the following parameters.
 * @param {String} log_id - Required, Specify userId E.g "lfy55-test1-12881323"
 * @param {String} timeBefore - Optional, Get all logs before date provided, E.g. 2022-07-01
 * @param {String} timeAfter - Optional, Get all logs after date provided, E.g 2022-07-01
 * @param {String} event - Optional, Specify event name of logs
 * @param {String} eventType - Optional, Specify event type of logs
 * @param {String} url - Optional, Specify the url of logs
 * @returns {Array} - Array of logs based on the filter conditions
 */
  function filter_logs(log_id, timeBefore, timeAfter, event, eventType, url){
    var log_object = localStorage.getItem(log_id);
    if (log_object === 'undefined') {
      return null;
    }
    var logs = JSON.parse(log_object);
    if (timeBefore != 0) {
      var date = new Date(timeBefore);
      logs = logs.filter(log => date > new Date(Date.parse(log.timestamp)));
    }
    if (timeAfter != 0) {
      var date = new Date(timeAfter);
      date.setDate(date.getDate()+1);
      logs = logs.filter(log => date < new Date(Date.parse(log.timestamp)));
    }
    if (event != 0) {
      logs = logs.filter(log => log.event == event);
    }
    if (eventType != 0) {
      logs = logs.filter(log => log.eventType == eventType);
    }
    if (url != 0) {
      logs = logs.filter(log => log.url == url);
    }
    return logs;
  }

// Given an array and write the content of the array to file "dataArray.txt"
function writeArrayToFile(filter) {
  const writeStream = fs.createWriteStream('dataArray.txt');
  const pathName = writeStream.path;

  // write each value of the array on the file breaking line
  filter.forEach(value => writeStream.write(`${JSON.stringify(value)}\n`));

  // the finish event is emitted when all data has been flushed from the stream
  writeStream.on('finish', () => {
  console.log(`wrote all the array data to file ${pathName}`);
  });

  // handle the errors on the write process
  writeStream.on('error', (err) => {
  console.error(`There is an error writing the file ${pathName} => ${err}`)
  });

  // close the stream
  writeStream.end();
}

// Prints out all the current userId
function printAllUserId() {
  for (let i = 0; i < localStorage.length; i ++) {
    console.log(localStorage.key(i));
  }
}

