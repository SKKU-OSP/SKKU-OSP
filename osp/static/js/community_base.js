$(function () {
    $.noConflict();
    $('.hi').slick({
        number: 3,
        slide: 'div',
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2000,
        arrows: true,
    });

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