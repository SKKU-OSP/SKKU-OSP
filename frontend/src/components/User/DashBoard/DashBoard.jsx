import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAuthConfig } from '../../../utils/auth';

import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Chart from './Charts/Chart';
import { noLegendOption } from '../../../utils/chartOption';
import { Chart as ChartJS } from 'chart.js';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const dashboardDataUrl = `${serverDomain}/user/api/dashboard/`;

function Dashboard() {
  const { username } = useParams();
  const [years, setYears] = useState([]);
  const [targetYear, setTargetYear] = useState(2023);

  const [isReady, setIsReady] = useState(false);
  const [scoreDetailChartData, setScoreDetailChartData] = useState();

  const [scoreChartData, setScoreChartData] = useState();
  const [mainScoreChartConfig, setMainScoreChartConfig] = useState({});
  const [detailScoreChartConfigs, setDetailScoreChartConfigs] = useState([]);

  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const getDashboardData = async () => {
      const response = await axios.get(`${dashboardDataUrl}${username}/`, getAuthConfig());
      const res = response.data;
      if (res.status === 'success') {
        setYears(res.data.year);
        setChartData(res.data);
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
        weight: 0.1
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

    return { type: 'doughnut', labels, data, plugins };
  };

  useEffect(() => {
    if (chartData) {
      ChartJS.overrides['doughnut'].plugins.legend.display = false;
      const scoreChartData = chartData.score.find((obj) => obj.year === targetYear);

      const labels = ['main_repo_score', 'other_repo_score', 'reputation_score'];
      const mainConfig = getDoughnutConfig(scoreChartData, labels);
      setMainScoreChartConfig(mainConfig);
      const labelToMaxVaule = { main_repo_score: 3, other_repo_score: 1, reputation_score: 1 };
      const labelToColor = { main_repo_score: '#36A2EB', other_repo_score: '#FF6384', reputation_score: '#4BC0C0' };

      const detailConfigs = labels.map((label) =>
        getDoughnutConfig(scoreChartData, [label], labelToMaxVaule[label], '24px san-serif', labelToColor[label])
      );
      setDetailScoreChartConfigs(detailConfigs);
    }
  }, [chartData, targetYear]);

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between">
        <div className="big doughnut">
          {/* 메인 score 차트 */}
          <Chart {...mainScoreChartConfig} />
        </div>
        <div>
          <div className="d-flex justify-content-between">
            <div className="github-username">SeoJeongYeop</div>
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
                <div key={config.labels[0]} style={{ width: '200px' }}>
                  <Chart {...config} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      div.
    </div>
  );
}

export default Dashboard;
