$("#savebtn").click(function(){
  if(confirm("변경사항을 저장하시겠습니까 ?") == true){
    saveAll();
    alert("저장되었습니다. 프로필화면으로 돌아갑니다.");
  }
  else{
      return ;
  }
});
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

    for(int of ints){
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
    // 페이지 로드시에 이벤트 리스너 부여
    let items = document.querySelectorAll(".lang-item");
    items.forEach(item => {
        item.addEventListener("dragstart", () => {
            item.classList.add("dragging");
        });
        item.addEventListener("dragend", () => {
            item.classList.remove("dragging");
          });


    });


    let containers = document.querySelectorAll(".tier-container");
    containers.forEach(container => {
        container.addEventListener("dragover", e => {
          e.preventDefault();
          const afterElement = getDragAfterElement(container, e.clientX);
          const draggable = document.querySelector(".dragging");
          //console.log(draggable);
          if (draggable == null){
            console.log("undefined");
          }
          else if (afterElement === undefined) {
            container.appendChild(draggable);
          } else {
            container.insertBefore(draggable, afterElement);
          }
        });
      });

    
    const lang_trashcan = document.querySelector("#lang-trash-can")
    lang_trashcan.addEventListener("dragover", e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(lang_trashcan, e.clientX);
        const draggable = document.querySelector(".dragging");
        
        if (draggable == null){
          console.log("undefined");
          
        }
        if (afterElement === undefined) {          
            lang_trashcan.appendChild(draggable);
          } else {
            lang_trashcan.insertBefore(draggable, afterElement);
            
        }

    })
    lang_trashcan.addEventListener("drop", e => {
      e.preventDefault();
      const afterElement = getDragAfterElement(lang_trashcan, e.clientX);
      const draggable = document.querySelector(".dragging");
      
      if (draggable == null){
        console.log("undefined");
        
      }
      if (afterElement === undefined) {          
          lang_trashcan.removeChild(draggable);   
        } else {
          lang_trashcan.insertBefore(draggable, afterElement);
          
      }

  })

    function dragEnter(ev) {
        ev.preventDefault();
    }
    
    function drag(ev) {
        ev.dataTransfer.setData("text", ev.target.id);
    }
    
    function drop(ev) {
        ev.preventDefault();
        //var data = ev.dataTransfer.getData("text"); // img태그 아이디를 가져옴
        // ev.target.appendChild(document.getElementById(data)); // 다른 div태그에 img를 추가함(옮김. 드래그처리)
    }

    function deldrop(ev) {
        ev.preventDefault();
        var data = ev.dataTransfer.getData("text");
        var deltarget = document.getElementById(data);
        deltarget.remove();
    }


    function getDragAfterElement(container, x) {
        const draggableElements = [
          ...container.querySelectorAll(".draggable:not(.dragging)"),
        ];
      
        return draggableElements.reduce(
          (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) {
              return { offset: offset, element: child };
            } else {
              return closest;
            }
          },
          { offset: Number.NEGATIVE_INFINITY },
        ).element;
      }



function reload_window(){
    return new Promise(function(resolve){
      $('#languagediv').load(window.location.href + ' #languagediv');
      resolve('hello');
    });
  }
async function reload(){
  let a = await reload_window();
  return('hello');
}
$(document).ready(function() {
    var langlists = $('.langlabel');


});
function languageAppend(){
  var formData = $("#languageform").serialize();
  formData += "&act=" + 'append';
  formData += "&target=" + '';
  
  var langs = $('.stack-name');
  var langsarr = [];

  for(lang of langs){
      langsarr.push($(lang).attr('for').slice(4));
  }
  var selected = $("#langdiv").find(".placeholder").text();

  if(selected == "Language tag"){
    alert("선택하고 추가해주세요");
    return;
    }

  var selected_nospace;
  selected_nospace = selected.replace(/ /g, "");

  var logo;
  var color;
  var fontcolor;
  var name;


  console.log(!(langsarr.includes(selected)));
  if(!(langsarr.includes(selected))){
    $.ajax({
    cache : false,
      url : "languages",
      type : 'POST', 
      data : formData,
      dataType : 'json',
      success : function(retdata) {

        name = retdata.name;
        logo = retdata.logo;
        color = retdata.color;
        fontcolor = retdata.fontcolor;
        appendTagicon(name, logo, color, fontcolor);
      }, 
      error : function(xhr, status) {
          // alert(xhr + " : " + status);
          console.log('선택하고 추가해주세요');
          // alert("선택하고 추가해주세요")
      }  
    });
  }

  function appendTagicon(name, logo, color, fontcolor){
    if(logo == "default.svg"){
      $("#tier0-container").append(`
        <div id="tag_` + name.replace(" ", "_") + `"  draggable="true" class="lang-item" ondragstart="drag(event)">
          <div class="stack-box"  style="background-color: ` + color + `;">
            <span class="stack-name" for="tag_` + name.replace(" ", "_") + `" style="color:`+ fontcolor +`">`+ name +`</span>
          </div>
        </div>
      `);
    }
    else{
      $("#tier0-container").append(`
        <div id="tag_` + name.replace(" ", "_") + `"  draggable="true" class="lang-item" ondragstart="drag(event)">
          <div class="stack-box"  style="background-color: ` + color + `;">
            <img class="stack-icon" src="`+ logo +`/`+ fontcolor +`" alt="temp"/>
            <span class="stack-name" for="tag_` + name.replace(" ", "_") + `" style="color:`+ fontcolor +`">`+ name +`</span>
          </div>
        </div>
      `);
    }
    let newitem = document.querySelector("#tag_" + name.replace(" ", "_"));

    newitem.addEventListener("dragstart", () => {
      newitem.classList.add("dragging");
    });
    newitem.addEventListener("dragend", () => {
      newitem.classList.remove("dragging");
    }); 
  }
}

