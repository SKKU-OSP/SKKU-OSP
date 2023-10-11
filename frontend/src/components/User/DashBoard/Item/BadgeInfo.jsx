import classes from './BadgeInfo.module.css';
function BadgeInfo(props) {
  const icon = props.icon;
  const label = props.label;
  const desc = props.desc;
  const badgeColor = props.color;

  return (
    <div className="d-flex gap-3 ps-3">
      <div className={classes.badgeContainer} style={{ backgroundColor: badgeColor }}>
        {icon}
      </div>
      <div>
        <div className={classes.badgeLabel}>{label}</div>
        <div className={classes.badgeDesc}>{desc}</div>
      </div>
    </div>
  );
}

export default BadgeInfo;
