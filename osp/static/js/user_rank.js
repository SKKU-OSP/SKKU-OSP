$(document).ready(function () {
    var last_year = 0;
    $('#scoreTable > tbody > tr > td:nth-child(7)').each(function(){
        last_year = Math.max(Number($(this).html()), last_year);
    })
    console.log(last_year)
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
                rows: [String(last_year)]
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