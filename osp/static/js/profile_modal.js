function setVisualModal() {
  const start_year = 2019;
  const grass_size = 66;
  const standard_contr = 30;
  const NS = "http://www.w3.org/2000/svg";
  let year_intvl = end_year - start_year;
  let select_year = end_year;
  let select_month = 0;
  let chartFactor = "score";
  let is_selected_month = 0;
  let is_nomalization = 0;
  const cssDecl = getComputedStyle(document.documentElement);
  const palette = getPalette(cssDecl);

  const factorLabels = ["score", "star", "commit", "pr", "issue", "repo"];

  const modal_ctx = []; // 4 ctx
  for (let i = 0; i <= 3; i++) modal_ctx.push(document.getElementById('modal-canvas' + i).getContext("2d"));

  let pie_chart = new Chart(modal_ctx[0]);
  let radar_chart = new Chart(modal_ctx[1]);
  let dist_chart = new Chart(modal_ctx[2]);
  let specific_score_chart = new Chart(modal_ctx[3]);

  setYearBtn();
  setMonthDropdown();
  setFactorDropdown();
  setRadarToggleBtn();
  setRadarCompareBtn();

  let icon_modal = document.getElementById("icon-modal");
  icon_modal.addEventListener("click", (e) => {
    $('#modalBox').modal('show');
  });

  const div_activity_monthly = document.getElementById("modal-activity-monthly");
  let monthly_contr = chart_data["monthly_contr"][select_year - start_year];

  let monthly_contribution = Array(12).fill(0);
  let monthly_contribution_level = Array(12).fill(0);
  let factor_contribution = Array(6).fill(0);
  let target_contribution = Array(6).fill(0);

  updateMonthly(select_year);
  makeModalSpecificScoreChart();

  function updateMonthly(select_year) {
    monthly_contr = chart_data["monthly_contr"][select_year - start_year];
    let dirty_month = Array(12).fill(0);
    for (let i = 0; i < monthly_contr.length; i++) {
      let total = monthly_contr[i]["total"];
      let mid = monthly_contr[i]['month'] - 1;
      dirty_month[mid] = 1;
      monthly_contribution[mid] = total;
      if (total <= standard_contr) {
        let divisor = standard_contr / 3;
        monthly_contribution_level[mid] = Math.ceil(total / divisor);
      }
      else {
        monthly_contribution_level[mid] = 4;
      }
    }
    let cur_date = new Date();
    let month = cur_date.getMonth(); // month - 1
    dirty_month.forEach((dirty, idx) => {
      if (!dirty) {
        if (select_year === cur_date.getFullYear() && idx < month) monthly_contribution_level[idx] = 0;
        else monthly_contribution_level[idx] = 5;
      }
    });
    clearChildElement(div_activity_monthly);
    is_selected_month = 0;
    is_selected_factor = 0;
    makeMonthGrass();
    select_month = 0;
    updateFactor(factorLabels, select_month);
    makePage(chart_data, 0);
  }
  function clearChildElement(element) {
    let child = element.lastElementChild;
    while (child) {
      element.removeChild(child);
      child = element.lastElementChild;
    }
  }
  function updateFactor(factorLabels, month = 0) {
    if (target_yearly_contr.length > 0)
      target_monthly_contr = target_yearly_contr[select_year - start_year];
    if (month === 0) {
      //initialize
      for (let i = 0; i < factorLabels.length; i++) {
        factor_contribution[i] = 0;
        target_contribution[i] = 0;
      }
      for (let j = 0; j < factorLabels.length; j++) {
        for (let i = 0; i < monthly_contr.length; i++) {
          factor_contribution[j] += monthly_contr[i][factorLabels[j]];
        }
        if (factorLabels[j] === "star" && monthly_contr.length > 0) {
          factor_contribution[j] = monthly_contr[0][factorLabels[j]];
        }
        for (let i = 0; i < target_monthly_contr.length; i++) {
          target_contribution[j] += target_monthly_contr[i][factorLabels[j]];
        }
        if (factorLabels[j] === "star" && target_monthly_contr.length > 0) {
          target_contribution[j] = target_monthly_contr[0][factorLabels[j]];
        }
      }
    }
    else {
      let mid = -1;
      let tid = -1;
      for (let i = 0; i < monthly_contr.length; i++) {
        if (month === monthly_contr[i]['month']) mid = i;
      }
      for (let i = 0; i < target_monthly_contr.length; i++) {
        if (month === target_monthly_contr[i]['month']) tid = i;
      }
      for (let j = 0; j < factorLabels.length; j++) {
        if (mid !== -1) factor_contribution[j] = monthly_contr[mid][factorLabels[j]];
        else factor_contribution[j] = 0;
        if (tid !== -1) target_contribution[j] = target_monthly_contr[tid][factorLabels[j]];
        else target_contribution[j] = 0;
      }
    }
  }

  /** 연도에 따라 월별 잔디 차트를 렌더링하는 함수 */
  function makeMonthGrass() {
    const month_label = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const fs = 15;
    $("#modal-grass-title").text(select_year + "년 오픈소스 활동");
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 6; col++) {
        let mIdx = row * 6 + col;
        let rect = document.createElementNS(NS, "rect");
        let ctb = monthly_contribution[mIdx]
        let level = monthly_contribution_level[mIdx];
        rect.setAttributeNS(null, "month", mIdx + 1);
        rect.setAttributeNS(null, "raw", ctb);
        rect.setAttributeNS(null, "focus", 0);
        rect.setAttributeNS(null, "x", (grass_size) * col + 1.5 * fs);
        rect.setAttributeNS(null, "y", (grass_size) * row + 1.5 * fs);
        rect.setAttributeNS(null, "width", grass_size);
        rect.setAttributeNS(null, "height", grass_size);
        rect.setAttributeNS(null, "rx", "50");
        rect.setAttributeNS(null, "ry", "50");
        rect.setAttributeNS(null, "class", "modal-contrib");
        rect.setAttributeNS(null, "data-level", level);
        rect.setAttributeNS(null, "stroke-width", "0");
        rect.style.fill = palette.levels[level];

        let mLabel = document.createElementNS(NS, "g");
        mLabel.setAttributeNS(null, "transform", `translate(${(grass_size) * col + 1.5 * fs}, ${(grass_size) * row + 1.5 * fs})`);
        mLabel_text = month_label[mIdx].split("");
        for (let i = 0; i < mLabel_text.length; i++) {
          let mText = document.createElementNS(NS, "text");
          mText.textContent = mLabel_text[i];
          mText.setAttributeNS(null, "x", i * 13 - 20);
          mText.setAttributeNS(null, "y", 12);
          mText.setAttributeNS(null, "transform", `rotate(${-60 + 12 * i})`);
          mText.style.fontSize = "12px";
          if (level === 5) mText.style.fill = palette.inactive;
          else {
            mText.style.fill = palette.active;
            mText.style.fontWeight = "bold";
          }
          mLabel.appendChild(mText);
        }
        if (level !== 5) {
          rect.style.cursor = "pointer";
          rect.addEventListener("click", (e) => {
            let focus = 1 - e.target.attributes[2].value;
            is_selected_month = focus;
            if (is_selected_month) {
              select_month = e.target.attributes[0].value;
              let month_elements = document.getElementsByClassName("modal-contrib");
              for (let rect of month_elements) {
                rect.setAttributeNS(null, "focus", 0);
                rect.removeAttribute("stroke");
                rect.removeAttribute("stroke-width");
              }
              $("#modal-btnGroupDropMonth").text(month_label[select_month - 1]);
              showTooltip(select_month);
              e.target.setAttribute("stroke", cssDecl.getPropertyValue('--data-line'));
              e.target.setAttribute("stroke-width", "2px");
            }
            else {
              select_month = 0;
              $("#modal-btnGroupDropMonth").text("ALL");
              $(".modal-grass-tooltip").remove();
              e.target.removeAttribute("stroke");
              e.target.removeAttribute("stroke-width");
            }
            $("#btnGroupDropMonth").text($(`.month-item[value=${select_month}]`).text());
            e.target.attributes[2].value = focus;
            updateFactor(factorLabels, select_month);
            makePage(chart_data, 1);
          });
        }
        div_activity_monthly.appendChild(rect);
        div_activity_monthly.appendChild(mLabel);
      }
    }
    pie_chart.destroy();
    const pie_label = [];
    let divisor = 0
    for (; divisor <= standard_contr; divisor = Math.floor(divisor + standard_contr / 3)) {
      if (divisor === 0) pie_label.push("0");
      else pie_label.push(String(Math.ceil(divisor - standard_contr / 3 + 1)) + "~" + String(divisor));
    }
    pie_label.push(String(Math.ceil(divisor - standard_contr / 3 + 1) + " 이상"));
    const pie_dataset = Array(6).fill(0);
    let active_grass = 0;
    monthly_contribution_level.forEach((val) => {
      if (val <= 4) {
        pie_dataset[val]++;
        active_grass++;
      }
    });
    if (active_grass === 0) {
      monthly_contribution_level.forEach((val) => {
        pie_dataset[val]++;
        active_grass++;
      });
    }
    console.log("pie_dataset", pie_dataset);
    const pie_data = {
      labels: pie_label,
      datasets: [{
        data: pie_dataset,
        backgroundColor: palette.levels,
        hoverOffset: 4
      }]
    };
    pie_chart = new Chart(modal_ctx[0], {
      type: 'pie', data: pie_data,
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => {
                return `${item.label}: ${item.raw} (${(item.raw * 100 / active_grass).toFixed(1)}%)`;
              },
            },
          },
          datalabels: {
            anchor: (context) => {
              return 'center';
            },
            color: "black",
            font: {
              family: 'IBMPlexSansKR-Regular',
            },
            formatter: (value, context) => {
              const datasetArray = context.dataset.data;
              if (datasetArray[context.dataIndex] > 0)
                return (datasetArray[context.dataIndex] * 100 / active_grass).toFixed(1) + "%";
              else return '';
            }
          },
        },
        responsive: true,
      },
      plugins: [ChartDataLabels],
    });
  }

  function getNormalCoeff(value, label, is_work = 1, goal = 10) {
    if (value === 0) return 1;
    if (is_work) return goal / value;
    else if (label === "commit") return 1 / 10;
    else return 1;
  }
  function makePage(chart_data, render_id = 0) {
    let user_data_total = JSON.parse(chart_data["user_data"])[select_year - start_year];
    let user_data = {
      "score": user_data_total["total_score"],
      "commit": user_data_total["commit_cnt"],
      "pr": user_data_total["pr_cnt"],
      "issue": user_data_total["issue_cnt"],
      "repo": user_data_total["repo_cnt"],
    }
    user_data["star"] = chart_data["own_star"]["star"];
    let annual_data = JSON.parse(chart_data["annual_overview"])[0];
    let dist_data = {
      "score": chart_data["score_dist"][select_year - start_year],
      "star": chart_data["star_dist"][select_year - start_year],
      "commit": chart_data["commit_dist"][select_year - start_year],
      "pr": chart_data["pr_dist"][select_year - start_year],
      "issue": chart_data["issue_dist"][select_year - start_year],
      "repo": chart_data["repo_dist"][select_year - start_year]
    }
    dist_data["num"] = chart_data["score_dist"][select_year - start_year].length;
    if (dist_data["num"] === 0) dist_data["num"] = 1;
    if (render_id === 0) {
      makeModalRadarChart(is_nomalization, select_month);
      makeModalDistChart(annual_data, dist_data, user_data);
    }
    else if (render_id === 1) makeModalRadarChart(is_nomalization, select_month);
    else if (render_id === 2) makeModalDistChart(annual_data, dist_data, user_data);
  }

  /** 차트 모달의 정규분포 Scatter 차트 렌더링 함수 */
  function makeModalDistChart(annual_data, dist_data, user_data) {
    let mean = 0;
    let sigma = 1;
    const normal_dist_data = [];
    let dist_x = 0, dist_width, dist_text;
    if (chartFactor === "star") {
      mean = Number(chart_data["own_star"]["avg"]);
      sigma = Number(chart_data["own_star"]["std"]);
    } else {
      mean = Number(annual_data[chartFactor][select_year - start_year]);
      sigma = Number(annual_data[chartFactor + "_std"][select_year - start_year]);
    }
    if (isNaN(mean)) mean = 0;
    if (isNaN(sigma)) sigma = 1;
    let s = 100, beforeVal = -1;
    let p = 0, percentage = "", fixIdx = 0;
    if (chartFactor === "score") fixIdx = 3;
    dist_data[chartFactor].reverse().forEach((val, idx) => {
      if (beforeVal !== Number(val).toFixed(fixIdx)) {
        let x = (dist_data["num"] - idx) / dist_data["num"] * 100;
        let y = gaussian(Number(val));
        normal_dist_data.push({ x: val, y: y, tooltip: Number(val).toFixed(fixIdx) });
        if (Number(user_data[chartFactor]).toFixed(fixIdx) === Number(val).toFixed(fixIdx)) {
          dist_x = val;
          p = (s + x) / 2;
          percentage = "(" + String((100 - p).toFixed(2)) + "%)";
          dist_text = String(val.toFixed(fixIdx)) + percentage;
        }
        beforeVal = Number(val).toFixed(fixIdx);
        s = x;
      }
    });
    dist_data[chartFactor].reverse();
    /** 확률밀도함수 */
    function gaussian(x) {
      let gaussianConstant = 1 / Math.sqrt(2 * Math.PI);
      x = (x - mean) / sigma;
      return gaussianConstant * Math.exp(-.5 * x * x) / sigma;
    };
    let dist_line_color = cssDecl.getPropertyValue('--data-line');
    const clickableLines = {
      id: 'clickableLines',
      afterDatasetsDraw(chart, args, pluginOptions) {
        for (let i = 0; i < chart._metasets[0].data.length; i++) {
          let target = chart._metasets[0].data[i];
          let findX = target["$context"].raw.x;
          if (findX.toFixed(fixIdx) === dist_x.toFixed(fixIdx)) {
            dist_width = target.x;
          }
        }
        const { ctx, chartArea: { top, bottom } } = chart;
        class Line {
          constructor(xCoor, text) {
            this.width = xCoor;
            this.text = text;
          };
          draw(ctx) {
            ctx.restore();
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = dist_line_color;
            ctx.moveTo(this.width, top + 2);
            ctx.lineTo(this.width, bottom);
            ctx.stroke();
            ctx.font = '12px Helvetica Neue, Helvetica, Arial, sans-serif';

            // position x 계산
            let posX = this.width;
            if (fixIdx === 0)
              posX -= 3 * this.text.length; // Score 제외 나머지 요소
            else
              posX -= 4 * (fixIdx); // Score의 x 좌표 계산
            if (posX < 40) posX = 40;
            ctx.fillText(this.text, posX, top)
            ctx.fillText("you", this.width - 10, bottom + 10)
            ctx.save();
          }
        }
        let drawLine = new Line(dist_width, dist_text);
        drawLine.draw(ctx);
      },
    };
    dist_chart.destroy();
    let dist_point_color = cssDecl.getPropertyValue('--data-dist-0');
    dist_chart = new Chart(modal_ctx[2], {
      type: 'scatter',
      data: { datasets: [{ data: normal_dist_data }] },
      options: {
        elements: {
          point: { radius: 2, borderColor: dist_point_color, backgroundColor: dist_point_color }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                return String((items[0].raw.x).toFixed(fixIdx));
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
    let histogram_title = String(select_year) + "년 " + chartFactor.split("_")[0].toUpperCase() + " 분포";
    $("#modal-histogram-title").text(histogram_title);
  }
  function newArrayRange(start, end, step = 1, fix_point = 0) {
    let arr = [];
    for (let i = start; i <= end; i = i + step) {
      arr.push(i.toFixed(fix_point));
    }
    return arr;
  }
  function makeModalSpecificScoreChart() {
    /* Chart 3: 세부 점수 그래프 */
    let score_data = chart_data["score_data"];
    const yearLabel = newArrayRange(start_year, end_year);
    const score_dataset = [];
    const specific_score_label = ["main_repo_score", "other_repo_score", "reputation_score"];
    const cc3 = [];
    for (let i = 0; i < 3; i++) cc3.push(cssDecl.getPropertyValue('--data-score-' + i));
    for (let i = 0; i < specific_score_label.length; i++) {
      let score_dataset_data = [];
      let score_label = specific_score_label[i];
      for (let y = 0; y <= year_intvl; y++) {
        score_dataset_data.push(score_data[y][score_label]);
      }
      score_dataset.push({
        "label": score_label,
        "data": score_dataset_data,
        "backgroundColor": cc3[i],
      });
    }

    const total_score_data = [];
    for (let y = 0; y <= year_intvl; y++) {
      total_score_data.push(score_data[y]["total_score"]);
    }
    specific_score_chart.destroy();
    specific_score_chart = new Chart(modal_ctx[3], {
      type: "bar",
      data: { labels: yearLabel, datasets: score_dataset },
      options: {
        indexAxis: 'y',
        elements: {
          bar: { borderWidth: 1, }
        },
        responsive: true,
        plugins: {
          legend: { display: false, },
          datalabels: {
            anchor: 'end',
            align: (context) => {
              if (total_score_data[context.dataIndex] <= 4.6)
                return 'end';
              else
                return 'start';
            },
            formatter: (value, context) => {
              const datasetArray = [];
              context.chart.data.datasets.forEach((dataset) => {
                if (dataset.data[context.dataIndex] !== 'undefined') {
                  datasetArray.push(dataset.data[context.dataIndex]);
                }
              });
              function totalSum(total, datapoint) {
                return total + datapoint;
              }
              let sum = datasetArray.reduce(totalSum, 0);
              if (context.datasetIndex === datasetArray.length - 1)
                if (sum === 0) return 0;
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
  function makeModalRadarChart(is_nomalization = 0, month = 0) {
    const radar_labels = ["commits/10", "stars", "issues", "PRs"];
    const radar_label_keys = ["commit", "star", "issue", "pr"];
    const average_data = [];
    const coeffs = {};
    const user_dataset = [];
    const target_dataset = [];
    let avg_data = {};
    let user_data = {};
    let target_data = {};
    if (month === 0) {
      avg_data = JSON.parse(chart_data["annual_overview"])[0];
      avg_data['star'] = chart_data['own_star']['avg'];
      factorLabels.forEach((label) => {
        if (Array.isArray(avg_data[label])) {
          avg_data[label] = avg_data[label][select_year - start_year];
        }
      });
      factorLabels.forEach((label, idx) => {
        user_data[label] = factor_contribution[idx];
        target_data[label] = target_contribution[idx];
      })
    } else {
      avg_data = chart_data["monthly_avg"][select_year - start_year][month - 1];
      avg_data['star'] = chart_data['own_star']['avg'];
      factorLabels.forEach((label, idx) => {
        user_data[label] = factor_contribution[idx];
        target_data[label] = target_contribution[idx];
      });
    }

    radar_label_keys.forEach((label) => {
      let factor_value = avg_data[label];
      let coeff = getNormalCoeff(factor_value, label, is_nomalization);
      coeffs[label] = coeff;
      average_data.push(coeff * factor_value);
    });

    radar_label_keys.forEach((label) => {
      user_dataset.push(coeffs[label] * user_data[label]);
      target_dataset.push(coeffs[label] * target_data[label]);
    });

    let radar_title = select_year + "년 " + month + "월 기여도 비교";
    if (month === 0) radar_title = select_year + "년 기여도 비교";
    if (is_nomalization) radar_title = radar_title + "(정규화)";
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
      backgroundColor: palette.radars[0] + '80',
      hoverBackgroundColor: palette.radars[0] + 'E3',
      borderColor: palette.radars[0] + 'AA',
      hoverBorderColor: palette.radars[0],
      borderWidth: 1,
    });
    radar_datasets.push({ // 유저
      type: "radar",
      label: chart_data['username'],
      data: user_dataset,
      backgroundColor: palette.radars[1] + '80',
      hoverBackgroundColor: palette.radars[1] + 'E3',
      borderColor: palette.radars[1] + 'AA',
      hoverBorderColor: palette.radars[1],
      borderWidth: 1,
    });
    let target = $(".select-compare").find(".placeholder");
    if (target.text() !== chart_data["username"] &&
      target.text() !== "비교없음") {
      radar_datasets.push({ // 비교 유저
        type: "radar",
        label: target.text(),
        data: target_dataset,
        backgroundColor: palette.radars[2] + '80',
        hoverBackgroundColor: palette.radars[2] + 'E3',
        borderColor: palette.radars[2] + 'AA',
        hoverBorderColor: palette.radars[2],
        borderWidth: 1,
      });
    }
    radar_datasets.sort((d1, d2) => {
      let sum1 = 0;
      let sum2 = 0;
      d1['data'].forEach((ele) => {
        sum1 += ele
      });
      d2['data'].forEach((ele) => {
        sum2 += ele
      });
      return (sum1 - sum2);
    })
    /* Chart 1: 레이더 차트 */
    radar_chart.destroy();
    radar_chart = new Chart(modal_ctx[1], {
      data: {
        labels: radar_labels,
        datasets: radar_datasets,
      },
      options: radarOption,
    });
  }

  function showTooltip(select_month = 0) {
    $(".modal-grass-tooltip").remove();
    if (select_month !== 0) {
      let rect_target = $(`rect.modal-contrib[month=${select_month}]`).first();
      rect_target.attr({ "stroke": cssDecl.getPropertyValue('--data-line'), "stroke-width": "2px", "focus": 1 });
      let rect_x = Number(rect_target.attr("x"));
      let rect_y = Number(rect_target.attr("y"));
      let mLabel = document.createElementNS(NS, "text");
      mLabel.textContent = String(rect_target.attr("month")) + "월: " + rect_target.attr("raw");
      let label_len = (mLabel.textContent).length;
      mLabel.setAttributeNS(null, "class", "modal-grass-tooltip");
      let mLabel_x = rect_x + (10 - label_len) * 1.5;
      let mLabel_y = rect_y + grass_size / 2
      mLabel.setAttributeNS(null, "x", mLabel_x);
      mLabel.setAttributeNS(null, "y", mLabel_y);
      mLabel.setAttributeNS(null, "font-family", "IBMPlexSansKR-Regular");
      mLabel.setAttributeNS(null, "font-size", "14px");
      mLabel.style.strokeWidth = "0";
      mLabel.style.pointerEvents = "none";
      let mBack = document.createElementNS(NS, "rect");
      mBack.setAttributeNS(null, "class", "modal-grass-tooltip");
      mBack.setAttributeNS(null, "x", mLabel_x);
      mBack.setAttributeNS(null, "y", rect_y + grass_size / 4);
      mBack.setAttributeNS(null, "width", label_len * 8);
      mBack.setAttributeNS(null, "height", grass_size / 3 + 4);
      mBack.style.strokeWidth = "0";
      mBack.style.fill = "white";
      mBack.style.pointerEvents = "none";
      let mPath = document.createElementNS(NS, "path");
      mPath.setAttributeNS(null, "class", "modal-grass-tooltip");
      mPath.setAttributeNS(null, "d", `M ${rect_x + label_len * 2.5} ${32 + rect_y} l 10 14 10 -14 z`);
      mPath.style.strokeWidth = "0";
      mPath.style.fill = "white";
      mPath.style.pointerEvents = "none";
      rect_target.parent().append(mBack);
      rect_target.parent().append(mPath);
      rect_target.parent().append(mLabel);
    }
  }
  /**
   * 연도버튼에 해당 연도에 맞는 잔디 차트를 렌더링하는 이벤트 추가
   */
  function setYearBtn() {
    let btn_year = document.getElementsByClassName("modal-btn-year");
    for (let btn of btn_year) {
      btn.addEventListener("click", function () {
        select_year = btn.innerText;
        $('.modal-btn-year.active').removeClass("active");
        this.className += " active";
        updateMonthly(select_year);
      });
    }
  }

  /**
   * 월별 드롭다운을 클릭하면 
   * 1.잔디를 포커스
   * 2.툴팁을 보여줌
   * 3.기여 요소를 업데이트
   * 4.페이지를 다시 렌더링
   */
  function setMonthDropdown() {
    $(".modal-month-item").on("click", (e) => {
      $("#modal-btnGroupDropMonth").text(e.target.innerText);
      select_month = Number(e.target.value);
      $("rect.modal-contrib").attr("focus", 0);
      $("rect.modal-contrib").removeAttr("stroke");
      $("rect.modal-contrib").removeAttr("stroke-width");
      $(".modal-grass-tooltip").remove();
      showTooltip(select_month);
      updateFactor(factorLabels, select_month);
      makePage(chart_data, 1);
    });
  }
  /**
   * 기여요소 드롭다운을 선택하면 해당 기여요소 데이터를 시각화
   */
  function setFactorDropdown() {
    $(".modal-factor-item").on("click", (e) => {
      $("#modal-btnGroupDropFactor").text(e.target.innerText);
      chartFactor = (e.target.innerText).toLowerCase();
      updateFactor(factorLabels, select_month);
      makePage(chart_data, 2);
    });
  }

  /**
   * Radar Chart에 존재하는 버튼에 따라 RadarChart를 다시 렌더링
   */
  function setRadarToggleBtn() {
    $("#modal-btn-toggle").attr("title", "평균을 10점으로 맞추어 자신의 점수를 비교하기 쉽게 만듭니다.");
    $("#modal-btn-toggle").on("click", (e) => {
      is_nomalization = 1 - is_nomalization;
      makeModalRadarChart(is_nomalization, select_month);
      if (is_nomalization) {
        e.target.setAttribute("title", "raw값을 표시합니다. 단, commit은 1/10 값입니다.");
        e.target.textContent = "raw 값";
      }
      else {
        e.target.setAttribute("title", "평균을 10점으로 맞추어 자신의 점수를 비교하기 쉽게 만듭니다.");
        e.target.textContent = "정규화";
      }
    });
  }

  /**
   * 달에 맞는 레이더 차트를 렌더링
   */
  function setRadarCompareBtn() {
    $("#modal-btn-compare").on("click", function () {
      if (target_yearly_contr.length > 0) {
        target_monthly_contr = target_yearly_contr[select_year - start_year];
        updateFactor(factorLabels, select_month);
        makePage(chart_data, 1);
      }
    });
  }

  /**
   * @param {CSSStyleDeclaration} cssDecl CSS 속성 값을 포함하는 요소 
   * @returns {Object} js로 조작할 색깔 객체
   */
  function getPalette(cssDecl) {
    const palette = {};
    palette.levels = []; // 5 level color
    for (let i = 0; i < 6; i++) palette.levels.push(cssDecl.getPropertyValue('--data-level-' + i));
    palette.radars = []; // 3 radar color
    for (let i = 0; i < 3; i++) palette.radars.push(cssDecl.getPropertyValue('--data-radar-' + i));
    palette.inactive = cssDecl.getPropertyValue('--main-icon-color');
    palette.active = cssDecl.getPropertyValue('--bootstrap-primary');
    return palette;
  }
}
function setGbtiModal() {
  const cssDecl = getComputedStyle(document.documentElement);
  $("#btn-save-id-card").on("click", () => {
    const screenshotTarget = document.getElementById("gbti-id-card");
    const idCard = document.getElementById("gbti-id-card-content");
    idCard.style.position = "relative";
    idCard.style.zIndex = 1057;
    shadow_ele = Array(6);
    for (let i = 0; i < 6; i++) {
      shadow_ele[i] = document.createElement("div");
      shadow_ele[i].style.display = "block";
      shadow_ele[i].style.width = idCard.getBoundingClientRect().width + 2 - i + "px";
      shadow_ele[i].style.height = idCard.getBoundingClientRect().height - i + "px";
      shadow_ele[i].style.backgroundColor = '#0000000d';
      shadow_ele[i].style.position = "absolute";
      shadow_ele[i].style.borderRadius = "15px";
      shadow_ele[i].style.top = "16px";
      shadow_ele[i].style.left = 4 + 0.5 * i + "px";
      shadow_ele[i].style.zIndex = 1056;
      screenshotTarget.appendChild(shadow_ele[i]);
    }

    html2canvas(screenshotTarget, { scale: 2, backgroundColor: cssDecl.getPropertyValue('--developer-bg-color') }).then((canvas) => {
      canvas.getContext('2d').filter = 'blur(4px)';
      const base64image = canvas.toDataURL("image/png");
      var anchor = document.createElement('a');
      anchor.setAttribute("href", base64image);
      anchor.setAttribute("download", "my-image.png");
      anchor.click();
      anchor.remove();
    });
    idCard.removeAttribute("style");
    shadow_ele.forEach((shadow) => {
      shadow.remove();
    });
  });
  const type_ctx = []
  for (let i = 1; i <= 3; i++) type_ctx.push(document.getElementById('canvas-type-' + i).getContext("2d"));

  const typeE_data = type_data["typeE_data"];
  const typeE_sector = type_data["typeE_sector"];
  const typeE_label = Array(24).fill(0).map((val, idx) => idx);
  const hour_palette = [];
  for (let i = 0; i < 24; i++) {
    if (typeE_sector[0] <= i && i < typeE_sector[1]) hour_palette.push(cssDecl.getPropertyValue('--type-hour-0'));
    else hour_palette.push(cssDecl.getPropertyValue('--type-hour-1'));
  }
  let hour_chart = new Chart(type_ctx[0], {
    type: 'bar',
    data: {
      labels: typeE_label, datasets: [{
        data: typeE_data,
        backgroundColor: hour_palette, borderRadius: 5
      }],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Commits"
          }
        }
      },
      plugins: {
        legend: { display: false },
      },
    },
  });

  const typeF_data = type_data["typeF_data"];
  const typeF_label = ["초반", "중반", "후반", "마무리"];
  const freq_palette = [];
  for (let i = 0; i < 4; i++) freq_palette.push(cssDecl.getPropertyValue('--type-freq-' + i));
  let freq_chart = new Chart(type_ctx[1], {
    type: 'bar',
    data: {
      labels: typeF_label, datasets: [{
        data: typeF_data,
        backgroundColor: freq_palette,
        barPercentage: 0.8, borderRadius: 5
      }],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Commits"
          }
        }
      },
      plugins: {
        legend: { display: false },
      },
    },
  });

  const typeG_data = type_data["typeG_data"];
  const typeG_label = ["개인", "팀"];
  const cooperate_palette = []
  for (let i = 0; i < 2; i++) cooperate_palette.push(cssDecl.getPropertyValue('--type-coop-' + i));
  let cooperate_chart = new Chart(type_ctx[2], {
    type: 'bar',
    data: {
      labels: typeG_label, datasets: [{
        data: typeG_data,
        backgroundColor: cooperate_palette,
        barPercentage: 0.4, borderRadius: 5
      }],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Commits"
          }
        }
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}
