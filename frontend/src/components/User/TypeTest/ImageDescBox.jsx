function ImageDescBox(props) {
  const src = props.src;
  const title = props.title;
  const desc = props.desc;
  const attrs = props.attrs;

  const bgImgStyle = {
    backgroundImage: `url('${src}')`,
    backgroundSize: '300px'
  };

  return (
    <div className="desc-box" style={bgImgStyle}>
      <div className="text-center mt-5">
        <span className="badge text-bg-light fs-5 bold">{title}</span>
      </div>

      <div className="desc-textbox">
        <div className="desc-img">
          <img src={src} className="desc-center-img" />
        </div>
        {attrs &&
          attrs.map((attr) => (
            <span key={attr} className="badge text-bg-light fs-7" style={{fontFamily: "nanumfont_Bold"}}>
              #{attr}
            </span>
          ))}
        <p className="fs-6" style={{fontFamily: "nanumfont_Bold"}}>{desc}</p>
      </div>
    </div>
  );
}

export default ImageDescBox;
