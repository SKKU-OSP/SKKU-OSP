const article = {
    init: function () {
        console.log("article init");
        let _this = this;
        if($("#btn-content-edit").length > 0){
            $("#btn-content-edit").on('click', () => {
                console.log("article edit");
                _this.editSubmit();
            });
        }else{
            console.log("content edit null");
        }
        $("#btn-article-delete").on('click', () => {
            console.log("article delete");
            _this.deleteArticle();
        });
    },
    editSubmit: function () {
        console.log("editSubmit");
        let t = $('#article-form').data('edit-type');
        if (t === 'register') {
            this.registerArticle();
        } else {
            this.updateArticle();
        }
        return false;
    },
    registerArticle: function () {
        console.log("registerArticle");
        let ajax_form_data = new FormData();
        ajax_form_data.append('title', $('#article-title').val());
        ajax_form_data.append('body', $('#article-body').val());
        ajax_form_data.append('is_anonymous', $('#is-anonymous').prop('checked'));
        ajax_form_data.append('is_notice', $('#is-notice').prop('checked'));
        ajax_form_data.append('tags', category_select.selected().toString());
        let board_id = $("#board-id").val();
        let board_name = $("#board-name").val();
        let board_type = $("#board-type").val();
        ajax_form_data.append('board_id', board_id);
        ajax_form_data.append('board_name', board_name);

        if (board_type == 'Recruit') {
            ajax_form_data.append('team_id', $('#team-option').val());
            const offset = new Date().getTimezoneOffset() * 60000;
            let period_start_date = new Date($('#PeriodPickerStartInput').val())-offset;
            let period_end_date = new Date($('#PeriodPickerEndInput').val())-offset;
            if(period_start_date > period_end_date){
                alert('날짜입력에 오류가 있습니다.');
                return 0;
            }
            ajax_form_data.append('period_start', new Date(period_start_date).toISOString());
            ajax_form_data.append('period_end', new Date(period_end_date).toISOString());
        }
        else if (board_type == 'Team') {
            let team_id = $("#team-id").val();
            ajax_form_data.append('team_id', team_id);
        }

        if (confirm("글을 등록하시겠습니까?")) {
            $.ajax({
                type: "POST",
                url: "/community/api/article/create/",
                data: ajax_form_data,
                dataType: 'json',
                processData: false,
                contentType: false,

                success: function (data) {
                    console.log(data);
                    if (data['status'] == "success") {
                        alert('등록이 완료되었습니다!');
                        window.location.href = `/community/board/${board_name}/${board_id}/`;
                    } else {
                        alert(data['message']);
                    }
                },
                error: function (data) {
                    console.log("res", data);
                    alert('Error Occured');
                }
            });
        }
    },
    updateArticle: function () {
        console.log("updateArticle");
        console.log("no chekc", $('#is-notice').prop('checked'));
        let ajax_form_data = new FormData();
        ajax_form_data.append('title', $('#article-title').val());
        ajax_form_data.append('body', $('#article-body').val());
        ajax_form_data.append('is_anonymous', $('#is-anonymous').prop('checked'));
        ajax_form_data.append('is_notice', $('#is-notice').prop('checked'));
        ajax_form_data.append('tags', category_select.selected().toString());
        let board_id = $("#board-id").val();
        let board_name = $("#board-name").val();
        let board_type = $("#board-type").val();
        let article_id = $("#article-id").val();
        ajax_form_data.append('board_name', board_name);
        ajax_form_data.append('board_id', board_id);
        ajax_form_data.append('article_id', article_id);

        if (board_type == 'Recruit'){
            const offset = new Date().getTimezoneOffset() * 60000;
            const period_start_date = new Date($('#PeriodPickerStartInput').val())-offset;
            const period_end_date = new Date($('#PeriodPickerEndInput').val())-offset;
            ajax_form_data.append('period_start', new Date(period_start_date).toISOString());
            ajax_form_data.append('period_end', new Date(period_end_date).toISOString());
        }

        if (confirm("수정을 완료하시겠습니까?")) {
            $.ajax({
                type: "POST",
                url: "/community/api/article/update/",
                data: ajax_form_data,
                dataType: 'json',
                processData: false,
                contentType: false,

                success: function (data) {
                    if (data['status'] == "success") {
                        alert('수정이 완료되었습니다!');
                        window.location.href = `/community/article/${article_id}/`; 
                    } else {
                        alert(data['message']);
                    }
                },
                error: function (data) {
                    console.log("error", data);
                    alert('Error Occured');
                }
            });
        }
    },
    deleteArticle: function () {
        let board_id = $("#board-id").val();
        let board_name = $("#board-name").val();
        let article_id = $("#article-id").val();
        console.log("article_id", article_id);
        ajax_form_data = new FormData();
        ajax_form_data.append('article_id', article_id);
        $('#article-form').submit();

        if (confirm("글을 삭제하시겠습니까?")) {
            $.ajax({
                type: "POST",
                url: "/community/api/article/delete/",
                data: ajax_form_data,
                dataType: 'json',
                processData: false,
                contentType: false,
                success: function (data) {
                    if (data['status'] == "success") {
                        alert('삭제가 완료되었습니다!') 
                        window.location.href = `/community/board/${board_name}/${board_id}/`;
                    } else {
                        alert(data['message']);
                    }
                },
                error: function (data) {
                    console.log("res", data);
                    alert('Error Occured');
                }
            });
        }
    }
};
article.init();
