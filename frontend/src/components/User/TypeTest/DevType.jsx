import { useNavigate } from 'react-router-dom';
import DevTypeCard from './DevTypeCard';
import ImageDescBox from './ImageDescBox';
import { useState, useEffect } from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
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
        const response = await fetch(`${serverUrl}/api/dev-types/stats`);
        const data = await response.json();
        // 데이터를 count 기준으로 정렬
        const sortedData = data.sort((a, b) => b.count - a.count);
        setStats(sortedData);
      } catch (error) {
        console.error('통계 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const chartData = {
    labels: stats.map((stat, index) => `${index + 1}. ${stat.type}`),
    datasets: [
      {
        data: stats.map(stat => stat.count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
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
          label: (context) => `${context.raw}명`,
        },
      },
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
              padding: '16px',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px'
            }}>
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
