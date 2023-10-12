import DevTypeCard from './DevTypeCard';
import ImageDescBox from './ImageDescBox';

const serverUrl = import.meta.env.VITE_SERVER_URL;
function DevType(props) {
  const data = props.data;
  const devType = `${serverUrl}/static/images/${data.code}.png`;
  const factors = [data.typeA, data.typeB, data.typeC, data.typeD];
  const pos = data.pos;
  const neg = data.neg;

  return (
    <div>
      <DevTypeCard
        devType={devType}
        descEng={data.desc}
        descKr={data.descKR}
        typeEng={data.nickname}
        typeKr={data.nicknameKR}
        factors={factors}
      />
      <div className="d-flex justify-content-around flex-wrap">
        <div>
          <div className="fs-5">상생 파트너</div>
          <ImageDescBox
            src={`${serverUrl}/static/images/${pos.code}.png`}
            title={pos.nicknameKR}
            desc={pos.descKR}
            attrs={pos.desc.split(' ')}
          />
        </div>
        <div>
          <div className="fs-5">상극 파트너</div>
          <ImageDescBox
            src={`${serverUrl}/static/images/${neg.code}.png`}
            title={neg.nicknameKR}
            desc={neg.descKR}
            attrs={neg.desc.split(' ')}
          />
        </div>
      </div>
    </div>
  );
}

export default DevType;
