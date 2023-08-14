import { useEffect, useState } from 'react';

function AnnualSelectors() {
  const [yearList, setYearList] = useState([2019, 2020, 2021, 2022, 2023]);
  useEffect(() => {
    setYearList([2019, 2020, 2021, 2022, 2023]);
  }, []);
  const endYear = Math.max(...yearList);
  return (
    <div className="d-flex text-lg mt-4">
      <div className="dropdown">
        <button
          className="btn btn-primary dropdown-toggle me-2"
          id="yearDropdown"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          {endYear}
        </button>
        <ul className="dropdown-menu" aria-labelledby="yearDropdown">
          {yearList.map((year) => {
            return (
              <li key={`year-${year}`}>
                <button className="dropdown-item year-item">{year}</button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="form-check form-switch flex-switch">
        <input className="form-check-input" id="totalSwitch" type="checkbox" role="switch" defaultChecked />
        <label className="form-check-label" htmlFor="totalSwitch">
          <span className="switch-toggle">개별</span>
          <span className="switch-toggle bold">합계</span>
        </label>
      </div>
    </div>
  );
}

export default AnnualSelectors;
