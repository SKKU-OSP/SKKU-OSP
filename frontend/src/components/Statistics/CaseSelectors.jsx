import { useCaseNumStore } from '../../stores/statistics/statisticsStore';
import Form from 'react-bootstrap/Form';

function CaseSelectors() {
  const { absence, major, handleAbsenceSwitch, handleMajorSwitch } = useCaseNumStore();

  return (
    <Form className="d-flex text-lg">
      <Form.Check
        type="switch"
        label={`휴학생 ${absence ? '포함' : '미포함'}`}
        onChange={handleAbsenceSwitch}
        checked={absence}
        className="flex-switch"
      />
      <Form.Check
        type="switch"
        label={`복수전공 ${major ? '포함' : '미포함'}`}
        onChange={handleMajorSwitch}
        checked={major}
        className="flex-switch"
      />
    </Form>
  );
}

export default CaseSelectors;
