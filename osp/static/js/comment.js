const comment = {
    init: function () {
        console.log("comment init");
        let _this = this;
        if($("#btn-comment-save").length > 0){
            $("#btn-comment-save").on('click', () => {
                console.log("comment save");
                _this.save();
            });
        }else{
            console.log("comment save button null");
        }
    },
    save: function () {
        const commentForm = $("#comment-form")[0];
        const ajax_form_data = new FormData(commentForm);
        ajax_form_data.append('body', $('#comment-body').val());
        ajax_form_data.append('is_anonymous', $('#comment-is-anonymous').prop('checked'));

        if (confirm("댓글을 등록하시겠습니까?")) {
            $("#btn-comment-save").unbind("click");
            $.ajax({
                type: "POST",
                url: "/community/api/comment/create/",
                data: ajax_form_data,
                dataType: 'json',
                processData: false,
                contentType: false,

                success: function (data) {
                    console.log(data);
                    if (data['status'] === "success") {
                        alert(data['message']);
                        $('#comment-content').html(data['html']);
                        $("#btn-comment-save").bind("click", () => {
                            comment.save();
                        });
                    } else {
                        alert(data['message']);
                        $("#btn-comment-save").bind("click", () => {
                            comment.save();
                        });
                    }
                },
                error: function (data) {
                    alert(data['message']);
                    $("#btn-comment-save").bind("click", () => {
                        comment.save();
                    });
                }
            });
        }
    },
    delete: function (comment_id) {
        const ajax_form_data = new FormData();
        ajax_form_data.append('comment_id', comment_id);
        ajax_form_data.append('csrfmiddlewaretoken', csrftoken);

        if (confirm("댓글을 삭제하시겠습니까?")) {
            $.ajax({
                type: "POST",
                url: "/community/api/comment/delete/",
                data: ajax_form_data,
                dataType: 'json',
                processData: false,
                contentType: false,

                success: function (data) {
                    console.log(data);
                    if (data['status'] == "success") {
                        alert(data['message']);
                        $('#comment-content').html(data['html']);
                    } else {
                        alert(data['message']);
                    }
                },
                error: function (data) {
                    alert(data['message']);
                }
            });
        }
    }
};
comment.init();
