function intsAppend(){
    var formData = $("#intsform").serialize();
    formData += "&act=" + 'append';
    formData += "&target=" + '';
    console.log(formData);

    var selected = $("#intsform").find(".placeholder").text();
    console.log(selected);
    if(selected == "Tag"){
        alert("선택하고 추가해주세요");
        return;
    }
    var ints = $('.bg-tag-domain');
    var intsarr = [];
    console.log(ints);

    for(int of ints){
      console.log($(int).text());
      intsarr.push($(int).text());
    }

    if(!(intsarr.includes(selected))){
      $("#interestsdiv").append(`<span id='intspan_`+ selected +`'>
        <button type="submit" class="btn btn-outline-dark badge delete-domain" name="action" value="delete `+ selected +`" onclick="intsDelete('`+ selected +`'); return false;">` + selected +`
        </button>
        </span>`);
        $.ajax({
        cache : false,
        url : "interests", 
        type : 'POST', 
        data : formData,
        success : function(data) {
            console.log('success');
        }, 

        error : function(xhr, status) {
            // alert(xhr + " : " + status);
            console.log('error');
            // alert("선택하고 추가해주세요")

        }
        });

    }
}
function intsDelete(target){
    var formData = $("#intsform").serialize();
    formData += "&act=" + 'delete';
    formData += "&target=" + target;
    console.log(formData);

    console.log("span[id='intspan_" +  target + "']");
    $("span[id='intspan_" +  target + "']").remove();

    $.ajax({
        cache : false,
        url : "interests", // 요기에
        //processData: false,
        //contentType: false,
        type : 'POST', 
        data : formData,
        success : function(data) {
            //var jsonObj = JSON.parse(data);
            console.log('success');
        }, // success 

        error : function(xhr, status) {
            // alert(xhr + " : " + status);
            console.log('error');
        }
    });

}



function reload_window(){
    return new Promise(function(resolve){
      console.log('language is deleted, reload window');
      $('#languagediv').load(window.location.href + ' #languagediv');
      resolve('hello');
    });
  }
async function reload(){
  let a = await reload_window();
  console.log('middle of async');
  return('hello');
}
$(document).ready(function() {
    var langlists = $('.langlabel');
    console.log(langlists);


});
function languageAppend(){
  var formData = $("#languageform").serialize();
  formData += "&act=" + 'append';
  formData += "&target=" + '';
  console.log(formData);
  var langs = $('.langlabel');
  var langsarr = [];

  console.log(langs);
  for(lang of langs){
      console.log($(lang).attr('for').slice(4));
      langsarr.push($(lang).attr('for').slice(4));
  }
  var selected = $("#langdiv").find(".placeholder").text();
  //selected = selected.slice(3);
  if(selected == "Language tag"){
    alert("선택하고 추가해주세요");
    return;
    }
  var selected_nospace;

  selected_nospace = selected.replace(/ /g, "");
  console.log(langsarr);
  console.log(selected);

  console.log(!(langsarr.includes(selected)));
  if(!(langsarr.includes(selected))){
  
    $.ajax({
    cache : false,
      url : "languages",
      type : 'POST', 
      data : formData,
      success : function(data) {
        console.log('success');
      }, 
      error : function(xhr, status) {
          // alert(xhr + " : " + status);
          console.log('선택하고 추가해주세요');
          // alert("선택하고 추가해주세요")
      }  
    });
    $("#languagediv").append(`
    <div id="langdiv_`+ selected_nospace + `"class="langdiv">
    <span style="display:inline-block; width: 120px;">
        <label for="tag_`+ selected_nospace + `" class="badge bg-tag-language me-1 langlabel" style="height:20px; margin-bottom:5px; ">` + selected + `</label>
    </span>
    <span class="range-wrap" style="margin-right:30px;">
        <input style="width:50%; color:#0094FF;" type="range" class="form-control-range lang-tag" min="0" max="4" step="1" value ="0" name ="tag_`+ selected +`" id="tag_`+ selected +`" list="tickmarks">
        <!--output for="range" class="bubble" id="out_` + selected_nospace + `"></output-->
    </span>  
    <button class="btn delete-lang" name="action" onclick="languageDelete('`+ selected +`', '`+ selected_nospace + `'); return false;">
        <svg width="14" height="19" viewBox="0 0 14 19" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 16.5C1 17.6 1.9 18.5 3 18.5H11C12.1 18.5 13 17.6 13 16.5V4.5H1V16.5ZM3 6.5H11V16.5H3V6.5ZM10.5 1.5L9.5 0.5H4.5L3.5 1.5H0V3.5H14V1.5H10.5Z"/>
        </svg>
    </button>
    <hr>
    </div>
  `);
  }

}
function languageDelete(target){
  var formData = $("#languageform").serialize();
  formData += "&act=" + 'delete';
  target = encodeURIComponent(target);
  formData += "&target=" + target;

  // console.log(target);
  // console.log(formData);
  
  target = decodeURI(target);
  
  divtarget = target.replace(/ /g, "");
  divtarget = decodeURIComponent(divtarget);
  console.log(divtarget);
  console.log("div[id='langdiv_" +  divtarget + "']");
  $("div[id='langdiv_" +  divtarget + "']").remove();
  $.ajax({
    cache : false,
    url : "languages",
    type : 'POST', 
    data : formData,
    success : function(data) {
      //var jsonObj = JSON.parse(data);
      console.log('success');
    },

    error : function(xhr, status) {
      console.log('error');
    }

  });
  /*
  reload();
  */
}

