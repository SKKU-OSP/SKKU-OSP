import Form from 'react-bootstrap/Form';

function CaseSelectors() {
  return (
    <Form className="d-flex text-lg">
      <Form.Check type="switch" id="absence-switch" label="휴학생 포함" checked />
      <Form.Check type="switch" id="major-switch" label="복수전공 포함" checked />
      {/* <div className="form-check form-switch">
        <input className="form-check-input" id="absenceSwitch" type="checkbox" role="switch" checked="checked" />
        <label className="form-check-label" htmlFor="absenceSwitch">
          <span className="bold">휴학생 </span>
          <span className="switch-toggle-absence none">미포함 </span>
          <span className="switch-toggle-absence bold">포함 </span>
        </label>
      </div>
      <div className="form-check form-switch">
        <input className="form-check-input" id="majorSwitch" type="checkbox" role="switch" checked="checked" />
        <label className="form-check-label" htmlFor="majorSwitch">
          <span className="bold">복수전공 </span>
          <span className="switch-toggle-major none">미포함 </span>
          <span className="switch-toggle-major bold">포함 </span>
        </label>
      </div> */}
    </Form>
  );
}

export default CaseSelectors;
