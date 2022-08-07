$(function () {
    $.noConflict();


    var tag_selector = new SlimSelect({
        select: '#tag-select',
        onChange: (selected_list) => {
            for (selected of selected_list) {
                $(`.ss-value[data-id="${selected.id}"]`).addClass('bg-' + selected.class)
            }
            redraw();
        }
    });



})

$(document).ready(function(){
    $('.slick-carousel').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        // autoplay: true,

        autoplay: false,
        autoplaySpeed: 2000,
        prevArrow: '<div class="a-left prev slick=prev control-c pointer opacity-hover" style="line-height:140px;padding-right:5px;"><</div>',
        nextArrow: '<div class="a-left prev slick=prev control-c pointer opacity-hover" style="line-height:140px;padding-left:5px;">></div>',
        arrows:true,
        responsive:[
            {
                breakpoint:900,
                settings:{
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    autoplaySpeed: 4000,
                }
            },

        ]
    });
});