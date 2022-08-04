function setVisualModal(){
  const start_year = 2019;
  const grass_size = 60;
  const NS = "http://www.w3.org/2000/svg";
  let year_intvl = end_year-start_year;
  let select_year = end_year;
  let select_month = 0;
  let chartFactor = "score_sum";
  let is_selected_month = 0;
  let is_nomalization = 0;
  const palette = ["#EBEDF0","#a7e6f6","#49c8fd","#00a4ff","#0677ff"];
  const factorLabels = ["score", "star", "commit", "pr", "issue", "repo"];
  let modal_ctx = new Array(4);
  for(let i=0; i<3; i++){
    modal_ctx[i] = document.getElementById(`modal-canvas${String(i+1)}`).getContext("2d");
  }
  let radar_chart = new Chart(modal_ctx[0]);
  let dist_chart = new Chart(modal_ctx[1]);
  let specific_score_chart = new Chart(modal_ctx[2]);
  let btn_year = document.getElementsByClassName("modal-btn-year");
  for (let btn of btn_year) {
    btn.addEventListener("click",function(){
      select_year = btn.innerText;
      $('.modal-btn-year.active').removeClass("active");
      this.className += " active";
      let start = new Date();
      updateMonthly(select_year);
      let end = new Date();
      console.log("updateMonthly elapsed time", end-start);
    });
  }
  let icon_modal = document.getElementById("icon-modal");
  icon_modal.addEventListener("click", (e)=>{
    $('#modalBox').modal('show');
  });
  // close modal
  document.getElementById("closeModalIcon").addEventListener("click", ()=>{
    $('#modalBox').modal("hide");
  })
  $(".modal-month-item").on("click", (e)=>{
    $("#modal-btnGroupDropMonth").text(e.target.innerText);
    select_month = Number(e.target.value);
    $("rect.modal-ContributionMonth").attr("focus", 0);
    $("rect.modal-ContributionMonth").removeAttr("stroke");
    $("rect.modal-ContributionMonth").removeAttr("stroke-width");
    $(".modal-grass-tooltip").remove();
    showTooltip(select_month);
    updateFactor(factorLabels, select_month);
    makePage(chart_data, 1);
  });
  $(".modal-factor-item").on("click", (e)=>{
    $("#modal-btnGroupDropFactor").text(e.target.innerText);
    chartFactor = (e.target.innerText).toLowerCase();
    if(chartFactor == "score"){
      chartFactor = "score_sum";
    }
    updateFactor(factorLabels, select_month);
    makePage(chart_data, 2);
  });
  $("#modal-btn-toggle").on("click", (e)=>{
    is_nomalization = 1 - is_nomalization;
    makeModalRadarChart(is_nomalization, select_month);
    if(is_nomalization){
      e.target.setAttribute("title","raw값을 표시합니다. 단, commit은 1/10 값입니다.");
      e.target.textContent = "raw 값";
    }
    else{
      e.target.setAttribute("title","평균을 10점으로 맞추어 자신의 점수를 비교하기 쉽게 만듭니다.");
      e.target.textContent = "정규화";
    }
  });
  $("#modal-btn-compare").on("click", function(){
    if(target_yearly_contr.length>0){
      target_monthly_contr = target_yearly_contr[select_year-start_year];
      updateFactor(factorLabels, select_month);
      makePage(chart_data, 1);
    }
  });
  const div_activity_monthly = document.getElementById("modal-activity-monthly");
  let monthly_contr = chart_data["monthly_contr"][select_year-start_year];

  let monthly_contribution = Array(12).fill(0);
  let monthly_contribution_level = Array(12).fill(0);
  let factor_contribution = Array(6).fill(0);
  let factor_contribution_level = Array(6).fill(0);
  let target_contribution = Array(6).fill(0);
  let target_contribution_level = Array(6).fill(0);
  
  let start = new Date();
  updateMonthly(select_year);
  makeModalSpecificScoreChart();
  let end = new Date();
  console.log("updateMonthly elapsed time", end-start);

  function updateMonthly(select_year){
    monthly_contr = chart_data["monthly_contr"][select_year-start_year];
    let dirty_month = Array(12).fill(0);
    for(let i=0; i<monthly_contr.length; i++){
      let total = monthly_contr[i]["total"];
      let mid = monthly_contr[i]['month']-1;
      dirty_month[mid] = 1;
      monthly_contribution[mid] = total;
      if(total<=30){
        monthly_contribution_level[mid] = Math.ceil(total / 10);
      }
      else {
        monthly_contribution_level[mid] = 4;
      }
    }
    dirty_month.forEach((dirty, idx) =>{
      if(!dirty) monthly_contribution_level[idx] = 0;
    });
    clearChildElement(div_activity_monthly);
    is_selected_month = 0;
    is_selected_factor = 0;
    makeMonthGrass();
    select_month = 0;
    updateFactor(factorLabels, select_month);
    makePage(chart_data, 0);
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
        if(month == monthly_contr[i]['month']) mid = i;
      }
      for(let i=0; i<target_monthly_contr.length;i++){
        if(month == target_monthly_contr[i]['month']) tid = i;
      }
      for(let j=0; j<factorLabels.length; j++){
        if(mid != -1) factor_contribution[j] = monthly_contr[mid][factorLabels[j]];
        else factor_contribution[j] = 0;
        if(tid != -1) target_contribution[j] = target_monthly_contr[tid][factorLabels[j]];
        else target_contribution[j] = 0;
      }
    }
    for(let i=0; i<factorLabels.length; i++){
      factor_contribution_level[i] = getDataLevel(factor_contribution[i], i, is_selected_month);
      target_contribution_level[i] = getDataLevel(target_contribution[i], i, is_selected_month);
    }
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
    $("#modal-grass-title").text(select_year + "년 오픈소스 활동");
    for(let col = 1; col <= 6; col++){
      let gr = document.createElementNS(NS, "g");
      for(let row = 0; row < 2; row++){
        let mIdx = (col-1)*2+row;
        let rect = document.createElementNS(NS,"rect");
        let ctb = monthly_contribution[mIdx]
        let level = monthly_contribution_level[mIdx];
        let mLabel = document.createElementNS(NS,"text");
        rect.setAttributeNS(null,"month", mIdx+1);
        rect.setAttributeNS(null,"raw", ctb);
        rect.setAttributeNS(null,"focus", 0);
        rect.setAttributeNS(null,"x", 1);
        rect.setAttributeNS(null,"y", (grass_size+2.5*fs)*row+1.5*fs);
        rect.setAttributeNS(null,"width", grass_size);
        rect.setAttributeNS(null,"height", grass_size);
        rect.setAttributeNS(null,"rx", "2");
        rect.setAttributeNS(null,"ry", "2");
        rect.setAttributeNS(null,"class", "modal-ContributionMonth");
        rect.setAttributeNS(null,"data-level", level);
        mLabel.setAttributeNS(null, "x", 1);
        mLabel.setAttributeNS(null, "y", (grass_size+2.5*fs)*row+fs);
        mLabel.setAttributeNS(null, "font-family", "IBMPlexSansKR-Regular");
        mLabel.setAttributeNS(null, "font-size", "15px");
        mLabel.style.strokeWidth = "0px";
        mLabel.textContent = month_label[mIdx];
        rect.style.fill = palette[level];
        if(monthly_contr.length>mIdx){
          rect.style.cursor = "pointer";
          rect.addEventListener("click",(e) =>{
            let focus = 1 - e.target.attributes[2].value;
            is_selected_month = focus;
            if(is_selected_month) {
              select_month = e.target.attributes[0].value;
              let month_elements = document.getElementsByClassName("modal-ContributionMonth");
              for(let rect of month_elements){
                rect.setAttributeNS(null, "focus", 0);
                rect.removeAttribute("stroke");
                rect.removeAttribute("stroke-width");
              }
              showTooltip(select_month);
              e.target.setAttribute("stroke", "#fc2121");
              e.target.setAttribute("stroke-width", "2px");
            }
            else {
              select_month = 0;
              $(".modal-grass-tooltip").remove();
              e.target.removeAttribute("stroke");
              e.target.removeAttribute("stroke-width");
            }
            e.target.attributes[2].value = focus;
            updateFactor(factorLabels, select_month);
            makePage(chart_data, 1);
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
  function getNormalCoeff(value, label, is_work=1, goal=10){
    if(value == 0) return 1;
    if(is_work) return goal / value;
    else if(label == "commit") return 1/10;
    else return 1;
  }
  function makePage(chart_data, render_id=0){
    let user_data_total = JSON.parse(chart_data["user_data"])[select_year-start_year];
    let user_data = {
      "score_sum": user_data_total["total_score"],
      "commit": user_data_total["commit_cnt"],
      "pr": user_data_total["pr_cnt"],
      "issue": user_data_total["issue_cnt"],
      "repo": user_data_total["repo_cnt"],
    }
    user_data["star"] = chart_data["own_star"]["star"];
    let annual_data = JSON.parse(chart_data["annual_overview"])[0];
    let dist_data = {
      "score_sum" : chart_data["score_dist"][select_year-start_year],
      "star" : chart_data["star_dist"][select_year-start_year],
      "commit" : chart_data["commit_dist"][select_year-start_year],
      "pr" : chart_data["pr_dist"][select_year-start_year],
      "issue" : chart_data["issue_dist"][select_year-start_year],
      "repo" : chart_data["repo_dist"][select_year-start_year]
    }
    dist_data["num"] = chart_data["score_dist"][select_year-start_year].length;
    if(dist_data["num"] == 0) dist_data["num"] = 1;
    if(render_id==0){
      makeModalRadarChart(is_nomalization, select_month);
      makeModalDistChart(annual_data, dist_data, user_data);
    }
    else if(render_id == 1) makeModalRadarChart(is_nomalization, select_month);
    else if(render_id == 2) makeModalDistChart(annual_data, dist_data, user_data);
  }
  function makeModalDistChart(annual_data, dist_data, user_data){
    /* Chart 2: 정규분포 확률밀도함수 */
    let mean = 0;
    let sigma = 1;
    const normal_dist_data = [];
    let dist_x= 0, dist_width, dist_text;
    if(chartFactor == "star") {
      mean= Number(chart_data["own_star"]["avg"]);
      sigma = Number(chart_data["own_star"]["std"]);
    }else{
      mean= Number(annual_data[chartFactor][select_year-start_year]);
      sigma = Number(annual_data[chartFactor+"_std"][select_year-start_year]);
    }
    if(isNaN(mean)) mean = 0;
    if(isNaN(sigma)) sigma = 1;
    const scaleFactor = 100;
    let s=100, beforeVal=-1;
    dist_data[chartFactor].reverse().forEach((val, idx)=>{
      if(beforeVal != Number(val).toFixed(3)){
        let x = (dist_data["num"] - idx)/dist_data["num"]*100;
        let y = gaussian(Number(val));
        normal_dist_data.push({x:(s+x)/2, y:y*scaleFactor, tooltip:Number(val).toFixed(3)});
        if(Number(user_data[chartFactor]).toFixed(3) === Number(val).toFixed(3)){
          dist_x = (s+x)/2;
          dist_text = String((100-dist_x).toFixed(2))+"%";
        }
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
    const clickableLines = {
      id: 'clickableLines',
      afterDatasetsDraw(chart, args, pluginOptions){
        for(let i = 0; i<chart._metasets[0].data.length; i++){
          let target = chart._metasets[0].data[i];
          let findX = target["$context"].raw.x;
          if(findX.toFixed(3) === dist_x.toFixed(3)){
            dist_width = target.x;
          }
        }
        const {ctx, chartArea: {top, bottom}} = chart;
        class Line {
          constructor(xCoor, text){
            this.width = xCoor;
            this.text = text;
          };
          draw(ctx){
            ctx.restore();
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.moveTo(this.width, top+2);
            ctx.lineTo(this.width, bottom);
            ctx.stroke();
            ctx.font = '12px Helvetica Neue, Helvetica, Arial, sans-serif';
            ctx.fillText(this.text, this.width-20, top)
            ctx.fillText("you", this.width-10, bottom+10)
            ctx.save();
          }
        }
        let drawLine = new Line(dist_width, dist_text);
        drawLine.draw(ctx);
      },
    };
    dist_chart.destroy()
    dist_chart = new Chart(modal_ctx[1], {
      type: 'scatter',
      data: { datasets: [{data:normal_dist_data}] },
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
      plugins: [clickableLines]
    });
    let histogram_title = String(select_year)+"년 "+chartFactor.split("_")[0].toUpperCase()+" 분포";
    $("#modal-histogram-title").text(histogram_title);
  }
  function newArrayRange(start, end, step=1, fix_point=0){
    let arr = [];
    for(let i=start; i<=end; i = i+step){
      arr.push(i.toFixed(fix_point));
    }
    return arr;
  }
  function makeModalSpecificScoreChart(){
    /* Chart 3: 세부 점수 그래프 */
    let score_data = chart_data["score_data"];
    const yearLabel = newArrayRange(start_year, end_year);
    const score_dataset= [];
    const specific_score_label = ["main_repo_score", "other_repo_score", "reputation_score"];
    const cc3 = ["#f7a6af", "#ffc38b", "#fff875"];
    for(let i = 0; i < specific_score_label.length; i++){
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
    specific_score_chart.destroy();
    specific_score_chart = new Chart(modal_ctx[2], {
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
  }
  function makeModalRadarChart(is_nomalization=0, month=0){
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
      avg_data = JSON.parse(chart_data["annual_overview"])[0];
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
    $("#modal-radar-title").text(radar_title);
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
    let target = $(".select-compare").find(".placeholder");
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
    /* Chart 1: 레이더 차트 */
    radar_chart.destroy();
    radar_chart = new Chart(modal_ctx[0], {
        data: {
          labels: radar_labels,
          datasets: radar_datasets,
        },
        options: radarOption,
      });
  }

  function showTooltip(select_month = 0){
    $(".modal-grass-tooltip").remove();
    if(select_month!=0){
      let rect_target = $(`rect.modal-ContributionMonth[month=${select_month}]`).first();
      rect_target.attr({"stroke":"#fc2121", "stroke-width":"2px", "focus":1});
      let rect_x = Number(rect_target.attr("x"));
      let rect_y = Number(rect_target.attr("y"));
      let mLabel = document.createElementNS(NS,"text");
      mLabel.textContent = String(rect_target.attr("month"))+"월: "+rect_target.attr("raw");
      let label_len = (mLabel.textContent).length;
      mLabel.setAttributeNS(null, "class", "modal-grass-tooltip");
      mLabel.setAttributeNS(null, "x", rect_x+(9-label_len)*1.5);
      mLabel.setAttributeNS(null, "y", rect_y + grass_size/2);
      mLabel.setAttributeNS(null, "font-family", "IBMPlexSansKR-Regular");
      mLabel.setAttributeNS(null, "font-size", "12px");
      mLabel.style.strokeWidth = "0px";
      let mBack = document.createElementNS(NS, "rect");
      mBack.setAttributeNS(null, "class", "modal-grass-tooltip");
      mBack.setAttributeNS(null, "x", rect_x+(9-label_len)*1.5);
      mBack.setAttributeNS(null, "y", rect_y-grass_size*3/4 + grass_size);
      mBack.setAttributeNS(null,"width", label_len*8);
      mBack.setAttributeNS(null,"height", grass_size/3+4);
      mBack.style.strokeWidth = "0px";
      mBack.style.fill ="white";
      let mPath = document.createElementNS(NS, "path");
      mPath.setAttributeNS(null, "class", "modal-grass-tooltip");
      mPath.setAttributeNS(null, "d", `M ${label_len*2.5} ${32+rect_y} l 10 14 10 -14 z`);
      mPath.style.strokeWidth = "0px";
      mPath.style.fill ="white";
      rect_target.parent().append(mBack);
      rect_target.parent().append(mPath);
      rect_target.parent().append(mLabel);
    }
  }
}
function setPortfolioModal(){
  let icon_portfolio_modal = document.getElementById("icon-portfolio");
  icon_portfolio_modal.addEventListener("click", ()=>{
    $('#modalPortfolioBox').modal('show');
  });
  document.getElementById("closePortfolioModalIcon").addEventListener("click", ()=>{
    $('#modalPortfolioBox').modal("hide");
  });
  document.getElementById("closePortfolioModalBtn").addEventListener("click", ()=>{
    $('#modalPortfolioBox').modal("hide");
  });
}
function setGbtiModal(){
  let icon_portfolio_modal = document.getElementById("icon-gbti");
  icon_portfolio_modal.addEventListener("click", ()=>{
    $('#modalGbtiBox').modal('show');
  });
  document.getElementById("closeGbtiModalIcon").addEventListener("click", ()=>{
    $('#modalGbtiBox').modal("hide");
  });
  document.getElementById("closeGbtiModalBtn").addEventListener("click", ()=>{
    $('#modalGbtiBox').modal("hide");
  });
  $("#btn-save-id-card").on("click", ()=>{
    const screenshotTarget = document.getElementById("gbti-id-card");
    html2canvas(screenshotTarget).then((canvas)=>{
      const base64image = canvas.toDataURL("image/png");
      var anchor = document.createElement('a');
      anchor.setAttribute("href", base64image);
      anchor.setAttribute("download", "my-image.png");
      anchor.click();
      anchor.remove();
    });
  });
  const main = document.querySelector('#main');
  const qna = document.querySelector('#qna');
  const result = document.querySelector('#result');
  const selection=[];
  const endPoint=15;
  const factor=[0,0,0,0];
  function getResult(){
      qna.style.WebkitAnimation = "fadeOut 0.5s";
      qna.style.animation = "fadeOut 0.5s";
      setTimeout(()=>{
          result.style.WebkitAnimation = "fadeIn 0.5s";
          result.style.animation = "fadeIn 0.5s"; 
          setTimeout(()=>{
              qna.style.display="none";
              result.style.display = "block";
          },200)
          for (let k = 0; k < endPoint; k++){
              if(qnaList[k].answer[selection[k]].factor.length>1){
                  if(qnaList[k].answer[selection[k]].factor[1]=='N') {
                      factor[2]+=qnaList[k].answer[selection[k]].val[1];
                  }
                  else if(qnaList[k].answer[selection[k]].factor[1]=='S') {
                      factor[2]-=qnaList[k].answer[selection[k]].val[1];
                  }
                  else if(qnaList[k].answer[selection[k]].factor[1]=='T') {
                      factor[1]+=qnaList[k].answer[selection[k]].val[1];
                  }
                  else if(qnaList[k].answer[selection[k]].factor[1]=='F') {
                      factor[1]-=qnaList[k].answer[selection[k]].val[1];
                  }
                  else if(qnaList[k].answer[selection[k]].factor[1]=='E') {
                      factor[3]+=qnaList[k].answer[selection[k]].val[1];
                  }
                  else if(qnaList[k].answer[selection[k]].factor[1]=='I') {
                      factor[3]-=qnaList[k].answer[selection[k]].val[1];
                  }
                  else if(qnaList[k].answer[selection[k]].factor[1]=='P') {
                      factor[0]+=qnaList[k].answer[selection[k]].val[1];
                  }
                  else if(qnaList[k].answer[selection[k]].factor[1]=='J') {
                      factor[0]-=qnaList[k].answer[selection[k]].val[1];
                  }
              }

              if(qnaList[k].answer[selection[k]].factor[0]=='N') {
                  factor[2]+=qnaList[k].answer[selection[k]].val[0];
              }
              else if(qnaList[k].answer[selection[k]].factor[0]=='S') {
                  factor[2]-=qnaList[k].answer[selection[k]].val[0];
              }
              else if(qnaList[k].answer[selection[k]].factor[0]=='T') {
                  factor[1]+=qnaList[k].answer[selection[k]].val[0];
              }
              else if(qnaList[k].answer[selection[k]].factor[0]=='F') {
                  factor[1]-=qnaList[k].answer[selection[k]].val[0];
              }
              else if(qnaList[k].answer[selection[k]].factor[0]=='E') {
                  factor[3]+=qnaList[k].answer[selection[k]].val[0];
              }
              else if(qnaList[k].answer[selection[k]].factor[0]=='I') {
                  factor[3]-=qnaList[k].answer[selection[k]].val[0];
              }
              else if(qnaList[k].answer[selection[k]].factor[0]=='P') {
                  factor[0]+=qnaList[k].answer[selection[k]].val[0];
              }
              else if(qnaList[k].answer[selection[k]].factor[0]=='J') {
                  factor[0]-=qnaList[k].answer[selection[k]].val[0];
              }
              
          }
          console.log(factor);
      }, 200);
      
  }
  function addA(aTxt,qIdx,idx){
      
      var abox = document.querySelector('.abox');
      var answer = document.createElement('div');
      answer.className = 'answerbtn';
      answer.classList.add('my-2');
      answer.classList.add('mx-auto');
      answer.classList.add('answerList');
      //answer.classList.add('fadeIn');
      abox.appendChild(answer);
      answer.innerHTML = aTxt;

      answer.addEventListener("click",function(){
          selection[qIdx] = idx;
          var children = document.querySelectorAll('.answerList');
          for (let k =0; k<children.length; k++){
              children[k].disabled = true;
              //children[k].style.WebkitAnimation = "fadeOut 0.3s";
              //children[k].style.animation = "fadeOut 0.3s";
              
              children[k].style.display = 'none';
          }
          /*setTimeout(()=>{
              for (let k =0; k<children.length; k++){
                  children[k].style.display = 'none';
              }
          },100)*/
          if(qIdx<endPoint-1) nextQ(++qIdx);
          else {
              getResult();
          }
          
      },false);

  }
  function nextQ(qIdx){
      var qbox = document.querySelector('.qbox');
      qbox.innerHTML = qnaList[qIdx].q;
      for (let k in qnaList[qIdx].answer){
          addA(qnaList[qIdx].answer[k].a,qIdx,k);
      }
      var status = document.querySelector('.statusBar');
      status.style.width= (100/endPoint) * qIdx + '%';
  }
  $("#gbti-test-start").on("click", ()=>{
    begin();
  });
  $("#gbti-test-restart").on("click", ()=>{
    begin();
  });
  function begin(){
      main.style.WebkitAnimation = "fadeOut 0.5s";
      main.style.animation = "fadeOut 0.5s";
      setTimeout(()=>{
          qna.style.WebkitAnimation = "fadeIn 0.5s";
          qna.style.animation = "fadeIn 0.5s"; 
          setTimeout(()=>{
              main.style.display="none";
              qna.style.display = "block";
          },200)
          let qIdx=0;
          nextQ(qIdx);
      }, 200);
  }
}
