window.onload = function () {

  // 휴학생, 복수전공 스위치
  const switchAbsence = document.getElementById("absenceSwitch");
  const switchMajor = document.getElementById("majorSwitch");
  // 개별 합계 스위치
  const switchTotal = document.getElementById("totalSwitch");
  // factor 선택 탭
  const scoreTab = document.getElementById("pills-score-tab");
  const commitTab = document.getElementById("pills-commits-tab");
  const starTab = document.getElementById("pills-stars-tab");
  const prTab = document.getElementById("pills-pr-tab");
  const issueTab = document.getElementById("pills-issue-tab");
  
  let includeAbsence = true;
  let includePluralMajor = true;
  let switchChecked = true;
  let chartFactor = "score";
  let annual = end_year;
  const start_year = 2019;
  let annual_list = [];
  for (let year=start_year; year<=end_year; year++){
    annual_list.push(String(year));
  }
  const cssDecl = getComputedStyle(document.documentElement);
  const palette = []; // 13 level color
  const bsPrimary = cssDecl.getPropertyValue('--data-level-4');
  const bsBorder = "rgba(255, 255, 255, 0)"
  const cc3 = [];
  for(let i=0; i<3; i++) cc3.push(cssDecl.getPropertyValue('--data-score-'+ i));
  switchAbsence.addEventListener("change", function (e) {
    $(".switch-toggle-absence").toggleClass("bold");
    $(".switch-toggle-absence").toggleClass("none");
    if (!switchChecked) {
      $("#totalSwitch").trigger("click");
      $("#totalSwitch").attr("checked", "checked");
      switchChecked = true;
    }
    $("#pills-score-tab").addClass("active");
    $("#pills-commits-tab").removeClass("active");
    $("#pills-stars-tab").removeClass("active");
    $("#pills-pr-tab").removeClass("active");
    $("#pills-issue-tab").removeClass("active");
    $("#totalSwitch").classList;
    annual = end_year;
    document.getElementById("yearDropdown").textContent = annual;
    chartFactor = "score";
    changeCardTitle(chartFactor);
    includeAbsence = !includeAbsence;
    destroyChart(overviewChart, 4);
    destroyChart(chart, 3);
    destroyChart(yearChart, 5);
    fetchData();
  });
  switchMajor.addEventListener("change", function (e) {
    $(".switch-toggle-major").toggleClass("bold");
    $(".switch-toggle-major").toggleClass("none");
    if (!switchChecked) {
      $("#totalSwitch").trigger("click");
      $("#totalSwitch").attr("checked", "checked");
      switchChecked = true;
    }
    $("#pills-score-tab").addClass("active");
    $("#pills-commits-tab").removeClass("active");
    $("#pills-stars-tab").removeClass("active");
    $("#pills-pr-tab").removeClass("active");
    $("#pills-issue-tab").removeClass("active");
    $("#totalSwitch").classList;
    annual = end_year;
    document.getElementById("yearDropdown").textContent = annual;
    chartFactor = "score";
    changeCardTitle(chartFactor);
    includePluralMajor = !includePluralMajor;
    destroyChart(overviewChart, 4);
    destroyChart(chart, 3);
    destroyChart(yearChart, 5);
    fetchData();
  });
  function createObjArray(size) {
    return new Array(size).fill(new Object(null));
  }
  const yearChart = createObjArray(5);
  const overviewChart = createObjArray(4);
  const chart = createObjArray(3);
  function destroyChart(chart, size) {
    for (let i = 0; i < size; i++) {
      chart[i].destroy();
    }
  }
  function changeCardTitle(factor) {
    const cardTitle = document.getElementsByClassName("factor");
    let word;
    if (factor === "pr")
      word = "PR";
    else {
      word = factor.charAt(0).toUpperCase() + factor.slice(1);
    }
    cardTitle.item(0).textContent = `전체 ${word} 분포`;
    cardTitle.item(1).textContent = `학번별 ${word} 분포`;
    cardTitle.item(2).textContent = `학과별 ${word} 분포`;
  }
  fetchData();
  function fetchData() {
    if (!includeAbsence && !includePluralMajor)
      makePage(chartdata_3); //휴학생 제외, 복전생 제외 
    else if (!includeAbsence)
      makePage(chartdata_2); //휴학생 제외, 복전생 포함
    else if (!includePluralMajor)
      makePage(chartdata_1); //휴학생 포함, 복전생 제외
    else
      makePage(chartdata_0); // 전체 포함
  }

  function makePage(chartdata) {
    let annual_overview = JSON.parse(chartdata["annual_overview"])[0];
    // console.log("annual_overview",annual_overview);
    let annual_total = JSON.parse(chartdata["annual_total"])[0];
    let annual_dist = JSON.parse(chartdata[`year${annual}`])[0];
    // console.log("annual_dist",annual_dist);
    let annual_student = JSON.parse(chartdata["student_year"])[annual-start_year];
    const annual_repo = [];
    for(let i = start_year; i <= end_year; i++){
      annual_repo.push(annual_total["repo"][end_year-i]);
    }
    let scoreAnnual = annual_overview["score"];
    const commitAnnual = annual_overview["commit"];
    const starAnnual = annual_overview["star"];
    const prAnnual = annual_overview["pr"];
    const issueAnnual = annual_overview["issue"];
    let annualList = [
      scoreAnnual,
      commitAnnual,
      starAnnual,
      prAnnual,
      issueAnnual,
    ];

    let dist = annual_dist["score"];
    let sidData = annual_dist["score_sid"];
    console.log("sidData", sidData)
    for(let i=0; i<13; i=i+1+sidData.length/12) palette.push(cssDecl.getPropertyValue('--type-sid-'+i.toFixed()));
    let deptData = annual_dist["score_dept"];
    let sidTopData = annual_dist["score_sid_pct"];
    let deptTopData = annual_dist["score_dept_pct"];
    // 바깥쪽에 두면 싱크가 안맞아서 그래프가 안 나타난다.

    const yearFactorList = ["score", "commit", "star", "pr", "issue"];
    let factorDistLabelDict = {};
    classCnt.forEach((list_len, i)=>{
      factorDistLabelDict[yearFactorList[i]] = []
      let gap = classGap[i];
      for(let k=0; k<list_len; k++){
        factorDistLabelDict[yearFactorList[i]].push( String(gap*k)+"~"+String(gap*(k+1)));
      }
    });
    const scoreDistLineLabel = [];
    const scoreDistLabel = factorDistLabelDict["score"];
    scoreDistLabel.forEach((label)=>{
      scoreDistLineLabel.push(Number(label.split("~")[0]));
    })
    const commitDistLabel = factorDistLabelDict["commit"];
    const starDistLabel = factorDistLabelDict["star"];
    const prDistLabel = factorDistLabelDict["pr"];
    const issueDistLabel = factorDistLabelDict["issue"];
    const sidLabel = [];
    for(let i=end_year; i>end_year-sidData.length;i--){
      sidLabel.push(String(i).substring(2));
    }
    let labelList = [scoreDistLabel, sidLabel, deptLabel];
    let sidStd = annual_dist[`${chartFactor}_sid_std`];
    let deptStd = annual_dist[`${chartFactor}_dept_std`];
    const annualStdList = [
      annual_overview["score_std"],
      annual_overview["commit_std"],
      annual_overview["star_std"],
      annual_overview["pr_std"],
      annual_overview["issue_std"],
    ];

    let datasetList = [
      makeHistogramJson(dist, scoreDistLabel), // original: dist
      makeErrorJson(sidData, sidStd),
      makeErrorJson(deptData, deptStd),
    ];
    const yearNameRule = ["score", "commit", "star", "pr", "issue"];
    const overviewNameRule = ["score", "commit", "star", "repo"];
    const canvasNameRule = ["total", "sid", "dept"];
    let ctxYear = new Array(5);
    for (let i = 0; i < 5; i++) {
      ctxYear[i] = document
        .getElementById(`${yearNameRule[i]}Year`)
        .getContext("2d");
    }
    let ctxOverview = new Array(4);
    for (let i = 0; i < 4; i++) {
      ctxOverview[i] = document
        .getElementById(`${overviewNameRule[i]}Overview`)
        .getContext("2d");
    }
    let ctx = new Array(3);
    for (let i = 0; i < 3; i++) {
      ctx[i] = document
        .getElementById(`${canvasNameRule[i]}ScoreDist`)
        .getContext("2d");
    }
    setOverallStat(annual_total);
    
    const noLegendOption = {
      plugins: {
        legend: {display: false},
      },
      scales: {
        y: { beginAtZero: true },
      },
    };
    const scoreOption = {
      plugins: {
        legend: {display: false},
      },
      scales: {
        y: { max: 5, beginAtZero: true },
      },
    };
    function histogramOption(offset) {
      return {
        plugins: {
          legend: {display: false},
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

                return `${min}-${max}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "linear",
            offset: false,
            grid: {offset: false},
            ticks: {stepSize: offset * 2},
          },
          y: { beginAtZero: true },
        },
      };
    }
    let overviewDatasetList = [
      annual_total["student_KP"],
      annual_total["commit"],
      annual_total["star"],
      annual_repo,
    ];

    let overviewFactorList = ["num", "commit", "star", "repo"];

    for (let i = 0; i < 4; i++) {
      overviewChart[i] = makeChart(
        ctxOverview[i],
        "line",
        overviewFactorList[i],
        annual_list,
        overviewDatasetList[i],
        bsPrimary,
        noLegendOption
      );
    }
    const chartTypeRule = ["bar", "barWithErrorBars", "barWithErrorBars"];
    let chartColorRule = [bsPrimary, palette, cc3];
    let chartOptions = [histogramOption(0.25), scoreOption, scoreOption];
    let topdataRule = [
      [],
      makeScatterData(sidTopData, sidLabel),
      makeScatterData(deptTopData, deptLabel),
    ];
    for (let i = 0; i < 3; i++) {
      chart[i] = makeChart(
        ctx[i],
        chartTypeRule[i],
        chartFactor,
        labelList[i],
        datasetList[i],
        chartColorRule[i],
        chartOptions[i],
        topdataRule[i]
      );
    }
    // 연도 선택 드롭다운
    $(".year-item").on("click", (e)=>{
      $("#yearDropdown").text(e.target.innerText);
      annual = e.target.innerText;
      setAnnualDistData(annual, chartFactor);
      setOverallStat(
        annual_total,
        switchChecked ? 1 : annual_total["student_total"][i]
      );
      reloadChart(annual, chartFactor);
    });
    scoreTab.addEventListener("click", function () {
      unchosenBtn();
      chooseBtn(scoreTab);
      chartFactor = "score";
      changeCardTitle(chartFactor);
      reloadChart(annual, chartFactor);
    });
    commitTab.addEventListener("click", function () {
      unchosenBtn();
      chooseBtn(commitTab);
      chartFactor = "commit";
      changeCardTitle(chartFactor);
      reloadChart(annual, chartFactor);
    });
    starTab.addEventListener("click", function () {
      unchosenBtn();
      chooseBtn(starTab);
      chartFactor = "star";
      changeCardTitle(chartFactor);
      reloadChart(annual, chartFactor);
    });
    prTab.addEventListener("click", function () {
      unchosenBtn();
      chooseBtn(prTab);
      chartFactor = "pr";
      changeCardTitle(chartFactor);
      reloadChart(annual, chartFactor);
    });
    issueTab.addEventListener("click", function () {
      unchosenBtn();
      chooseBtn(issueTab);
      chartFactor = "issue";
      changeCardTitle(chartFactor);
      reloadChart(annual, chartFactor);
    });
    switchTotal.addEventListener("change", function (e) {
      $(".switch-toggle").toggleClass("bold");
      if (e.target.checked === false) {
        switchChecked = false;
        $("#commitTitle").text("학생당 Commit 수");
        $("#starTitle").text("학생당 Star 수");
        $("#repoTitle").text("학생당 Repo 수");
        setOverallStat(annual_total, annual_total["student_total"][annual - start_year]);
        destroyChart(overviewChart, 4);
        const data = [];
        for (let year = start_year; year <= end_year; year++) {
          annual_student = JSON.parse(chartdata["student_year"])[year-start_year];
          annual_student.map((obj) => {
            const picked = (({ github_id, score}) => ({
              github_id,
              score,
            }))(obj);
            if (Number(picked['score']) >= 3) {
              data.push({
                x: String(year),
                y: picked['score'],
                tooltip: picked["github_id"],
                order: 1,
              });
            }
          });
        }
        overviewChart[0] = makeChart(
          ctxOverview[0],
          "line",
          "score",
          annual_list,
          data,
          bsPrimary,
          {
            borderColor: bsBorder,
            plugins: {
              legend: {display: false},
              tooltip: {
                callbacks: {
                  title: (items) => {
                    return items[0].raw.y;
                  },
                  label: (item) => {
                    return item.raw.tooltip;
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  stepSize: 1,
                },
              },
              y: {
                max: 5,
                beginAtZero: true,
              },
            },
          }
        );

        const commitDataset = [];
        for (let year = start_year; year <= end_year; year++) {
          annual_student = JSON.parse(chartdata["student_year"])[year-start_year];
          annual_student.map((obj) => {
            const picked = (({ github_id, commit }) => ({
              github_id,
              commit,
            }))(obj);
            if (Number(picked["commit"]) > 0) {
              commitDataset.push({
                x: String(year),
                y: picked["commit"],
                tooltip: picked["github_id"],
              });
            }
          });
        }
        overviewChart[1] = makeChart(
          ctxOverview[1],
          "line",
          "commit",
          annual_list,
          commitDataset,
          bsPrimary,
          {
            borderColor: bsBorder,
            plugins: {
              legend: {display: false},
              tooltip: {
                callbacks: {
                  title: (items) => {
                    return items[0].raw.y;
                  },
                  label: (item) => {
                    return item.raw.tooltip;
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  stepSize: 1,
                },
              },
              y: {
                beginAtZero: true,
              },
            },
          }
        );

        const starDataset = [];
        for (let year = start_year; year <= end_year; year++) {
          annual_student = JSON.parse(chartdata["student_year"])[year-start_year];
          annual_student.map((obj) => {
            const picked = (({ github_id, star }) => ({
              github_id,
              star,
            }))(obj);
            if (Number(picked["star"]) > 0) {
              starDataset.push({
                x: String(year),
                y: picked["star"],
                tooltip: picked["github_id"],
              });
            }
          });
        }
        overviewChart[2] = makeChart(
          ctxOverview[2],
          "line",
          "star",
          annual_list,
          starDataset,
          bsPrimary,
          {
            borderColor: bsBorder,
            plugins: {
              legend: {display: false},
              tooltip: {
                callbacks: {
                  title: (items) => {
                    return items[0].raw.y;
                  },
                  label: (item) => {
                    return item.raw.tooltip;
                  },
                },
              },
            },
            scales: {
              x: {ticks: {stepSize: 1}},
              y: {beginAtZero: true},
            },
          }
        );

        const repoDataset = [];
        for (let year = start_year; year <= end_year; year++) {
          let annual_repo_list = repodata[year - start_year];
          for (let idx in annual_repo_list) {
            let repo = annual_repo_list[idx];
            Object.keys(repo).forEach((key)=>{
              repoDataset.push({
                x: String(year),
                y: repo[key],
                tooltip: key,
              });
            });
          }
        }
        overviewChart[3] = makeChart(
          ctxOverview[3],
          "line",
          "repo",
          annual_list,
          repoDataset,
          bsPrimary,
          {
            borderColor: bsBorder,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (items) => {
                    return items[0].raw.y;
                  },
                  label: (item) => {
                    return item.raw.tooltip;
                  },
                },
              },
            },
            scales: {
              x: {ticks: { stepSize: 1}},
              y: {beginAtZero: true},
            },
          }
        );
      }
      if (e.target.checked === true) {
        switchChecked = true;
        $("#commitTitle").text("총 Commit 수");
        $("#starTitle").text("총 Star 수");
        $("#repoTitle").text("총 Repo 수");
        destroyChart(overviewChart, 4);
        setOverallStat(annual_total);
        
        overviewDatasetList = [
          annual_total["student_KP"],
          annual_total["commit"],
          annual_total["star"],
          annual_repo,
        ];
        for (let i = 0; i < 4; i++) {
          overviewChart[i] = makeChart(
            ctxOverview[i],
            "line",
            overviewFactorList[i],
            annual_list,
            overviewDatasetList[i],
            bsPrimary,
            noLegendOption
          );
        }
      }
    });
    function unchosenBtn() {
      scoreTab.classList.remove("active");
      commitTab.classList.remove("active");
      starTab.classList.remove("active");
      prTab.classList.remove("active");
      issueTab.classList.remove("active");
    }
    function chooseBtn(ele) {
      ele.classList.add("active");
    }

    function numberWithCommas(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function setOverallStat(annual_total, nStudent = 1) {

      // Overall statistic data: 3점 이상 비율, 총 커밋 수, 총 스타 수, 총 레포 수
      let fix = nStudent === 1 ? 0 : 1;
      let idx_asc = annual - start_year;
      let idx_desc = end_year - annual;
      const overGoalcount = annual_total[`student_KP`][idx_asc];
      $("#overGoalNumerator").text(numberWithCommas(overGoalcount));
      $("#overGoalDenominator").text(
        numberWithCommas(annual_total["student_total"][idx_asc])
      );
      $("#overGoalPercent").text(
        ((overGoalcount / annual_total["student_total"][idx_asc]) * 100).toFixed(1) +
          "%"
      );

      let sumTotalCommit = 0; // sum total commit
      let sumTotalStar = 0; // sum total star
      annual_total["commit"].forEach((element) => {
        sumTotalCommit += element;
      });
      annual_total["star"].forEach((element) => {
        sumTotalStar += element;
      });
      $("#commitNumerator").text(
        numberWithCommas((annual_total["commit"][idx_asc] / nStudent).toFixed(fix))
      );
      $("#commitDenominator").text(numberWithCommas(sumTotalCommit));
      $("#commitPercent").text(
        ((annual_total["commit"][idx_asc] / nStudent / sumTotalCommit) *100)
        .toFixed(1) + "%"
      );
      $("#starNumerator").text(
        numberWithCommas((annual_total["star"][idx_asc] / nStudent).toFixed(fix))
      );
      $("#starDenominator").text(numberWithCommas(sumTotalStar));
      $("#starPercent").text(
        ((annual_total["star"][idx_asc] / nStudent / sumTotalStar) *100)
        .toFixed(1) + "%"
      );
      $("#repoNumerator").text(
        numberWithCommas((annual_total["repo"][idx_desc] / nStudent).toFixed(fix))
      );
      $("#repoDenominator").text(numberWithCommas(annual_total["repo_total"]));
      $("#repoPercent").text(
        ((annual_total["repo"][idx_desc] / nStudent / annual_total["repo_total"]) *100)
        .toFixed(1) + "%"
      );

      controlFontSize();
    }
    function setAnnualDistData(annual, factor) {
      document.getElementById("yearDropdown").textContent = annual;
      annual_dist = JSON.parse(chartdata[`year${annual}`])[0];
      dist = annual_dist[`${factor}`];
      sidData = annual_dist[`${factor}_sid`];
      deptData = annual_dist[`${factor}_dept`];
      sidTopData = annual_dist[`${factor}_sid_pct`];
      deptTopData =annual_dist[`${factor}_dept_pct`];
    }
    function makeChart(ctx, type, factor,
      labels, data, color, options, topdata = []) {

      let chart;
      if (type === "barWithErrorBars") {
        const borderWidth = 0.9;
        const barPercentage = 0.9;
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
              {
                type: "scatter",
                data: topdata,
              },
            ],
          },
          options: options,
        });
      } else if (type === "bar") {
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
      } else {
        chart = new Chart(ctx, {
          data: {
            labels: labels,
            datasets: [
              {
                type: type,
                label: factor,
                data: data,
                backgroundColor: color,
              },
            ],
          },
          options: options,
        });
      }

      return chart;
    }

    function reloadChart(annual, factor) {
      destroyChart(chart, 3);
      chartColorRule = [bsPrimary, palette, cc3];
      switch (factor) {
        case "score":
          labelList[0] = scoreDistLabel;
          chartOptions = [histogramOption(0.25), scoreOption, scoreOption];
          break;
        case "commit":
          labelList[0] = commitDistLabel;
          chartOptions = [histogramOption(50), noLegendOption, noLegendOption];
          break;
        case "star":
          labelList[0] = starDistLabel;
          chartOptions = [histogramOption(1), noLegendOption, noLegendOption];
          break;
        case "pr":
          labelList[0] = prDistLabel;
          chartOptions = [histogramOption(2.5), noLegendOption, noLegendOption];
          break;
        case "issue":
          labelList[0] = issueDistLabel;
          chartOptions = [histogramOption(1), noLegendOption, noLegendOption];
          break;
        default:
          console.log("reloadChart factor error");
      }
      annual_dist = JSON.parse(chartdata[`year${annual}`])[0];
      dist = annual_dist[`${factor}`];
      sidData = annual_dist[`${factor}_sid`];
      deptData = annual_dist[`${factor}_dept`];
      sidStd = annual_dist[`${factor}_sid_std`];
      deptStd = annual_dist[`${factor}_dept_std`];
      sidTopData = annual_dist[`${factor}_sid_pct`];
      deptTopData = annual_dist[`${factor}_dept_pct`];
      topdataRule = [
        [],
        makeScatterData(sidTopData, sidLabel),
        makeScatterData(deptTopData, deptLabel),
      ];
      datasetList = [
        makeHistogramJson(dist, labelList[0]),
        makeErrorJson(sidData, sidStd),
        makeErrorJson(deptData, deptStd),
      ];
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          chart[i] = makeChart(
            ctx[i],
            chartTypeRule[i],
            chartFactor,
            labelList[i],
            datasetList[i],
            chartColorRule[i],
            chartOptions[i]
          );
        } else {
          chart[i] = makeChart(
            ctx[i],
            chartTypeRule[i],
            chartFactor,
            labelList[i],
            datasetList[i],
            chartColorRule[i],
            {plugins: {legend: {display: false}}},
            topdataRule[i]
          );
        }
      }
    }

    function makeErrorJson(dataArr, stdArr) {
      let newData = new Array(dataArr.length);
      for (let i = 0; i < dataArr.length; i++) {
        let errorJson = {};
        errorJson["y"] = Number(dataArr[i]);
        errorJson["yMax"] = Number(
          (Number(dataArr[i]) + Number(stdArr[i])).toFixed(2)
        );
        errorJson["yMin"] = Number(
          (Number(dataArr[i]) - Number(stdArr[i]) < 0
            ? 0
            : Number(dataArr[i]) - Number(stdArr[i])
          ).toFixed(2)
        );
        newData[i] = errorJson;
      }
      return newData;
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
      return newDist;
    }

    for (let i = 0; i < 5; i++) {
      yearChart[i] = makeChart(
        ctxYear[i],
        "lineWithErrorBars",
        yearFactorList[i],
        annual_list,
        makeErrorJson(annualList[i], annualStdList[i]),
        bsPrimary,
        i === 0
          ? {
              plugins: {legend: {display: false}},
              scales: {
                y: { max: 5, beginAtZero: true },
              },
            } // 그래프 렌더링 문제로 오브젝트자체를 전달하도록함
          : noLegendOption
      );
    }

    // too long text
    function controlFontSize() {
      const numerator = document.getElementsByClassName("text-primary");
      const denominator = document.getElementsByClassName("total");
      const percent = document.getElementsByClassName("percent");
      const kpi = document.getElementsByClassName("kpi");
      for (let i = 0; i < numerator.length; i++) {
        let lenNumer = numerator.item(i).textContent.length;
        let lenDenom = denominator.item(i).textContent.length;
        let lenPercent = percent.item(i).textContent.length;
        let lenText = (lenNumer + lenDenom + lenPercent);
        if (lenText >= 13) {
          kpi.item(i).style.fontSize = (25 / lenText).toFixed(2) +"rem";
        }
      }
    }

    function makeScatterData(arr2d, label) {
      let ret = [];
      for (let i = 0; i < arr2d.length; i++) {
        for (let j = 0; j < arr2d[i].length; j++) {
          ret.push({ x: label[i], y: arr2d[i][j] });
        }
      }
      //console.log("makescatter", ret);
      return ret;
    }
  }
};
