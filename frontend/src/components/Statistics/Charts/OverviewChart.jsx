import { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { LineWithErrorBarsController, LineWithErrorBarsChart, PointWithErrorBar } from 'chartjs-chart-error-bars';

const OverviewChart = (props) => {
  const chartRef = useRef();
  const [chartInstance, setChartInstance] = useState(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    const createChart = () => {
      ChartJS.register(...registerables, LineWithErrorBarsController, LineWithErrorBarsChart, PointWithErrorBar);
      setChartInstance(
        new ChartJS(ctx, {
          type: 'lineWithErrorBars',
          data: props.data,
          options: props.options
        })
      );
    };

    destroyChart(); // 기존 차트 파괴
    createChart(); // 새로운 차트 생성

    return () => {
      destroyChart(); // 컴포넌트가 unmount될 때 차트 파괴
    };
  }, [props.data, props.options]);

  const destroyChart = () => {
    if (chartInstance) {
      chartInstance.destroy();
      setChartInstance(null);
    }
  };

  return <canvas ref={chartRef} />;
};

export default OverviewChart;
