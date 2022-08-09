$(document).ready(function () {
    var last_year = 0;
    $('#scoreTable > tbody > tr > td:nth-child(7)').each(function () {
        last_year = Math.max(Number($(this).html()), last_year);
    })
    var table = $('#scoreTable').DataTable({
        dom: 'Bfrtp',
        language: {
            searchPanes: {
                clearMessage: '초기화',
                collapse: {0: '&#61263', _: '&#61263'}
            }
        },
        buttons: [{
            extend: 'searchPanes',
            config: {
                layout: 'columns-5',
                viewTotal: true,
                orderable: false,
                columns: [2, 3, 4, 6, 7],
                preSelect: [{
                    column: 6,
                    rows: [String(last_year)]
                }]
            },
        }],
        columnDefs: [{
            orderable: false,
            targets: [0, 1, 2, 3, 4, 5, 6]
        }, ],
        order: [
            [7, 'desc']
        ],
    });
    $('#scoreTable_filter > label').contents().filter(function(){
        return this.nodeType === 3;
    }).remove();
    $('#scoreTable_filter > label > input').attr('placeholder', 'Search')
});