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

      <div className="desc-textbox" style={{ textAlign: "center", backgroundColor: '#f9f9f9' }}>
        <h4
          className="text-center mb-4"
          style={{ fontFamily: "nanumfont_Bold", fontSize: '1.4rem', lineHeight: 1.6,
                marginTop: '25px' }}
        >
          &lt;{title}&gt;
        </h4>
      </div>
    </div>
  );
}

export default ImageDescBox;
