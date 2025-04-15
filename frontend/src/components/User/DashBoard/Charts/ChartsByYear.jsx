import { useEffect, useState } from 'react';

import axios from 'axios';
import { Chart as ChartJS } from 'chart.js';
import { useParams } from 'react-router-dom';

import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

import Chart from './Chart';
import { getAuthConfig } from '../../../../utils/auth';
import { noLegendOption } from '../../../../utils/chartOption';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const dashboardDataUrl = `${serverDomain}/user/api/dashboard/`;

function ChartsByYear() {
  const { username } = useParams();
  const [years, setYears] = useState([]);
  const [targetYear, setTargetYear] = useState(2023);

  const [mainScoreChartConfig, setMainScoreChartConfig] = useState({});
  const [detailScoreChartConfigs, setDetailScoreChartConfigs] = useState([]);
  const [lineChart, setLineChart] = useState();
  const [compareBarChart, setCompareBarChart] = useState();
  const [histogramBarChart, setHistogramBarChart] = useState();

  const [chartData, setChartData] = useState(null);

  const [chartTab, setChartTab] = useState(); // {score, commit, star, pr, issue}
  const [selectTab, setSelectTab] = useState(); // 선택된 tab
  const [tabInfo, setTabInfo] = useState(); // tab 정보

  const handleTabSelect = (selectedKey) => {
    setSelectTab(selectedKey);
  };

  useEffect(() => {
    const getDashboardData = async () => {
      const response = await axios.get(`${dashboardDataUrl}${username}/`, getAuthConfig());
      const res = response.data;
      if (res.status === 'success') {
        console.log('res.data', res.data);
        setYears(res.data.years);
        setChartData(res.data);
        setChartTab(res.data.factors);
        setSelectTab(res.data.factors[0]);
        setTabInfo(res.data.annual_user_factor[targetYear]);
      } else {
        console.log(res);
      }
    };
    getDashboardData();
  }, [username]);

  const getDoughnutConfig = (raw, labels, maxValue, font, palette) => {
    const extractedData = labels.map((key) => raw[key]);
    const sumScore = extractedData.reduce((a, b) => a + b, 0);
    const maxScore = maxValue ? maxValue : 5;
    const ctxFont = font ? font : '36px sans-serif';
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
    const data = { labels, datasets };

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
        ctx.fillText(Number(sumScore).toFixed(2), width / 2, (top + height + 20) / 2);
      }
    };

    const plugins = [doughnutText];

    return { type: 'doughnut', data, plugins };
  };

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
          pointBackgroundColor: 'rgba(150, 130, 230, 1)',
          borderColor: 'rgba(150, 130, 230, 1)',
          tension: 0.01,
          borderWidth: 3
        }
      ]
    };
    return { type: 'line', data, options: noLegendOption };
  };

  const getCompareBarConfig = (mean, user) => {
    const data = {
      labels: ['평균', '유저'],
      datasets: [
        {
          label: '비교 차트',
          data: [mean, user],
          backgroundColor: ['rgba(0, 0, 255, 0.7)', 'rgba(255, 165, 0, 0.8)']
        }
      ]
    };
    return { type: 'bar', data };
  };

  const getHistogramBarConfig = (setting, dist, user) => {
    const labels = Array.from({ length: setting.class_num }, (_, i) => (i + 1) * setting.level_step);
    const backgroundColors = labels.map((label, idx) => {
      if (idx == 0 && user < label) return 'rgba(255, 165, 0, 0.8)';
      if (idx + 1 == setting.class_num) {
        if (user >= label) return 'rgba(255, 165, 0, 0.8)';
        else return 'rgba(0, 0, 255, 0.7)';
      }
      if (user >= label && user < labels[idx + 1]) {
        return 'rgba(255, 165, 0, 0.8)';
      }
      return 'rgba(0, 0, 255, 0.7)';
    });
    const data = {
      labels: labels,
      datasets: [
        {
          label: 'Histogram',
          data: dist,
          backgroundColor: backgroundColors // 색상 배열을 backgroundColor에 할당
        }
      ]
    };
    return { type: 'bar', data };
  };

  useEffect(() => {
    if (chartData) {
      ChartJS.overrides['doughnut'].plugins.legend.display = false;
      const scoreChartData = chartData.score.find((obj) => obj.year === targetYear);
      const labels = ['main_repo_score', 'other_repo_score', 'reputation_score'];
      const mainConfig = getDoughnutConfig(scoreChartData, labels);
      setMainScoreChartConfig(mainConfig);

      const labelToMaxVaule = { main_repo_score: 3, other_repo_score: 1, reputation_score: 5 };
      const labelToColor = { main_repo_score: '#36A2EB', other_repo_score: '#FF6384', reputation_score: '#4BC0C0' };
      const detailConfigs = labels.map((label) =>
        getDoughnutConfig(scoreChartData, [label], labelToMaxVaule[label], '24px san-serif', labelToColor[label])
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
      setCompareBarChart(getCompareBarConfig(meanValue, userValue));
      const distValue = chartData.factor_dist[targetYear][selectTab];
      const distSetting = chartData.dist_setting[selectTab];
      setHistogramBarChart(getHistogramBarConfig(distSetting, distValue, userValue));
    }
  }, [targetYear, selectTab]);

  return (
    <>
      {chartData && (
        <>
          <div className="d-flex justify-content-between">
            <div className="big doughnut">
              <Chart {...mainScoreChartConfig} />
            </div>
            <div>
              <div className="d-flex justify-content-between">
                <div className="github-username">{username}</div>
                <DropdownButton id="dropdown-basic-button" variant="light" title={targetYear}>
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
              <div className="d-flex justify-content-between">
                {detailScoreChartConfigs.map((config) => {
                  return (
                    <div key={config.data.labels} style={{ width: '200px' }}>
                      <Chart {...config} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <Chart {...lineChart} />
            </div>
          </div>
          <div className="row">
            <Nav justify variant="underline" activeKey={selectTab} onSelect={handleTabSelect}>
              {chartTab.map((factor) => {
                return (
                  <Nav.Item key={factor}>
                    <Nav.Link eventKey={factor}>
                      {factor} <br /> {tabInfo[factor]}
                    </Nav.Link>
                  </Nav.Item>
                );
              })}
            </Nav>
          </div>
          <div className="row justify-content-center">
            <div className="col-6">
              <Chart {...histogramBarChart} />
            </div>
            <div className="col-6">
              <Chart {...compareBarChart} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default ChartsByYear;
