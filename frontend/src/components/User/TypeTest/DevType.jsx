import { useNavigate } from 'react-router-dom';
import DevTypeCard from './DevTypeCard';
import ImageDescBox from './ImageDescBox';

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
        <div className="mb-2">
          <div className="fs-5" style={{fontFamily: "nanumfont_ExtraBold"}}>상극 파트너</div>
          <ImageDescBox
            src={`${serverUrl}/static/images/${neg.code}.png`}
            title={neg.nicknameKR}
            desc={neg.descKR}
            attrs={neg.desc.split(' ')}
          />
        </div>
      </div>
    </>
  );
}

export default DevType;
