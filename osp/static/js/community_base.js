$(function () {
    // $.noConflict();
    var tag_selector = new SlimSelect({
        select: '#tag-select',
        onChange: (selected_list) => {
            for (selected of selected_list) {
                $(`.ss-value[data-id="${selected.id}"]`).addClass('bg-' + selected.class)
            }
            redraw();
        },
        placeholder: 'Tag',
    });
})
