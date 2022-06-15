$(document).ready(function () {
    var table = $('#scoreTable').DataTable({
        dom: 'Pfrtip',
        searchPanes: {
            layout: 'columns-1',
            viewTotal: true,
            orderable: false,
            columns: [7],
            initCollapsed: true,
        },
        columnDefs: [
            {
                orderable: false, 
                targets: [0, 7]
            },
        ],
        order: [[1, 'desc']],
    });
    $('.dtsp-titleRow').remove();
    $('.dtsp-panesContainer').insertAfter('#scoreTable_filter');
});