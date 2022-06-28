window.onload = function () {
  const start_year = 2019;
  const end_year = 2021;
  const grass_size = 60;
  const NS = "http://www.w3.org/2000/svg";
  let chartObjList = [];
  let year_intvl = end_year-start_year;
  let select_year = 2021;
  let chartFactor = "score_sum";
  visual_ctx = new Array(4);
  for(let i=0; i<3; i++){
    console.log(`canvas${String(i+1)}`);
    visual_ctx[i] = document.getElementById(`canvas${String(i+1)}`).getContext("2d");
  }
  let btn_year = document.getElementsByClassName("btn-year");
  btn_year.remo
  for (let btn of btn_year) {
    btn.addEventListener("click",function(){
      select_year = btn.innerText;
      console.log(btn.innerText);
      $('.btn-year.active').removeClass("active");
      this.className += " active";
      destroyChart(chartObjList, chartObjList.length);
      chartObjList = [];
      makePage(chart_data);
    });
  }
  let chart_nav = document.getElementsByClassName("nav-link");
  for (let nav of chart_nav) {
    nav.addEventListener("click",function(){
      document.getElementById("visual-subtitle").innerText = nav.innerText;
      console.log(nav.innerText);
      $('.nav-link.active').removeClass("active");
      this.className += " active";
      // 모든 차트를 구현하고 나서 확대페이지를 만든 후,
      // 개별 차트의 삭제와 생성을 구현
    });
  }
  
  const div_activity_monthly = document.getElementById("activity-monthly");
  const div_activity_factor = document.getElementById("activity-factor");
  console.log("div_activity_monthly");
  let start = new Date();
  let monthly_contribution = [];
  for(let i=0;i<12;i++){
    monthly_contribution.push(Math.floor(Math.random()*5));
  }
  let factor_contribution = [];
  for(let i=0;i<6;i++){
    factor_contribution.push(Math.floor(Math.random()*5));
  }
  for(let col = 1; col <= 6; col++){//month
    let gr = document.createElementNS(NS, "g");
    for(let row = 1; row <=2; row++){
      let rect = document.createElementNS(NS,"rect");
      let ctb = monthly_contribution[((col-1)*2+row)-1];
      rect.setAttributeNS(null,"x", 14);
      rect.setAttributeNS(null,"y", (grass_size+4)*row - 48);
      rect.setAttributeNS(null,"width", grass_size);
      rect.setAttributeNS(null,"height", grass_size);
      rect.setAttributeNS(null,"rx", "2");
      rect.setAttributeNS(null,"ry", "2");
      rect.setAttributeNS(null,"month", (col-1)*2+row);
      rect.setAttributeNS(null,"class", "ContributionCalendar-day");
      rect.setAttributeNS(null,"data-level", ctb);
      console.log(ctb);
      switch(ctb){
        case 0:
          rect.style.fill = "#EBEDF0"; break;
        case 1:
          rect.style.fill = "#9BE9A8"; break;
        case 2:
          rect.style.fill = "#40C463"; break;
        case 3:
          rect.style.fill = "#30A14E"; break;
        case 4:
          rect.style.fill = "#216E39"; break;
      }
      rect.addEventListener("click",(e) =>{
        alert(((col-1)*2+row).toFixed());
      });
      gr.appendChild(rect);
    }
    gr.setAttribute("transform", `translate(${(col-1)*(grass_size+4)}, 0)`);
    gr.setAttribute("stroke", "#aaaaaa");
    div_activity_monthly.appendChild(gr);
  }
  let factor_grass = document.getElementById("factor-grass");
  console.log("factor_grass", factor_grass);
  
  for(let col = 0; col < 6; col++){//factor
    let rect = document.createElementNS(NS,"rect");
    let ctb = monthly_contribution[col];
    rect.setAttributeNS(null,"x", (grass_size+4)*col+14);
    rect.setAttributeNS(null,"y", 12);
    rect.setAttributeNS(null,"width", grass_size);
    rect.setAttributeNS(null,"height", grass_size);
    rect.setAttributeNS(null,"rx", "2");
    rect.setAttributeNS(null,"ry", "2");
    rect.setAttributeNS(null,"class", "ContributionCalendar-day");
    rect.setAttributeNS(null,"data-level", ctb);
    console.log(ctb);
    switch(ctb){
      case 0:
        rect.style.fill = "#EBEDF0"; break;
      case 1:
        rect.style.fill = "#9BE9A8"; break;
      case 2:
        rect.style.fill = "#40C463"; break;
      case 3:
        rect.style.fill = "#30A14E"; break;
      case 4:
        rect.style.fill = "#216E39"; break;
    }
    rect.addEventListener("click",(e) =>{
      alert("factor");
    });
    factor_grass.appendChild(rect);
  }
  let end = new Date();
  console.log("elapsed time", end-start);
  
  for(let i=0; i<3; i++){
    console.log(`canvas${String(i+1)}`);
    visual_ctx[i] = document.getElementById(`canvas${String(i+1)}`).getContext("2d");
  }
  
  makePage(chart_data);
  function makePage(chart_data){
    console.log("makePage");
    console.log(chart_data);
    let student_data = JSON.parse(chart_data["user_data"])[select_year-start_year];
    console.log("student_data", student_data);
    let annual_data = chart_data["annual_overview"];
    console.log("annual_data", annual_data);
    let score_data = chart_data["score_data"];
    console.log("score_data", score_data);

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
    chartObjList.push(radar_chart);
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
    if(chartFactor=="score_sum") factor_label = scoreDistLabel;
    else if(chartFactor=="commit") factor_label = commitDistLabel;
    else if(chartFactor=="star") factor_label = starDistLabel;
    else if(chartFactor=="pr") factor_label = prDistLabel;
    else if(chartFactor=="issue") factor_label = issueDistLabel;
    else{
      console.log("not changes");
    }

    console.log("factor_label", factor_label);
    let dist = JSON.parse(chart_data[`year${select_year}`])[0];
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
    
    let dist_chart = makeChart(visual_ctx[1], /*type=*/"bar", /*factor=*/chartFactor, factor_label, dist_dataset, paramColor, 
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
    chartObjList.push(dist_chart);
    /* Chart 4: 세부 점수 그래프 */
    const score_dataset= [];
    const specific_score_label = ["main_repo_score", "other_repo_score", "reputation_score"];
    const cc3 = ["#f7a6af", "#ffc38b", "#fff875"];
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

    const total_score_data = [];
    for(let y = 0; y <= year_intvl; y++){
      total_score_data.push(score_data[y]["total_score"]);
    }

    let specific_score_chart = new Chart(visual_ctx[2], {
      type: "bar",
      data: {labels:yearLabel, datasets:score_dataset},
      options: {
        indexAxis: 'y',
        elements: {
          bar: {borderWidth: 1,}
        },
        responsive: true,
        plugins: {
          legend: {display: false,},
          title: {display: true, text: 'Score Bar Chart'},
          datalabels:{
            anchor: 'end',
            align: (context)=>{
              if(total_score_data[context.dataIndex] <= 4.6)
                return 'end';
              else
                return 'start';
            },
            formatter: (value, context) => {
              const datasetArray = [];
              context.chart.data.datasets.forEach((dataset)=>{
                if(dataset.data[context.dataIndex] != 'undefined'){
                  datasetArray.push(dataset.data[context.dataIndex]);
                }
              });
              function totalSum(total, datapoint) {
                return total + datapoint;
              }
              let sum = datasetArray.reduce(totalSum, 0);
              if(context.datasetIndex === datasetArray.length - 1)
                if(sum === 0) return 0;
                else return sum.toFixed(3);
              else
                return '';
            }
          }
        },
        scales: {
          x: { max: 5, beginAtZero: true, stacked: true },
          y: { stacked: true }
        },
      },
      plugins: [ChartDataLabels],
    });
    chartObjList.push(specific_score_chart);
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
