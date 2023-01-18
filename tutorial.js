"use strict";

(function() {
  window.localStorage;
  //1

  window.addEventListener("load", init);

  const quiz_urls = get_quiz_url();
  const quiz_names = get_quiz_name();
  const random_names = get_random_names();
  const active_laps = 20;
  const stucked_duration = 45;
  var selectList = [];
  var cur_ids = [];
  var cut_ind = -1;
  var cur_num = -1;
  var end = -1;
  const default_num = 5; //default display number
  var time_id_distribution = []
  var progress_id_distribution = []


  function init() {
    //localStorage.clear();
    //requestData_test();
    document.getElementById("refresh").addEventListener("click", requestData_test);
    document.getElementById("execute_btn").addEventListener("click", execute_query);
    document.getElementById("reset_query").addEventListener("click", reset_query);
    document.getElementById("pre").addEventListener("click", get_prev);
    document.getElementById("next").addEventListener("click", get_next);
    document.getElementById("num").selectedIndex = 1;
    document.getElementById("num").addEventListener("change", execute_query)
    document.getElementById("section").addEventListener("change", execute_query);
    document.getElementById("status").addEventListener("change", execute_query);
    document.getElementById("skipped").addEventListener("change", execute_query);
    document.getElementById("orderby").addEventListener("change", execute_query);
    document.getElementById("order").addEventListener("change", execute_query);
    document.getElementById("distribution-select").addEventListener("change", toggle_distribution);
    document.getElementById("distribution-select").selectedIndex = 0;
    chooseMode();
    document.getElementById("multiple_student").addEventListener("click", setMultipleView);
    display_overall_mode();
    select_Id();
    progress_scatter_chart("scroll-chart1", true);
    requestData_get(); //testing to request and display bash logs

  }

  //test form api request:**************************************************
  function start() {
    // Initializes the client with the API key and the Translate API.
    gapi.client.init({
      'apiKey': 'AIzaSyCrk7pe5eyRSr4F3UY0R81pnK7qROmtxCk',
      'discoveryDocs': ["https://forms.googleapis.com/$discovery/rest?version=v1"],
      'clientId': "1082759085293-n0akqpbgqm1u0ndp32r8rqjpib5bi3ql.apps.googleusercontent.com"
    }).then(function() {
      // Executes an API request, and returns a Promise.
      // The method name `language.translations.list` comes from the API discovery.
      return gapi.client.forms.forms.responses.list({
        formId: "1l_UDk9xZAHrywXY-HWqvsZZYa6RZB9lMvD0zZFBD7f4"
      });
    }).then(function(response) {
      console.log(response.result.data);
    }, function(reason) {
      console.log('Error: ' + reason.result.error.message);
    });
  };

  //==============================================================================
  //tester function for bash logs
  function requestData_get() {
    //https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/find-cyverse-log
    const PULL_URL = "https://us-south.functions.appdomain.cloud/api/v1/web/ORG-UNC-dist-seed-james_dev/cyverse/get-cyverse-log";
    var help_data = {
        body: {
          "password": "password",
          "skip": 0,
          "limit": 500,
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
  function printLog (log) {
    console.log(log);
  }


  function toggle_distribution() {
    var selected = document.getElementById("distribution-select").value;
    if (selected == "Status Counting") {
      document.getElementById("user-number-board").style.display = "flex";
      document.getElementById("distribution-board").style.display = "none";
    }else {
      document.getElementById("user-number-board").style.display = "none";
      document.getElementById("distribution-board").style.display = "flex";
      distribution_chart();
    }
  }

  function distribution_chart() {
    time_id_distribution = [];
    progress_id_distribution = [];
    var ids = get_active_ids();
    var time_and_progress_data = get_time_and_progress(ids);
    var time_data = time_and_progress_data.time;
    var progress_data = time_and_progress_data.progress;
    var progress_label = ["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"]
    console.log(time_data);
    console.log(progress_data);

    //populate progress data
    var progress_data_final = [];
    var progress_label = [];
    for (let i = 0; i < 100; i += 10) {
      var min = i;
      var max = i+10;
      var count = 0;
      var id_list = [];
      for (let j = 0; j < progress_data.length; j ++) {
        if (i == 0) {
          if (progress_data[j].progress <= max) {
            count ++;
            id_list.push(progress_data[j].id)
          }
        }else {
          if (progress_data[j].progress > min && progress_data[j].progress <= max) {
            count ++;
            id_list.push(progress_data[j].id)
          }
        }
      }
      if (count != 0) {
        progress_data_final.push(count);
        var label = min + "-" + max + "%"
        progress_label.push(label);
        progress_id_distribution.push(id_list)
      }
    }

    //populate time distribution data
    var max_time = -1;
    var min = Number.MAX_VALUE;
    for (let i = 0; i < time_data.length; i ++) {
      if (time_data[i].time < min) {
        min = time_data[i].time;
      }
      if (time_data[i].time > max) {
        max = time_data[i].time;
      }
    }
    var cutoff = Math.ceil((max - min)/10/10) * 10;
    var time_data_final = [];
    var time_label = [];
    for (let i = 0; i < 10; i ++) {
      var count = 0;
      var min = i*cutoff;
      var max = min + cutoff;
      var id_list = [];
      for (let j = 0; j < time_data.length; j ++) {
        if (time_data[j].time >= min && time_data[j].time < max) {
          count ++;
          id_list.push(time_data[j].id)
        }
      }
      if (count != 0) {
        time_data_final.push(count);
        var label = min + "-" + max
        time_label.push(label);
        time_id_distribution.push(id_list);
      }
    }
    // console.log(time_data)
    // console.log(time_label);
    // console.log(progress_id_distribution)

    //draw chart
    draw_distribution(time_data_final, time_label, "Time Distribution (Minutes)", time_id_distribution);
    draw_distribution(progress_data_final, progress_label, "Progress Distribution", progress_id_distribution)

  }

  function get_time_and_progress(ids) {
    var time_data = [];
    var progress_data = [];
    var progress_label = ["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"]
    for (let i = 0; i < ids.length; i ++) {
      var id = ids[i];
      var time = get_total_active_time(id);
      time_data.push({time: time, id: id});
      var progress_ind = current_progress_ind(id);
      var progress_percent = Math.round(progress_ind / 57 * 100);
      progress_data.push({progress: progress_percent, id: id});
    }
    return {time: time_data, progress: progress_data};
  }

  function draw_distribution(data, label, chart_id, id_distribution) {
    //setup annotation

    const data_final = {
      labels: label,
      datasets: [{
        label: 'Students in this range',
        data: data,
        backgroundColor: [
          'rgba(153, 204, 255)',
          'rgba(102, 178, 255)',
          'rgba(51, 153, 255)',
          'rgba(0, 128, 255)',
        ],
        hoverBackgroundColor: [
          'rgba(219, 182, 59, 0.8)'
        ]
      }]
    };

    const config = {
      type: 'bar',
      data: data_final,
      options: {
        onHover: (event, chartElement) => {
          event.native.target.style.cursor = chartElement[0] ? 'pointer': 'default';
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: chart_id
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      },
    };

    var chartExist = Chart.getChart(chart_id); // <canvas> id
    if (chartExist != undefined){
      chartExist.destroy();
    }
    var ctx = document.getElementById(chart_id).getContext('2d');
    const myChart = new Chart(ctx, config);
    myChart.canvas.onclick = clickHandler;

    //make bar chart clickable
    function clickHandler(click) {
      const points = myChart.getElementsAtEventForMode(click, 'nearest', {intersect: true}, true);
      var id_list = id_distribution[points[0].index];
      progress_scatter_chart_id(id_list, true);
    }
  }

  function progress_distribution_chart() {
    document.getElementById("distribution-board").textContent = "progress";
  }

  function setMultipleView() {
    selectList = [];
    milestone_time_chart(get_active_ids());
    total_run_time_chart(get_active_ids());
  }

  function chooseMode() {
    document.getElementById("mode_btn").addEventListener("click", event => {
      toggle_mode();
    });
  }

  function display_overall_mode() {
    set_random_name();
    // milestone_time_chart(get_active_ids());
    total_run_time_chart(get_active_ids());
    // test scroll =======================
    progress_scatter_chart("scroll-chart1", true);
    all_vs_average_scatter();
  }

  function all_vs_average_scatter() {
    var ids = get_active_ids();
    var time_progress_data = get_time_and_progress(ids);
    var time_data = time_progress_data.time;
    var progress_data = time_progress_data.progress;
    var total_time = 0;
    var total_progress = 0;
    for (let i = 0; i < time_data.length; i ++) {
      total_time += time_data[i].time;
      total_progress += progress_data[i].progress;
    }
    var ave_time = total_time / ids.length;
    var ave_progress = total_progress / ids.length;
    var first_data = [];
    var second_data = [];
    var third_data = [];
    var fourth_data = [];
    for (let i = 0; i < time_data.length; i ++) {
      var time = time_data[i].time;
      var progress = progress_data[i].progress;
      var id = time_data[i].id;
      var name = localStorage.getItem("**"+id);
      var temp = {x: time, y: progress, name: name};
      if (time > ave_time && progress > ave_progress) {
        first_data.push(temp);
      }else if (time <= ave_time && progress > ave_progress) {
        second_data.push(temp);
      }else if (time <= ave_time && progress <= ave_progress) {
        third_data.push(temp);
      }else {
        fourth_data.push(temp);
      }
    }
    var dataset = [{
      label: "Good",
      data: first_data,
      backgroundColor: 'rgb(30,144,255)'
    }, {
      label: "Excellent",
      data: second_data,
      backgroundColor: "rgb(60,179,113)"
    }, {
      label: "Fair",
      data: third_data,
      backgroundColor: "rgb(240,128,128)"
    }, {
      label: "Left Behind",
      data: fourth_data,
      backgroundColor: "rgb(105,105,105)"
    }]

    var chartExist = Chart.getChart("all_average"); // <canvas> id
    if (chartExist != undefined){
      chartExist.destroy();
    }
    var ctx = document.getElementById("all_average").getContext('2d');
    var myChart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: dataset
      },
      options: {
        scales: {
          y: {
            title: {
              display: true,
              text: "progress"
            },
            ticks: {
              callback: function (value, index, ticks) {
                return value + "%"
              }
            }
          },
          x: {
            title: {
              display: true,
              text: "Time (minutes)"
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: "Time vs Progress"
          },
          autocolors: false,
          annotation: {
            annotations: {
              line1: {
                type: 'line',
                yMin: ave_progress,
                yMax: ave_progress,
                borderColor: 'rgb(100,149,237)',
                borderWidth: 2,
                label: {
                  display: true,
                  font: 8,
                  borderRadius: 2,
                  padding: 2,
                  position: "end",
                  content: "Average progress:" + Math.round(ave_progress*100)/100 + "%"
                }
              },
              line2: {
                type: 'line',
                xMin: ave_time,
                xMax: ave_time,
                borderColor: 'rgb(70,130,180)',
                borderWidth: 2,
                drawTime: 'beforeDatasetsDraw',
                label: {
                  font: 8,
                  display: true,
                  borderRadius: 2,
                  padding: 2,
                  position: "start",
                  content: "Average time: " + Math.round(ave_time*100)/100,
                },
                callbacks: {
                  label: (context) => {
                    return "1"
                  }
                }
              },
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return context.raw.name + ", " + "progress: " + context.raw.y + "%, " + "time: " + context.raw.x + " mins"
              }
            }
          }
        }
      }
    })
  }

  function reset_query() {
    document.getElementById("num").selectedIndex = 1;
    document.getElementById("section").selectedIndex = 0;
    document.getElementById("status").selectedIndex = 0;
    document.getElementById("skipped").checked = false;
    document.getElementById("orderby").selectedIndex = 0;
    document.getElementById("order").selectedIndex = 0;
    cur_ids = [];
    cut_ind = -1;
    cur_num = -1;
    end = -1;
    progress_scatter_chart("scroll-chart1", true)
  }

  function get_prev() {
    if (cur_num < cur_ids.length) {
      if (end != -1) {
        end = -1;
      }else {
        if (cut_ind - cur_num > 0) {
          cut_ind -= cur_num;
        }
      }
      execute_query();
    }
  }

  function get_next() {
    if (cur_num < cur_ids.length) {
      if (cut_ind + cur_num <= cur_ids.length) {
        cut_ind = cut_ind + cur_num;
      }else {
        end = cur_ids.length - cut_ind;
      }
      execute_query();
    }
  }


  function toggle_mode() {
    document.querySelector('#main_header').textContent = "Cloud Tutorial User Analysis";
    var user_container = document.getElementById("user_mode_container");
    var overall_container = document.getElementById("overall_mode_container");
    if (user_container.style.display === "none") {
      overall_container.style.display = "none";
      user_container.style.display = "block";
      document.querySelector("#test_hide").style.display = "none";
      document.querySelector('#search').style.display = 'block'
      // document.querySelector('#user_info').style.display = 'none';
      select_Id();
    }else {
      user_container.style.display = "none";
      overall_container.style.display = "block";
      display_overall_mode();
    }
  }

  function select_Id() {
    const input = document.querySelector('#logId');
    const suggestions = document.querySelector('.suggestions ul');
    input.addEventListener('keyup', searchHandler);
    suggestions.addEventListener('click', useSuggestion);
    const select_btn = document.querySelector('#select_id');
    select_btn.addEventListener('click', function() {
      const input_value = input.value;
      if (has_key(input_value)){
        document.querySelector('#id_error').style.display = 'none';
        toggle_class_isibility('block');
        main(input_value);
      }else {
        toggle_class_isibility('none');
        document.querySelector('#id_error').style.display = 'block';
      }
    })
  }

  function toggle_class_isibility(visibility) {
    document.getElementById("test_hide").style.display = visibility;
  }

  function main(logId) {
    document.querySelector("#main_header").textContent = "Report for userId: " + logId;
    overall_progress_chart(logId);
    section_progress_chart(logId, 1);
    section_progress_chart(logId, 2);
    section_progress_chart(logId, 3);
    show_total_time(logId);
    section_time_chart(logId);
    sub_part_time_chart(logId, 1);
    sub_part_time_chart(logId, 2);
    sub_part_time_chart(logId, 3);
    command_details_chart(logId, true);
    document.getElementById("command-num").addEventListener("change", () => {command_details_chart(logId, false)});
    document.getElementById("event").addEventListener("change", () => {command_details_chart(logId, false)});
  }

  function populate_type(logId) {
    var logs = filter_logs(logId, 0, 0, 0, 0, 0);
    var all_event_types = getAllEventType(logs);
    //populate event_type select
    var select = document.getElementById("event");
    select.length = 0;
    for (let i = 0; i < all_event_types.length; i ++) {
      var event_type = all_event_types[i];
      var new_option = new Option(event_type);
      select.add(new_option)
    }
  }

  function command_details_chart(logId, update_select){
    var logs = filter_logs(logId, 0, 0, 0, 0, 0);
    if (update_select) {
      populate_type(logId);
    }
    var num = parseInt(document.getElementById("command-num").value);
    var event_type = document.getElementById("event").value;
    const tbody = document.getElementById("command-table").getElementsByTagName('tbody')[0];
    tbody.innerHTML = "";
    const table = document.getElementById("command-table");
    let count = 0;
    for (let i = logs.length-1; i >= 0; i --) {
      if (logs[i].eventType == event_type) {
        if (count == num) {
          break;
        }
        count ++;
        let row = tbody.insertRow();
        let event = row.insertCell(0);
        event.innerHTML = logs[i].event;
        let event_type = row.insertCell(1);
        event_type.innerHTML = logs[i].eventType;
        let url = row.insertCell(2);
        url.innerHTML = logs[i].url;
        let time = row.insertCell(3);
        time.innerHTML = logs[i].timestamp;
      }
    }
  }

  function get_active_ids() {
    var logIds = getKeys();
    logIds = logIds.filter(id => !id.startsWith("**"));
    var active_ids = [];
    for (let i = 0; i < logIds.length; i ++) {
      var active_time = get_total_active_time(logIds[i]);
      if (active_time > 0) {
        if (current_progress(logIds[i]) != "Haven't started the tutorial or haven't completed any quizzes.") {
          active_ids.push(logIds[i]);
        }
      }
    }
    return active_ids;
  }

  function get_not_started_id() {
    var logIds = getKeys();
    logIds = logIds.filter(id => !id.startsWith("**"));
    var not_started_ids = [];
    for (let i = 0; i < logIds.length; i ++) {
      var active_time = get_total_active_time(logIds[i]);
      if (active_time > 0) {
        if (current_progress(logIds[i]) == "Haven't started the tutorial or haven't completed any quizzes.") {
          not_started_ids.push(logIds[i]);
        }
      }
    }
    return not_started_ids;
  }

  // testing function for console log bash data ==============>
  function bash_analysis() {
    var log_arr = filter_logs("gunings-36644677",0,0,0,0,0)
    console.log(log_arr);
    // console.log(getAllEvents(log_arr));
    // console.log(getAllEventType(log_arr));
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

  function execute_query() {
    //get query selection data
    var num = document.getElementById("num").value;
    var section_name = document.getElementById("section").value; //done
    var status = document.getElementById("status").value;//done
    var skipped = document.getElementById("skipped").checked;
    var orderby = document.getElementById("orderby").value;
    var order = document.getElementById("order").value;
    if (num != '' && num != cur_num) {
      cut_ind = -1;
      cur_num = -1;
      cur_ids = [];
    }
    console.log(num + section_name + status + skipped + orderby + order);

    var active_ids = get_active_ids();
    var result_ids = [];
    //filter section
    if (section_name != "N/A") {
      for (let i = 0; i < active_ids.length; i++) {
        var id = active_ids[i];
        var progress_ind = current_progress_ind(id);
        //console.log(id + " " + progress_ind);
        if (section_name == "DNA Subway") {
          if (progress_ind >= 0 && progress_ind <= 11) {
            result_ids.push(id);
          }
        }else if (section_name == "DNA Discovery") {
          if (progress_ind > 11 && progress_ind <= 25) {
            result_ids.push(id);
          }
        }else {
          if (progress_ind > 25 && progress_ind <= 57) {
            result_ids.push(id);
          }
        }
      }
    }else {
      result_ids = active_ids;
    }

    //console.log(result_ids);
    progress_scatter_chart_2("scroll-chart1", num, status, skipped, orderby, order, result_ids, true);

  }

  //testing progress scatter ======================================

  function progress_scatter_chart_2(canvas_id, num, status, skipped, orderby, order, id_list, animation_option) {
    //populate skipped set
    var dataset = [];
    var active_ids = id_list;
    var id_y = active_ids;
    var data_set = [];
    var stucked_set = [];
    var completed_set = [];
    var in_progress_id = [];
    var stucked_id = [];
    var completed_id = [];
    var max_time = -1;


    for (let i = 0; i < active_ids.length; i ++) {
      var log_id = active_ids[i]
      var cur_progress_ind = current_progress_ind(log_id);
      var cur_progress = get_formated_quiz_name(quiz_names[cur_progress_ind]);

      var name = localStorage.getItem("**"+log_id);
      var total_time = get_total_active_time(log_id);
      if (total_time > max_time) {
        max_time = total_time;
      }
      var log_arr = filter_logs(log_id, 0, 0, 0, 0, 0);
      var milestone_ind = current_progress_ind(log_id);
      if (milestone_ind % 2 == 1) { // if most current quiz is a post quiz, then we want the time since corresponding pre-quiz
        milestone_ind -= 1;
      }
      var milestone_ind_in_log = ind_in_log_arr_helper(quiz_urls[milestone_ind], log_arr)
      if (milestone_ind_in_log < 0) {
        milestone_ind_in_log = 0;
      }
      var duration = active_time_between(milestone_ind_in_log, log_arr.length-1, active_laps, log_arr);
      var data = {x: cur_progress, y: name, time: total_time, duration: duration, id: log_id};
      if (current_progress(log_id) == quiz_names[quiz_names.length - 1]) {
        var index = ind_in_log_arr_helper(quiz_urls[quiz_urls.length-1], log_arr);
        var complete_time = new Date(Date.parse(log_arr[index].timestamp));
        var time_since = timeSince(complete_time);
        var data1 = {x: cur_progress, y: name, time: total_time, duration: duration, id: log_id, since: time_since};
        completed_set.push(data1);
        completed_id.push(log_id);
      }else if (duration > stucked_duration) {
        stucked_set.push(data);
        stucked_id.push(log_id);
      }else {
        data_set.push(data);
        in_progress_id.push(log_id)
      }
    }

    var x_labels = [];
    x_labels.push('DNA Subway')
    for (let i = 0; i < quiz_names.length; i += 2) {
      if (x_labels.length == 7) {
        x_labels.push('DNA Discovery');
      }
      if (x_labels.length == 15) {
        x_labels.push('DNA Bash')
      }
      x_labels.push(get_formated_quiz_name(quiz_names[i]));
    }
    //x_labels.push('End of Tutorial')
    var grid_color = [];
    for (let i = 0; i < x_labels.length; i ++) {
      if (i == 0 || i == 7 || i == 15) {
        grid_color.push('rgba(236, 100, 75)');
      }else {
        grid_color.push('rgba(142, 139, 139)');
      }
    }

    //populate counting page
    var stucked_num = stucked_set.length;
    var complete_num = completed_set.length;
    var in_progress_num = data_set.length + stucked_num;
    var not_started_num = get_not_started_id().length;
    document.querySelector("#not-started").textContent = not_started_num;
    document.querySelector("#completed").textContent = complete_num;
    document.querySelector("#in-progress").textContent = in_progress_num;
    document.querySelector("#stucked").textContent = stucked_num;
    var total_num = not_started_num + complete_num + in_progress_num + stucked_num;

    polulate_pie_chart(Math.round((not_started_num * 1.0/total_num)*100 * 1e1) / 1e1,"not-started-chart");
    polulate_pie_chart(Math.round((complete_num * 1.0/total_num)*100 * 1e1) / 1e1,"completed-chart");
    polulate_pie_chart(Math.round((stucked_num * 1.0/total_num)*100 * 1e1) / 1e1,"stucked-chart");
    polulate_pie_chart(Math.round((in_progress_num * 1.0/total_num)*100 * 1e1) / 1e1,"in-progress-chart");

    var visited_set = [];
    var skipped_set = [];
    var skipped_ids = [];
    for (let i = 0; i < id_list.length; i ++) {
      var isStucked = false;
      var isCompleted = false;
      var is_in_progress = false;
      for (let j = 0; j < stucked_id.length; j ++) {
        if (stucked_id[j] == id_list[i]) {
          isStucked = true;
          break;
        }
      }
      if (!isStucked) {
        for (let j = 0; j < completed_id.length; j ++) {
          if (completed_id[j] == id_list[i]) {
            isCompleted = true;
          }
        }
      }
      if (!isCompleted) {
        is_in_progress = true;
      }
      if ((status == "stucked" && isStucked) || (status == "completed" && isCompleted) || status == "in progress" && is_in_progress || status == "N/A") {
        var id = id_list[i];
        var visited_millestones_data = visited_millestone_ind(id);
        var temp_visited = [];
        var isSkipped = false;
        for (let j = 0; j < visited_millestones_data.length-1; j ++) {
          var cur_ind = visited_millestones_data[j];
          var cur_millestone_name = get_formated_quiz_name(quiz_names[cur_ind]); //x
          var name = localStorage.getItem("**"+id); //y
          var data = {x: cur_millestone_name, y: name, id: id};
          temp_visited.push(data);
          var pre_ind = 0;
          if (j != 0) {
            pre_ind = visited_millestones_data[j-1];
          }
          if (cur_ind - pre_ind > 2) {
            skipped_ids.push(id);
            isSkipped = true;
            for (let k = pre_ind+2; k < cur_ind; k += 2) {
              var millestone_name = get_formated_quiz_name(quiz_names[k]); //x
              var data = {x: millestone_name, y: name, id: id};
              skipped_set.push(data);
            }
          }
        }
        if (skipped) {
          if (isSkipped) {
            visited_set = visited_set.concat(temp_visited);
          }
        }else {
          visited_set = visited_set.concat(temp_visited);
        }
      }
    }
    // console.log(visited_set);
    // console.log(skipped_set);
    var visited = {
      label: "visited millestones",
      data: visited_set,
      backgroundColor: 'rgba(128, 128, 128)',
      radius: 2,
      //pointStyle: 'star'
    }
    var skip = {
      label: "skipped millestones",
      data: skipped_set,
      backgroundColor: 'rgba(236, 100, 75)',
      radius: 4,
      pointStyle: 'triangle'
    }
    dataset.push(visited);
    dataset.push(skip);

    //filter stuck, in progress, complete set again
    var stucked_set_final =[]
    if (skipped) {
      for (let i = 0; i < stucked_set.length; i ++) {
        var data = stucked_set[i];
        var match = false;
        for (let j = 0; j < skipped_ids.length; j ++) {
          if (data.id == skipped_ids[j]) {
            match = true;
          }
        }
        if (match) {
          stucked_set_final.push(stucked_set[i]);
        }
      }
    }else {
      stucked_set_final = stucked_set;
    }

    var data_set_final =[]
    if (skipped) {
      for (let i = 0; i < data_set.length; i ++) {
        var data = data_set[i];
        var match = false;
        for (let j = 0; j < skipped_ids.length; j ++) {
          if (data.id == skipped_ids[j]) {
            match = true;
          }
        }
        if (match) {
          data_set_final.push(data_set[i]);
        }
      }
    }else {
      data_set_final = data_set;
    }
    var completed_set_final =[]
    if (skipped) {
      for (let i = 0; i < completed_set.length; i ++) {
        var data = completed_set[i];
        var match = false;
        for (let j = 0; j < skipped_ids.length; j ++) {
          if (data.id == skipped_ids[j]) {
            match = true;
          }
        }
        if (match) {
          completed_set_final.push(completed_set[i]);
        }
      }
    }else {
      completed_set_final = completed_set;
    }

    var stuck_dta = {
      label: 'Students Stuck for more than ' + stucked_duration + ' mins',
      data: stucked_set_final,
      backgroundColor: 'rgba(255, 0, 0)',
      radius: 5
      };

    var in_progress_dta = {
      label: 'Students in progress',
      data: data_set_final,
      backgroundColor: 'rgba(31, 119, 180)',
      pointStyle: 'triangle',
      radius: 6,
      rotation: 90
    };

    var completed_dta = {
      label: 'Students Completed',
      data: completed_set_final,
      backgroundColor: 'rgba(170, 220, 40)',
      pointStyle:'rect',
      radius: 5
    };

    //filter status
    if (status != "N/A") {
      if (status == "stucked") {
        id_y = stucked_id;
        dataset.push(stuck_dta);
      }else if (status == 'in progress'){
        id_y = in_progress_id;
        dataset.push(in_progress_dta);
      }else {
        id_y = completed_id;
        dataset.push(completed_dta);
      }
    }else {
      dataset.push(stuck_dta);
      dataset.push(in_progress_dta);
      dataset.push(completed_dta);
    }

    //remove unwanted y labels
    if (skipped) {
      id_y = id_y.filter(value => skipped_ids.includes(value))
    }

    //specify the order
    if (orderby == "progress") {
      if (order == "ascending") {
        id_y.sort(function(a, b){return current_progress_ind(a)-current_progress_ind(b)})
      }else {
        id_y.sort(function(a, b){return current_progress_ind(b)-current_progress_ind(a)})
      }
    }else {
      if (order == "ascending") {
        id_y.sort(function(a, b){return get_total_command_count(a)-get_total_command_count(b)})
      }else if (orderby == "total command count"){
        id_y.sort(function(a, b){return get_total_command_count(b)-get_total_command_count(a)})
      }
    }
    if (num != '') {
      num = parseInt(num);
      if (cur_ids.length == 0) {
        cur_ids = id_y;
      }
      if (cur_num == -1) {
        cur_num = num;
      }
      if (cut_ind == -1) {
        cut_ind = num;
      }
    }

    if (num != '') {
      if (end == -1) {
        for (let i = 0; i < cut_ind - cur_num; i ++) {
          var id = id_y[i];
          var y = localStorage.getItem("**"+id);
          for (let j = 0; j < dataset.length; j ++) {
            var dta = dataset[j].data;
            dataset[j].data = dta.filter (value => value.y != y);
          }
        }
        for (let i = cut_ind; i < id_y.length; i ++) {
          var id = id_y[i];
          var y = localStorage.getItem("**"+id);
          for (let j = 0; j < dataset.length; j ++) {
            var dta = dataset[j].data;
            dataset[j].data = dta.filter (value => value.y != y);
          }
        }
      }else {
        for (let i = 0; i < cut_ind; i ++) {
          var id = id_y[i];
          var y = localStorage.getItem("**"+id);
          for (let j = 0; j < dataset.length; j ++) {
            var dta = dataset[j].data;
            dataset[j].data = dta.filter (value => value.y != y);
          }
        }
      }
      if (end == -1) {
        id_y = id_y.slice(cut_ind-cur_num, cut_ind);
      }else {
        id_y = id_y.slice(end*-1);
      }
    }

    // draw graph
    draw_chart_normal(canvas_id, dataset, random_name_list, id_y, x_labels, grid_color, animation_option);
  }

  function draw_chart_normal(canvas_id, dataset, random_name_list, id_y, x_labels, grid_color, animation_option) {
    var chartExist = Chart.getChart(canvas_id); // <canvas> id
    if (chartExist != undefined){
      chartExist.destroy();
    }
    var ctx = document.getElementById(canvas_id).getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: dataset
      },
      options: {
        onHover: (event, chartElement) => {
          event.native.target.style.cursor = chartElement[0] ? 'pointer': 'default';
        },
        animation: animation_option,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'category',
            labels: random_name_list(id_y),
            grid: {
              display: false
            },
            title: {
              display: true,
              text: 'Students',
              font: {
                weight: "bold"
              }
            },
            offset: true
          },
          x: {
            type: 'category',
            labels: x_labels,
            title: {
              display: true,
              text: 'Sections',
              font: {
                weight: "bold"
              }
            },
            grid: {
              color: grid_color,
              borderDash: [9, 1]
            },
            ticks: {
              color: grid_color
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              usePointStyle: true
            },
            position: 'top',
          },
          title: {
            display: true,
            text: "Students Progress Tracking",
            font: {
              size: 20
            },
            padding: {
              bottom: 3
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                if (context.dataset.label == 'Students Completed') {
                  return context.raw.y + ", Completed the tutorial " + context.raw.since + "ago";
                }else if (context.dataset.label == "visited millestones") {
                  return context.raw.y + ", completed " + context.raw.x;
                }else if (context.dataset.label == "skipped millestones") {
                  return context.raw.y + ", skipped " + context.raw.x;
                }
                return context.raw.y + ', have been working on "' + context.raw.x + '" for ' + context.raw.duration + ' mins;' + '\n' + 'Total time: ' + context.raw.time + ' mins';
              },
              afterFooter: function(chart) {
                var user_id = chart[0].raw.id;
                // total_run_time_chart([user_id]);
                // milestone_time_chart([user_id])
                update_chart(user_id);
                //console.log(user_id)
              }

            }
          }
        }
      }
    })

    myChart.canvas.onclick = clickHandler;
    document.getElementById(canvas_id).ondblclick = doubleClick;

    //var list = [];
    function clickHandler(click2) {
      var points = myChart.getElementsAtEventForMode(click2, 'nearest', {
        intersect: true}, true);
      if (points[0] != undefined) {
        var log_id = points[0].element.$context.raw.id;
        var exists = false;
        for (let i = 0; i < selectList.length; i ++) {
          if (selectList[i] == log_id) {
            selectList.splice(i, 1);
            exists = true;
            break;
          }
        }
        if (!exists) {
          selectList.push(log_id);
        }
        total_run_time_chart(selectList);
        milestone_time_chart(selectList);
        //console.log(list);
      }
    }

    function doubleClick(click) {
      var points = myChart.getElementsAtEventForMode(click, 'nearest', {
        intersect: true}, true);
      //var log_id = points[0].element.context.raw.id;
      if (points[0] != undefined) {
        var log_id = points[0].element.$context.raw.id;
        //display mode
        var user_container = document.getElementById("user_mode_container");
        var overall_container = document.getElementById("overall_mode_container");
        overall_container.style.display = "none";
        user_container.style.display = "block";
        document.querySelector('#id_error').style.display = 'none';
        toggle_class_isibility('block');
        main(log_id);
        diplay_user_info(log_id);
      }
    }
  }

  function ind_within_time(log_id, time_limit) {
    var cur_x_ind = -3;
    for (let j = 0; j < quiz_urls.length; j += 2) {
      var time = milestone_time(log_id, j);
      if (time >= time_limit) {
        cur_x_ind = j - 2;
        break;
      }
    }
    var logs = filter_logs(log_id, 0, 0, 0, 0, 0);
    var cur_progress_ind = current_progress_ind(log_id);
    if (cur_x_ind == -3) {
      return cur_progress_ind;
    }else {
      return cur_x_ind;
    }
  }

  //================================================================
  function update_chart(id) {
    //update time distribution chart
    var index = -1;
    for (let i = 0; i < time_id_distribution.length; i ++) {
      var id_list = time_id_distribution[i];
      for (let j = 0; j < id_list.length; j ++) {
        if (id_list[j] == id) {
          index = i;
          break;
        }
      }
    }
    var chart = Chart.getChart("Time Distribution (Minutes)");
    chart.setActiveElements([
      {datasetIndex: 0, index: index}
    ]);
    chart.update();

    //update progress distribution chart
    var index = -1;
    for (let i = 0; i < progress_id_distribution.length; i ++) {
      var id_list = progress_id_distribution[i];
      for (let j = 0; j < id_list.length; j ++) {
        if (id_list[j] == id) {
          index = i;
          break;
        }
      }
    }
    var chart = Chart.getChart("Progress Distribution");
    chart.setActiveElements([
      {datasetIndex: 0, index: index}
    ]);
    chart.update();
  }

  // draw progress chart with canvas_id only
  function progress_scatter_chart(canvas_id, animation_option) {
    var active_ids = get_active_ids();
    progress_scatter_chart_2(canvas_id, default_num, "N/A", false, "N/A", "N/A", active_ids, animation_option);
  }

  function progress_scatter_chart_id(id_list) {
    progress_scatter_chart_2("scroll-chart1", default_num, "N/A", false, "N/A", "N/A", id_list, true);
  }

  function diplay_user_info(log_id) {
    document.querySelector('#search').style.display = 'none';
    // document.getElementById('user_info').style.display = 'block';
    document.querySelector('#main_header').textContent = "Report for userId: " + log_id;
  }

  function timeSince(date) {
    var seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    var result = "";
    var interval = seconds / 31536000;
    var count = 0;
    if (interval > 1) {
      count ++;
      result += (Math.floor(interval) + " years ");
      seconds = seconds - 31536000*Math.floor(interval);
    }

    interval = seconds / 2592000;
    if (interval > 1) {
      count ++;
      result += (Math.floor(interval) + " months ");
      seconds = seconds - 2592000*Math.floor(interval);
    }
    if (count == 2) {
      return result;
    }

    interval = seconds / 86400;
    if (interval > 1) {
      count++;
      result += (Math.floor(interval) + " days ");
      seconds = seconds - 86400*Math.floor(interval);
    }
    if (count == 2) {
      return result;
    }

    interval = seconds / 3600;
    if (interval > 1) {
      count ++;
      result += (Math.floor(interval) + " hours ");
      seconds = seconds - 3600*Math.floor(interval);
    }
    if (count == 2) {
      return result;
    }

    interval = seconds / 60;
    if (interval > 1) {
      count ++;
      result += (Math.floor(interval) + " minutes ");
      seconds = seconds - 60*Math.floor(interval);
    }
    if (count == 2) {
      return result;
    }

    result += (Math.floor(seconds) + " seconds");
    return result;
  }

  function total_run_time_chart(logIds){
    var view_type = "(multiple students view)"
    if (logIds.length == 1) {
      view_type = "(" + localStorage.getItem("**" + logIds[0]) + "'s view)";
    }
    //prepare dataset
    //var allDataset = [];
    var subway_data = [];
    var discovery_data = [];
    var bash_data = [];
    var other_quiz_data = [];

    //populate rest data
    var rest_data = [];

    var max_quiz = 0;
    var min_quiz = 10000000;
    var max_milestone = 0;
    var min_milestone = 10000000;
    var num_command_arr_list = []
    var start_time = new Date(2022, 10, 5, 10, 0); //10:00am
    for (let i = 0; i < logIds.length; i ++) {
      let log_id = logIds[i];
      // var y_axis = log_id;
      // if (i < random_names.length) {
      //   y_axis = random_names[i];
      // }
      // get command num range
      // var max_quiz = 0;
      // var min_quiz = 10000000;
      // var max_milestone = 0;
      // var min_milestone = 10000000;
      var num_command_arr = []
      for (let k = 1; k < quiz_urls.length; k += 2) {
        if (k != 11 && k != 25 && k != 57) {
          var x = get_total_command(k, log_id);
          var y = get_total_command(0, log_id);
          if (k != 1) {
            y = get_total_command(k-2, log_id);
          }
          var n = x - y;
          if (n < 0) {
            n = 1;
          }
          if (n > max_quiz) {
            max_quiz = n;
          }else if (n <= min_quiz) {
            min_quiz = n;
          }
          num_command_arr.push(n);
        }else {
          var n = 0;
          if (k == 11) {
            n = get_total_command(k, log_id) - get_total_command(0, log_id);
          }else if (k == 25) {
            n = get_total_command(k, log_id) - get_total_command(11, log_id);
          }else {
            n = get_total_command(k, log_id) - get_total_command(25, log_id);
          }
          if (n <= 0) {
            n = 0;
          }
          if (n > max_milestone) {
            max_milestone = n;
          }
          if (n < min_milestone) {
            min_milestone = n;
          }
          num_command_arr.push(n);
        }
      }
      num_command_arr_list.push(num_command_arr);
    }

    for (let i = 0; i < logIds.length; i ++){
      var log_id = logIds[i]
      var y_axis = localStorage.getItem("**"+log_id);
      // if (i < random_names.length) {
      //   y_axis = random_names[i];
      // }
      //populate the data
      var ind = 0;
      for (let j = 1; j < quiz_urls.length; j += 2) {
        if (j != 11 && j != 25 && j != 57) {
          var quiz_time = milestone_time(log_id, j);
          if (quiz_time > 0) {
            //format the radium
            var num_command = num_command_arr_list[i][ind];
            var radium = 1;
            var cutoff = (max_quiz - min_quiz)*1.0 / 10;
            for (let z = 0; z < 10; z++) {
              if (num_command >= min_quiz+z*cutoff && num_command <= min_quiz+(z+1)*cutoff) {
                radium = 2.5 + z*0.5;
              }
            }
            var section_name = get_formated_quiz_name(quiz_names[j]);
            var quiz = {x: addMinutes(start_time, quiz_time).getTime(), y: y_axis, r: radium, num: num_command, section: section_name}
            other_quiz_data.push(quiz);
          }
        }else {
          var a_millstone_time = milestone_time(log_id, j);
          if (a_millstone_time > 0) {
            //format milestone radium
            var num_command = num_command_arr_list[i][ind];
            var radium = 1;
            var cutoff = (max_milestone - min_milestone)*1.0 / 10;
            for (let z = 0; z < 10; z++) {
              if (num_command >= min_milestone+z*cutoff && num_command <= min_milestone+(z+1)*cutoff) {
                radium = 3.5 + z*0.5;
              }
            }

            //var radium_1 = 2.5+9*0.5+0.5;
            var section_n = '';
            if (j == 11) {
              section_n = 'DNA Subway Complete'
            }else if (j == 25) {
              section_n = 'DNA Discovery Complete';
            }else {
              section_n = 'DNA Bash Complete'
            }
            var milestone = {x: addMinutes(start_time, a_millstone_time).getTime(), y: y_axis, r: radium, num: num_command_arr_list[i][ind], section: section_n};
            if (j == 11) {
              subway_data.push(milestone);
            }else if (j == 25) {
              discovery_data.push(milestone);
            }else {
              bash_data.push(milestone);
            }
          }
        }
        ind ++;
      }

      // populate rest data
      var rest_raw = get_rest_time(log_id);
      for (let k = 0; k < rest_raw.length; k ++) {
        var rest = {x: addMinutes(start_time, rest_raw[k][0]+1).getTime(), y: y_axis, duration: rest_raw[k][1]};
        rest_data.push(rest);
      }
    }

    //populate rest data
    for (let i = 0; i < rest_data.length; i ++) {
      var cur_date = rest_data[i].x;
      var j = i+1;
      var total_time = 0;
      var diff = 6;
      if (j < rest_data.length) {
        diff = Math.floor((rest_data[j].x - cur_date)/1000/60)
      }
      while (j < rest_data.length && diff <= 5) {
        total_time += rest_data[j].duration;
        rest_data.splice(j, 1);
        j++;
      }
      rest_data[i].duration += total_time;
    }


    //draw graph
    var chartExist = Chart.getChart("total_command_time"); // <canvas> id
    if (chartExist != undefined){
      chartExist.destroy();
    }
    var ctx = document.getElementById("total_command_time").getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: [{
          label: 'DNA subway Complete',
          data: subway_data,
          backgroundColor: 'rgba(31, 119, 180)',
          //pointBackgroundColor: 'rgba(31, 119, 180)',
        }, {
          label: 'DNA Discovery Complete',
          data: discovery_data,
          backgroundColor: 'rgba(255, 127, 14)',
        }, {
          label: 'DNA Bash Complete',
          data: bash_data,
          backgroundColor: 'rgba(34, 139, 34)',
        }, {
          label: 'Other section complete',
          data: other_quiz_data,
          backgroundColor: 'rgba(128,128,128)',
        }, {
          label: 'Break',
          data: rest_data,
          backgroundColor: 'rgba(213, 172, 17, 0.8)',
          radius: 2
        }
      ]
      },
      options: {
        scales: {
          y: {
            type: 'category',
            grid: {
              display: false
            },
            title: {
              display: true,
              text: 'Students',
              font: {
                weight: "bold"
              }
            },
            labels: random_name_list(logIds),
            offset: true
          },
          x: {
            offset: true,
            title: {
              display: true,
              text: 'Time (Starts 10:00am)',
              font: {
                weight: "bold"
              }
            },
            type: "time",
            time: {
              unit: "minute",
              // displayFormats: {
              //   hour: 'D-M-Y H:00:00'
              // }
              stepSize: 30,
              min: new Date(2022, 10, 5, 10, 1)
            },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: "circle"
            },
            align: "start"
          },
          title: {
            display: true,
            text: "Command Count vs Time " + view_type,
            font: {
              size: 20
            },
            padding: {
              bottom: 20
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                if (context.label == 'Break') {
                  return ('Break for ' + context.raw.duration + ' minutes' + ', ' + context.raw.y);
                }else {
                  var date = new Date(context.raw.x);
                  var hour = String(date.getHours()).padStart(2, '0');
                  var min = String(date.getMinutes()).padStart(2, '0');
                  var num = parseInt((context.raw.num));
                  var name = context.raw.y;
                  var section_name = context.raw.section;
                  return (section_name + ', ' + hour + ':' + min + ' ,' + name + ', ' + 'Command count: ' + num);
                }
              }
            }
          }
        }
      }
    })
  }


  function get_total_command(quiz_ind, log_id) {
    const log_arr = filter_logs(log_id, 0, 0, 0, 0, 0);
    var quiz_ind_all = ind_in_log_arr_helper(quiz_urls[quiz_ind], log_arr);
    return quiz_ind_all;
  }

  function get_total_command_count(log_id) {
    const log_arr = filter_logs(log_id, 0, 0, 0, 0, 0);
    return log_arr.length;
  }

  function milestone_time_chart(logIds) {
    var view_type = "(multiple students view)"
    if (logIds.length == 1) {
      view_type = "(" + localStorage.getItem("**" + logIds[0]) + "'s view)";
    }
    //set-up datasets
    var subway_data = [];
    var discovery_data = [];
    var bash_data = [];
    var other_quiz_data = [];
    var rest_data = [];
    var start_time = new Date(2022, 10, 5, 10, 0); //10:00am
    for (let i = 0; i < logIds.length; i ++) {
      let log_id = logIds[i];
      var y_axis = localStorage.getItem("**"+log_id);
      // if (i < random_names.length) {
      //   y_axis = random_names[i];
      // }
      var subway_time = milestone_time(log_id, 11);
      if (subway_time > 0) {
        var subway = {x: addMinutes(start_time, subway_time).getTime(), y: y_axis};
        subway_data.push(subway);
      }
      var discovery_time = milestone_time(log_id, 25);
      if (discovery_time > 0) {
        var discovery = {x: addMinutes(start_time, discovery_time).getTime(), y: y_axis};
        discovery_data.push(discovery);
      }
      var bash_time = milestone_time(log_id, 57);
      if (bash_time > 0) {
        var bash = {x: addMinutes(start_time, bash_time).getTime(), y: y_axis};
        bash_data.push(bash);
      }
      for (let j = 0; j < quiz_urls.length; j ++) {
        if (j != 11 && j != 25 && j != 57) {
          var quiz_time = milestone_time(log_id, j);
          if (quiz_time > 0) {
            var quiz = {x: addMinutes(start_time, quiz_time).getTime(), y: y_axis}
            other_quiz_data.push(quiz);
          }
        }
      }
      var rest_raw = get_rest_time(log_id);
      for (let k = 0; k < rest_raw.length; k ++) {
        var rest = {x: addMinutes(start_time, rest_raw[k][0]+1), y: y_axis, duration: rest_raw[k][1]};
        rest_data.push(rest);
      }
    }
    for (let i = 0; i < rest_data.length; i ++) {
      var cur_date = rest_data[i].x;
      var j = i+1;
      var total_time = 0;
      var diff = 6;
      if (j < rest_data.length) {
        diff = Math.floor((rest_data[j].x - cur_date)/1000/60)
      }
      while (j < rest_data.length && diff <= 5) {
        total_time += rest_data[j].duration;
        rest_data.splice(j, 1);
        j++;
      }
      rest_data[i].duration += total_time;
    }

    //draw scatter graph
    var chartExist = Chart.getChart("total_command_time"); // <canvas> id
    if (chartExist != undefined){
      chartExist.destroy();
    }
    var ctx = document.getElementById("total_command_time").getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'scatter',
      data: {
                  datasets: [{
                      label: 'Subway Complete',
                      data: subway_data,
                      backgroundColor: 'rgba(31, 119, 180)',
                      //pointBackgroundColor: 'rgba(31, 119, 180)',
                      radius: 6
                  }, {
                      label: 'Discovery Complete',
                      data: discovery_data,
                      backgroundColor: 'rgba(255, 127, 14)',
                      //pointBackgroundColor: 'rgba(255, 127, 14)',
                      //pointStyle: 'triangle',
                      radius: 6
                  }, {
                      label: 'Bash Complete',
                      data: bash_data,
                      backgroundColor: 'rgba(34, 139, 34)',
                      //pointBackgroundColor: 'rgba(34, 139, 34)',
                      //pointStyle: 'triangle',
                      radius: 6
                  }, {
                      label: 'Other Section Complete',
                      data :other_quiz_data,
                      backgroundColor: 'rgba(128,128,128)',
                      radius: 3
                  }, {
                      label: 'Break taken',
                      data: rest_data,
                      backgroundColor: 'rgba(213, 172, 17, 0.8)',
                      radius: 3.5
                  }
                ]
            },
      options: {
        scales: {
          y: {
            type: 'category',
            // ticks: {
            //   callback: function(value, index) {
            //     return logIds[value-1]
            //   }
            // },
            grid: {
              display: false
            },
            title: {
              display: true,
              text: 'Students',
              font: {
                weight: "bold"
              }
            },
            labels: random_name_list(logIds),
            offset: true
          },
          x: {
            offset: true,
            title: {
              display: true,
              text: 'Time (Starts 10:00am)',
              font: {
                weight: "bold"
              }
            },
            type: "time",
            time: {
              unit: "minute",
              // displayFormats: {
              //   hour: 'D-M-Y H:00:00'
              // }
              stepSize: 30,
              min: new Date(2022, 10, 5, 10, 1)
            },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: "circle"
            },
            align: "start"
          },
          title: {
            display: true,
            text: "Progress/Milestone Vs Time " + view_type,
            font: {
              size: 20
            },
            padding: {
              bottom: 20
            }
          },
          tooltip: {
            callbacks: {
              label: ((tooltipItem, data) => {
                if (tooltipItem.datasetIndex == 4) {
                  var duration = tooltipItem.raw.duration;
                  var person = tooltipItem.raw.y;
                  return 'Break for: ' + duration + ' mins' + ', ' + person;
                }else if (tooltipItem.datasetIndex == 3){
                  return "quiz submitted on " + tooltipItem.label.replace('Nov 5, 2022, ', '') + ' ' + tooltipItem.raw.y
                }else if (tooltipItem.datasetIndex == 2) {
                  return "DNA Bash Completed on " + tooltipItem.label.replace('Nov 5, 2022, ', '') + ' ' + tooltipItem.raw.y
                }else if (tooltipItem.datasetIndex == 1) {
                  return "DNA Discovery Completed on " + tooltipItem.label.replace('Nov 5, 2022, ', '') + ' ' + tooltipItem.raw.y
                }else {
                  return "DNA Subway Completed on " + tooltipItem.label.replace('Nov 5, 2022, ', '') + ' ' + tooltipItem.raw.y
                }
              })
            }
          }
        }
      }});
  }

  // returns a array of array, each element in the first array is one rest taken,
  // and each sub array has two element, first one being the active start time of the rest from beginning
  // and the second being the duration of the rest in minutes.
  function get_rest_time(log_id) {
    var log_arr = filter_logs(log_id, 0, 0, 0, 0, 0);
    var result = [];
    for (let i = 0; i < log_arr.length; i ++) {
      var time_1 = new Date(Date.parse(log_arr[i].timestamp));
      if (i+1 < log_arr.length) {
        var time_2 = new Date(Date.parse(log_arr[i+1].timestamp));
        var time_diff = Math.floor((time_2 - time_1)/1000/60);
        if (time_diff >= active_laps) {
          var time_of_rest = active_time_between(0, i, active_laps, log_arr);
          var rest_time = [time_of_rest, time_diff];
          result.push(rest_time);
        }
      }
    }
    return result;
  }

  function random_name_list(log_ids) {
    var result = [];
    for (let i = 0; i < log_ids.length; i ++) {
      result.push(localStorage.getItem("**"+log_ids[i]));
    }
    return result;
    // var result = [];
    // var random_length = random_names.length;
    // for (let i = 0; i < log_ids.length; i ++) {
    //   if (i < random_length) {
    //     result.push(random_names[i]);
    //   }else {
    //     result.push(log_ids[i]);
    //   }
    // }
    // return result;
  }

  function set_random_name() {
    var log_ids = get_active_ids();
    var random_length = random_names.length;
    for (let i = 0; i < log_ids.length; i ++) {
      if (i < random_length) {
        var temp = "**"+log_ids[i];
        localStorage.setItem(temp, random_names[i]);
      }else {
        localStorage.setItem(temp, log_ids[i]);
      }
    }
  }

  function addMinutes(date, numOfMinutes) {
    const dateCopy = new Date(date.getTime());

    dateCopy.setMinutes(dateCopy.getMinutes() + numOfMinutes);

    return dateCopy;
  }

  // returns the active time from start to reach the given milestone
  function milestone_time(logId, quiz_id) {
    const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
    var initial_ind = 0;
    var milestone_ind = ind_in_log_arr_helper(quiz_urls[quiz_id], log_arr);
    var time_between = active_time_between(initial_ind, milestone_ind,active_laps, log_arr);
    return time_between;
  }

  function sub_part_time_chart(logId, section_name) {
    const section_time_data = section_time_data_helper(logId, section_name);
    var section_id = '';
    var title = '';
    if (section_name == 1) {
      section_id = "subway_part_time"
      title = "DNA Subway"
    }
    if (section_name == 2) {
      section_id = "discovery_part_time";
      title = "DNA Discovery";
    }
    if (section_name == 3) {
      section_id = "bash_part_time";
      title = "DNA Command-Line"
    }
    var label = [];
    var chart_data = [];
    var i = 0;
    for (const x in section_time_data) {
      label[i] = x;
      chart_data[i] = section_time_data[x];
      i++;
    }

    var chartExist = Chart.getChart(section_id); // <canvas> id
    if (chartExist != undefined) {
      chartExist.destroy();
    }
    new Chart(document.getElementById(section_id).getContext('2d'), {
      type: "bar",
      data: {
        labels: label,
        datasets: [
          {
            label: "time (mins)",
            backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f"],
            data: chart_data
          }
        ]
      },
      options: {
        indexAxis: 'y',
        plugins: {
            legend: {
                display: false
            },
            title: {
              display: true,
              text: title
          }
        },
        responsiveAnimationDuration: 5000,
            barStrokeWidth : 1,
            responsive: true,
            maintainAspectRatio: false,
            barShowStroke: false,
            tooltips: {
               titleFontSize: 12,
            },
            scales: {
               xAxes: [{
                  display: true,
                  scaleLabel: {
                     display: true,
                     labelString: "Section"
                  }
               }],
                    yAxes: [{
                        display: true,
                  gridLines: {
                            display: false
                        },
                  scaleLabel: {
                     show: false,
                     labelString: ''
                  },
                        ticks: {
                            beginAtZero: true,
                            suggestedMin: 0,
                            suggestedMax: 2
                        }
                    }]
                },
                scales: {
                  x: {
                     grid: {
                        display: false
                     }
                  },
                  y: {
                     grid: {
                        display: false
                     }
                  }
             }
      }
    });
  }

  function section_time_data_helper(logId, section_name) {
    const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
    var start_ind = -1;
    var end_ind = -1;
    if (section_name == 1) {
      start_ind = 0;
      end_ind = 11;
    }
    if (section_name == 2) {
      start_ind = 12;
      end_ind = 25;
    }
    if (section_name == 3) {
      start_ind = 26;
      end_ind = 57;
    }
    var result_obj = {};
    for (let i = start_ind+1; i <= end_ind; i += 2) {
      var ind1 = ind_in_log_arr_helper(quiz_urls[i-1], log_arr);
      var ind2 = ind_in_log_arr_helper(quiz_urls[i], log_arr);
      var section_name = quiz_names[i].replace("DNA ", '').replace("Subway ", '').replace("Discovery ", '').
        replace("Command-Line ", '').replace("in progress: ", '').replace("Completed: ", '').replace("Post-Quiz: ", '');
      var section_time = active_time_between(ind1, ind2, active_laps, log_arr);
      if (section_time < 0) {
        section_time = 0;
      }
      result_obj[section_name] = section_time;
    }
    return result_obj;
  }

  function section_time_chart(logId) {
    const time_arr = get_section_time(logId);
    const label = ["DNA Subway", "DNA Discovery", "DNA Bash"];
    var chartExist = Chart.getChart("section_time"); // <canvas> id
    if (chartExist != undefined) {
      chartExist.destroy();
    }
    new Chart(document.getElementById("section_time").getContext('2d'), {
      type: "bar",
      data: {
        labels: label,
        datasets: [
          {
            label: "time (mins)",
            backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f"],
            data: time_arr
          }
        ]
      },
      options: {
        plugins: {
            legend: {
                display: false
            },
        },
        responsiveAnimationDuration: 5000,
            barStrokeWidth : 1,
            responsive: true,
            maintainAspectRatio: false,
            barShowStroke: false,
            tooltips: {
               titleFontSize: 12,
            },
            scales: {
               xAxes: [{
                  display: true,
                  scaleLabel: {
                     display: true,
                     labelString: "Section"
                  }
               }],
                    yAxes: [{
                        display: true,
                  gridLines: {
                            display: false
                        },
                  scaleLabel: {
                     show: false,
                     labelString: ''
                  },
                        ticks: {
                            beginAtZero: true,
                            suggestedMin: 0,
                            suggestedMax: 2
                        }
                    }]
                },
                scales: {
                  x: {
                     grid: {
                        display: false
                     }
                  },
                  y: {
                     grid: {
                        display: false
                     }
                  }
             }
      }
    });
  }

  function get_section_time(logId) {
    const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
    if (log_arr != null) {
      var subway_start_ind = ind_in_log_arr_helper(quiz_urls[0], log_arr);
      var subway_end_ind = ind_in_log_arr_helper(quiz_urls[11], log_arr);;
      if (subway_start_ind != -1 && subway_end_ind == -1) {
        var cur_ind = ind_in_arr_helper(current_progress(logId), quiz_names);
        subway_end_ind = ind_in_log_arr_helper(quiz_urls[cur_ind], log_arr);
      }
      var discovery_start_ind = ind_in_log_arr_helper(quiz_urls[12], log_arr);
      var discovery_end_ind = ind_in_log_arr_helper(quiz_urls[25], log_arr);
      if (discovery_start_ind != -1 && discovery_end_ind == -1) {
        var cur_ind = ind_in_arr_helper(current_progress(logId), quiz_names);
        discovery_end_ind = ind_in_log_arr_helper(quiz_urls[cur_ind], log_arr);
      }
      var bash_start_ind = ind_in_log_arr_helper(quiz_urls[26], log_arr);
      var bash_end_ind = ind_in_log_arr_helper(quiz_urls[57], log_arr);
      if (bash_start_ind != -1 && bash_end_ind == -1) {
        var cur_ind = ind_in_arr_helper(current_progress(logId), quiz_names);
        bash_end_ind = ind_in_log_arr_helper(quiz_urls[cur_ind], log_arr);
      }
      var subway_time = active_time_between(subway_start_ind, subway_end_ind, active_laps, log_arr);
      var discovery_time = active_time_between(discovery_start_ind, discovery_end_ind, active_laps, log_arr);
      var bash_time = active_time_between(bash_start_ind, bash_end_ind, active_laps, log_arr);
      if (subway_time == -1) {
        subway_time = 0;
      }
      if (discovery_time == -1) {
        discovery_time = 0;
      }
      if (bash_time == -1) {
        bash_time = 0;
      }
      return [subway_time, discovery_time, bash_time]
    }
    return [0, 0, 0];
  }

  function ind_in_arr_helper(str, arr) {
    for (let i = 0; i < arr.length; i ++) {
      if (arr[i].includes(str)) {
        return i;
      }
    }
    return -1;
  }

  function ind_in_log_arr_helper(str, log_arr) {
    for (let i = 0; i < log_arr.length; i ++) {
      if (log_arr[i].url.includes(str)) {
        return i;
      }
    }
    return -1;
  }

  function show_total_time(logId) {
    var total_time = get_total_active_time(logId);
    var hours = (total_time  - (total_time % 60)) / 60;
    var minutes = total_time % 60;
    document.getElementById("total_time").textContent = hours + "h " + minutes + "mins";
  }

  function get_total_active_time(logId) {
    const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
    var total_time = 0;
    if (log_arr == null) {
      total_time = 0;
    }else {
      total_time = active_time_between(0, log_arr.length, active_laps, log_arr);
    }
    return total_time;
  }

  function active_time_between(index1, index2, time_lapse, log_arr) {
    if (index1 < 0 || index2 < 0 || index1 >= log_arr.length || index2 > log_arr.length) {
      return -1;
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

  function overall_progress_chart(logId) {
    let overall_bar = document.getElementById("overall_bar");
    var progress_percent = get_section_progress_percent(logId, 4);
    if (progress_percent < 0) {
      progress_percent = 0;
    }
    overall_bar.style.width = progress_percent + "%"
    overall_bar.textContent = progress_percent + "%"
  }

  function polulate_pie_chart(percentage, canvas_id) {
    var config = {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [percentage, 100-percentage],
          backgroundColor: [
            "#3891eb",
            "#d3d3d3"
          ],
          hoverBackgroundColor: [
            "#3891eb",
            "#d3d3d3"
          ]
        }]
      },
      options: {
        elements: {
          center: {
            text: percentage + '%',
            color: '#3891eb', // Default is #000000
            fontStyle: 'Arial', // Default is Arial
            sidePadding: 10, // Default is 20 (as a percentage)
            minFontSize: 15, // Default is 20 (in px), set to false and text will not wrap.
            lineHeight: 15 // Default is 25 (in px), used for when text wraps
          }
        }
      },
      plugins: [{
          id: 'doughnut-centertext',
          beforeDraw: function(chart) {
            if (chart.config.options.elements.center) {
                // Get ctx from string
                var ctx = chart.ctx;

                // Get options from the center object in options
                var centerConfig = chart.config.options.elements.center;
                var fontStyle = centerConfig.fontStyle || 'Arial';
                var txt = centerConfig.text;
                var color = centerConfig.color || '#000';
                var maxFontSize = centerConfig.maxFontSize || 75;
                var sidePadding = centerConfig.sidePadding || 20;
                var sidePaddingCalculated = (sidePadding / 100) * (chart._metasets[chart._metasets.length-1].data[0].innerRadius * 2)
                // Start with a base font of 30px
                ctx.font = "30px " + fontStyle;

                // Get the width of the string and also the width of the element minus 10 to give it 5px side padding
                var stringWidth = ctx.measureText(txt).width;
                var elementWidth = (chart._metasets[chart._metasets.length-1].data[0].innerRadius * 2) - sidePaddingCalculated;

                // Find out how much the font can grow in width.
                var widthRatio = elementWidth / stringWidth;
                var newFontSize = Math.floor(30 * widthRatio);
                var elementHeight = (chart._metasets[chart._metasets.length-1].data[0].innerRadius * 2);

                // Pick a new font size so it will not be larger than the height of label.
                var fontSizeToUse = Math.min(newFontSize, elementHeight, maxFontSize);
                var minFontSize = centerConfig.minFontSize;
                var lineHeight = centerConfig.lineHeight || 25;
                var wrapText = false;

                if (minFontSize === undefined) {
                    minFontSize = 20;
                }

                if (minFontSize && fontSizeToUse < minFontSize) {
                    fontSizeToUse = minFontSize;
                    wrapText = true;
                }

                // Set font settings to draw it correctly.
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
                var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
                ctx.font = fontSizeToUse + "px " + fontStyle;
                ctx.fillStyle = color;

                if (!wrapText) {
                    ctx.fillText(txt, centerX, centerY);
                    return;
                }

                var words = txt.split(' ');
                var line = '';
                var lines = [];

                // Break words up into multiple lines if necessary
                for (var n = 0; n < words.length; n++) {
                    var testLine = line + words[n] + ' ';
                    var metrics = ctx.measureText(testLine);
                    var testWidth = metrics.width;
                    if (testWidth > elementWidth && n > 0) {
                        lines.push(line);
                        line = words[n] + ' ';
                    } else {
                        line = testLine;
                    }
                }

                // Move the center up depending on line height and number of lines
                centerY -= (lines.length / 2) * lineHeight;

                for (var n = 0; n < lines.length; n++) {
                    ctx.fillText(lines[n], centerX, centerY);
                    centerY += lineHeight;
                }
                //Draw text in center
                ctx.fillText(line, centerX, centerY);
            }
        }
      }]
    };
    var chartExist = Chart.getChart(canvas_id); // <canvas> id
    if (chartExist != undefined) {
      chartExist.destroy();
    }
    var ctx = document.getElementById(canvas_id).getContext("2d");
    var myChart = new Chart(ctx, config);
  }

  function section_progress_chart(logId, section_name) {
    var section_chart_id = '';
    if (section_name == 1) {
      section_chart_id = "subwayChart";
    }else if (section_name == 2) {
      section_chart_id = "discoveryChart";
    }else {
      section_chart_id = "bashChart";
    }
    var progress_percent = get_section_progress_percent(logId, section_name);
    if (progress_percent < 0) {
      progress_percent = 0;
    }
    polulate_pie_chart(progress_percent, section_chart_id);

  }

  function getKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i ++) {
      keys[i] = localStorage.key(i);
    }
    return keys;
  }

  function has_key(str) {
    str = str + '';
    typeof(str); //test
    var arr = getKeys();
    arr = arr.filter(id => !id.startsWith("*"));
    for (let i = 0; i < arr.length; i ++) {
      if (arr[i] === str) {
        return true;
      }
    }
    return false;
  }

  function search(str) {
    var arr = getKeys();
    arr = arr.filter(id => !id.startsWith("**"))
    let results = [];
    const val = str.toLowerCase();

    for (let i = 0; i < arr.length; i++) {
      if (arr[i].toLowerCase().indexOf(val) > -1) {
        results.push(arr[i]);
      }
    }
    return results;
  }

  function searchHandler(e) {
    const inputVal = e.currentTarget.value;
    let results = [];
    if (inputVal.length > 0) {
      results = search(inputVal);
    }
    showSuggestions(results, inputVal);
  }

  function showSuggestions(results, inputVal) {
    const suggestions = document.querySelector('.suggestions ul');
    suggestions.innerHTML = '';

    if (results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        let item = results[i];
        // Highlights only the first match
        // TODO: highlight all matches
        const match = item.match(new RegExp(inputVal, 'i'));
        item = item.replace(match[0], `<strong>${match[0]}</strong>`);
        suggestions.innerHTML += `<li>${item}</li>`;
      }
      suggestions.classList.add('has-suggestions');
    } else {
      results = [];
      suggestions.innerHTML = '';
      suggestions.classList.remove('has-suggestions');
    }
}

  function useSuggestion(e) {
    const input = document.querySelector('#logId');
    const suggestions = document.querySelector('.suggestions ul');
    input.value = e.target.innerText;
    input.focus();
    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');
  }

  function get_section_progress_percent(log_id, section_name) {
    var total_section = 0;
    var quiz_name = current_progress(log_id);
    var cur_ind = count_ind(quiz_name, quiz_names)+1;
    switch(section_name) {
      case 1:
        if (cur_ind > 12) {
          cur_ind = 12;
        }
        total_section = 12
        break;
      case 2:
        if (cur_ind < 13) {
          cur_ind = 0;
        }else if (cur_ind >= 13 && cur_ind <= 26){
          cur_ind = cur_ind - 12;
        }else{
          cur_ind = 14;
        }
        total_section = 14;
        break;
      case 3:
        if (cur_ind < 27){
          cur_ind = 0;
        }else {
          cur_ind = cur_ind - 26;
        }
        total_section = 32
        break;
      case 4:
        total_section = 58;
        break;
    }

    var cur_progress_percent = Math.round((cur_ind * 1.0/total_section)*100 * 1e1) / 1e1;
    return cur_progress_percent;
  }

  function count_ind(text, arr) {
    for (let i = 0; i < arr.length; i ++) {
      if (text.includes(arr[i])) {
        return i;
      }
    }
    return -1;
  }

  function current_progress(logId) {
    const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
    if (log_arr == null) {
      throw "Couldn't find corresponding logId";
    }
    for (let i = log_arr.length - 1; i >= 0; i--) {
      var quiz_url = log_arr[i].url + "";
      var quiz_name_ind = count_ind(quiz_url, quiz_urls);
      if (quiz_name_ind != -1) {
        var matching_quiz_name = quiz_names[quiz_name_ind];
        return matching_quiz_name;
      }
    }
    return "Haven't started the tutorial or haven't completed any quizzes."
  }

  // given a logId, search for and return the index of the latest quiz in the quiz_name array
  // return -1 if haven't submitted any quiz
  function current_progress_ind(logId) {
    const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
    if (log_arr == null) {
      throw "Couldn't find corresponding logId";
    }
    for (let i = log_arr.length - 1; i >= 0; i--) {
      var quiz_url = log_arr[i].url + "";
      var quiz_name_ind = count_ind(quiz_url, quiz_urls);
      if (quiz_name_ind != -1) {
        return quiz_name_ind;
      }
    }
    return -1;
  }

  //given a logId, return all the millestone index (only post quiz) that we have found in his log
  //the last index in returned list is the most current progress quiz index
  function visited_millestone_ind(logId){
    const log_arr = filter_logs(logId, 0, 0, 0, 0, 0);
    if (log_arr == null) {
      throw "Couldn't find corresponding logId";
    }
    var result = [];
    for (let i = 0; i < log_arr.length; i++) {
      var quiz_url = log_arr[i].url + "";
      var quiz_name_ind = count_ind(quiz_url, quiz_urls);
      if (quiz_name_ind != -1) {
        if (quiz_name_ind % 2 == 1) {
          if (!result.includes(quiz_name_ind)){
            // if (quiz_name_ind <= max_ind) {
              result.push(quiz_name_ind);
            //}
          }
        }
      }
    }
    return result;
  }

  function get_formated_quiz_name(name) {
    return name.replace("DNA ", '').replace("Subway ", '').replace("Discovery ", '').
    replace("Command-Line ", '').replace("in progress: ", '').replace("Completed: ", '').replace("Post-Quiz: ", '').replace("Pre-Quiz: ", '');
  }

  /**
 * Read data from file 'logs.json' and filters the log data by based on
 * the following parameters, throws error if 'logs.json' doesn't exist.
 * @param {String} log_id - Specify username
 * @param {String} timeBefore - Get logs before date provided, E.g. 2022-07-01
 * @param {String} timeAfter - Get logs after date provided, etc. 2022-07-01
 * @param {String} event - Specify event name of logs
 * @param {String} eventType - Specify event type of logs
 * @param {String} url - Specify the url of logs
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

  function get_quiz_url() {
    return ["1FAIpQLSddCGvt7FriT0z3PhiLvi43-Vi9yBfla1Yi6ABQeJK68zdmsw/formResponse",
    "1FAIpQLScrLQ6sPbKsJE_XWPW9KoPm_mzcXixBORRJBDNztE6RLanq-Q/formResponse",
    "1FAIpQLScUzQHQOFezUmID7lwJDgGhxgjtnjHBFNfMjCU_7aWoEFXU6A/formResponse",
    "1FAIpQLSdio-36gufdOH-iwlcAroKij-wnIAPL0-MQgRi6CDA12Fm3Cg/formResponse",
    "1FAIpQLSeHeBZ_LH7kzg9yW_DzKur4yqWF9gdO0LWm3KCCU2u6WypzEQ/formResponse",
    "1FAIpQLSfXUX5Jr2moJDv7O7eQYjRjoyrk5NsbHFXEXYFfWoTMcXF99A/formResponse",
    "1FAIpQLScQaX9ukw_eyaA7aMD6Pl_4q_KJ1r-ARxPN5uXM_bsvB95n1w/formResponse",
    "1FAIpQLSc8qQblV-rqShUmf8zIaZDNoJlid2lG2VrlM0oH-Kz5Sb3klg/formResponse",
    "1FAIpQLSfy8nP9pGmEgliCFJG1PjwySgoHKsQNP_IZB0C_hksLi0hOiw/formResponse",
    "1FAIpQLSe4qhVC3vFo6MDiDFUs7xFELH1VEyV4mqdlN-m50DozlkESRw/formResponse",
    "1FAIpQLSdgm5NKev7ZiSL_7DswMQdpTJEzL45LVc6dXt5fUuCYo90NGA/formResponse",
    "1FAIpQLSeg72q8HBIiJCBS54pKvlfPXbad7JwxdNKQC5KrC4OWoOka3A/formResponse",

    "1FAIpQLScmGaKjinmJ7qUHWCmWw0mxN5g-JazjXQD-7M3GZ9EC5HGI2g/formResponse",
    "1FAIpQLSei9Pkns752nj36ayhoM-plQeJY1UlIMHn6phC_scoy_9-4CA/formResponse",
    "1FAIpQLSdP3_5w_CW0K141FLwsF0b_uowA1Rt1aHMLxS4okg03VsahLg/formResponse",
    "1FAIpQLScWg4k3vzAWe_t9H_IcqoTRBHw-iEDcU91TnyxJbKuMgRjByw/formResponse",
    "1FAIpQLSfD16aU73_yIXLpcVl9CcSIBCwzzT5lXIdj_ZQcIw7iAow-kQ/formResponse",
    "1FAIpQLSeIcAbANhDPvZBw5AzTDx9nyFcD76Tv9T1ixs9iw71t2YnmhQ/formResponse",
    "1FAIpQLScQWaqoa0WPVMjpI2RlgihmInju6NK5UWAzaOs7cWMSmBxLGg/formResponse",
    "1FAIpQLSdsHvNiyyOK6-gDU4anJW_Tpx7_tCZF9SrrvHnz227adSNwhA/formResponse",
    "1FAIpQLScku4KLqUCLAD6rkFapwK4Ywvm3URDnToj3Oa0KqTueIK_8Vw/formResponse",
    "1FAIpQLSeqZOjy2fESBbWOtq-r3E38d3Lr9uV17xt-TZIO3WL8FuO53A/formResponse",
    "1FAIpQLSdVPiy7-pDvKVLjvrKZwQBrm53jdufPce-lCA9tUxarf_ofvg/formResponse",
    "1FAIpQLSeojtdyjb1OUwaRj23FLdmgSAEBABSyMyKxORzuTRxgGLk-IQ/formResponse",
    "1FAIpQLSf2reh4lCauC_8SjF1szyWS2RQQMq4D9BYaFOJiKB2BIFmtGg/formResponse",
    "1FAIpQLSc4b0485oI5Xy8fowLheMiI3aNOuwDZGDLtHvD2q3cgzBCnHw/formResponse",

    "1FAIpQLSe1AbMbUslRViSCPOILByQcZ6g7iDcI_TxTyS0Uia_t1F4tiQ/formResponse",
    "1FAIpQLSc27KcDFFKijSuqgWbWVfdloK-zxQYUjvhR7qlXwhlyALXCIw/formResponse",
    "1FAIpQLSe8XNS0aMWvM5PYep4UUtkx2B5ufoxVsm1tRALbYOv3UjLriQ/formResponse",
    "1FAIpQLSf4Q6rKo_mNIhabwNLzSy-GIlHeSl3aU0S4vLCzb_FvrXtn1g/formResponse",
    "1FAIpQLSf2tv8MV-HPRcjrOVsHjas04akdQnpKlk5NB7OANTU04PUxVA/formResponse",
    "1FAIpQLSfy_etgaf5f4O7ARir0HvTTx_Y1JrgwF-U2D_ntxbqk3gfBbA/formResponse",
    "1FAIpQLSfz3Qh3CNc8zBsImuqIcMXSpYJg8Gh_Oai_n8PHO-H7MRtwjg/fomrResponse",
    "1FAIpQLSeg5XYiu1zS9v-J4N3QozcPkoWXflUnCjTf0Y3QoyRLh2qWJQ/formResponse",
    "1FAIpQLScazx0aKRqUKqnV2r0vLrN3WEoT8rCxcxOOY8rl3VuwDTe-Sw/formResponse",
    "1FAIpQLSdyrbSwWJM-JfF8FFwrnhxJROJds63yw78Lb-eN9zZYnJpDLA/formResponse",
    "1FAIpQLSeQ1yD1F2RU2r420eqTTTbUXKqdzmbifb_jhD3yiZ5GZy9jXw/formResponse",
    "1FAIpQLSeExwoAFyO2tIcH3NfhnP9jR8Syq1Sy4YOoGcpp5y2dDE0Snw/formResponse",
    "1FAIpQLSetGb7kVNbBpMYv-ge14aNiP2K0HiH36Ql1ZXFLZ9lGQHWuUA/formResponse",
    "1FAIpQLScQz3qCnuue3wx9bI4alb5egIjH-zPXyxhBlRkTdEZEckCcaw/formResponse",
    "1FAIpQLSfH-RbJYf-x9FDYeKsw2nUKs-wzHHpwZmE8OIBIc6BjKjGbaA/formResponse",
    "1FAIpQLScBtBrhXMnqXbob1vZDSOFHGbTVZWRs6mcChM_P9-i2Mk7SQg/formResponse",
    "1FAIpQLScYMIDV2Mbo26asDQpcFPDHaaihRY9IJU5-BjXygc-KkzPY9Q/formResponse",
    "1FAIpQLSd9-TB1m7ZyZzZHPNRZ7S41sbV4BHxwBcYJlePogWDsRyeDlA/formResponse",
    "1FAIpQLSc9AZubmmAxBP1qWT7AIARqpdvrZ1i4edHFK4NPl36Qm5WXEg/formResponse",
    "1FAIpQLSdG_lnZfZiL7v2mPIkAzp8779AqwyPz5CHY7I2kt1ODshX6Qg/formResponse",
    "1FAIpQLSczs6f10KzQGX00wiYSmP7hSpLQfvrT7SP6oVnlUGTGunZeMA/formResponse",
    "1FAIpQLSfFXH9FdEXfIWu8JOQdSJ8pm0jK0GZMlDFJueeY3aII0C9H_Q/formResponse",
    "1FAIpQLSfBlK2slNhKOFTLobeWlug44_bzFFo_vJPt2QNWLj0dALOfXw/formResponse",
    "1FAIpQLSddYE-x27SFOGufUR408nmRuigmzE_GEpk4hW3PRIPexD8F1w/formResponse",
    "1FAIpQLSf06kuzfcj5oLz9M_rLQDYBOPLwMGQd7csmW_7OX2kipzTcog/formResponse",
    "1FAIpQLSf-LxagwwhvMv2Ort0G7t2oI0KejCbzVG350tvEatu6wrso-g/formResponse",
    "1FAIpQLSePOQOf9PDDciiIW0BrO_qNCEDQMxGsRoPj1SW41BTrmUjtzQ/formResponse",
    "1FAIpQLSeInEVkhm24ZAnsgsySiP-8nkrZHR6i6ByCcLdm5jlj9tJb7Q/formResponse",
    "1FAIpQLSfV-K96T4a17Rds8NpMD6279raYeR6yHAiK0CzZEmrkD4K_Ig/formResponse",
    "1FAIpQLSdPCfA8lvIllZVOKkAVBLlvqAxNCT0PctriYhGTQiXdH0fzjQ/formResponse",
    "1FAIpQLScSEZDJSnVDEsIymk29DQ7EU4XFTRrUQJ7Lezgfr3aXdDlKbA/formResponse",
    "1FAIpQLSfLeFWj4lcIB0iR74IC15B6o5Khu6QKRY1Evw2TwH-hji9Cmw/formResponse"
  ];
  }

  function get_quiz_name() {
    return ["DNA Subway in progress: Pre-Quiz: File System1",
      "DNA Subway in progress: Post-Quiz: File System1",
      "DNA Subway in progress: Pre-Quiz: Basic Computation",
      "DNA Subway in progress: Post-Quiz: Basic Computation",
      "DNA Subway in progress: Pre-Quiz: Basic Genetics",
      "DNA Subway in progress: Post-Quiz: Basic Genetics",
      "DNA Subway in progress: Pre-Quiz: FastX Toolkit",
      "DNA Subway in progress: Post-Quiz: FastX Toolkit",
      "DNA Subway in progress: Pre-Quiz: Kallisto + Sleuth",
      "DNA Subway in progress: Post-Quiz: Kallisto + Sleuth",
      "DNA Subway in progress: Pre-Quiz: Cloud Computing",
      "DNA Subway Completed: Post-Quiz: Cloud Computing",

      "DNA Discovery in progress: Pre-Quiz: File System2",
      "DNA Discovery in progress: Post-Quiz: File System2",
      "DNA Discovery in progress: Pre-Quiz: Composite | Pipe",
      "DNA Discovery in progress: Post-Quiz: Composite | Pipe",
      "DNA Discovery in progress: Pre-Quiz: Access List",
      "DNA Discovery in progress: Post-Quiz: Access List",
      "DNA Discovery in progress: Pre-Quiz: Access Inheritance",
      "DNA Discovery in progress: Post-Quiz: Access Inheritance",
      "DNA Discovery in progress: Pre-Quiz: Access Overriding",
      "DNA Discovery in progress: Post-Quiz: Access Overriding",
      "DNA Discovery in progress: Pre-Quiz: Permission Override",
      "DNA Discovery in progress: Post-Quiz: Permission Override",
      "DNA Discovery in progress: Pre-Quiz: Tree Accesses",
      "DNA Discovery Completed: Post-Quiz: Tree Accesses",

      "DNA Command-Line in progress: Pre-Quiz: Bash-Scope",
      "DNA Command-Line in progress: Post-Quiz: Bash-Scope",
      "DNA Command-Line in progress: Pre-Quiz: Directories & Files",
      "DNA Command-Line in progress: Post-Quiz: Directories & Files",
      "DNA Command-Line in progress: Pre-Quiz: Long Listing",
      "DNA Command-Line in progress: Post-Quiz: Long Listing",
      "DNA Command-Line in progress: Pre-Quiz: Command Anatomy",
      "DNA Command-Line in progress: Post-Quiz: Command Anatomy",
      "DNA Command-Line in progress: Pre-Quiz: CD",
      "DNA Command-Line in progress: Post-Quiz: CD",
      "DNA Command-Line in progress: Pre-Quiz: Built-In vs External",
      "DNA Command-Line in progress: Post-Quiz: Built-In vs External",
      "DNA Command-Line in progress: Pre-Quiz: Relative Names",
      "DNA Command-Line in progress: Post-Quiz: Relative Names",
      "DNA Command-Line in progress: Pre-Quiz: CAT & Standard IO",
      "DNA Command-Line in progress: Post-Quiz: CAT & Standard IO",
      "DNA Command-Line in progress: Pre-Quiz: I/O Redirect",
      "DNA Command-Line in progress: Post-Quiz: I/O Redirect",
      "DNA Command-Line in progress: Pre-Quiz: '>>' and '*'",
      "DNA Command-Line in progress: Post-Quiz: '>>' and '*'",
      "DNA Command-Line in progress: Pre-Quiz: Manipulate Nodes",
      "DNA Command-Line in progress: Post-Quiz: Manipulate Nodes",
      "DNA Command-Line in progress: Pre-Quiz: PATH & Variables",
      "DNA Command-Line in progress: Post-Quiz: PATH & Variables",
      "DNA Command-Line in progress: Pre-Quiz: Pipes",
      "DNA Command-Line in progress: Post-Quiz: Pipes",
      "DNA Command-Line in progress: Pre-Quiz: Files & Permissions",
      "DNA Command-Line in progress: Post-Quiz: Files & Permissions",
      "DNA Command-Line in progress: Pre-Quiz: Looping",
      "DNA Command-Line in progress: Post-Quiz: Looping",
      "DNA Command-Line in progress: Pre-Quiz: Unix Permissions",
      "DNA Command-Line in progress: Post-Quiz: Unix Permissions"
      ];
  }

  function get_random_names() {
    return ["Vosgi", "Matiji", "Made", "Wil", "Seong", "Paytom", "Mpho", "Chidiebere", "Hilla", "Muirgen", "Marija",
            "Adisa", "Arie", "Timotheos", "Laurine", "Fareed", "Judocus"];
  }

  //helper function for data setup

  function requestData() {
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
    fetch(PULL_URL, {method: 'POST', headers: headers, body: JSON.stringify(help_data)})
      .then(checkStatus)
      .then(resp => resp.json())
      .then(filter_resp)
      .then(local_storage_setup)
      .then(display_overall_mode)
      .then(select_Id)
  }

  //new requesting data endpoint below

  function requestData_test() {
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
    fetch(PULL_URL, {method: 'POST', headers: headers, body: JSON.stringify(help_data)})
      //.then(checkStatus)
      .then(resp => resp.json())
      .then(filter_resp_test)
      .then(local_storage_setup_test)
      .then(display_overall_mode)
      .then(select_Id)
  }

  function filter_resp_test(id_arr) {
    var all_ids = id_arr.found_items;
    var filtered = all_ids.filter(data => !data.includes("CyVerseDefaultUser"));
    return filtered;
  }

  async function local_storage_setup_test(all_ids) {
    //localStorage.clear();
    var existing_ids = getKeys().filter(id => !id.startsWith("**"));
    for (let i = 0; i < all_ids.length; i ++) {
      var id = all_ids[i];
      var log = await fetch_by_id(id);
      var log_list = log.logs[0].log.logArray;
      var log_json = JSON.stringify(log_list);
      localStorage.setItem(id, log_json);
      console.log("localstorage setup complete!")
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


  function local_storage_setup(user_log_arr) {
    var arr = [];
    arr = user_log_arr;
    arr.forEach(user_arr => {
      var log_id = user_arr.log_id;
      var log_list = user_arr.log.logArray;
      localStorage.setItem(log_id, JSON.stringify(log_list));
    });
  }

  function filter_resp(data) {
    const data_arr = data.logs;
    const filtered = data_arr.filter(data => !(data.log_id + "").includes("CyVerseDefaultUser"));
    return filtered;
  }

  function checkStatus(response) {
    if (response.ok) {
      return response;
    } else {
      throw Error("Error in request: " + response.statusText);
    }
  }
})();