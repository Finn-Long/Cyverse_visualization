import fetch from 'node-fetch'
import {LocalStorage} from "node-localstorage"
import fs from 'fs'
var localStorage = new LocalStorage('./scratch');

//Main
//await init();
//setup_storage_helper();
//await setup_storage_helper();
//await init();

//var filter = filter_logs("lfy55-test1-12881323", 0, 0, 0, 0, 0);
// console.log(filter);
//writeArrayToFile(filter)
//print_all_active_logs();

// var logId1 = "lfy55-test1-18408231";
// var logId2 = "lfy55-test1-12881323";
// var logId3 = "whatif-83558120";
// console.log(print_user_report(logId2));
// var all_ids = await getData_helper2();
// all_ids = all_ids.found_items;
// for (let i = 0; i < all_ids.length; i ++) {
//   var id = all_ids[i];
//   console.log(await getData_helper3(id));
// }
//await requestData_find();
//const ids = await requestData_find();
await requestData_get("log_ids");



//Main functions
function print_user_report(logId) {
  console.log("User logId: " + logId);
  console.log("User's current progress: " + current_progress(logId));
  console.log("Time spent on each section: ")
  const section_time_dict = get_time_by_section(logId);
  for (let key in section_time_dict) {
    var time = section_time_dict[key];
    console.log(key + ": " + time + " minutes");
  }
  console.log("Total amount of time spent so far: " + total_time_spent(logId) + " minutes");
  const arr = get_most_time_setion(logId);
  console.log("Section takes most time to complete is " + arr[0] + ", " + arr[1] + " minutes");
}

function get_most_time_setion(logId) {
  const section_time_dict = get_time_by_section(logId);
  var max_time = 0;
  var section = "";
  for (let key in section_time_dict) {
    var time = section_time_dict[key];
    if (time > max_time) {
      max_time = time;
      section = key;
    }
  }
  return [section, max_time];
}

function get_time_by_section(logId) {
  const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
  if (log_arr == null) {
    throw "Couldn't find corresponding logId";
  }
  var result = {};
  for (let i = 0; i < log_arr.length; i ++) {
    var pre_quiz_name = quiz_url_helper((log_arr[i].url + ""));
    if (pre_quiz_name !== "No match found" && !pre_quiz_name.includes('Post-Quiz')) {
      var j = i + 1;
      var post_quiz_name = pre_quiz_name.replace('Pre', 'Post');
      post_quiz_name = post_quiz_name.replace('in progress', '');
      var debug = quiz_url_helper((log_arr[j].url + ""));
      var debug1 = debug.replace('Completed', '');
      var debug2 = (post_quiz_name === debug1);
      while (j < log_arr.length && (quiz_url_helper((log_arr[j].url + "")).replace('in progress', '').replace('Completed', '')) !== post_quiz_name){
        j++;
      }
      var section_name = pre_quiz_name.replace(' in progress', '');
      section_name = section_name.replace('Pre-Quiz:', '');
      if (j >= log_arr.length) {
        result[section_name] = -1;
      }else {
        result[section_name] = active_time_between(i, j+1, 40, log_arr);
      }
    }
  }
  return result;
}

function current_progress(logId) {
  const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
  if (log_arr == null) {
    throw "Couldn't find corresponding logId";
  }
  for (let i = log_arr.length - 1; i >= 0; i--) {
    var quiz_url = log_arr[i].url + "";
    var matching_quiz_name = quiz_url_helper(quiz_url);
    if (matching_quiz_name !== "No match found") {
      return matching_quiz_name;
    }
  }
  return "Haven't started the tutorial or haven't completed any quizzes."
}

function time_between(pre_quiz, post_quiz, logId) {
  const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
  if (log_arr == null) {
    throw "Couldn't find corresponding logId";
  }
  var start_index = -1;
  var end_index = -1;
  for (let i = 0; i < log_arr.length; i ++) {
    if ((log_arr[i].url + "").includes(pre_quiz)) {
      start_index = i;
    }else if ((log_arr[i].url + "").includes(post_quiz)) {
      end_index = i;
    }
  }
  if (start_index < 0 || end_index < 0) {
    throw "Haven't completed pre / post quiz"
  }
  return active_time_between(start_index, end_index + 1, 45, log_arr);
}

