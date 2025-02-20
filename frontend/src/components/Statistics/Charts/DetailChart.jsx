import { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';

const DetailChart = (props) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null); // useRef로 차트 인스턴스 관리

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    const createChart = () => {
      ChartJS.register(...registerables);

      chartInstanceRef.current = new ChartJS(ctx, {
        type: 'line',
        data: props.data,
        options: props.options
      });
    };

    destroyChart(); // 기존 차트 삭제 후 새로운 차트 생성
    createChart();

    return () => {
      destroyChart(); // 언마운트 시 기존 차트 제거
    };
  }, [props.data, props.options]);

  const destroyChart = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
  };

  return <canvas ref={chartRef} />;
};

export default DetailChart;
