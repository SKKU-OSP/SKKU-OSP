$(function () {
    if($('#tag-select').length){
        let tag_selector = new SlimSelect({
            select: '#tag-select',
            onChange: (selected_list) => {
                for (let selected of selected_list) {
                    $(`.ss-value[data-id="${selected.id}"]`).addClass('bg-' + selected.class);
                }
                if(selected_list.length > 0){
                    $("#activity-tag-btn").addClass("btn-primary");
                    $("#activity-tag-btn").removeClass("btn-light");
                    $("#user-tag-btn").addClass("btn-primary");
                    $("#user-tag-btn").removeClass("btn-light");
                }else{
                    $("#activity-tag-btn").removeClass("btn-primary");
                    $("#activity-tag-btn").addClass("btn-light");
                    $("#user-tag-btn").addClass("btn-primary");
                    $("#user-tag-btn").removeClass("btn-light");
                }
            },
            placeholder: 'Tag',
        });
    }
});

/**
 * 동의서 관련 함수
 * @param {*} user 
 */
function consentWriteOpen(user){
    console.log("open_consent_write");
    $.ajax({
        url: `/user/${user}/api/consent-write`,
        type: "GET",
        data: null,
        dataType: 'HTML'
    }).done(function (data) {
        $('#consent-wirte').addClass('ready').html(data)
        $('#consent-wirte').modal('show');
    })
}

function submitWriteConsent(e, user){
    e.preventDefault();
    let formHTML = $("#write-consent-form")[0]
    let form_data = new FormData(formHTML);

    // form_data에서 모든 라디오 버튼의 값을 가져오기
    let opt_check = true;
    Array.from(form_data.keys()).forEach(key => {
        if(form_data.get(key) == "0"){
            opt_check = false;
        }
    });
    if(opt_check){
        $.ajax({
            url: `/user/${user}/api/consent-write`,
            method: 'POST',
            data: form_data,
            dataType: 'JSON',
            processData: false,
            contentType: false,
        }).done(function (data) {
            console.log(data);
            alert(data.msg);
            window.location.reload();
        });
    }else{
        alert("정보 공개에 동의하지 않아 글쓰기 작업이 제한됩니다.");
    }

    return false;
}

function consentUserOpen(user){
    console.log("open_consent_user");
    $.ajax({
        url: `/user/${user}/api/consent-open`,
        type: "GET",
        data: null,
        dataType: 'HTML'
    }).done(function (data) {
        $('#consent-open').addClass('ready').html(data)
        $('#consent-open').modal('show');
    })
}

function submitUserConsent(e, user){
    e.preventDefault();
    let formHTML = $("#open-consent-form")[0];
    let form_data = new FormData(formHTML);
    
    // form_data에서 모든 라디오 버튼의 값을 가져오기
    let opt_check = true;
    Array.from(form_data.keys()).forEach(key => {
        if(form_data.get(key) == "0"){
            opt_check = false;
        }
    });
    if(opt_check){
        $.ajax({
            url: `/user/${user}/api/consent-open`,
            method: 'POST',
            data: form_data,
            dataType: 'JSON',
            processData: false,
            contentType: false,
        }).done(function (data) {
            console.log(data);
            alert(data.msg);
            window.location.reload();
        });
    }else{
        alert("정보 공개에 동의하지 않아 유저 추천시스템에 대한 접근이 제한됩니다.");
    }

    return false;
}
