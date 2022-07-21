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
  const palette = ["#EBEDF0","#a7e6f6","#49c8fd","#00a4ff","#0677ff"];
  const factorLabels = ["star", "commit", "pr", "issue", "repo_cr", "repo_co"];
  let visual_ctx = new Array(4);
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
  let chart_navs = document.getElementsByClassName("nav-link");
  for (let nav of chart_navs) {
    nav.addEventListener("click",function(e){
      $('.nav-link.active').removeClass("active");
      this.className += " active";
      let nav_id = e.target.attributes.id.value;
      let pane_id = nav_id.split("-tab")[0];
      let chart_pane = $('#'+pane_id);
      before_pane = $('.tab-pane.show.active')
      before_pane.removeClass("active");
      before_pane.removeClass("show");
      chart_pane.addClass("active");
      chart_pane.addClass("show");
    });
  }
  $(".year-item").on("click", (e)=>{
    $("#btnGroupDropYear").text(e.target.innerText);
    select_year = e.target.innerText;
    updateMonthly(select_year);
  });
  $(".month-item").on("click", (e)=>{
    $("#btnGroupDropMonth").text(e.target.innerText);
    select_month = Number(e.target.value);
    $("rect.ContributionMonth").removeAttr("stroke");
    $("rect.ContributionMonth").removeAttr("stroke-width");
    $(`rect.ContributionMonth[month=${select_month}]`).attr({"stroke":"#fc2121", "stroke-width":"2px"});
    hideTooltip();
    updateFactor(factorLabels, select_month);
  });
  $(".factor-item").on("click", (e)=>{
    $("#btnGroupDropFactor").text(e.target.innerText);
    chartFactor = (e.target.innerText).toLowerCase();
    if(chartFactor == "score"){
      chartFactor = "score_sum";
    }
    $("rect.ContributionFactor").attr("focus", 0);
    $("rect.ContributionFactor").removeAttr("stroke");
    $("rect.ContributionFactor").removeAttr("stroke-width");
    hideTooltip();
    updateFactor(factorLabels, select_month);
    $(`rect.ContributionFactor[factor="${chartFactor}"]`).attr({"stroke":"#fc2121", "stroke-width":"2px"});
  });
  $("#btn-toggle").on("click", (e)=>{
    is_nomalization = 1 - is_nomalization;
    makeRadarChart(is_nomalization, select_month);
    if(is_nomalization){
      e.target.setAttribute("title","raw값을 표시합니다. 단, commit은 1/10 값입니다.");
      e.target.textContent = "raw 값";
    }
    else{
      e.target.setAttribute("title","평균을 10점으로 맞추어 자신의 점수를 비교하기 쉽게 만듭니다.");
      e.target.textContent = "정규화";
    }
  });
  $("#btn-compare").on("click", function(){
    if(target_yearly_contr.length>0){
      target_monthly_contr = target_yearly_contr[select_year-start_year];
    }
    updateMonthly(select_year);
  });
  $("#icon-interests").on("click", function(){
    $(".expandable:nth-child(2)").toggleClass("semi-expanded-0");
    $(".expandable:nth-child(3)").toggleClass("semi-expanded-1");
    $(".expandable:nth-child(1)").toggleClass("expanded");
  })
  $("#icon-lang").on("click", function(){
    $(".expandable:nth-child(1)").toggleClass("semi-expanded-0");
    $(".expandable:nth-child(3)").toggleClass("semi-expanded-2");
    $(".expandable:nth-child(2)").toggleClass("expanded");
  })
  const div_activity_monthly = document.getElementById("activity-monthly");
  let factor_grass = document.getElementById("factor-grass");
  let monthly_contr = chart_data["monthly_contr"][select_year-start_year];

  let monthly_contribution = Array(12).fill(0);
  let monthly_contribution_level = Array(12).fill(0);
  let factor_contribution = Array(6).fill(0);
  let factor_contribution_level = Array(6).fill(0);
  let target_contribution = Array(6).fill(0);
  let target_contribution_level = Array(6).fill(0);
  
  let start = new Date();
  updateMonthly(select_year);
  let end = new Date();
  console.log("updateMonthly elapsed time", end-start);

  function updateMonthly(select_year){
    
    monthly_contr = chart_data["monthly_contr"][select_year-start_year];
    for(let i=0; i<monthly_contr.length; i++){
      let total = monthly_contr[i]["total"];
      let mid = monthly_contr[i]['month']-1;
      monthly_contribution[mid] = total;
      if(total<=30){
        monthly_contribution_level[mid] = Math.ceil(total / 10);
      }
      else {
        monthly_contribution_level[mid] = 4;
      }
    }
    
    clearChildElement(div_activity_monthly);
    is_selected_month = 0;
    is_selected_factor = 0;
    hideTooltip();
    makeMonthGrass();
    select_month = 0;
    updateFactor(factorLabels, select_month);
  }
  function clearChildElement(element){
    let child = element.lastElementChild;
    while(child){
      element.removeChild(child);
      child = element.lastElementChild;
    }
  }
  function updateFactor(factorLabels, month=0) { 
    if(target_yearly_contr.length > 0)
      target_monthly_contr = target_yearly_contr[select_year-start_year];
    console.log("updateFactor", target_monthly_contr);
    if(month == 0){
      //initialize
      for(let i=0; i<factorLabels.length; i++) {
        factor_contribution[i] = 0;
        target_contribution[i] = 0;
      }
      for(let j=0; j<factorLabels.length; j++) {
        for(let i=0; i<monthly_contr.length; i++){
          factor_contribution[j] += monthly_contr[i][factorLabels[j]];
        }
        if(factorLabels[j] == "star" && monthly_contr.length > 0){
          factor_contribution[j] = monthly_contr[0][factorLabels[j]];
        }
        for(let i=0; i<target_monthly_contr.length; i++){
          target_contribution[j] += target_monthly_contr[i][factorLabels[j]];
        }
        if(factorLabels[j] == "star" && target_monthly_contr.length > 0){
          target_contribution[j] = target_monthly_contr[0][factorLabels[j]];
        }
      }
    }
    else{
      let mid = -1;
      let tid = -1;
      for(let i=0; i<monthly_contr.length;i++){
        if(month == monthly_contr[i]['month']){
          mid = i;
        }
      }
      for(let i=0; i<target_monthly_contr.length;i++){
        if(month == target_monthly_contr[i]['month']){
          tid = i;
        }
      }
      for(let j=0; j<factorLabels.length; j++){
        if(mid != -1){
          factor_contribution[j] = monthly_contr[mid][factorLabels[j]];
        }
        else{
          factor_contribution[j] = 0;
        }
        if(tid != -1){
          target_contribution[j] = target_monthly_contr[tid][factorLabels[j]];
        }else{
          target_contribution[j] = 0;
        }
      }
    }
    for(let i=0; i<factorLabels.length; i++){
      factor_contribution_level[i] = getDataLevel(factor_contribution[i], i, is_selected_month);
      target_contribution_level[i] = getDataLevel(target_contribution[i], i, is_selected_month);
    }
    clearChildElement(factor_grass);
    makeFactorGrass();
  }
  
  function getDataLevel(value, type, isMonthly=true){
    let level = 0;
    if (isMonthly) {
      if (type === 1) level = Math.ceil(value / 25);
      else if (type === 0)  level = Math.ceil(value / 2);
      else if (type === 2)  level = Math.ceil(value / 3);
      else level = Math.ceil(value / 2);
    }
    else {
      if (type === 1) level = Math.ceil(value / 100);
      else if (type === 0)  level = Math.ceil(value / 2);
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
        rect.style.fill = palette[level];
        if(monthly_contr.length>mIdx){
          rect.style.cursor = "pointer";
          rect.addEventListener("click",(e) =>{
            let focus = 1 - e.target.attributes[2].value;
            is_selected_month = focus;
            chartFactor="score_sum";
            $("#btnGroupDropFactor").text("Score");

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
            $("#btnGroupDropMonth").text($(`.month-item[value=${select_month}]`).text());
            e.target.attributes[2].value = focus;
            updateFactor(factorLabels, select_month);
          });
        }
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
    const factor_label = ["STAR", "COMMIT", "PR", "ISSUE", "CR", "CO"];
    const fs = 15;
    for(let col = 0; col < 6; col++){
      let rect = document.createElementNS(NS,"rect");
      let ctb = factor_contribution[col];
      let level = factor_contribution_level[col];
      let fLabel = document.createElementNS(NS,"text");
      rect.setAttributeNS(null,"factor", factorLabels[col]);
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
      rect.style.fill = palette[level];
      
      rect.style.cursor = "pointer";
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
        let textFactor = $(`.factor-item[value=${chartFactor}]`).text()
        if(textFactor == '') textFactor = "Score"
        $("#btnGroupDropFactor").text(textFactor);
        if(factor_label[col].toLowerCase() != factorLabels[col]){
          chartFactor = "score_sum";
        }
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
  function getNormalCoeff(value, label, is_work=1, goal=10){
    if(value == 0) return 1;
    if(is_work) return goal / value;
    else if(label == "commit") return 1/10;
    else return 1;
  }
  function makePage(chart_data){
    console.log("makePage");
    let user_data = JSON.parse(chart_data["user_data"])[select_year-start_year];
    let annual_data = chart_data["annual_overview"][0];
    let score_data = chart_data["score_data"];
    let dist_data = {
      "score_sum" : chart_data["score_dist"][select_year-start_year],
      "star" : chart_data["star_dist"][select_year-start_year],
      "commit" : chart_data["commit_dist"][select_year-start_year],
      "pr" : chart_data["pr_dist"][select_year-start_year],
      "issue" : chart_data["issue_dist"][select_year-start_year],
      "fork" : chart_data["fork_dist"][select_year-start_year]
    }
    dist_data["num"] = chart_data["score_dist"][select_year-start_year].length;
    if(dist_data["num"] == 0) dist_data["num"] = 1;
    
    const baseColor = "#174adf";
    const userColor = "#ffe522";
    makeRadarChart(is_nomalization, select_month);
    let mean = 0;
    let sigma = 1;
    /* Chart 2: 분포도 히스토그램 */
    var data = [];
    if(chartFactor == "star") {
      mean= Number(chart_data["own_star"]["avg"]);
      sigma = Number(chart_data["own_star"]["std"]);
    }else{
      mean= Number(annual_data[chartFactor][select_year-start_year]);
      sigma = Number(annual_data[chartFactor+"_std"][select_year-start_year]);
      console.log("ms", mean, sigma);
    }
    if(isNaN(mean)) mean = 0;
    if(isNaN(sigma)) sigma = 1;
    var scaleFactor = 100;
    let s=100, beforeVal=-1;
    dist_data[chartFactor].reverse().forEach((val, idx)=>{
      if(beforeVal != Number(val).toFixed(3)){
        let x = (dist_data["num"] - idx)/dist_data["num"]*100;
        let y = gaussian(Number(val));
        data.push({x:(s+x)/2, y:y*scaleFactor, tooltip:Number(val).toFixed(3)});
        beforeVal = Number(val).toFixed(3);
        s=x;
      }
    });
    dist_data[chartFactor].reverse();
    function gaussian(x) {
      // 확률밀도함수
      let gaussianConstant = 1 / Math.sqrt(2 * Math.PI);
      x = (x - mean) / sigma;
      return gaussianConstant * Math.exp(-.5 * x * x) / sigma;
    };
    var dist_chart = new Chart(visual_ctx[1], {
      type: 'scatter',
      data: { datasets: [{data:data}] },
      options:{
        elements:{
          point:{radius:2, borderColor: "rgba(0, 148, 255, 1)",backgroundColor:"rgba(0, 148, 255, 1)"}
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                return String((100-items[0].raw.x).toFixed(2))+"%";
              },
              label: (item) => {
                return String(parseFloat(item.raw.tooltip));
              },
            },
          },
        },
      },
    });
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

    let dist = JSON.parse(chart_data[`year${select_year}`])[0];
    if(typeof(dist[chartFactor]) =="undefined"){
      chartFactor = "score_sum";
    }
    console.log("chartFactor",chartFactor);
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
    let dist_dataset = makeHistogramJson(dist[chartFactor], factor_scope_label);
    let colorIdx = findDistIdx(factor_Xaxis_label, Number(user_data[chartFactor]));
    let paramColor = [];

    for(let i=0; i<factor_scope_label.length; i++){
      if(i != colorIdx) paramColor.push(baseColor);
      else paramColor.push(userColor);
    }

    // let dist_chart = makeChart(visual_ctx[1], "bar", chartFactor, factor_Xaxis_label, dist_dataset, paramColor, factor_option);
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

  function makeRadarChart(is_nomalization=0, month=0){
    const radar_labels = ["commits", "stars", "issues", "PRs"];
    const radar_label_keys = ["commit", "star", "issue", "pr"];
    const average_data = [];
    const coeffs = {};
    const user_dataset = [];
    const target_dataset = [];
    let avg_data = {};
    let user_data = {};
    let target_data = {};
    if(month == 0){
      avg_data = chart_data["annual_overview"][0];
      avg_data['star'] = chart_data['own_star']['avg'];
      factorLabels.forEach((label)=>{
        if(Array.isArray(avg_data[label])){
          avg_data[label] = avg_data[label][select_year-start_year];
        }
      });
      factorLabels.forEach((label, idx)=>{
        user_data[label] = factor_contribution[idx];
        target_data[label] = target_contribution[idx];
      })
    }else{
      avg_data = chart_data["monthly_avg"][select_year-start_year][month-1];
      avg_data['star'] = chart_data['own_star']['avg'];
      factorLabels.forEach((label, idx)=>{
        user_data[label] = factor_contribution[idx];
        target_data[label] = target_contribution[idx];
      });
    }

    radar_label_keys.forEach((label)=>{
      let factor_value = avg_data[label];
      let coeff = getNormalCoeff(factor_value, label, is_nomalization);
      coeffs[label] = coeff;
      average_data.push(coeff * factor_value);
    });
    
    radar_label_keys.forEach((label)=>{
      user_dataset.push(coeffs[label] * user_data[label]);
      target_dataset.push(coeffs[label] * target_data[label]);
    });
    
    let radar_title = select_year + "년 " + month + "월 기여도 비교";
    if(month == 0) radar_title = select_year + "년 기여도 비교";
    if(is_nomalization) radar_title = radar_title + "(정규화)";
    $("#radar-title").text(radar_title);
    const radarOption = {
      plugins: {
        legend: { display: false },
      },
      responsive: true,
    };
    const radar_datasets = [];
    radar_datasets.push({ // 전체 평균
              type: "radar",
              label: "average",
              data: average_data,
              backgroundColor: "rgba(0, 0, 200, 0.3)",
              hoverBackgroundColor: "rgba(0, 0, 200, 0.9)",
              borderColor: "rgba(0, 0, 200, 0.5)",
              hoverBorderColor: "rgba(0, 0, 200, 1)",
              borderWidth: 1,
            });
    radar_datasets.push({ // 유저
              type: "radar",
              label: chart_data['username'],
              data: user_dataset,
              backgroundColor: "rgba(200, 0, 0, 0.3)",
              hoverBackgroundColor: "rgba(200, 0, 0, 0.9)",
              borderColor: "rgba(200, 0, 0, 0.5)",
              hoverBorderColor: "rgba(200, 0, 0, 1)",
              borderWidth: 1,
            });
    let target = $("#target-search").find(".placeholder");
    if(target.text() != chart_data["username"] && 
    target.text() != "비교없음"){
      radar_datasets.push({ // 비교 유저
              type: "radar",
              label: target.text(),
              data: target_dataset,
              backgroundColor: "rgba(0, 200, 0, 0.3)",
              hoverBackgroundColor: "rgba(0, 200, 0, 0.9)",
              borderColor: "rgba(0, 200, 0, 0.5)",
              hoverBorderColor: "rgba(0, 200, 0, 1)",
              borderWidth: 1,
            });
    }
    radar_datasets.sort((d1, d2)=>{
      let sum1 = 0;
      let sum2 = 0;
      d1['data'].forEach((ele)=>{
        sum1 += ele
      });
      d2['data'].forEach((ele)=>{
        sum2 += ele
      });
      return (sum1 - sum2);
    })
    console.log("radar_datasets", radar_datasets);

    /* Chart 1: 레이더 차트 */
    if(chartObjList.length > 0){
      destroyChart(chartObjList, 1);
    }
    let radar_chart = new Chart(visual_ctx[0], {
        data: {
          labels: radar_labels,
          datasets: radar_datasets,
        },
        options: radarOption,
      });
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
    let histogram_title = String(select_year)+"년 "+chartFactor.split("_")[0].toUpperCase()+" 분포";
    $("#histogram-title").text(histogram_title);
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
    let scrollLeft = document.getElementById("visualization").scrollLeft
    tooltip.style.left = (evt.layerX - 20) + scrollLeft + "px";
    tooltip.style.top = (evt.layerY - 50) + scrollTop + "px";
  }

  function hideTooltip() {
    let tooltip = document.getElementById("task-tooltip");
    tooltip.style.display = "none";
  }
  setVisualModal();
  setPortfolioModal();
  let sideHeight = 0;
  const sideCol = document.getElementById("profile-info");
  for(let i=0; i<sideCol.children.length;i++){
    sideHeight += sideCol.children[i].getBoundingClientRect().height;
  }
  const article = document.getElementById("body-content");
  window.addEventListener("scroll", function() {
    let bodyHeight = 0;
    let contents = document.getElementsByClassName("profile-content");
    for(let i=0; i<contents.length; i++){
      let ele = contents.item(i);
      bodyHeight += ele.getBoundingClientRect().height;
    }
    mt = document.documentElement.scrollTop-article.offsetTop;
    sideCol.style.marginTop = mt+'px';
    if(mt+sideHeight > bodyHeight){
      mt = Math.floor(bodyHeight - sideHeight + 16);
      sideCol.style.marginTop = mt+'px';
    }
    if(mt<0 || document.documentElement.scrollTop == 0) sideCol.style.marginTop = '0px';
  });
};
