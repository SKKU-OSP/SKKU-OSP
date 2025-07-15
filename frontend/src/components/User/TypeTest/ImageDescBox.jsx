function ImageDescBox(props) {
  const src = props.src;
  const title = props.title;
  const desc = props.desc;
  const attrs = props.attrs;

  const bgImgStyle = {
    backgroundColor: '#ffffff',
    height: '150px',            // 상단 네모 영역 높이
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <div className="desc-box" style={{ width: '100%' }}>
      {/* 상단 이미지 영역 */}
      <div className="desc-img" style={bgImgStyle}>
        <img
          src={src}
          alt="dev type"
          style={{
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
          }}
        />
      </div>

      <div
        className="desc-textbox"
        style={{
          backgroundColor: '#072a60',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '120px',
        }}
      >
        {title && (
          <h4
            className="text-center mb-4"
            style={{
              fontFamily: "nanumfont_Bold",
              fontSize: '1.8rem',
              lineHeight: 1.3,
              margin: 0,
              marginBottom: '12px',
              color: '#fff'
            }}
          >
            {title}
          </h4>
        )}
        <p
          style={{
            fontFamily: "nanumfont_Regular",
            fontSize: '1.0rem',
            whiteSpace: 'pre-line',
            lineHeight: 1.5,
            color: '#fff',
            margin: 0
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

export default ImageDescBox;
