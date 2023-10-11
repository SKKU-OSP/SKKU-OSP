export default function SimpleBox(props) {
  const borderStyle = {
    border: '1px var(--gray-500) solid'
  };
  const numberWithCommas = (x) => {
    if (typeof x === 'number') return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    else return x;
  };
  const label = props.label;
  const value = numberWithCommas(props.value);
  return (
    <div className="text-center mb-3 col-5 col-lg-2 col-sm-4" style={borderStyle}>
      <div className="fs-3 bold">{value}</div>

      <div className="fs-7">{label}</div>
    </div>
  );
}
