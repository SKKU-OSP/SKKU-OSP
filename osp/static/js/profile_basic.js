window.addEventListener('load', function () {
  console.log("whatwhatwhat");
  let icon_portfolio_modal = document.getElementById("icon-portfolio");
  icon_portfolio_modal.addEventListener("click", ()=>{
    $('#modalPortfolioBox').modal('show');
  });
  $("#icon-interests").on("click", function(){
    $("#icon-interests").toggleClass("bi-arrows-angle-contract");
    $("#icon-interests").toggleClass("bi-arrows-angle-expand");
    $('#icon-interests').attr('title', function(index, attr){
    return attr == "확장" ? "축소" : "확장";
    });
    $(".expandable:nth-child(3)").toggleClass("semi-expanded-0");
    $(".expandable:nth-child(1)").toggleClass("semi-expanded-1");
    $(".expandable:nth-child(2)").toggleClass("expanded");
  });
  $("#icon-lang").on("click", function(){
    $("#icon-lang").toggleClass("bi-arrows-angle-contract");
    $("#icon-lang").toggleClass("bi-arrows-angle-expand");
    $('#icon-lang').attr('title', function(index, attr){
    return attr == "확장" ? "축소" : "확장";
    });
    $(".expandable:nth-child(2)").toggleClass("semi-expanded-0");
    $(".expandable:nth-child(1)").toggleClass("semi-expanded-2");
    $(".expandable:nth-child(3)").toggleClass("expanded");
  });
});
