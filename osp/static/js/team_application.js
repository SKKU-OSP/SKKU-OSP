teamApplication = {
    init: function () {
        console.log("teamApplication init");
        let _this = this;
        _this.showEmptyApply();
        $(".btn-team-accept").on('click', (e) => {
            let msgId = e.target.dataset.id;
            let status = true;
            let msg = $(`#msg-${msgId}`);
            let teamId = msg.data("team-id");
            let user = msg.data("user");
            console.log("accept", teamId, user, status);
            _this.applyResult(teamId, user, status);
        });
        $(".btn-team-refuse").on('click', (e) => {
            let msgId = e.target.dataset.id;
            let status = false;
            let msg = $(`#msg-${msgId}`);
            let teamId = msg.data("team-id");
            let user = msg.data("user");
            console.log("refuse", teamId, user, status);
            _this.applyResult(teamId, user, status);
        });
        console.log("btn-xs btn-remove team-apply-delete");
        console.log($(".team-apply-delete"));

        $(".team-apply-delete").on('click', (e) => {
            console.log("team-apply-delete");
            let msgId = e.target.dataset.id;
            console.log("delete", msgId);
            _this.applyDelete(msgId);
        });
    },
    showEmptyApply: function () {
        msg_received = $(".split-line.received");
        console.log(msg_received);
        if (msg_received.length == 0){
            $("#apply-recv").empty();
            $("#apply-recv").append(`<div style="text-align:center; padding-top:40px;">받은 지원서가 없습니다. </div>`);
        }
        msg_sent = $(".split-line.sent");
        console.log("msg_sent",msg_sent);
        if (msg_sent.length == 0){
            $("#apply-send").empty();
            $("#apply-send").append(`<div style="text-align:center; padding-top:40px;">보낸 지원서가 없습니다. </div>`);
        }
    },
    applyResult: function (team_id, username, is_okay) {
        var status = is_okay ? "수락" : "거절";
            
        if (!confirm(username + ": " + status + "하시겠습니까?")) {
            return;
        }
        ajax_form_data = new FormData();
        ajax_form_data.append('team_id', team_id);
        ajax_form_data.append('username', username);
        ajax_form_data.append('is_okay', is_okay);
        ajax_form_data.append('direction', 'TO_TEAM');
        ajax_form_data.append('csrfmiddlewaretoken', csrftoken);
        
        $.ajax({
            type: "POST",
            url: "/team/api/team-invite-update/",
            data: ajax_form_data,
            dataType: 'json',
            processData: false,
            contentType: false,
            
            success: function (data) {
                if (data['status'] == "success") {
                    console.log(data)
                    $('#apply-user-'+data['username']).remove()
                    teamApplication.showEmptyApply();
                } else {
                    alert(data['message']);
                }
            },
            error: function (data) {
                alert('Error Occured');
            }
        });
    },
    applyDelete: function (msg_id) {
        ajax_form_data = new FormData();
        ajax_form_data.append('msg_id', msg_id);
        ajax_form_data.append('csrfmiddlewaretoken', csrftoken);
        $.ajax({
            type: 'POST',
            url: '/team/api/team-invite-delete/',
            data: ajax_form_data,
            dataType: 'JSON',
            processData: false,
            contentType: false,
            success: function(data){
                if (data['status'] == "success") {
                console.log(data)
                $('#apply-' + msg_id).remove();
                teamApplication.showEmptyApply();
                } else {
                alert(data['message']);
                }
            }
        });
    }
}
teamApplication.init();
