const DetailCardContent = (props) => {
  const cardTitle = props.cardTitle;
  const data = props.data;

  return (
    <>
      <h5 className="card-title">{cardTitle}</h5>
      <div className="text-center kpi">
        <span className="current text-primary">{data.target}</span> / <span className="total">{data.total}</span>
        <span className="percent-wrapper">
          (<span className="percent">{data.percent}%</span>)
        </span>
      </div>
    </>
  );
};

export default DetailCardContent;
