import ResultProgress from './ResultProgress';

function DevTypeCard(props) {
  const devType = props.devType;
  const descEng = props.descEng;
  const descKr = props.descKr;
  const typeEng = props.typeEng;
  const typeKr = props.typeKr;
  const factors = props.factors;

  return (
    <div id="gbti-id-card" style={{ position: 'relative' }}>
      <div id="gbti-id-card-content" className="modal-gbti-card">
        <div className="weak-text ms-3 text-start">SOSD ID CARD</div>
        <div className="d-flex justify-content-center">
          <div className="gbti-content d-flex justify-content-center" style={{ padding: '1% 4%', width: '50%' }}>
            <img src={devType} className="gbti-img" />
          </div>
          <div
            className="gbti-content d-flex flex-column justify-content-between"
            style={{ padding: '1% 4%', width: '50%' }}
          >
            <p
              id="descEng"
              className="text-center text-label"
              style={{ fontSize: '12px', marginBottom: '2px', fontWeight: '600', fontFamily: "nanumfont_Bold"}}
            >
              {descEng}
            </p>
            <p id="descKr" className="text-center text-label mb-1" style={{ fontSize: '14px', fontWeight: '600', fontFamily: "nanumfont_Bold" }}>
              {descKr}
            </p>
            <h4 id="typeEng" className="text-center" style={{fontFamily: "nanumfont_Bold"}}>
              {typeEng}
            </h4>
            <h4 id="typeKr" className="text-center" style={{fontFamily: "nanumfont_Bold"}}>
              {typeKr}
            </h4>
            <div className="d-flex justify-content-between text-label">
              <span>MultiPlay</span>
              <span>SinglePlay</span>
            </div>
            <ResultProgress factor={factors[3]} />
            <div className="d-flex justify-content-between text-label">
              <span>Creative</span>
              <span>Efficient</span>
            </div>
            <ResultProgress factor={factors[2]} />
            <div className="d-flex justify-content-between text-label">
              <span>CoolHead</span>
              <span>WarmHeart</span>
            </div>
            <ResultProgress factor={factors[1]} />
            <div className="d-flex justify-content-between text-label">
              <span>Fluid</span>
              <span>Steady</span>
            </div>
            <ResultProgress factor={factors[0]} />
          </div>
        </div>
        <div className="weak-text me-3 text-end">2023 &#9426; SKKU-OSP</div>
      </div>
    </div>
  );
}

export default DevTypeCard;