function saveImg(){
  const imageInput = $("#photo")[0];
  if($("#image_section").attr('src') == "/data/media/img/profile_img/default.jpg"){
    
    $.ajax({
      type: "POST",
      url: "imagedefault",
      headers: {'X-CSRFToken': csrftoken},
      success: function(rtn){


      },
      err: function(err){

      }
    })
    return;
  }



  if(imageInput.files.length > 0){
    const formData = new FormData();

    formData.append("photo", imageInput.files[0]);

    $.ajax({
      type:"POST",
      url: "image",
      headers: {'X-CSRFToken': csrftoken},
      mode: 'same-origin',
      processData: false,
      contentType: false,
      data: formData,
      success: function(rtn){


      },
      err: function(err){

      }
    })

  }
}

function saveAll(){
  let profiledata = {};
  profiledata.portfolio = $("#id_portfolio").val();
  profiledata.introduction = $("#id_introduction").val();
  profiledata.plural_major = $("#plural_major").val();
  profiledata.personal_email = $("#personal_email").val();
  profiledata.primary_email = $("#primary_email").val();
  profiledata.secondary_email = $("#secondary_email").val();
  profiledata.profileprivacy = $("#profileprivacy").val();
  profiledata.articleprivacy = $("#articleprivacy").val();
  profiledata.teamprivacy = $("#teamprivacy").val();

  let tier0langs = $("#tier0-container").children('.lang-item');
  let tier1langs = $("#tier1-container").children('.lang-item');
  let tier2langs = $("#tier2-container").children('.lang-item');
  let tier3langs = $("#tier3-container").children('.lang-item');
  let tier4langs = $("#tier4-container").children('.lang-item');

  var i;
  var tier0arr = {}
  var tier1arr = {}
  var tier2arr = {}
  var tier3arr = {}
  var tier4arr = {}

  for(i=0; i<tier0langs.length; i++) tier0arr[i] = tier0langs[i].id.slice(4)
  for(i=0; i<tier1langs.length; i++) tier1arr[i] = tier1langs[i].id.slice(4)
  for(i=0; i<tier2langs.length; i++) tier2arr[i] = tier2langs[i].id.slice(4)
  for(i=0; i<tier3langs.length; i++) tier3arr[i] = tier3langs[i].id.slice(4)
  for(i=0; i<tier4langs.length; i++) tier4arr[i] = tier4langs[i].id.slice(4)

  profiledata.tier0langs = tier0arr;
  profiledata.tier1langs = tier1arr;
  profiledata.tier2langs = tier2arr;
  profiledata.tier3langs = tier3arr;
  profiledata.tier4langs = tier4arr;

  $.ajax({
    cache : false,
    url : "all",
    type : 'POST',
    data : JSON.stringify(profiledata),
    success : function(data, response) {
      console.log('success');
      saveImg();
      window.location.href='..';
    }, // success 

    error : function(xhr, status) {
      // alert(xhr + " : " + status);
      console.log('error');
    }

    });
    
    

}

function readURL(input) {
if (input.files && input.files[0]) {
var reader = new FileReader();  
reader.onload = function (e) {
  $('#image_section').attr('src', e.target.result);  
}
  reader.readAsDataURL(input.files[0]);
}
}

$("#profileimg").ready(function() {
  $("#photo").change(function(){
    let input = this;

    if (input.files && input.files[0]) {
      var reader = new FileReader();  
      reader.onload = function (e) {
        $('#image_section').attr('src', e.target.result);
      }
      reader.readAsDataURL(input.files[0]);
    }
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

  var radio = $(':radio[name="flexRadioDefault"]:checked').val();
  $('#plural_major').val('0');
  
});
$("#flexRadioDefault2").change(function(){
  var radio = $(':radio[name="flexRadioDefault"]:checked').val();
  $('#plural_major').val('1');

  
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

  var radio = $(':radio[name="teamprivacyradio"]:checked').val();
  $('#teamprivacy').val('True');

  
});
$("#teamprivacyradio1").change(function(){

  var radio = $(':radio[name="teamprivacyradio"]:checked').val();
  $('#teamprivacy').val('False');
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
  var radio = $(':radio[name="articleprivacyradio"]:checked').val();
  $('#articleprivacy').val('True');
  
});
$("#articleprivacyradio1").change(function(){
  var radio = $(':radio[name="articleprivacyradio"]:checked').val();
  $('#articleprivacy').val('False');
});
});
$(document).ready(function() {
profile_privacy = $('#profileprivacy').attr('value');
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
  var radio = $(':radio[name="profileprivacyradio"]:checked').val();
  $('#profileprivacy').val('0');
});
$("#profileprivacyradio1").change(function(){
  var radio = $(':radio[name="profileprivacyradio"]:checked').val();
  $('#profileprivacy').val('1');
});
$("#profileprivacyradio2").change(function(){
  var radio = $(':radio[name="profileprivacyradio"]:checked').val();
  $('#profileprivacy').val('2');
});
});

function deleteImg(){
  if(confirm("기본 이미지로 변경하시겠습니까 ?") == true){
  $("#image_section").attr('src', "/data/media/img/profile_img/default.jpg");

  }
  else{
  
  }
  return;
}


