window.onload = function () {
  const start_year = 2019;
  const end_year = 2021;
  const grass_size = 60;
  const NS = "http://www.w3.org/2000/svg";
  let chartObjList = [];
  let year_intvl = end_year-start_year;
  let select_year = 2021;
  let select_month = 0;
  let chartFactor = "score_sum";
  let is_selected_month = 0;
  let is_selected_factor = 0;
  let is_nomalization = 0;
  visual_ctx = new Array(4);
  for(let i=0; i<3; i++){
    visual_ctx[i] = document.getElementById(`canvas${String(i+1)}`).getContext("2d");
  }
  let btn_year = document.getElementsByClassName("btn-year");
  for (let btn of btn_year) {
    btn.addEventListener("click",function(){
      select_year = btn.innerText;
      $('.btn-year.active').removeClass("active");
      this.className += " active";
      let start = new Date();
      updateMonthly(select_year);
      let end = new Date();
      console.log("updateMonthly elapsed time", end-start);
    });
  }
  let chart_nav = document.getElementsByClassName("nav-link");
  for (let nav of chart_nav) {
    nav.addEventListener("click",function(){
      document.getElementById("visual-subtitle").innerText = nav.innerText;
      $('.nav-link.active').removeClass("active");
      this.className += " active";
      // 모든 차트를 구현하고 나서 확대페이지를 만든 후,
      // 개별 차트의 삭제와 생성을 구현
    });
  }
  let btn_toggle = document.getElementById("btn-toggle");
  btn_toggle.addEventListener("click", (e)=>{
    is_nomalization = 1 - is_nomalization;
    makeRadarChart(is_nomalization);
    if(is_nomalization){
      e.target.setAttribute("title","raw값을 표시합니다. 단, commit은 1/100 값입니다.");
      e.target.textContent = "raw";
    }
    else{
      e.target.setAttribute("title","평균을 10점으로 맞추어 자신의 점수를 비교하기 쉽게 만듭니다.");
      e.target.textContent = "nomalize";
    }
  });
  const div_activity_monthly = document.getElementById("activity-monthly");
  let factor_grass = document.getElementById("factor-grass");
  let monthly_contr = JSON.parse(chart_data["monthly_contr"][select_year-start_year]);
  console.log("monthly_contr", monthly_contr);
  let monthly_contribution = Array(12).fill(0);
  let monthly_contribution_level = Array(12).fill(0);
  let factor_contribution = Array(6).fill(0);
  let factor_contribution_level = Array(6).fill(0);
  const factorLables = ["commit", "star", "pr", "issue", "repo_cr", "repo_co"];
  
  let start = new Date();
  updateMonthly(select_year);
  let end = new Date();
  console.log("updateMonthly elapsed time", end-start);

  function updateMonthly(select_year){
    
    monthly_contr = JSON.parse(chart_data["monthly_contr"][select_year-start_year]);
    for(let i=0; i<monthly_contr.length; i++){
      let total = monthly_contr[i]["total"];
      monthly_contribution[i] = total;
      if(total<=30){
        monthly_contribution_level[i] = Math.ceil(total / 10);
      }
      else {
        monthly_contribution_level[i] = 4;
      }
    }
    clearChildElement(div_activity_monthly);
    is_selected_month = 0;
    is_selected_factor = 0;
    hideTooltip();
    makeMonthGrass();
    select_month = 0;
    updateFactor(factorLables, select_month);
  }
  function clearChildElement(element){
    let child = element.lastElementChild;
    while(child){
      element.removeChild(child);
      child = element.lastElementChild;
    }
  }
  function updateFactor(factorLables, month=0) { 
    console.log("updateFactor")
    if(month == 0){
      //initialize
      for(let i=0; i<monthly_contr.length; i++) {
        factor_contribution[i] = 0;
      }
      for(let i=0; i<monthly_contr.length; i++) {
        for(let j=0; j<factorLables.length; j++) {
          factor_contribution[j] += monthly_contr[i][factorLables[j]];
        }
      }
    }
    else{
      for(let j=0; j<factorLables.length; j++){
        factor_contribution[j] = monthly_contr[month-1][factorLables[j]];
      }
    }
    for(let i=0; i<factorLables.length; i++){
      factor_contribution_level[i] = getDataLevel(factor_contribution[i], i, is_selected_month);
    }
    clearChildElement(factor_grass);
    makeFactorGrass();
  }
  
  function getDataLevel(value, type, isMonthly=true){
    let level = 0;
    if (isMonthly) {
      if (type === 0) level = Math.ceil(value / 25);
      else if (type === 2)  level = value;
      else if (type === 2)  level = Math.ceil(value / 3);
      else level = Math.ceil(value / 2);
    }
    else {
      if (type === 0) level = Math.ceil(value / 100);
      else if (type === 1)  level = Math.ceil(value / 2);
      else if (type === 2)  level = Math.ceil(value / 5);
      else level = Math.ceil(value / 4);
    }
    if(level>4) level = 4;
    return level;
  }

  /* Grass for Month */
  function makeMonthGrass(){
    console.log("mMG: y",select_year, "month_contr", monthly_contribution);
    const month_label = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const fs = 15;
    for(let col = 1; col <= 6; col++){
      let gr = document.createElementNS(NS, "g");
      for(let row = 1; row <=2; row++){
        let mIdx = (col-1)*2+row-1;
        let rect = document.createElementNS(NS,"rect");
        let ctb = monthly_contribution[mIdx]
        let level = monthly_contribution_level[mIdx];
        let mLabel = document.createElementNS(NS,"text");
        rect.setAttributeNS(null,"month", mIdx+1);
        rect.setAttributeNS(null,"raw", ctb);
        rect.setAttributeNS(null,"focus", 0);
        rect.setAttributeNS(null,"x", fs);
        rect.setAttributeNS(null,"y", (grass_size+fs)*row - fs*3);
        rect.setAttributeNS(null,"width", grass_size);
        rect.setAttributeNS(null,"height", grass_size);
        rect.setAttributeNS(null,"rx", "2");
        rect.setAttributeNS(null,"ry", "2");
        rect.setAttributeNS(null,"class", "ContributionMonth");
        rect.setAttributeNS(null,"data-level", level);
        mLabel.setAttributeNS(null, "x", fs);
        mLabel.setAttributeNS(null, "y", (grass_size+fs)*row - fs*3);
        mLabel.setAttributeNS(null, "font-family", "verdana");
        mLabel.setAttributeNS(null, "font-size", "15px");
        mLabel.style.fill = "black";
        mLabel.textContent = month_label[mIdx];
        switch(level){
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
          let focus = 1 - e.target.attributes[2].value;
          is_selected_month = focus;

          if(is_selected_month) {
            select_month = e.target.attributes[0].value;
            let month_elements = document.getElementsByClassName("ContributionMonth");
            for(let rect of month_elements){
              rect.setAttributeNS(null, "focus", 0);
              rect.removeAttribute("stroke");
              rect.removeAttribute("stroke-width");
            }
            showTooltip(e, String(e.target.attributes[0].value)+"월: "+e.target.attributes[1].value);
            e.target.setAttribute("stroke", "#fc2121");
            e.target.setAttribute("stroke-width", "2px");
          }
          else {
            select_month = 0;
            hideTooltip();
            e.target.removeAttribute("stroke");
            e.target.removeAttribute("stroke-width");
          }
          e.target.attributes[2].value = focus;
          updateFactor(factorLables, select_month);
        });
         gr.appendChild(rect);
         gr.appendChild(mLabel);
      }
      gr.setAttribute("transform", `translate(${(col-1)*(grass_size+fs)}, 0)`);
      gr.setAttribute("stroke", "#aaaaaa");
      div_activity_monthly.appendChild(gr);
    }
  }
  /* Grass for Factor */
  function makeFactorGrass(){
    console.log("mFG: y",select_year,"m",select_month,"ftr_contr", factor_contribution);
    const factor_label = ["COMMIT", "STAR", "PR", "ISSUE", "CR", "CO"];
    const fs = 15;
    for(let col = 0; col < 6; col++){
      let rect = document.createElementNS(NS,"rect");
      let ctb = factor_contribution[col];
      let level = factor_contribution_level[col];
      let fLabel = document.createElementNS(NS,"text");
      rect.setAttributeNS(null,"factor", factorLables[col]);
      rect.setAttributeNS(null,"raw", ctb);
      rect.setAttributeNS(null,"focus", 0);
      rect.setAttributeNS(null,"x", (col)*(grass_size+fs)+fs);
      rect.setAttributeNS(null,"y", fs);
      rect.setAttributeNS(null,"width", grass_size);
      rect.setAttributeNS(null,"height", grass_size);
      rect.setAttributeNS(null,"rx", "2");
      rect.setAttributeNS(null,"ry", "2");
      rect.setAttributeNS(null,"class", "ContributionFactor");
      rect.setAttributeNS(null,"data-level", level);
      fLabel.setAttributeNS(null, "x", (col)*(grass_size+fs)+fs);
      fLabel.setAttributeNS(null, "y", fs);
      fLabel.setAttributeNS(null, "font-family", "verdana");
      fLabel.setAttributeNS(null, "font-size", "15px");
      fLabel.style.fill = "black";
      fLabel.textContent = factor_label[col];
      switch(level){
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
        let focus = 1 - e.target.attributes[2].value;
        is_selected_factor = focus;
        if(is_selected_factor){
          chartFactor = (e.target.attributes[0].value).split("_")[0];
          let factor_elements = document.getElementsByClassName("ContributionFactor");
          for(let rect of factor_elements){
            rect.setAttributeNS(null, "focus", 0);
            rect.removeAttribute("stroke");
            rect.removeAttribute("stroke-width");
          }
          showTooltip(e, String(e.target.attributes[0].value)+": "+e.target.attributes[1].value);
          e.target.setAttribute("stroke", "#fc2121");
          e.target.setAttribute("stroke-width", "2px");
        }
        else {
          chartFactor = "score_sum";
          hideTooltip();
          e.target.removeAttribute("stroke");
          e.target.removeAttribute("stroke-width");
        }
        e.target.attributes[2].value = focus;
        destroyChart(chartObjList, chartObjList.length);
        chartObjList = [];
        makePage(chart_data);
      });
      factor_grass.appendChild(rect);
      factor_grass.appendChild(fLabel);
    }
    destroyChart(chartObjList, chartObjList.length);
    chartObjList = [];
    makePage(chart_data);
  }
  
  for(let i=0; i<3; i++){
    visual_ctx[i] = document.getElementById(`canvas${String(i+1)}`).getContext("2d");
  }
  function getNormalCoeff(value, label, is_work=1, goal=10){
    if(value == 0) return 1;
    if(is_work) return goal / value;
    else if(label == "commit") return 1/100;
    else return 1;
  }
  function makePage(chart_data){
    console.log("makePage");
    let student_data = JSON.parse(chart_data["user_data"])[select_year-start_year];
    console.log("student_data", student_data);
    let annual_data = chart_data["annual_overview"];
    console.log("annual_data", annual_data);
    let score_data = chart_data["score_data"];
    console.log("score_data", score_data);
    
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
    makeRadarChart(is_nomalization);
    
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
    console.log("chartFactor",chartFactor);
    let dist_dataset = makeHistogramJson(dist[chartFactor], factor_scope_label);
    let colorIdx = findDistIdx(factor_Xaxis_label, Number(student_data[chartFactor]));
    let paramColor = [];

    for(let i=0; i<factor_scope_label.length; i++){
      if(i != colorIdx) paramColor.push(baseColor);
      else paramColor.push(userColor);
    }

    let dist_chart = makeChart(visual_ctx[1], "bar", chartFactor, factor_Xaxis_label, dist_dataset, paramColor, factor_option);
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

  function makeRadarChart(is_nomalization=0){
    const annual_data = chart_data["annual_overview"];
    const student_data = JSON.parse(chart_data["user_data"])[select_year-start_year];
    const radar_labels = ["commits", "stars", "issues", "PRs"];
    const radar_label_keys = ["commit", "star", "issue", "pr"];
    const average_data = [];
    const coeffs = {};
    radar_label_keys.forEach((label)=>{
      let annual_value = annual_data[label][select_year-start_year];
      let coeff = getNormalCoeff(annual_value, label, is_nomalization);
      coeffs[label] = coeff;
      average_data.push(coeff * annual_data[label][select_year-start_year]);
    });
    const user_data = [];
    radar_label_keys.forEach((label)=>{
        user_data.push(coeffs[label] * student_data[label]);
    });

    console.log("average_data", average_data);
    console.log("user_data", user_data);
    
    const radarOption = {
      plugins: {
        legend: {
          display: false,
        },
      },
      responsive: true,
    };

    /* Chart 1: 레이더 차트 */
    if(chartObjList.length > 0){
      destroyChart(chartObjList, 1);
    }
    let radar_chart = new Chart(visual_ctx[0], {
        data: {
          labels: radar_labels,
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
    console.log("chartObjList", chartObjList);
    if (chartObjList.length > 0) chartObjList[0] = radar_chart;
    else chartObjList.push(radar_chart);
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

  function destroyChart(chart=[], size=0) {
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
    console.log("makeHistogramJson", label[0]);
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
    function showTooltip(evt, text) {
      let tooltip = document.getElementById("task-tooltip");
      tooltip.innerHTML = text;
      tooltip.setAttribute("display", "block");
      tooltip.style.display = "block";
      let scrollTop = document.getElementById("visualization").scrollTop
      tooltip.style.left = (evt.layerX - 20) + "px";
      tooltip.style.top = (evt.layerY - 50) + scrollTop + "px";
    }

    function hideTooltip() {
      var tooltip = document.getElementById("task-tooltip");
      tooltip.style.display = "none";
    }
    function toggleChart(){
      console.log("toggle");
    }
};
