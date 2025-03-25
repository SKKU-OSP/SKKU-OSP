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
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${serverUrl}/user/api/dashboard/dev-type/statistics/`);
        if (response.data.status === 'success' && response.data.data) {
          const statsData = response.data.data;
          // total 필드의 값을 count로 사용하도록 변환
          const formattedData = Object.entries(statsData).map(([type, data]) => ({
            type: type,  // MBTI 코드
            koreanType: data.nicknameKR,  // API에서 받은 한글 닉네임
            count: data.total || 0  // total 필드의 값 사용
          }));

          // 전체 합계 계산
          const total = formattedData.reduce((sum, item) => sum + item.count, 0);
          
          // 비율 계산 추가
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

  const chartData = {
    labels: stats.map((stat, index) => `${index + 1}. ${stat.koreanType}`),
    datasets: [
      {
        data: stats.map(stat => stat.count),
        percentage: stats.map(stat => stat.percentage), // 백분율 데이터 추가
        backgroundColor: stats.map(stat => 
          stat.type === data.code 
            ? 'rgba(255, 99, 132, 0.5)'  // 사용자의 MBTI 타입인 경우 분홍색
            : 'rgba(54, 162, 235, 0.5)'  // 그 외의 경우 파란색
        ),
        borderColor: stats.map(stat => 
          stat.type === data.code 
            ? 'rgba(255, 99, 132, 1)'    // 사용자의 MBTI 타입인 경우 분홍색
            : 'rgba(54, 162, 235, 1)'    // 그 외의 경우 파란색
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
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const stat = stats[context.dataIndex];
            const isMyType = stat.type === data.code;
            return ` ${stat.count}명${isMyType ? ' (내 유형)' : ''}`;
          },
        },
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: false,
        },
        ticks: {
          callback: (value) => `${value}명`,
        },
        max: Math.max(...stats.map(stat => stat.count)) * 1.2,
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'nanumfont_Bold',
          },
        },
      },
    },
  };

  return (
    <>
      <div className="d-flex fs-4 bold mb-4 justify-content-between">
        <div style={{fontFamily: "nanumfont_ExtraBold"}}>개발자 유형</div>
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('test')} style={{fontFamily: "nanumfont_Bold"}}>
            다시 검사하기
          </button>
        </div>
      </div>
      <div className="mb-5">
        <DevTypeCard
          devType={devType}
          descEng={data.desc}
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
            <div className="fs-5 mb-3" style={{fontFamily: "nanumfont_ExtraBold"}}>상생 파트너</div>
            <ImageDescBox
              src={`${serverUrl}/static/images/${pos.code}.png`}
              title={pos.nicknameKR}
              desc={pos.descKR}
              attrs={pos.desc.split(' ')}
            />
          </div>
          <div style={{ flex: '1' }}>
            <div className="fs-5 mb-3" style={{fontFamily: "nanumfont_ExtraBold"}}>상극 파트너</div>
            <ImageDescBox
              src={`${serverUrl}/static/images/${neg.code}.png`}
              title={neg.nicknameKR}
              desc={neg.descKR}
              attrs={neg.desc.split(' ')}
            />
          </div>
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