function print_all_active_logs() {
  for (let i = 0; i < localStorage.length; i ++) {
    var key = localStorage.key(i);
    var time = total_time_spent(key);
    if (time != 0) {
      console.log("Ctverse Id = " + key + ", time spent = " + time);
    }
  }
}

function total_time_spent(logId) {
  const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
  if (log_arr == null) {
    return -1;
  }
  return active_time_between(0, log_arr.length, 15, log_arr);
}

function active_time_between(index1, index2, time_lapse, log_arr) {
  if (index1 < 0 || index2 < 0 || index1 >= log_arr.length || index2 > log_arr.length) {
    throw "Invalid index input."
  }
  var total_m = 0;
  var pre_time = new Date(Date.parse(log_arr[index1].timestamp));
  for (let i = index1; i < index2; i ++) {
    var cur_time = new Date(Date.parse(log_arr[i].timestamp));
    var time_diff = Math.floor((cur_time - pre_time)/1000/60);
    if (time_diff < time_lapse) {
      total_m += time_diff;
    }
    pre_time = cur_time;
  }
  return total_m;
}

/**
 * Read data from file 'logs.json' and filters the log data by based on
 * the following parameters, throws error if 'logs.json' doesn't exist.
 * @param {String} username - Specify username
 * @param {String} timeBefore - Get logs before date provided, E.g. 2022-07-01
 * @param {String} timeAfter - Get logs after date provided, etc. 2022-07-01
 * @param {String} event - Specify event name of logs
 * @param {String} eventType - Specify event type of logs
 * @param {String} url - Specify the url of logs
 * @returns {Array} - Array of logs based on the filter conditions
 */
function filter_logs(username, timeBefore, timeAfter, event, eventType, url){
  //setup_storage_helper();
  var log_object = localStorage.getItem(username);
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

function filter_not_event(log_arr, event, eventType) {
  var filtered = log_arr;
  if (event != 0) {
    filtered = filtered.filter(log => log.event != event);
  }
  if (eventType != 0) {
    filtered = filtered.filter(log => log.eventType != eventType);
  }
  return filtered;
}

function filter_includes(log_arr, event, eventType, url) {
  var filtered = log_arr;
  if (event != 0) {
    filtered = filtered.filter(log => log.event.includes(event));
  }
  if (eventType != 0) {
    filtered = filtered.filter(log => log.eventType.includes(eventType));
  }
  if (url != 0) {
    filtered = filtered.filter(log => log.url.includes(url));
  }
  return filtered;
}

/**
 * Initialize the process by fetching data from remote and storing log data
 * back to a local json file called "logs.json" for later use. (Excludes "CuverseDefaultUser")
 */
async function init() {
  const data = await getData_helper();
  const data_arr = data.logs;
  const filtered = data_arr.filter(data => !(data.log_id + "").includes("CyVerseDefaultUser"));
  writeFile(filtered);
}

function getAllEvents(log_arr) {
  var event_arr = [];
  log_arr.forEach(log => {
    var event = log.event;
    if (event_arr.indexOf(event) == -1) {
      event_arr.push(event);
    }
  });
  return event_arr;
}

function getAllEventType(log_arr) {
  var eventType_arr = [];
  log_arr.forEach(log => {
    var eventType = log.eventType;
    if (eventType_arr.indexOf(eventType) == -1) {
      eventType_arr.push(eventType);
    }
  });
  return eventType_arr;
}


//Helper functions

async function setup_storage_helper() {
  localStorage.clear();
  var exi = fs.existsSync('logs.json');
  if (!exi){
    throw ("initialize first");
  }
  var raw_log = readFile('logs.json');
  local_storage_helper(raw_log.logs);
}

function writeArrayToFile(filter) {
  const writeStream = fs.createWriteStream('array.txt');
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

function writeFile(arr_of_logs) {
  var data = {};
  data.logs = arr_of_logs;
  fs.writeFile("logs.json", JSON.stringify(data), function(err) {
    if (err) {
      throw err;
    }else {}
      console.log("complete");
    })
}

function readFile() {
  var obj = JSON.parse(fs.readFileSync('logs.json', 'utf8'));
  return obj;
}

async function getData_helper3(id) {
  const PULL_URL = "https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/get-cyverse-log";

  var help_data = {
      body: {
        "password": "password",
        "log_id": id,
        "course_id": "Cyverse_Cloud_Tutorial"
      }
  }

  var headers = {
      "Content-Type": "application/json"
  }

  const response = await fetch(PULL_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(help_data)
  });
  return response.json();
}

async function getData_helper2() {
  const PULL_URL = "https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/find-cyverse-log";

  var help_data = {
      body: {
        "password": "password",
        "find": "log_id",
        "by": "log_type",
        "value": "ChromePlugin",
        "course_id": "Cyverse_Cloud_Tutorial"
      }
  }

  var headers = {
      "Content-Type": "application/json"
  }

  const response = await fetch(PULL_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(help_data)
  });
  return response.json();
}

