$(document).ready(function () {
    var table = $('#scoreTable').DataTable({
        dom: 'Pfrtip',
        searchPanes: {
            layout: 'columns-5',
            viewTotal: true,
            orderable: false,
            columns: [2, 3, 4, 6, 7],
            initCollapsed: true,
            preSelect:[{
                column: 6,
                rows: ['2021']
            }]
        },
        columnDefs: [
            {
                orderable: false, 
                targets: [0, 1, 2, 3, 4, 5, 6]
            },
        ],
        order: [[7, 'desc']],
    });
    $('.dtsp-titleRow').remove();
    $('.dtsp-panesContainer').insertAfter('#scoreTable_filter');
});