import { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';

function CaseSelectors(props) {
  const [caseNum, setCaseNum] = useState(0);

  const hadleAbsenceSwitch = (e) => {
    setCaseNum((prev) => (e.target.checked ? prev - 2 : prev + 2));
  };

  const hadleMajorSwitch = (e) => {
    setCaseNum((prev) => (e.target.checked ? prev - 1 : prev + 1));
  };

  useEffect(() => {
    props.onSetCaseNum(caseNum);
  }, [props, caseNum]);

  const absenceLabel = caseNum >= 2 ? '미포함' : '포함';
  const majorLabel = caseNum % 2 ? '미포함' : '포함';
  return (
    <Form className="d-flex text-lg">
      <Form.Check
        type="switch"
        label={`휴학생 ${absenceLabel}`}
        onClick={hadleAbsenceSwitch}
        className="flex-switch"
        defaultChecked
      />
      <Form.Check
        type="switch"
        label={`복수전공 ${majorLabel}`}
        onClick={hadleMajorSwitch}
        className="flex-switch"
        defaultChecked
      />
    </Form>
  );
}

export default CaseSelectors;