function saveImg(){
  const imageInput = $("#photo")[0];
  console.log("imageInput: ", imageInput.files)
  
  if(imageInput.files.length > 0){
    const formData = new FormData();
    formData.append("photo", imageInput.files[0]);
    $.ajax({
      type:"POST",
      url: "image",
      processData: false,
      contentType: false,
      data: formData,
      success: function(rtn){
        const message = rtn.data.values[0];
        console.log("message: ", message)
      },
      err: function(err){
        //console.log("err:", err)
      }
    })

  }
}

function saveAll(){
  var formData = $("#portform").serialize();
  formData += '&' + $('#infoform').serialize();
  formData += '&' + $('#introform').serialize();
  formData += '&' + $('.lang-tag').serialize();
  formData += ''
  alert("저장되었습니다.");
  console.log(formData);
  $.ajax({
    cache : false,
    url : "save_all",
    type : 'POST', 
    data : formData,
    success : function(data, response) {
      //var jsonObj = JSON.parse(data);
      
      console.log('success');

    }, // success 

    error : function(xhr, status) {
      // alert(xhr + " : " + status);
      console.log('error');
    }

    });
  reload();

}

function readURL(input) {
if (input.files && input.files[0]) {
var reader = new FileReader();  
reader.onload = function (e) {
  $('#image_section').attr('src', e.target.result);  
}
  reader.readAsDataURL(input.files[0]);
}
console.log('이미지 확인2');
}

$("#profileimg").ready(function() {
console.log('change detected');
$("#photo").change(function(){
  console.log('이미지 확인1-로드');
  let input = this;
  console.log(input);
  if (input.files && input.files[0]) {
    console.log('preview avaliable');
    var reader = new FileReader();  
    reader.onload = function (e) {
      console.log($('#image_section'));
      $('#image_section').attr('src', e.target.result);
    }
    reader.readAsDataURL(input.files[0]);
  }
  console.log('이미지 확인2');
});
});


$(document).ready(function() {
plural = $('#plural_major').attr('value');
if(plural==0){
  $(":radio[id=flexRadioDefault1]").prop('checked', true);
}
else{
  $(":radio[id=flexRadioDefault2]").prop('checked', true);
}
$("#flexRadioDefault1").change(function(){
  console.log('라디오변경');
  var radio = $(':radio[name="flexRadioDefault"]:checked').val();
  $('#plural_major').val('0');
  console.log(radio);
  
});
$("#flexRadioDefault2").change(function(){
  console.log('라디오변경');
  var radio = $(':radio[name="flexRadioDefault"]:checked').val();
  $('#plural_major').val('1');
  console.log(radio);
  
});
});
$(document).ready(function() {
team_privacy = $('#teamprivacy').attr('value');
if(team_privacy == "True"){
  $(":radio[id=teamprivacyradio0]").prop('checked', true);
}
else{
  $(":radio[id=teamprivacyradio1]").prop('checked', true);
}
$("#teamprivacyradio0").change(function(){
  console.log('라디오변경');
  var radio = $(':radio[name="teamprivacyradio"]:checked').val();
  $('#teamprivacy').val('True');
  console.log($('#teamprivacy').attr('value'));
  
});
$("#teamprivacyradio1").change(function(){
  console.log('라디오변경');
  var radio = $(':radio[name="teamprivacyradio"]:checked').val();
  $('#teamprivacy').val('False');
  console.log($('#teamprivacy').attr('value'));
});
});
$(document).ready(function() {
article_privacy = $('#articleprivacy').attr('value');
if(article_privacy == "True"){
  $(":radio[id=articleprivacyradio0]").prop('checked', true);
}
else{
  $(":radio[id=articleprivacyradio1]").prop('checked', true);
}
$("#articleprivacyradio0").change(function(){
  console.log('라디오변경');
  var radio = $(':radio[name="articleprivacyradio"]:checked').val();
  $('#articleprivacy').val('True');
  console.log($('#articleprivacy').attr('value'));
  
});
$("#articleprivacyradio1").change(function(){
  console.log('라디오변경');
  var radio = $(':radio[name="articleprivacyradio"]:checked').val();
  $('#articleprivacy').val('False');
  console.log($('#articleprivacy').attr('value'));
});
});
$(document).ready(function() {
profile_privacy = $('#profileprivacy').attr('value');
console.log(profile_privacy);
if(profile_privacy== '0'){
  $(":radio[id=profileprivacyradio0]").prop('checked', true);
}
else if(profile_privacy == '1'){
  $(":radio[id=profileprivacyradio1]").prop('checked', true);
}
else{
  $(":radio[id=profileprivacyradio2]").prop('checked', true);
}
$("#profileprivacyradio0").change(function(){
  console.log('라디오변경');
  var radio = $(':radio[name="profileprivacyradio"]:checked').val();
  $('#profileprivacy').val('0');
  console.log($('#profileprivacy').attr('value'));
});
$("#profileprivacyradio1").change(function(){
  console.log('라디오변경');
  var radio = $(':radio[name="profileprivacyradio"]:checked').val();
  $('#profileprivacy').val('1');
  console.log($('#profileprivacy').attr('value'));
});
$("#profileprivacyradio2").change(function(){
  console.log('라디오변경');
  var radio = $(':radio[name="profileprivacyradio"]:checked').val();
  $('#profileprivacy').val('2');
  console.log($('#profileprivacy').attr('value'));
});
});