import { useEffect, useState } from 'react';

import axios from 'axios';
import axiosInstance from '../../../../utils/axiosInterCeptor';
import { Chart as ChartJS } from 'chart.js';
import { useParams } from 'react-router-dom';

import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

import Chart from './Chart';
import RepoBox from '../Item/RepoBox';
import ChartBox from '../Item/ChartBox';
import { getAuthConfig } from '../../../../utils/auth';
import { noLegendOption, histogramOption, makeHistogramJson } from '../../../../utils/chartOption';

import { BiSolidCrown } from 'react-icons/bi';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const dashboardDataUrl = `${serverDomain}/user/api/dashboard/`;

function ChartsByYear2() {
  const { username } = useParams();
  const [years, setYears] = useState([]);
  const [targetYear, setTargetYear] = useState(2023);

  const [mainScoreChartConfig, setMainScoreChartConfig] = useState({});
  const [detailScoreChartConfigs, setDetailScoreChartConfigs] = useState([]);
  const [lineChart, setLineChart] = useState();
  const [compareBarChart, setCompareBarChart] = useState();
  const [histogramBarChart, setHistogramBarChart] = useState();

  const [chartData, setChartData] = useState(null);
  const [bestRepo, setBestRepo] = useState(null);

  const [chartTab, setChartTab] = useState(); // {score, commit, star, pr, issue}
  const [selectTab, setSelectTab] = useState(); // 선택된 tab
  const [tabInfo, setTabInfo] = useState(); // tab 정보

  const handleTabSelect = (selectedKey) => {
    setSelectTab(selectedKey);
  };

  useEffect(() => {
    const getDashboardData = async () => {
      const response = await axiosInstance.get(`${dashboardDataUrl}${username}/`, getAuthConfig());
      const res = response.data;
      if (res.status === 'success') {
        console.log('res.data', res.data);
        setYears(res.data.years);
        setChartData(res.data);
        setChartTab(res.data.factors);
        setSelectTab(res.data.factors[0]);
        const initYear = new Date().getFullYear();
        setTabInfo(res.data.annual_user_factor[initYear]);
        setTargetYear(initYear);
      } else {
        console.log(res);
      }
    };
    getDashboardData();
  }, [username]);

  useEffect(() => {
    if (chartData) {
      ChartJS.overrides['doughnut'].plugins.legend.display = false;
      const scoreChartData = chartData.score.find((obj) => obj.year === targetYear);
      setBestRepo(scoreChartData.best_repo);

      const labels = ['main_repo_score', 'other_repo_score', 'reputation_score'];
      const mainConfig = getDoughnutConfig(scoreChartData, labels);
      setMainScoreChartConfig(mainConfig);

      const labelToMaxVaule = { main_repo_score: 3, other_repo_score: 1, reputation_score: 5 };
      const labelToColor = { main_repo_score: '#36A2EB', other_repo_score: '#FF6384', reputation_score: '#4BC0C0' };
      const detailConfigs = labels.map((label) =>
        getDoughnutConfig(scoreChartData, [label], labelToMaxVaule[label], '16px san-serif', labelToColor[label])
      );
      setDetailScoreChartConfigs(detailConfigs);

      setTabInfo(chartData.annual_user_factor[targetYear]);

      const LineChartTotalValue = chartData.monthly_contr[targetYear].map((item) => item.total);
      setLineChart(getLineConfig(LineChartTotalValue));
    }
  }, [chartData, targetYear]);

  useEffect(() => {
    if (chartData) {
      const meanValue = chartData.annual_factor_avg[targetYear][selectTab];
      const userValue = chartData.annual_user_factor[targetYear][selectTab];
      setCompareBarChart(getCompareBarConfig(meanValue, userValue, selectTab));
      const distValue = chartData.factor_dist[targetYear][selectTab];
      const distSetting = chartData.dist_setting[selectTab];
      setHistogramBarChart(getHistogramBarConfig(distSetting, distValue, userValue));
    }
  }, [chartData, targetYear, selectTab]);

  const getDoughnutConfig = (raw, labels, maxValue, font, palette) => {
    const extractedData = labels.map((key) => raw[key]);
    const sumScore = extractedData.reduce((a, b) => a + b, 0);
    const maxScore = maxValue ? maxValue : 5;
    const ctxFont = font ? font : '32px sans-serif';
    const fontSize = parseFloat(ctxFont) ? parseFloat(ctxFont) : 0;
    const backgroundColor = palette ? palette : ['#36A2EB', '#FF6384', '#4BC0C0', '#FF9F40'];

    const datasets = [
      {
        data: [maxScore],
        circumference: 360,
        weight: 0.01
      },
      {
        data: extractedData,
        backgroundColor: backgroundColor,
        circumference: (ctx) => {
          return (ctx.dataset.data.reduce((a, b) => a + b, 0) / maxScore) * 360;
        }
      }
    ];
    const data = { labels: labels.map((label) => labelTitleMap[label]), datasets };

    const doughnutText = {
      id: 'main-score',
      beforeDraw(chart) {
        const {
          ctx,
          chartArea: { top, width, height }
        } = chart;
        ctx.save();

        ctx.font = ctxFont;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'black';
        ctx.fillText(Number(sumScore).toFixed(2), width / 2, top + fontSize / 4 + height / 2);
      }
    };

    const plugins = [doughnutText];

    return { type: 'doughnut', data, plugins };
  };

  const labelTitleMap = {
    main_repo_score: '활동 수준',
    other_repo_score: '활동 다양성',
    reputation_score: '활동 영향성'
  };
  const labelDescMap = {
    '활동 수준': '기여한 리포지토리 중 최고점수 (최대 3점)',
    '활동 다양성': '여러 리포지토리에 기여했는지에 대한 점수 (최대 1점)',
    '활동 영향성': '오픈소스 생태계에 영향을 미쳤는지에 대한 점수 (최대 5점 보너스)'
  };
  const mainBarColor = '#36A2EB';
  const focusBarColor = '#ffa500';

  const getLineConfig = (value) => {
    const labels = value.map((_, idx) => {
      return `${idx + 1}월`;
    });
    const data = {
      labels: labels,
      datasets: [
        {
          data: value,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: mainBarColor,
          tension: 0.01,
          borderWidth: 3
        }
      ]
    };
    return { type: 'line', data, options: noLegendOption };
  };

  const getCompareBarConfig = (mean, user, label = 'value') => {
    const data = {
      labels: ['평균', 'You'],
      datasets: [
        {
          label: label,
          data: [mean, user],
          barPercentage: 0.4,
          backgroundColor: [mainBarColor, focusBarColor]
        }
      ]
    };
    return {
      type: 'bar',
      data,
      options: {
        plugins: { legend: { display: false } }
      }
    };
  };

  const getHistogramBarConfig = (setting, dist, user) => {
    const labels = Array.from({ length: setting.class_num }, (_, i) => i * setting.level_step);
    const backgroundColors = labels.map((label, idx) => {
      if (idx === 0 && user < label) return focusBarColor;
      if (idx + 1 === setting.class_num) {
        if (user >= label) return focusBarColor;
        else return mainBarColor;
      }
      if (user >= label && user < labels[idx + 1]) {
        return focusBarColor;
      }
      return mainBarColor;
    });

    const histogramJsonData = makeHistogramJson(labels, dist, setting.level_step);
    const histogramDatasets = [
      {
        type: 'bar',
        label: 'num',
        data: histogramJsonData,
        backgroundColor: backgroundColors,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 1
      }
    ];
    const data = {
      labels: labels,
      datasets: histogramDatasets
    };
    return { type: 'bar', data, options: histogramOption(setting.level_step / 2) };
  };

  return (
    <div className="row mb-4">
      <div className="d-flex justify-content-between mb-2">
        <div className="fs-4 mb-2 bold" style={{ fontFamily: 'nanumfont_ExtraBold' }}>
          연도별 분석
        </div>
        <DropdownButton variant="light" title={targetYear} style={{ float: 'right' }}>
          {years.map((year) => {
            return (
              <Dropdown.Item
                key={year}
                eventKey={year}
                onClick={() => {
                  setTargetYear(year);
                }}
                active={year === targetYear}
              >
                {year}
              </Dropdown.Item>
            );
          })}
        </DropdownButton>
      </div>

      {chartData && (
        <>
          <div className="dashboard-box mb-4">
            <div className="d-flex flex-wrap justify-content-between">
              <div className="col-4 col-lg-3 p-2 mb-2">
                <div className="fs-5 bold" style={{ fontFamily: 'nanumfont_ExtraBold' }}>
                  GitHub 기여점수
                </div>
                <div className="d-flex gap-2 fs-7 weak-text" style={{ fontFamily: 'nanumfont_Bold' }}>
                  GitHub 활동내역을 통해 산출한 점수 (최대 5점)
                </div>
                <Chart {...mainScoreChartConfig} />
              </div>
              <div className="col-7 col-lg-5 p-2 mb-2">
                {detailScoreChartConfigs.map((config) => {
                  return (
                    <ChartBox
                      key={config.data.labels}
                      label={config.data.labels}
                      desc={labelDescMap[config.data.labels]}
                      color={config.data.datasets[1].backgroundColor}
                      chart={<Chart {...config} />}
                    />
                  );
                })}
              </div>
              <div className="col-12 col-lg-3 p-2 mb-2">
                {bestRepo && (
                  <>
                    <div className="d-flex fs-5 bold lh-1 mb-2">
                      <BiSolidCrown size="20" color="#ffa500" />
                      BEST
                    </div>
                    <RepoBox
                      repoName={bestRepo.repo_name}
                      commits={bestRepo.commit_count}
                      commitLines={bestRepo.commit_lines}
                      prs={bestRepo.pr_count}
                      issues={bestRepo.issue_count}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-5 dashboard-box p-3 mb-4">
            <div className="fs-5 bold" style={{ fontFamily: 'nanumfont_ExtraBold' }}>
              월별 기여내역
            </div>
            <div className="col-12">
              <Chart {...lineChart} />
            </div>
          </div>
          <div className="col-12 col-lg-7 dashboard-box p-3 mb-4">
            <div className="fs-5 bold" style={{ fontFamily: 'nanumfont_ExtraBold' }}>
              기여내역 비교
            </div>
            <Nav justify variant="underline" activeKey={selectTab} onSelect={handleTabSelect}>
              {chartTab.map((factor) => {
                return (
                  <Nav.Item key={factor} className="text-center">
                    <Nav.Link eventKey={factor}>
                      {factor} <br /> {tabInfo[factor]}
                    </Nav.Link>
                  </Nav.Item>
                );
              })}
            </Nav>
            <div className="d-flex flex-wrap">
              <div className="col-12 col-lg-6 mb-2 p-2">
                <Chart {...histogramBarChart} />
              </div>
              <div className="col-12 col-lg-6 mb-2 p-2">
                <Chart {...compareBarChart} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ChartsByYear2;