async function getData_helper() {
  const PULL_URL = "https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/get-cyverse-log";

  var help_data = {
      body: {
        "log_type": "ChromePlugin",
        "password": "password",
        "limit": 6000,
        "skip": 0,
        "course_id": "Cyverse_Cloud_Tutorial"
      }
  }

  var headers = {
      "Content-Type": "application/json"
  }

  const response = await fetch(PULL_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(help_data)
  });
  return response.json();
}

function local_storage_helper(user_log_arr) {
  var arr = [];
  arr = user_log_arr;
  arr.forEach(user_log => {
    const username = user_log.log.logID;
    var log_list = user_log.log.logArray;
    localStorage.setItem(username, JSON.stringify(log_list));
  });
}


function quiz_url_helper(url) {
  switch(true) {
    case (url.includes("1FAIpQLSddCGvt7FriT0z3PhiLvi43-Vi9yBfla1Yi6ABQeJK68zdmsw/formResponse")):
      return "DNA Subway in progress: Pre-Quiz: File System";
    case (url.includes("1FAIpQLScrLQ6sPbKsJE_XWPW9KoPm_mzcXixBORRJBDNztE6RLanq-Q/formResponse")):
      return "DNA Subway in progress: Post-Quiz: File System";
    case (url.includes("1FAIpQLScUzQHQOFezUmID7lwJDgGhxgjtnjHBFNfMjCU_7aWoEFXU6A/formResponse")):
      return "DNA Subway in progress: Pre-Quiz: Basic Computation";
    case (url.includes("1FAIpQLSdio-36gufdOH-iwlcAroKij-wnIAPL0-MQgRi6CDA12Fm3Cg/formResponse")):
      return "DNA Subway in progress: Post-Quiz: Basic Computation";
    case (url.includes("1FAIpQLSeHeBZ_LH7kzg9yW_DzKur4yqWF9gdO0LWm3KCCU2u6WypzEQ/formResponse")):
      return "DNA Subway in progress: Pre-Quiz: Basic Genetics";
    case (url.includes("1FAIpQLSfXUX5Jr2moJDv7O7eQYjRjoyrk5NsbHFXEXYFfWoTMcXF99A/formResponse")):
      return "DNA Subway in progress: Post-Quiz: Basic Genetics";
    case (url.includes("1FAIpQLScQaX9ukw_eyaA7aMD6Pl_4q_KJ1r-ARxPN5uXM_bsvB95n1w/formResponse")):
      return "DNA Subway in progress: Pre-Quiz: FastX (Trimming + Filtering) Toolkit";
    case (url.includes("1FAIpQLSc8qQblV-rqShUmf8zIaZDNoJlid2lG2VrlM0oH-Kz5Sb3klg/formResponse")):
      return "DNA Subway in progress: Post-Quiz: FastX (Trimming + Filtering) Toolkit";
    case (url.includes("1FAIpQLSfy8nP9pGmEgliCFJG1PjwySgoHKsQNP_IZB0C_hksLi0hOiw/formResponse")):
      return "DNA Subway in progress: Pre-Quiz: Kallisto (Alignment) + Sleuth (Differential Analysis)";
    case (url.includes("1FAIpQLSe4qhVC3vFo6MDiDFUs7xFELH1VEyV4mqdlN-m50DozlkESRw/formResponse")):
      return "DNA Subway in progress: Post-Quiz: Kallisto (Alignment) + Sleuth (Differential Analysis)";
    case (url.includes("1FAIpQLSdgm5NKev7ZiSL_7DswMQdpTJEzL45LVc6dXt5fUuCYo90NGA/formResponse")):
      return "DNA Subway in progress: Pre-Quiz: High-Performance Cloud Computing";
    case (url.includes("1FAIpQLSeg72q8HBIiJCBS54pKvlfPXbad7JwxdNKQC5KrC4OWoOka3A/formResponse")):
      return "DNA Subway Completed: Post-Quiz: High-Performance Cloud Computing";
  }
  return "No match found";
}




