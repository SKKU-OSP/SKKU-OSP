window.onload = function () {
  const main = document.querySelector('#main');
  const qna = document.querySelector('#qna');
  const result = document.querySelector('#result');
  const loading = document.querySelector('#loading');
  let selection=[];
  let endPoint=15;
  let factor=[0,0,0,0];
  let P,N,T,E;
  let descKr, descEng;
  let resultIdx;

  $("#btn-save-id-card").on("click", ()=>{
    const screenshotTarget = document.getElementById("gbti-id-card");
    html2canvas(screenshotTarget).then((canvas)=>{
      const base64image = canvas.toDataURL("image/png");
      var anchor = document.createElement('a');
      anchor.setAttribute("href", base64image);
      anchor.setAttribute("download", "my-image.png");
      anchor.click();
      anchor.remove();
    });
  });

  function setResult(){
    P= (factor[0]>0 ? 0:1);
    T= (factor[1]>0 ? 0:1);
    N= (factor[2]>0 ? 0:1);
    E= (factor[3]>0 ? 0:1); // factor 0,1 : ENTP 0000
    
    descKr = descList[0][P].descKr + descList[1][T].descKr + descList[2][N].descKr + descList[3][E].descKr; //한글 설명 생성
    descEng = descList[0][P].descEng + descList[1][T].descEng + descList[2][N].descEng + descList[3][E].descEng; //영문 설명 생성
    let devtype=(E ? 'I':'E') + (N ? 'S':'N') +  (T ? 'F':'T') + (P ? 'J':'P'); //devtype 결과 string
  
    console.log(devtype, descEng, descKr);

    for (let k=0;k<16;k++){
      if (devtype == resultList[k].mbti) resultIdx=k;
    }
    // var result0= document.querySelector('#descKr'); // 한글 설명 삽입
    // result0.innerHTML = descKr;

    var result1= document.querySelector('#descEng'); // 영문 설명 삽입
    result1.innerHTML = descEng;
    
    var result2= document.querySelector('#typeEng'); // 영문 타입명
    result2.innerHTML = resultList[resultIdx].typeEng;

    var result3= document.querySelector('#typeKr'); // 한글 타입명
    result3.innerHTML = resultList[resultIdx].typeKr;

    var resultImg = document.createElement('img'); 
    const imgDiv = document.querySelector('#resultImg');

    var imgURL= '/static/images/'+devtype+'.png';
    resultImg.src= imgURL;
    result.alt=devtype;
    imgDiv.appendChild(resultImg); //이미지 삽입
    saveTestResult({"type":devtype, "factor": factor});
  }

  function getResult(){

    qna.style.display="none";
    loading.style.display="flex";
    qna.style.WebkitAnimation = "fadeOut 0.5s";
    qna.style.animation = "fadeOut 0.5s";
    setTimeout(()=>{
      loading.style.WebkitAnimation = "fadeOut 0.5s";
      loading.style.animation = "fadeOut 0.5s";
      result.style.WebkitAnimation = "fadeIn 1s";
      result.style.animation = "fadeIn 1s";
      setTimeout(()=>{
        loading.style.display="none";
        result.style.display = "block";
        $(".btn-gbti").removeClass("none");
      },500)
      for (let k = 0; k < endPoint; k++){
        if(qnaList[k].answer[selection[k]].factor.length>1){
          if(qnaList[k].answer[selection[k]].factor[1]=='N') {
            factor[2]+=qnaList[k].answer[selection[k]].val[1];
          }
          else if(qnaList[k].answer[selection[k]].factor[1]=='S') {
            factor[2]-=qnaList[k].answer[selection[k]].val[1];
          }
          else if(qnaList[k].answer[selection[k]].factor[1]=='T') {
            factor[1]+=qnaList[k].answer[selection[k]].val[1];
          }
          else if(qnaList[k].answer[selection[k]].factor[1]=='F') {
            factor[1]-=qnaList[k].answer[selection[k]].val[1];
          }
          else if(qnaList[k].answer[selection[k]].factor[1]=='E') {
            factor[3]+=qnaList[k].answer[selection[k]].val[1];
          }
          else if(qnaList[k].answer[selection[k]].factor[1]=='I') {
            factor[3]-=qnaList[k].answer[selection[k]].val[1];
          }
          else if(qnaList[k].answer[selection[k]].factor[1]=='P') {
            factor[0]+=qnaList[k].answer[selection[k]].val[1];
          }
          else if(qnaList[k].answer[selection[k]].factor[1]=='J') {
            factor[0]-=qnaList[k].answer[selection[k]].val[1];
          }
        }

        if(qnaList[k].answer[selection[k]].factor[0]=='N') {
          factor[2]+=qnaList[k].answer[selection[k]].val[0];
        }
        else if(qnaList[k].answer[selection[k]].factor[0]=='S') {
          factor[2]-=qnaList[k].answer[selection[k]].val[0];
        }
        else if(qnaList[k].answer[selection[k]].factor[0]=='T') {
          factor[1]+=qnaList[k].answer[selection[k]].val[0];
        }
        else if(qnaList[k].answer[selection[k]].factor[0]=='F') {
          factor[1]-=qnaList[k].answer[selection[k]].val[0];
        }
        else if(qnaList[k].answer[selection[k]].factor[0]=='E') {
          factor[3]+=qnaList[k].answer[selection[k]].val[0];
        }
        else if(qnaList[k].answer[selection[k]].factor[0]=='I') {
          factor[3]-=qnaList[k].answer[selection[k]].val[0];
        }
        else if(qnaList[k].answer[selection[k]].factor[0]=='P') {
          factor[0]+=qnaList[k].answer[selection[k]].val[0];
        }
        else if(qnaList[k].answer[selection[k]].factor[0]=='J') {
          factor[0]-=qnaList[k].answer[selection[k]].val[0];
        }
      }
      console.log(factor);
      let result_progress = $(".test-result-bar");
      for (let i=0; i<result_progress.length; i++){
        let bars = $(result_progress[i]).children();
        let widthList = getProgressLength(factor[i], !!i);
        for (let j=0; j<bars.length; j++){
          bars[j].style.width = String(widthList[j]) + "%";
        }
      }
      setResult();
    }, 1000);
    function getProgressLength(factor, reverse=false){
      let result = []
      let val = factor
      if(reverse) val = -factor;
      if(val < 0){
        result.push(50+val/2);
        result.push(-val/2);
        result.push(50);
      }else{
        result.push(50);
        result.push(val/2);
        result.push(50-val/2);
      }
      return result;
    }
  }
  function addA(aTxt,qIdx,idx){
      
    var abox = document.querySelector('.abox');
    var answer = document.createElement('div');
    answer.className = 'answerbtn';
    answer.classList.add('my-2');
    answer.classList.add('mx-auto');
    answer.classList.add('answerList');
    answer.classList.add('fadeIn');
    abox.appendChild(answer);
    answer.innerHTML = aTxt;

    answer.addEventListener("click",function(){
      selection[qIdx] = idx;
      var children = document.querySelectorAll('.answerList');
      for (let k =0; k<children.length; k++){
        children[k].disabled = true;
        children[k].style.WebkitAnimation = "fadeOut 0.4s";
        children[k].style.animation = "fadeOut 0.4s";
        children[k].style.display = 'none';
      }
      setTimeout(()=>{
        for (let k =0; k<children.length; k++){
          children[k].style.display = 'none';
        }
      },200)
      if(qIdx<endPoint-1) nextQ(++qIdx);
      else {
        getResult();
      }
    },false);
  }

  function nextQ(qIdx){
    var qbox = document.querySelector('.qbox');
    qbox.innerHTML = qnaList[qIdx].q;
    for (let k in qnaList[qIdx].answer){
      addA(qnaList[qIdx].answer[k].a, qIdx, k);
    }
    var pgBar = document.querySelector('.progress-bar');
    pgBar.style.width= (100/endPoint) * qIdx + '%';
  }
  $("#gbti-test-start").on("click", ()=>{
    begin();
  });
  $("#gbti-test-restart").on("click", ()=>{
    begin();
  });

  function begin(){
    selection=[];
    endPoint=15;
    factor=[0,0,0,0];
    let imgDiv = $('#resultImg');
    imgDiv.empty(); //이미지 삭제
    $(".btn-gbti").addClass("none");
    result.style.display = "none";
    main.style.WebkitAnimation = "fadeOut 0.5s";
    main.style.animation = "fadeOut 0.5s";
    setTimeout(()=>{
      qna.style.WebkitAnimation = "fadeIn 0.5s";
      qna.style.animation = "fadeIn 0.5s"; 
      setTimeout(()=>{
        main.style.display="none";
        qna.style.display = "block";
      },200)
      let qIdx=0;
      nextQ(qIdx);
    }, 200);
  }
  function saveTestResult(data={}){
    $.ajax({
      type:"POST",
      url: `testresult`,
      data:JSON.stringify(data),
      dataType: 'json',
      processData: false,
      contentType: false,
      success:function(res){
        console.log("data pass result",res);
      },
      error : function(data){ 
        console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
      }
    });
  }
}
