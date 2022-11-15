$(document).ready(function () {
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
                layout: 'columns-1',
                viewTotal: true,
                orderable: false,
                columns: [7],
                initCollapsed: true,
            },
        }],
        columnDefs: [
            {
                orderable: false, 
                targets: [0, 7]
            },
        ],
        order: [[1, 'desc']],
        drawCallback: function() {
            $('.contributor_list').click(function(){
                // $('.contributor_panel').show();
                // github_id = $(this).attr('data-id');
                // repo_name = $(this).attr('data-repo');
                // var top_coord = $(this).offset().top + $(this).height() / 2;
                // var left_coord = $(this).offset().left;
                // console.log(top_coord);
                // $.ajax(
                //     {
                //         url: '/rank/repo/api',
                //         data: {'github_id': github_id, 'repo_name': repo_name},
                //         method: 'GET',
                //         dataType: 'json'
                //     }
                // ).done(function(data) {
                //     $('.contributor_panel').html('');
                //     var table_tag = $('<table></table>');
                //     table_tag.append('<thead><tr><td>Name</td><td>GitHub</td><td>Commits</td><td>Issues</td><td>Pulls</td></tr></thead>')
                //     table_tag.attr('class', 'table table-light');
                //     var tbody = $('<tbody></tbody>');
                //     for(row in data){
                //         var row_tag = $('<tr></tr>');
                //         row_tag.append('<td>' + data[row].name + '</td>');
                //         row_tag.append('<td>' + data[row].github_id + '</td>');
                //         row_tag.append('<td>' + data[row].commit_cnt + '</td>');
                //         row_tag.append('<td>' + data[row].issue_cnt + '</td>');
                //         row_tag.append('<td>' + data[row].pull_cnt + '</td>');
                //         tbody.append(row_tag);
                //     }
                //     table_tag.append(tbody);
                //     $('.contributor_panel').append(table_tag);
                //     $('.contributor_panel').css('top', top_coord).css('left', left_coord - $('.contributor_panel').width());
                // });
            }, function(){
                // $('.contributor_panel').hide();
                // $('.contributor_panel').html('');
            });
        }
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
});