//new requesting data endpoint below

async function requestData_get(id) {
  //https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/find-cyverse-log
  const PULL_URL = "https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/get-cyverse-log";
  var help_data = {
      body: {
        "password": "password",
        "skip": 0,
        "limit": 100,
        "log_type": "Bash",
        "course_id": "Cyverse-RNA-Tutorial",
        //"log_id": id
      }
  }
  var headers = {
      "Content-Type": "application/json"
  }
  fetch(PULL_URL, {method: 'POST', headers: headers, body: JSON.stringify(help_data)})
    //.then(checkStatus)
    .then(resp => resp.json())
    .then(printLog)
    //.then(filter_resp_test)
    //.then(local_storage_setup_test)
    //.then(display_overall_mode)
    //.then(select_Id)
}

async function requestData_find() {
  //https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/find-cyverse-log
  const PULL_URL = "https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/find-cyverse-log";
  var help_data = {
      body: {
        "password": "password",
        "find": "log_id",
        "by": "log_type",
        "value": "Bash"
      }
  }
  var headers = {
      "Content-Type": "application/json"
  }
  fetch(PULL_URL, {method: 'POST', headers: headers, body: JSON.stringify(help_data)})
    //.then(checkStatus)
    .then(resp => resp.json())
    .then(getAllLog)
    //.then(filter_resp_test)
    //.then(local_storage_setup_test)
    //.then(display_overall_mode)
    //.then(select_Id)
}

async function getAllLog(ids) {
  var all_id = ids.found_items;
  for (let i = 0; i < all_id.length; i ++) {
    await requestData_get(all_id[i]);
  }
}

function printLog (log) {
  console.log(log);
}

function filter_resp_test(id_arr) {
  var all_ids = id_arr.found_items;
  var filtered = all_ids.filter(data => !data.includes("CyVerseDefaultUser"));
  return filtered;
}

async function local_storage_setup_test(all_ids) {
  for (let i = 0; i < all_ids.length; i ++) {
    var id = all_ids[i];
    var log = await fetch_by_id(id);
    var log_list = log.logs[0].log.logArray;
    console.log(id);
    console.log(JSON.stringify(log_list));
  }
}

async function fetch_by_id(id) {
  const PULL_URL = "https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/get-cyverse-log";

  var help_data = {
      body: {
        "password": "password",
        "log_id": id,
        "course_id": "Cyverse_Cloud_Tutorial"
      }
  }

  var headers = {
      "Content-Type": "application/json"
  }

  const response = await fetch(PULL_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(help_data)
  });
  return response.json();
}




