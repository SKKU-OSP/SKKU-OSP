import { useNavigate } from 'react-router-dom';
import DevTypeCard from './DevTypeCard';
import ImageDescBox from './ImageDescBox';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// 백분율 표시를 위한 커스텀 플러그인 정의
const percentageLabelsPlugin = {
  id: 'percentageLabels',
  afterDatasetsDraw(chart) {
    // 개발자 유형 차트인지 확인
    if (!chart.canvas.closest('.dev-type-chart')) {
      return;
    }

    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    
    if (!meta || !meta.data || !chart.data.datasets[0].percentage) {
      return;
    }

    meta.data.forEach((element, index) => {
      const percentage = chart.data.datasets[0].percentage[index];
      const { x, y } = element.tooltipPosition();
      
      ctx.save();
      ctx.font = '12px nanumfont_Bold';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percentage}%`, x + 10, y);
      ctx.restore();
    });
  }
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  percentageLabelsPlugin
);

const serverUrl = import.meta.env.VITE_SERVER_URL;
function DevType(props) {
  const navigate = useNavigate();
  const data = props.data;
  const devType = `${serverUrl}/static/images/${data.code}.png`;
  const factors = [data.typeA, data.typeB, data.typeC, data.typeD];
  const pos = data.pos;
  const neg = data.neg;

  return (
    <>
      <div className="d-flex fs-4 bold mb-2 justify-content-between">
        <div style={{fontFamily: "nanumfont_ExtraBold"}}>개발자 유형</div>
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('test')} style={{fontFamily: "nanumfont_Bold"}}>
            다시 검사하기
          </button>
        </div>
      </div>
      <div className="mb-4">
        <DevTypeCard
          devType={devType}
          descEng={data.desc}
          descKr={data.descKR}
          typeEng={data.nickname}
          typeKr={data.nicknameKR}
          factors={factors}
        />
      </div>
      <div className="d-flex justify-content-around flex-wrap gap-2">
        <div className="mb-2">
          <div className="fs-5" style={{fontFamily: "nanumfont_ExtraBold"}}>상생 파트너</div>
          <ImageDescBox
            src={`${serverUrl}/static/images/${pos.code}.png`}
            title={pos.nicknameKR}
            desc={pos.descKR}
            attrs={pos.desc.split(' ')}
          />
        </div>
        {/* 오른쪽: 통계 그래프 */}
        <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
          <div className="fs-5 mb-3" style={{fontFamily: "nanumfont_ExtraBold"}}>개발자 유형 통계</div>
          {loading ? (
            <div className="text-center">로딩 중...</div>
          ) : (
            <div style={{ 
              height: '300px',
              overflowY: 'auto', 
              paddingRight: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 8px 8px'
            }} className="dev-type-chart">
              <div style={{ height: '700px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DevType;
