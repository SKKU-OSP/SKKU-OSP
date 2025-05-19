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

const serverUrl = import.meta.env.VITE_SERVER_URL;

// 기본 Chart.js 모듈은 전역에 등록 (플러그인은 여기서 등록하지 않습니다)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Chart.js 4.3.3에 맞게 백분율 표시 플러그인 정의
const percentageLabelsPlugin = {
  id: 'percentageLabels',
  afterDatasetsDraw(chart, args, options) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    if (!dataset || !dataset.percentage) return;
    const meta = chart.getDatasetMeta(0);
    meta.data.forEach((bar, index) => {
      const percentage = dataset.percentage[index];
      if (percentage === undefined) return;
      const xPos = bar.x + 10;
      const yPos = bar.y;
      ctx.save();
      ctx.font = '12px nanumfont_Bold';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percentage}%`, xPos, yPos);
      ctx.restore();
    });
  }
};

function DevType(props) {
  const navigate = useNavigate();
  const data = props.data;
  const devType = `${serverUrl}/static/images/${data.code}.png`;
  const factors = [data.typeA, data.typeB, data.typeC, data.typeD];
  const pos = data.pos;
  const neg = data.neg;
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // devtype 페이지에 진입 시 플러그인을 등록하고, 벗어날 때 해제합니다.
  useEffect(() => {
    ChartJS.register(percentageLabelsPlugin);
    return () => {
      ChartJS.unregister(percentageLabelsPlugin);
    };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${serverUrl}/user/api/dashboard/dev-type/statistics/`);
        if (response.data.status === 'success' && response.data.data) {
          const statsData = response.data.data;
          // total 필드를 count로 사용
          const formattedData = Object.entries(statsData).map(([type, data]) => ({
            type: type,
            koreanType: data.nicknameKR,
            count: data.total || 0
          }));

          // 전체 합계 계산
          const total = formattedData.reduce((sum, item) => sum + item.count, 0);
          
          // 비율 계산
          const dataWithPercentage = formattedData.map(item => ({
            ...item,
            percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0'
          }));

          // count 기준으로 정렬
          const sortedData = dataWithPercentage.sort((a, b) => b.count - a.count);
          setStats(sortedData);
        } else {
          setStats([]);
        }
      } catch (error) {
        console.error('통계 데이터 로딩 실패:', error);
        setStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // stats가 없을 경우 기본값으로 maxCount를 설정
  const rawMax = stats.length > 0 ? Math.max(...stats.map(stat => stat.count)) : 100;
  const maxCount = Math.ceil(rawMax * 1.2);

  const chartData = {
    labels: stats.map((stat, index) => `${index + 1}. ${stat.koreanType}`),
    datasets: [
      {
        data: stats.map(stat => stat.count),
        percentage: stats.map(stat => stat.percentage), // 백분율 데이터
        backgroundColor: stats.map(stat => 
          stat.type === data.code 
            ? 'rgba(255, 99, 132, 0.5)'  // 내 유형: 분홍색
            : 'rgba(54, 162, 235, 0.5)'   // 그 외: 파란색
        ),
        borderColor: stats.map(stat => 
          stat.type === data.code 
            ? 'rgba(255, 99, 132, 1)'
            : 'rgba(54, 162, 235, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const stat = stats[context.dataIndex];
            const isMyType = stat.type === data.code;
            return ` ${stat.count}명${isMyType ? ' (내 유형)' : ''}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: false },
        ticks: {
          callback: (value) => {
            if (value > rawMax) return '';
            return `${value}명`;
          }
        },
        max: maxCount,
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { family: 'nanumfont_Bold' },
        },
      },
    },
  };

  return (
    <>
      <div className="d-flex fs-4 bold mb-4 justify-content-between">
        <div style={{ fontFamily: "nanumfont_ExtraBold" }}>개발자 유형</div>
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('test')} style={{ fontFamily: "nanumfont_Bold" }}>
            다시 검사하기
          </button>
        </div>
      </div>
      <div className="mb-5">
        <DevTypeCard
          devType={devType}
          desc={data.desc}
          descKr={data.descKR}
          typeEng={data.nickname}
          typeKr={data.nicknameKR}
          factors={factors}
        />
      </div>
      <div className="d-flex gap-3">
        {/* 왼쪽: 상생/상극 파트너 */}
        <div className="d-flex gap-3" style={{ flex: '1.6' }}>
          <div style={{ flex: '1' }}>
            <div className="fs-5 mb-3" style={{ fontFamily: "nanumfont_ExtraBold" }}>상생 파트너</div>
            <ImageDescBox
              src={`${serverUrl}/static/images/${pos.code}.png`}
              title={pos.nickname}
              desc={pos.descKR}
              attrs={pos.desc.split(' ')}
            />
          </div>
          <div style={{ flex: '1' }}>
            <div className="fs-5 mb-3" style={{ fontFamily: "nanumfont_ExtraBold" }}>상극 파트너</div>
            <ImageDescBox
              src={`${serverUrl}/static/images/${neg.code}.png`}
              title={neg.nickname}
              desc={neg.descKR}
              attrs={neg.desc.split(' ')}
            />
          </div>
        </div>

        {/* 오른쪽: 통계 그래프 */}
        <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
          <div className="fs-5 mb-3" style={{ fontFamily: "nanumfont_ExtraBold" }}>개발자 유형 통계</div>
          {loading ? (
            <div className="text-center">로딩 중...</div>
          ) : (
            stats.length > 0 ? (
              <div style={{ 
                height: '300px',
                overflowY: 'auto', 
                paddingRight: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: 'rgba(0, 0, 0, 0.1) 0px 8px 8px'
              }}>
                <div style={{ height: '700px' }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            ) : (
              <div className="text-center">통계 데이터가 없습니다.</div>
            )
          )}
        </div>
      </div>
    </>
  );
}

export default DevType;
