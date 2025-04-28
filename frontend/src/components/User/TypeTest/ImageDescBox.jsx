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
    <div className="desc-box" style={{ ...bgImgStyle, width: '100%' }}>
      <div className="text-center mt-5">
        <span className="badge text-bg-light fs-5 bold">{title}</span>
      </div>

      <div className="desc-textbox" style={{ textAlign: "left"}}>
        <div className="desc-img">
          <img src={src} className="desc-center-img" />
        </div>
        {/* {attrs &&
          attrs.map((attr) => (
            <span key={attr} className="badge text-bg-light fs-7" style={{fontFamily: "nanumfont_Bold"}}>
              #{attr}
            </span>
          ))} */}
        {attrs && (
          <>
            <span className="badge text-bg-light fs-7" style={{ fontFamily: "nanumfont_Bold" }}>
              #{attrs[3]}
            </span>
            <span className="badge text-bg-light fs-7" style={{ fontFamily: "nanumfont_Bold" }}>
              #{attrs[2]}
            </span>
            <br />
            <span className="badge text-bg-light fs-7" style={{ fontFamily: "nanumfont_Bold" }}>
              #{attrs[1]}
            </span>
            <span className="badge text-bg-light fs-7" style={{ fontFamily: "nanumfont_Bold" }}>
              #{attrs[0]}
            </span>
          </>
        )}
        <p className="fs-7" style={{fontFamily: "nanumfont_Bold", marginTop: "16px"}}>{desc}</p>
      </div>
    </div>
  );
}

export default ImageDescBox;
