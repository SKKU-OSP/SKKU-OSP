import { useState } from 'react';

import FactorSelectors from './FactorSelectors';
import Histogram from './Charts/Histogram';

function FactorDists({ distData, isReady, targetYear, factorsClassNum, factorLevelStep }) {
  const [targetFactor, setTargetFactor] = useState('score');
  const factorIdxMap = { score: 0, commit: 1, star: 2, pr: 3, issue: 4 };
  const factorIdx = factorIdxMap[targetFactor];
  const classNum = factorsClassNum[factorIdx];
  const levelStep = factorLevelStep[factorIdx];
  const histogramLabels = Array.from({ length: classNum }, (_, idx) => idx * levelStep);

  const parseDistData = () => {
    if (isReady && Object.hasOwn(distData, 'years')) return distData.years[targetYear][targetFactor];
    return null;
  };
  const data = parseDistData(distData);
  const histogramRawData = data ? data.value : [];

  const getHistogramData = (labels, data) => {
    return {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: 'num',
          data: data,
          backgroundColor: '#0d6efd',
          borderWidth: 1,
          barPercentage: 1,
          categoryPercentage: 1
        }
      ]
    };
  };

  /**
   *
   * @param {Array} dist
   * @param {Array} label
   * @returns
   */
  const makeHistogramJson = (dist, label) => {
    let offset = levelStep / 2;
    if (dist) {
      return dist.map((val, idx) => {
        return {
          x: Number(label[idx]) + offset,
          y: val
        };
      });
    }
    return [];
  };
  function histogramOption(offset) {
    return {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              const item = items[0];
              const x = item.parsed.x;
              if (x === 0) return '0';
              let min = x - offset <= 0 ? 0 : x - offset;
              let max = x + offset;
              return `${min}-${max}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          offset: false,
          grid: { offset: false },
          ticks: { stepSize: offset * 2 }
        },
        y: { beginAtZero: true }
      }
    };
  }

  const histogramJsonData = makeHistogramJson(histogramRawData, histogramLabels);
  const histogramData = getHistogramData(histogramLabels, histogramJsonData);

  return (
    <>
      <FactorSelectors factor={targetFactor} onSetFactor={setTargetFactor} />
      <div className="tab-pane fade show mt-2" id="pills-score">
        <div className="row mt-2">
          <div className="col-md-4">
            <div className="card p-3">
              <h5 className="card-title factor">전체 {targetFactor} 분포</h5>
              <Histogram options={histogramOption(levelStep / 2)} data={histogramData} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3">
              <h5 className="card-title factor">학번별 {targetFactor} 분포</h5>
              <canvas id="sidScoreDist"></canvas>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3">
              <h5 className="card-title factor">학과별 {targetFactor} 분포</h5>
              <canvas id="deptScoreDist"></canvas>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FactorDists;
