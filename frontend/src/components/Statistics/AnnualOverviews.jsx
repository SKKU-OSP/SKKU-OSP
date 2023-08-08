import './Statistic.css';

function AnnualOverviews() {
  return (
    <div className="row pt-2 mb-2">
      <div className="col-percent-20">
        <div className="card p-2">
          <h5 className="card-title">연도별 Score</h5>
          <canvas id="scoreYear"></canvas>
        </div>
      </div>
      <div className="col-percent-20">
        <div className="card p-2">
          <h5 className="card-title">연도별 Commit</h5>
          <canvas id="commitYear"></canvas>
        </div>
      </div>
      <div className="col-percent-20">
        <div className="card p-2">
          <h5 className="card-title">연도별 Star</h5>
          <canvas id="starYear"></canvas>
        </div>
      </div>
      <div className="col-percent-20">
        <div className="card p-2">
          <h5 className="card-title">연도별 PR</h5>
          <canvas id="prYear"></canvas>
        </div>
      </div>
      <div className="col-percent-20">
        <div className="card p-2">
          <h5 className="card-title">연도별 Issue</h5>
          <canvas id="issueYear"></canvas>
        </div>
      </div>
    </div>
  );
}

export default AnnualOverviews;
