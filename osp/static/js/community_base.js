$(function () {
    // $.noConflict();
    var tag_selector = new SlimSelect({
        select: '#tag-select',
        onChange: (selected_list) => {
            for (selected of selected_list) {
                $(`.ss-value[data-id="${selected.id}"]`).addClass('bg-' + selected.class);
            }
            redraw();
            if(selected_list.length > 0){
                $("#tag-btn").addClass("btn-primary");
                $("#tag-btn").removeClass("btn-secondary");
            }else{
                $("#tag-btn").removeClass("btn-primary");
                $("#tag-btn").addClass("btn-secondary");
            }
        },
        placeholder: 'Tag',
    });
})
function toggleTag(){
    $("#tag-filter").toggleClass("show");
}
