function AnnualDetails() {
  return (
    <div className="row pt-2" id="overviewChart">
      <div className="col-md-3">
        <div className="card p-3">
          <h5 className="card-title" id="scoreTitle">
            3점 이상 인원
          </h5>
          <div className="text-center kpi">
            <span className="current text-primary" id="overGoalNumerator"></span> /{' '}
            <span className="total" id="overGoalDenominator"></span>
            <span className="percent-wrapper">
              (
              <span className="percent" id="overGoalPercent">
                0.0%
              </span>
              )
            </span>
          </div>
          <canvas id="scoreOverview"></canvas>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3">
          <h5 className="card-title" id="commitTitle">
            총 Commit 수
          </h5>
          <div className="text-center kpi">
            <span className="current text-primary" id="commitNumerator"></span> /{' '}
            <span className="total" id="commitDenominator"></span>
            <span className="percent-wrapper">
              (
              <span className="percent" id="commitPercent">
                0.0%
              </span>
              )
            </span>
          </div>
          <canvas id="commitOverview"></canvas>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3">
          <h5 className="card-title" id="starTitle">
            총 Star 수
          </h5>
          <div className="text-center kpi">
            <span className="current text-primary" id="starNumerator"></span> /{' '}
            <span className="total" id="starDenominator"></span>
            <span className="percent-wrapper">
              (
              <span className="percent" id="starPercent">
                0.0%
              </span>
              )
            </span>
          </div>
          <canvas id="starOverview"></canvas>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3">
          <h5 className="card-title" id="repoTitle">
            총 Repo 수
          </h5>
          <div className="text-center kpi">
            <span className="current text-primary" id="repoNumerator"></span> /{' '}
            <span className="total" id="repoDenominator"></span>
            <span className="percent-wrapper">
              (
              <span className="percent" id="repoPercent">
                0.0%
              </span>
              )
            </span>
          </div>
          <canvas id="repoOverview"></canvas>
        </div>
      </div>
    </div>
  );
}

export default AnnualDetails;
