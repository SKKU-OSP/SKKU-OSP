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
    <div class="desc-box" style={bgImgStyle}>
      <div class="text-center mt-5">
        <span class="badge text-bg-light fs-5 bold">{title}</span>
      </div>

      <div class="desc-textbox">
        <div class="desc-img">
          <img src={src} className="desc-center-img" />
        </div>
        {attrs && attrs.map((attr) => <span class="badge text-bg-light fs-7">#{attr}</span>)}
        <p class="fs-6">{desc}</p>
      </div>
    </div>
  );
}

export default ImageDescBox;
