window.onload = function () {
  const start_year = 2019;
  const end_year = 2021;
  let year_intvl = end_year-start_year;
  let select_year = 2021;
  let chartFactor = "score";
  visual_ctx = new Array(4);
  for(let i=0; i<4; i++){
    console.log(`canvas${String(i+1)}`);
    visual_ctx[i] = document.getElementById(`canvas${String(i+1)}`).getContext("2d");
  }
  
  fetchData();
  function fetchData() {
    makePage(chart_data);
  }
  function makePage(chart_data){
    console.log("makePage");
    console.log(chart_data);
    let student_data = JSON.parse(chart_data["user_data"])[select_year-start_year];
    console.log("student_data", student_data);
    let annual_data = chart_data["annual_overview"];
    console.log("annual_data", annual_data);
    let score_data = chart_data["score_data"];
    console.log("score_data", score_data);

    const DATA_COUNT = 5;
    const labels = ["commits", "stars", "issues", "PRs"];
    const label_keys = ["commit", "star", "issue", "pr"];
    const average_data = [];
    label_keys.forEach((label)=>{
      if(label == "commit"){
        average_data.push(Math.log2(annual_data[label][select_year-start_year]));
      }
      else{
        average_data.push(annual_data[label][select_year-start_year]);
      }
    });
    const user_data = [];
    label_keys.forEach((label)=>{
      if(label == "commit"){
        user_data.push(Math.log2(student_data[label]));
      }
      else{
        user_data.push(student_data[label]);
      }
    });
    console.log("average_data", average_data);
    console.log("user_data", user_data);
    const baseColor = "#174adf";
    const userColor = "#ffe522";
    const cc6 = [
      "#4245cb",
      "#c629b6",
      "#ff268a",
      "#ff6657",
      "#ffab21",
      "#ffe913",
    ];
    const radarOption = {
      plugins: {
        legend: {
          display: true,
        },
        title: {
          display: true,
          text: 'Radar Chart'
        }
      },
      responsive: true,
    };

    /* Chart 1: 레이더 차트 */
    let radar_chart = new Chart(visual_ctx[0], {
        data: {
          labels: labels,
          datasets: [
            { // 전체 평균
              type: "radar",
              label: "average",
              data: average_data,
              backgroundColor: "rgba(0, 0, 200, 0.5)"
            },
            { // 유저
              type: "radar",
              label: "you",
              data: user_data,
              backgroundColor: "rgba(200, 0, 0, 0.5)"
            },
          ],
        },
        options: radarOption,
      });
    
    /* Chart 3: 분포도 히스토그램 */
    const scoreDistLabel = new Array(10);
    for (let i = 0; i < 10; i++) {
      scoreDistLabel[i] = `${((5 * i) / 10).toFixed(1)}~${(
        (5 * i) / 10 + 0.5
      ).toFixed(1)}`;
    }
    console.log("scoreDistLabel", scoreDistLabel, scoreDistLabel.length);
    const commitDistLabel = [
      "0~100",
      "100~200",
      "200~300",
      "300~400",
      "400~500",
    ];
    const starDistLabel = ["0~2", "2~4", "4~6", "6~8", "8~10"]; //contain over 10
    const prDistLabel = ["0~5", "5~10", "10~15", "15~20", "20~25"];
    const issueDistLabel = ["0~2", "2~4", "4~6", "6~8", "8~10"];
    const yearLabel = [];
    for(y = start_year; y<=end_year;y++){
      yearLabel.push(y);
    }
    let factor_label = scoreDistLabel;
    if(chartFactor=="score") factor_label = scoreDistLabel;
    else if(chartFactor=="commit") factor_label = commitDistLabel;
    else if(chartFactor=="star") factor_label = starDistLabel;
    else if(chartFactor=="pr") factor_label = prDistLabel;
    else if(chartFactor=="issue") factor_label = issueDistLabel;
    else{
      console.log("not changes");
    }

    console.log("factor_label", factor_label);
    let dist = JSON.parse(chart_data[`year${select_year}`])[0];
    console.log("dist[factor_label]", dist[chartFactor]);
    let dist_dataset = makeHistogramJson(dist[chartFactor], factor_label);
    console.log("dist_dataset", dist_dataset);

    let paramColor = Array(10);
    let colorIdx = findDistIdx(factor_label, Number(student_data[chartFactor]));
    console.log("colorIdx", colorIdx);
    for(let i=0; i<10;i++){
      paramColor[i] = baseColor;
      if(i==colorIdx) paramColor[i] = userColor;
    }
    console.log("paramColor", paramColor);
    
    let dist_chart = makeChart(visual_ctx[2], /*type=*/"bar", /*factor=*/chartFactor, factor_label, dist_dataset, paramColor, 
    {
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'Distribution Histogram'
        }
      },
    },);

    /* Chart 4: 세부 점수 그래프 */
    console.log("make score dataset",score_data[2]["total_score"]);
    const score_dataset= [];
    const specific_score_label = ["owner_score", "contributor_score", "additional_score"];
    const cc3 = ["#4245cb", "#ff4470", "#ffe913"];
    for(let i = 0; i <= year_intvl; i++){
      let score_dataset_data = [];
      let score_label = specific_score_label[i];
      for(let y = 0; y <= year_intvl; y++){
        score_dataset_data.push(score_data[y][score_label]);
      }
      score_dataset.push({
        "label":score_label,
        "data":score_dataset_data,
        "backgroundColor":cc3[i],
      });
    }
    console.log("score_dataset",score_dataset);

    let specific_score_chart = new Chart(visual_ctx[3], {
      type: "bar",
      data: {labels:yearLabel, datasets:score_dataset},
      options: {
        indexAxis: 'y',
        elements: {
          bar: {borderWidth: 2,}
        },
        responsive: true,
        plugins: {
          legend: {display: false,},
          title: {display: true, text: 'Score Bar Chart'},
        },
        scales: {
          x: { max: 5, beginAtZero: true, stacked: true,},
          y: {stacked: true}
        },
      },
    });
  }

  function findDistIdx(label=[], value){
    let ret_idx = label.length;
    try{
      
      label.forEach((interval, idx) => {
        let Vals = interval.split("~");
        let startVal = Number(Vals[0]);
        let endVal = Number(Vals[1]);
        if(startVal <= value && value < endVal){
          ret_idx = idx
        }
      });
    }catch(error){
      console.error(error)
      return -1;
    }
    return ret_idx;
    
  }

  function destroyChart(chart, size) {
    for (let i = 0; i < size; i++) {
      chart[i].destroy();
    }
  }

  function makeChart(ctx, type, factor,
      labels, data, color, options, topdata = []) {
    let chart;
    console.log("makechart");
    if (type === "bar") {
      //Histogram
      const borderWidth = 1;
      const barPercentage = 1;
      const categoryPercentage = 1;

      chart = new Chart(ctx, {
        data: {
          labels: labels,
          datasets: [
            {
              type: type,
              label: "num",
              data: data,
              backgroundColor: color,
              borderWidth: borderWidth,
              barPercentage: barPercentage,
              categoryPercentage: categoryPercentage,
            },
          ],
        },
        options: options,
      });
    }

    return chart;
  }

  function makeHistogramJson(dist, label) {
    console.log("makeHistogramJson", dist, label);
    let offset = 0;
    //label expect NUM1~NUM2 or NUM
    let newDist = new Array(dist.length);
    let newLabel = new Array(label.length);
    if (dist.length === label.length) {
      for (let i = 0; i < dist.length; i++) {
        if (label[i].indexOf("~") === -1) {
          newLabel[i] = label[i];
        } else {
          newLabel[i] = label[i].split("~")[1];
          if (offset === 0) {
            let temp = label[i].split("~");
            offset = (Number(temp[1]) - Number(temp[0])) / 2;
          }
        }
      }
    } else return dist;
    for (let j = 0; j < dist.length; j++) {
      newDist[j] = {
        x: Number(newLabel[j]) - offset,
        y: dist[j],
      };
    }
    console.log("NEW DIST", newDist);
    return newDist;
  }
};
