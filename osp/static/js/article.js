const article = {
    nInputFile: 0,
    init: function () {
        console.log("article init");
        let _this = this;
        if ($("#btn-content-edit").length > 0) {
            $("#btn-content-edit").on('click', () => {
                console.log("article edit");
                _this.editSubmit();
            });
        } else {
            console.log("content edit null");
        }
        $("#btn-content-delete").on('click', () => {
            console.log("article delete");
            _this.deleteArticle();
        });
        // 이미지 추가 버튼
        const btnAddImage = $('#add-image');
        btnAddImage.on('click', () => {
            article.addImage();
        });
        // 파일 추가 버튼
        const btnAddFile = $('#add-file');
        btnAddFile.on('click', () => {
            article.addFile();
        })
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
        const articleForm = $('#article-form')[0];
        const ajax_form_data = new FormData(articleForm);
        let articleTitle = $('#article-title').val();
        let articleBody = $('#article-body').html();
        ajax_form_data.append('body', articleBody);
        ajax_form_data.append('is_anonymous', $('#is-anonymous').prop('checked'));
        ajax_form_data.append('is_notice', $('#is-notice').prop('checked'));
        ajax_form_data.append('tags', category_select.selected().toString());
        let board_id = $("#board-id").val();
        let board_name = $("#board-name").val();
        let board_type = $("#board-type").val();

        if (board_type == 'Recruit') {
            if ($('#PeriodPickerStartInput').val() == 0 || $('#PeriodPickerEndInput').val() == 0) {
                alert('모집 기간을 입력해 주세요')
                return 0;
            }
            ajax_form_data.append('team_id', $('#team-option').val());
            const offset = new Date().getTimezoneOffset() * 60000;
            let period_start_date = new Date($('#PeriodPickerStartInput').val()) - offset;
            let period_end_date = new Date($('#PeriodPickerEndInput').val()) - offset;
            if (period_start_date > period_end_date) {
                alert('날짜입력에 오류가 있습니다.');
                return 0;
            }
            ajax_form_data.append('period_start', new Date(period_start_date).toISOString());
            ajax_form_data.append('period_end', new Date(period_end_date).toISOString());
        }
        if (articleTitle.trim() === "") {
            alert('제목을 입력해 주세요');
        }
        else if (articleBody.trim() === "") {
            alert('본문을 입력해 주세요');
        }
        else if (confirm("글을 등록하시겠습니까?")) {
            $("#btn-content-edit").unbind('click');
            $.ajax({
                type: "POST",
                url: "/community/api/article/create/",
                data: ajax_form_data,
                dataType: 'json',
                processData: false,
                contentType: false,
                async: false,
                success: function (data) {
                    console.log(data);
                    if (data['status'] == "success") {
                        alert('등록이 완료되었습니다!');
                        // 게시글쓰기 요청 성공시 다시 bind하지 않음
                        window.location.href = `/community/board/${board_name}/${board_id}/`;
                    } else {
                        alert(data['message']);
                        $("#btn-content-edit").bind('click', () => {
                            article.editSubmit();
                        });
                    }
                },
                error: function (data) {
                    console.log("res", data);
                    alert('Error Occured');
                    $("#btn-content-edit").bind('click', () => {
                        article.editSubmit();
                    });
                }
            });
        }
    },
    updateArticle: function () {
        console.log("updateArticle");
        const articleForm = $('#article-form')[0];
        const ajax_form_data = new FormData(articleForm);
        let articleTitle = $('#article-title').val();
        let articleBody = $('#article-body');
        ajax_form_data.append('body', articleBody.html());
        ajax_form_data.append('is_anonymous', $('#is-anonymous').prop('checked'));
        ajax_form_data.append('is_notice', $('#is-notice').prop('checked'));
        ajax_form_data.append('tags', category_select.selected().toString());
        let board_type = $("#board-type").val();
        let article_id = $("#article-id").val();

        if (board_type == 'Recruit') {
            const offset = new Date().getTimezoneOffset() * 60000;
            const period_start_date = new Date($('#PeriodPickerStartInput').val()) - offset;
            const period_end_date = new Date($('#PeriodPickerEndInput').val()) - offset;
            ajax_form_data.append('period_start', new Date(period_start_date).toISOString());
            ajax_form_data.append('period_end', new Date(period_end_date).toISOString());
        }
        if (articleTitle.trim() === "") {
            alert('제목을 입력해 주세요');
        }
        else if (articleBody.text().trim().length === 0) {
            alert('본문을 입력해 주세요');
        }
        else if (confirm("글을 수정하시겠습니까?")) {
            $("#btn-content-edit").unbind('click');
            $.ajax({
                type: "POST",
                url: "/community/api/article/update/",
                data: ajax_form_data,
                dataType: 'json',
                processData: false,
                contentType: false,
                async: false,
                success: function (data) {
                    if (data['status'] == "success") {
                        alert('수정이 완료되었습니다!');
                        window.location.href = `/community/article/${article_id}/`;
                    } else {
                        alert(data['message']);
                        $("#btn-content-edit").bind('click', () => {
                            article.editSubmit();
                        });
                    }
                },
                error: function (data) {
                    console.log("error", data);
                    alert('Error Occured');
                    $("#btn-content-edit").bind('click', () => {
                        article.editSubmit();
                    });
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
            $("#btn-content-delete").unbind('click');
            $.ajax({
                type: "POST",
                url: "/community/api/article/delete/",
                data: ajax_form_data,
                dataType: 'json',
                processData: false,
                contentType: false,
                success: function (data) {
                    if (data['status'] == "success") {
                        alert('삭제가 완료되었습니다!');
                        window.location.href = `/community/board/${board_name}/${board_id}/`;
                    } else {
                        alert(data['message']);
                        $("#btn-content-delete").bind('click', () => {
                            article.deleteArticle();
                        });
                    }
                },
                error: function (data) {
                    console.log("res", data);
                    alert('Error Occured');
                    $("#btn-content-delete").bind('click', () => {
                        article.deleteArticle();
                    });
                }
            });
        }
    },
    /**
     * 게시글 쓰기에서 파일업로드를 활성화하는 함수
     */
    addImage: function () {
        const articleBody = $('#article-body');
        const articleHelper = $('#article-helper');
        let nChild = $('#article-helper input').length;

        let focus = document.createElement("span");
        focus.id = 'focus-span';
        window.getSelection().getRangeAt(0).insertNode(focus);

        articleBody.blur();

        articleBody.html(articleBody.html() + `<div>
        <img id="article-image-${nChild}-preview" class="rounded-3" style="display:none;">
        <label class="d-flex hover-opacity article-input" for="article-image-${nChild}" contenteditable="false">
            <i class="bi bi-card-image"></i>
            <span>이미지 업로드</span>
        </label></div>
        <div>&nbsp;</div>`);

        articleBody.focus();

        let range = document.createRange();
        focus = document.getElementById("focus-span");

        range.selectNode(focus);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        range.deleteContents();

        let child = `<form id="article-image-${nChild}-form" method="post" enctype="multipart/form-data">
        <input type="file" id="article-image-${nChild}" name="image" class="form-control" onchange="article.previewSingleImage(${nChild})" style="display:none;">
        </form>`;

        articleHelper.append(child);
    },
    /**
     * 게시글 쓰기에서 이미지를 업로드하면 파일을 저장하고 미리보기를 렌더링하는 함수
     */
    previewSingleImage: function (num) {
        let targetInput = '#article-image-' + String(num);
        let inputFiles = $(targetInput);

        if (inputFiles.length > 0) {
            let inputFile = inputFiles[0];

            const uploadForm = $(`#${inputFile.id}-form`)[0];
            const formData = new FormData(uploadForm);

            $.ajax({
                url: '/community/api/article/image/',
                data: formData,
                method: 'POST',
                dataType: 'JSON',
                cache: false,
                contentType: false,
                processData: false
            }).done(function (data) {
                if (data['status'] == 'success') {
                    let file = inputFile.files[0];
                    const preview = $(`#${inputFile.id}-preview`);
                    if (file !== undefined) {
                        const fileReader = new FileReader();
                        fileReader.onload = () => {
                            preview.attr('src', data['src']);
                            preview.attr('style', "");
                        };
                        fileReader.readAsDataURL(file);
                    }
                    else {
                        preview.attr('src', preview.data('src'));
                    }
                    $(`label[for="${inputFile.id}"]`).remove();
                } else {
                    alert(data['message']);
                }
            });
        }
    },
    addFile: function () {
        // 업로드 파일의 구분을 위해 아이디 부여
        const fileContainer = $('#article-file-container');
        let nChild = article.nInputFile;
        article.nInputFile += 1;

        // 파일 입력 추가
        fileContainer.append(`<div id="input-group-${nChild}" class="input-group my-1">
        <input type="file" id="article-file-${nChild}" name="article_file_${nChild}" class="form-control article-file">
        <button type="button" class="input-group-text default-btn" onclick="article.deleteInput(${nChild})"><i class="bi bi-x-lg"></i></button>
        </div>`);
    },
    deleteInput: function (id) {
        // 입력 삭제 버튼 클릭시 파일 입력 삭제
        $(`#input-group-${id}`).remove();
    }
};
