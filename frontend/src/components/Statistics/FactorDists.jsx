function FactorDists() {
  return (
    <div className="tab-pane fade show mt-2" id="pills-score">
      <div className="row mt-2">
        <div className="col-md-4">
          <div className="card p-3">
            <h5 className="card-title factor">전체 Score 분포</h5>
            <canvas id="totalScoreDist"> </canvas>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3">
            <h5 className="card-title factor">학번별 Score 분포</h5>
            <canvas id="sidScoreDist"></canvas>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3">
            <h5 className="card-title factor">학과별 Score 분포</h5>
            <canvas id="deptScoreDist"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FactorDists;
