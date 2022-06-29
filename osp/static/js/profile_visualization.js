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
    visual_ctx[i] = document.getElementById(`canvas${String(i+1)}`).getContext("2d");
  }
  let btn_year = document.getElementsByClassName("btn-year");
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
  let start = new Date();

  let monthly_contr = JSON.parse(chart_data["monthly_contr"][select_year-start_year]);
  console.log("monthly_contr", monthly_contr);
  let monthly_contribution = Array(12).fill(0);
  let factor_contribution = Array(6).fill(0);
  const factorLables = ["commits", "stars", "prs", "issues", "cr_repos","co_repos"];
  for(let i=0; i<monthly_contr.length; i++){
    // console.log(i,monthly_contr[i]);
    let total = monthly_contr[i]["total"];
    if(total<=30){
      monthly_contribution[i] = Math.ceil(total / 10);
    }
    else monthly_contribution[i] = 4;
    for(let j=0; j<factorLables.length; j++){
      factor_contribution[j] += monthly_contr[i][factorLables[j]];
    }
  }
  console.log("factor_contribution", factor_contribution);
  for(let i=0; i<factorLables.length; i++){
    factor_contribution[i] = getDataLevel(factor_contribution[i], i, true);
  }
  function getDataLevel(value, type, isYear=false){
    let level = 0;
    if(isYear){
      if (type === 0) level = Math.ceil(value / 100);
      else if (type === 1)  level = Math.ceil(value / 2);
      else if (type === 2)  level = Math.ceil(value / 5);
      else level = Math.ceil(value / 4);
    }
    else{
      if (type === 0) level = Math.ceil(value / 25);
      else if (type === 2)  level = value;
      else if (type === 2)  level = Math.ceil(value / 3);
      else level = Math.ceil(value / 2);
    }

    if(level>4) level = 4;
    return level;
  }
  console.log("monthly_contribution", monthly_contribution);
  console.log("factor_contribution", factor_contribution);

  /* Grass for Month */
  for(let col = 1; col <= 6; col++){
    let gr = document.createElementNS(NS, "g");
    for(let row = 1; row <=2; row++){
      let rect = document.createElementNS(NS,"rect");
      let ctb = monthly_contribution[((col-1)*2+row)-1];
      rect.setAttributeNS(null,"month", (col-1)*2+row);
      rect.setAttributeNS(null,"x", 14);
      rect.setAttributeNS(null,"y", (grass_size+4)*row - 48);
      rect.setAttributeNS(null,"width", grass_size);
      rect.setAttributeNS(null,"height", grass_size);
      rect.setAttributeNS(null,"rx", "2");
      rect.setAttributeNS(null,"ry", "2");
      rect.setAttributeNS(null,"class", "ContributionCalendar-day");
      rect.setAttributeNS(null,"data-level", ctb);
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
        console.log(e.target.attributes[0].value);
      });
      gr.appendChild(rect);
    }
    gr.setAttribute("transform", `translate(${(col-1)*(grass_size+4)}, 0)`);
    gr.setAttribute("stroke", "#aaaaaa");
    div_activity_monthly.appendChild(gr);
  }
  /* Grass for Factor */
  let factor_grass = document.getElementById("factor-grass");
  for(let col = 0; col < 6; col++){
    let rect = document.createElementNS(NS,"rect");
    let ctb = factor_contribution[col];
    rect.setAttributeNS(null,"factor", factorLables[col]);
    rect.setAttributeNS(null,"x", (grass_size+4)*col+14);
    rect.setAttributeNS(null,"y", 12);
    rect.setAttributeNS(null,"width", grass_size);
    rect.setAttributeNS(null,"height", grass_size);
    rect.setAttributeNS(null,"rx", "2");
    rect.setAttributeNS(null,"ry", "2");
    rect.setAttributeNS(null,"class", "ContributionCalendar-day");
    rect.setAttributeNS(null,"data-level", ctb);
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
      console.log(e.target.attributes[0].value);
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

    /* Chart 2: 분포도 히스토그램 */
    function newArrayRange(start, end, step=1, fix_point=0){
      let arr = [];
      for(let i=start; i<=end; i = i+step){
        arr.push(i.toFixed(fix_point));
      }
      return arr;
    }
    function newArrayScope(range_arr=[]){
      let arr = [];
      for (let i = 1; i < range_arr.length; i++) {
        arr.push(range_arr[i-1]+"~"+range_arr[i]);
      }
      return arr;
    }

    const yearLabel = newArrayRange(start_year, end_year);
    let factor_Xaxis_label = [];
    let factor_option = {}
    switch(chartFactor){
      case "score_sum":
        factor_Xaxis_label = newArrayRange(0, 5, 0.5, 1);
        factor_option = histogramOption(0.25);
        break;
      case "commit":
        factor_Xaxis_label = newArrayRange(0, 500, 100);
        factor_option = histogramOption(50);
        break;
      case "star":
        factor_Xaxis_label = newArrayRange(0, 10, 2);
        factor_option = histogramOption(1);
        break;
      case "pr":
        factor_Xaxis_label = newArrayRange(0, 25, 5);
        factor_option = histogramOption(2.5);
        break;
      case "issue":
        factor_Xaxis_label = newArrayRange(0, 10, 2);
        factor_option = histogramOption(1);
        break;
      case "repo":
        factor_Xaxis_label = newArrayRange(0, 10, 2);
        factor_option = histogramOption(1);
        break;
      default:
        console.error("unknown factor");
    }
    let factor_scope_label = newArrayScope(factor_Xaxis_label);

    let dist = JSON.parse(chart_data[`year${select_year}`])[0];
    let dist_dataset = makeHistogramJson(dist[chartFactor], factor_scope_label);

    let colorIdx = findDistIdx(factor_Xaxis_label, Number(student_data[chartFactor]));
    console.log("colorIdx", colorIdx);

    let paramColor = [];
    for(let i=0; i<factor_scope_label.length; i++){
      if(i != colorIdx) paramColor.push(baseColor);
      else paramColor.push(userColor);
    }
    console.log("paramColor", paramColor);
    
    let dist_chart = makeChart(visual_ctx[1], /*type=*/"bar", /*factor=*/chartFactor, factor_Xaxis_label, dist_dataset, paramColor, factor_option);
    chartObjList.push(dist_chart);

    /* Chart 3: 세부 점수 그래프 */
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

  function findDistIdx(label=[], value=0){
    let ret_idx = 0;
    try{
      label.forEach((cmpVal, idx) => {
        if(Number(cmpVal)<=value) ret_idx = idx;
      });
    }catch(error){
      console.error(error)
      return -1;
    }
    if (ret_idx >= label.length-1) ret_idx = label.length-2;
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

  function histogramOption(offset) {
      return {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                if (!items.length) {
                  return "";
                }
                const item = items[0];
                const x = item.parsed.x;
                let min = x - offset <= 0 ? 0 : x - offset;
                let max = x + offset;
                if (x === 0) {
                  min = 0;
                  max = 0;
                }
                return `${min}~${max}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "linear",
            offset: false,
            grid: { offset: false },
            ticks: { stepSize: offset * 2 },
          },
          y: { beginAtZero: true },
        },
      };
    }
};
