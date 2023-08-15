import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

function AnnualSelectors({ years, targetYear, onSetYear, isTotal, onSetIsTotal }) {
  const handleSwitch = (e) => {
    onSetIsTotal(e.target.checked);
  };

  return (
    <div className="d-flex text-lg mt-4 gap-4 align-items-center">
      <DropdownButton id="dropdown-basic-button" title={targetYear}>
        {years &&
          years.map((year) => {
            return (
              <Dropdown.Item
                key={year}
                eventKey={year}
                onClick={() => {
                  onSetYear(year);
                }}
                active={year === targetYear}
              >
                {year}
              </Dropdown.Item>
            );
          })}
      </DropdownButton>
      <div className="form-check form-switch flex-switch">
        <input
          className="form-check-input"
          id="totalSwitch"
          type="checkbox"
          role="switch"
          defaultChecked
          onChange={handleSwitch}
        />
        <label className="form-check-label" htmlFor="totalSwitch">
          <span className={!isTotal ? 'switch-toggle bold' : 'switch-toggle'}>개별</span>
          <span className={isTotal ? 'switch-toggle bold' : 'switch-toggle'}>합계</span>
        </label>
      </div>
    </div>
  );
}

export default AnnualSelectors;
