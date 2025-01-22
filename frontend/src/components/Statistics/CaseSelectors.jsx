import Form from 'react-bootstrap/Form';
import { useChartFilterStore } from '../../stores/statistics/chartDataStore';

function CaseSelectors() {
  const { absence, major, toggleAbsence, toggleMajor } = useChartFilterStore();

  return (
    <Form className="d-flex text-lg">
      <Form.Check
        type="switch"
        label={`휴학생 ${absence ? '포함' : '미포함'}`}
        onChange={() => toggleAbsence()}
        className="flex-switch"
        checked={absence}
      />
      <Form.Check
        type="switch"
        label={`복수전공 ${major ? '포함' : '미포함'}`}
        onClick={() => toggleMajor()}
        className="flex-switch"
        checked={major}
      />
    </Form>
  );
}

export default CaseSelectors;
