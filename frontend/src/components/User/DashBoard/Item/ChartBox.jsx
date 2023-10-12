import { BsFillSquareFill } from 'react-icons/bs';

export default function ChartBox(props) {
  const borderStyle = {
    border: '1px var(--gray-500) solid'
  };
  const label = props.label;
  const desc = props.desc;
  const color = props.color;
  const chart = props.chart;

  return (
    <div className="d-flex justify-content-between p-2" style={borderStyle}>
      <div className="col-7 mb-3">
        <div className="d-flex align-items-center gap-2 fs-6 bold">
          <BsFillSquareFill color={color} /> {label}
        </div>
        <div className="d-flex gap-2 fs-7 weak-text">{desc}</div>
      </div>
      <div className="col-4">{chart}</div>
    </div>
  );
}
