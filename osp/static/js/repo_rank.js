$(document).ready(function () {
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
            style: 'os'
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
                        layout: 'columns-1',
                        viewTotal: true,
                        orderable: false,
                        columns: [7],
                        initCollapsed: true,
                    },
                },
                {
                    extend: 'csv',
                    className: 'btn btn-sm btn-success',
                    title: 'repository_rank'
                },
                {
                    extend: 'excel',
                    className: 'btn btn-sm btn-success',
                    title: 'repository_rank'
                },
            ]},
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
    $('#scoreTable_filter > label').contents().filter(function(){
        return this.nodeType === 3;
    }).remove();
    $('#scoreTable_filter > label > input').attr('placeholder', 'Search')
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
    $("#loading").css("display", "none");
    $("#scoreTable").addClass("show");
});

function showContr(e){
    console.log("showContr");
    const github_id = $(e.target).attr('data-id');
    const repo_name = $(e.target).attr('data-repo');
    let target_id = `div[id='${github_id}/${repo_name}']`;
    let noti_window = $(target_id);
    if(noti_window.hasClass("show")){
        noti_window.removeClass("show");
        return 0;
    }else{
        $("div.show").removeClass("show");
    }
    noti_window.addClass("show");
    $.ajax(
        {
            url: '/rank/repo/api',
            data: {'github_id': github_id, 'repo_name': repo_name},
            method: 'GET',
            dataType: 'json'
        }
    ).done(function(data) {
        noti_li = []
        const DATA_IDS = ['Name', 'GitHub Id', 'Commits', 'Issues', 'Pulls'];
        const DATA_KEYS = ["name", "github_id", "commit_cnt", "issue_cnt", "pull_cnt"];

        for(let data_id of DATA_IDS){
            noti_li.push(noti_window.children(`li[data-id='${data_id}']:eq(0)`));
        }
        noti_li.forEach((ele, idx)=>{
            ele.empty();
            ele.append('<div>' + DATA_IDS[idx]+ '</div>');
        });
        for(row in data){
            noti_li.forEach((ele, idx)=>{
                console.log(DATA_KEYS[idx], data[row][DATA_KEYS[idx]]);
                if(DATA_KEYS[idx] == "github_id"){
                    ele.append(`<div><a href="https://github.com/${data[row][DATA_KEYS[idx]]}">` + data[row][DATA_KEYS[idx]] + '</a></div>');
                }else{
                    ele.append('<div>' + data[row][DATA_KEYS[idx]] + '</div>');
                }
            });
        }
    });
}