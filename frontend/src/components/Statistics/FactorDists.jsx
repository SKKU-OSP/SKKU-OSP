import { useState } from 'react';

import FactorSelectors from './FactorSelectors';
import Histogram from './Charts/Histogram';
import DistChart from './Charts/DistChart';

import { makeErrorJson, getChartConfig, scoreOption, noLegendOption, histogramOption } from '../../utils/chartOption';

const category10 = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf'
];
function FactorDists(props) {
  const { distData, isReady, targetYear, factorsClassNum, factorLevelStep } = props;
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
  const parseObjectByKey = (key) => {
    if (isReady && Object.hasOwn(distData, key)) return distData[key];
    return [];
  };
  const data = parseDistData(distData);
  const sids = parseObjectByKey('sids');
  const depts = parseObjectByKey('depts');
  const factors = parseObjectByKey('factors');

  const histogramRawData = data ? data.value : [];
  // 학번별 분포 데이터
  const sidRawData = data ? data.value_sid : [];
  const sidStdData = data ? data.value_sid_std : [];
  const sidPctData = data ? data.value_sid_pct : [];
  // 학과별 분포 데이터
  const deptRawData = data ? data.value_dept : [];
  const deptStdData = data ? data.value_dept_std : [];
  const deptPctData = data ? data.value_dept_pct : [];

  const getHistogramDatasets = (distData) => {
    return [
      {
        type: 'bar',
        label: 'num',
        data: distData,
        backgroundColor: '#0d6efd',
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 1
      }
    ];
  };

  const getDistChartDatasets = (distData, pctData) => {
    return [
      {
        type: 'barWithErrorBars',
        label: 'num',
        data: distData,
        backgroundColor: category10,
        borderWidth: 0.9,
        barPercentage: 0.9,
        categoryPercentage: 1
      },
      {
        type: 'scatter',
        data: pctData
      }
    ];
  };

  function makeScatterData(labels, arr2d) {
    const scatterData = [];
    arr2d.forEach((arr, i) => {
      arr.forEach((value) => {
        scatterData.push({ x: labels[i], y: value });
      });
    });
    return scatterData;
  }

  /**
   * @param {Array} labels
   * @param {Array} dist
   * @returns
   */
  const makeHistogramJson = (labels, dist) => {
    let offset = levelStep / 2;
    if (dist) {
      return dist.map((val, idx) => {
        return {
          x: Number(labels[idx]) + offset,
          y: val
        };
      });
    }
    return [];
  };

  const histogramJsonData = makeHistogramJson(histogramLabels, histogramRawData);
  const histogramData = getChartConfig(histogramLabels, getHistogramDatasets(histogramJsonData));

  const distChartOption = targetFactor === 'score' ? scoreOption : noLegendOption;
  const sidErrorJsonData = makeErrorJson(sidRawData, sidStdData);
  const sidDistChartData = getChartConfig(
    sids,
    getDistChartDatasets(sidErrorJsonData, makeScatterData(sids, sidPctData))
  );
  const deptErrorJsonData = makeErrorJson(deptRawData, deptStdData);
  const deptDistChartData = getChartConfig(
    depts,
    getDistChartDatasets(deptErrorJsonData, makeScatterData(depts, deptPctData))
  );

  return (
    <>
      <FactorSelectors factor={targetFactor} onSetFactor={setTargetFactor} factors={factors} />
      <div className="tab-pane fade show mt-2">
        <div className="row mt-2">
          <div className="col-md-4">
            <div className="card p-3">
              <h5 className="card-title">전체 {targetFactor} 분포</h5>
              <Histogram options={histogramOption(levelStep / 2)} data={histogramData} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3">
              <h5 className="card-title">학번별 {targetFactor} 분포</h5>
              <DistChart options={distChartOption} data={sidDistChartData} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3">
              <h5 className="card-title">학과별 {targetFactor} 분포</h5>
              <DistChart options={distChartOption} data={deptDistChartData} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FactorDists;
