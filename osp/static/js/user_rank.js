$(document).ready(function () {
    var last_year = 0;
    $('#scoreTable > tbody > tr > td:nth-child(9)').each(function () {
        last_year = Math.max(Number($(this).html()), last_year);
    })
    var table = $('#scoreTable').DataTable({
        dom: 'Bfrtp',
        language: {
            searchPanes: {
                clearMessage: '초기화',
                collapse: {0: '<i class="bi bi-funnel"></i>', _: '<i class="bi bi-funnel-fill"></i>'}
            }
        },
        lengthChange: false,
        select: {
            style: 'multi'
        },
        buttons: {
            dom: {
                button: {
                    className: ''
                },
                container: {
                    className: 'dt-buttons mb-2'
                },
            },
            buttons:[
                {
                    extend: 'searchPanes',
                    className: 'btn btn-sm btn-light',
                    config: {
                        layout: 'columns-5',
                        viewTotal: true,
                        orderable: false,
                        columns: [4, 5, 6, 8, 9],
                        preSelect: [{
                            column: 8,
                            rows: [String(last_year)]
                        }]
                    },
                },
                {
                    extend: 'csv',
                    className: 'btn btn-sm btn-success',
                    title: 'user_rank'
                },
                {
                    extend: 'excel',
                    className: 'btn btn-sm btn-success',
                    title: 'user_rank'
                },
            ]},
        columnDefs: [{
            orderable: false,
            targets: [3, 4, 5, 6],
            searchPanes: {
                dtOpts: {
                    select: {
                        style: 'multi'
                    }
                }
            }
        }, 
        {
            targets:[2, 3],
            visible: false
        }],
        order: [
            [0, 'asc']
        ],
    });
    $('#scoreTable_filter > label').contents().filter(function(){
        return this.nodeType === 3;
    }).remove();
    $('#scoreTable_filter > label > input').attr('placeholder', 'Search');
    $("#loading").css("display", "none");
    $("#scoreTable").addClass("show");
});