function ArticleThumbUp(obj, article_id, user_id) {
    if (user_id == -1) {
        alert("로그인 후 이용해주세요.");
        return;
    }
    ajax_form_data = new FormData();
    ajax_form_data.append('article_id', article_id);
    ajax_form_data.append('csrfmiddlewaretoken', csrftoken);
    $.ajax({
        type: "POST",
        url: "/community/api/article/like/",
        data: ajax_form_data,
        dataType: 'json',
        processData: false,
        contentType: false,

        success: function (data) {
            if (data['status'] == 'success') {
                $(obj).toggleClass('material-icons-outlined');
                $(obj).toggleClass('material-icons');
            }
        },
    });
}

function ArticleScrap(article_id, user_id) {
    if (user_id == -1) {
        alert("로그인 후 이용해주세요.");
        return;
    }
    ajax_form_data = new FormData();
    ajax_form_data.append('article_id', article_id);
    ajax_form_data.append('csrfmiddlewaretoken', csrftoken);
    $.ajax({
        type: "POST",
        url: "/community/api/article/scrap/",
        data: ajax_form_data,
        dataType: 'json',
        processData: false,
        contentType: false,

        success: function (data) {
            if (data['status'] == 'success') {
                $(obj).toggleClass('material-icons-outlined');
                $(obj).toggleClass('material-icons');
            }
        },
    });
}

function apply_result(team_id, username, is_okay) {

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
                $('#AddTeamModal').html(data['data']);
            } else {
                alert(data['message']);
            }
        },
        error: function (data) {
            alert('Error Occured');
        }
    });
}

function message_box_builder(msg, is_receive) {
    var msg_date = new Date(msg.send_date);
    var msg_box = $('<div></div>').append(
            $('<div></div>')
            .addClass('chat-text')
            .append(
                $('<div></div>')
                .addClass('chat-text-body')
                .html(msg.body)
            )
            .append(
                $('<div></div>')
                .addClass(msg.read == 'True' ? '' : 'chat-unread')
            )
        ).append(
            $('<div></div>')
            .addClass('chat-date')
            .html(msg_date.toLocaleString(
                'en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    hour12: true,
                    minute: 'numeric'
                }
            ))
        ).addClass('chat-box')
        .addClass(is_receive ? 'receive' : 'send')
        .attr('id', 'message-' + msg.id);
    return msg_box;
}

function LoadMoreMessage() {
    var oppo_id = $($('.opponent-item.selected')[0]).attr('value');
    var oldest_date = $('#chat-view').attr('oldest')
    // $('#chat-view').prepend(
    //     $('<div></div>')
    //     .addClass('spinner-grow')
    //     .addClass('m-auto')
    //     .attr('id', 'chat-load')
    //     .attr('role', 'status')
    //     .append(
    //         $('<span></span>')
    //         .addClass('visually-hidden')
    //         .html('Loading')
    //     )
    // );
    $.ajax({
        url: '/message/chat/' + oppo_id,
        data: {
            'oldest': oldest_date
        },
        method: 'GET',
        dataType: 'JSON'
    }).done(function (data) {
        for (msg of data['data']) {
            is_receive = (msg.sender_id == oppo_id);
            var new_chat_box = message_box_builder(msg, is_receive)
            $('#chat-view').prepend(new_chat_box)
            $('#chat-view').scrollTop($('#chat-view').scrollTop() + new_chat_box.height())
            $('#chat-view').attr('oldest', msg.send_date)
        }
        // $('#chat-load').remove()
    });
}

function RefreshNewMessage() {

}


function refreshChatroom(oppo_id) {
    console.log(oppo_id);
    $('#chat-view').html('')
        .append(
            $('<div></div')
            .addClass('spinner-border')
            .addClass('m-auto')
            .append(
                $('<span></span>')
                .addClass('visually-hidden')
                .html('Loading...')
            )
        );

    $.ajax({
        url: '/message/chat/' + oppo_id,
        method: 'GET',
        dataType: 'JSON'
    }).done(function (data) {
        $('#chat-view').html('');
        $('#chat-input').removeAttr('disabled');
        for (msg of data['data']) {
            is_receive = (msg.sender_id == oppo_id);
            $('#chat-view').prepend(message_box_builder(msg, is_receive))
            $('#chat-view').attr('oldest', msg.send_date)
        }
        $('#chat-view').scrollTop($('#chat-view').height());
    });
}


function select_oppo() {
    $('.opponent-item').each(function () {
        $(this).removeClass('selected');
    });
    var tmp, unread_count;

    unread_count = $(this)[0].children[0].children[2];
    if (unread_count) {
        unread_count.remove();
    }

    $(this).addClass('selected');
    console.dir($(this));
    var oppo_id = $(this).attr('value');

    refreshChatroom(oppo_id);
}

function send_msg(event) {
    event.preventDefault();
    var form_data = new FormData($('#chat-input-form')[0]);
    var oppo_id = $($('.opponent-item.selected')[0]).attr('value');
    var random_id = Math.random().toString(36).substring(2, 11);
    $.ajax({
        url: '/message/chat/' + oppo_id,
        method: 'POST',
        data: form_data,
        dataType: 'JSON',
        processData: false,
        contentType: false,
        beforeSend: function () {
            msg = {
                'id': random_id,
                'body': $('#chat-input').val(),
                'send_date': Date.now(),
                'read': 'False',
            }
            $('#chat-view').append(message_box_builder(msg, false).addClass('pending'));
            $('#chat-input').val('')
        }
    }).done(function (data) {
        console.log(data);
        if (data.status == 'success') {
            $('#message-' + random_id)
                .removeClass('pending')
                .attr('id', 'message-' + data.msg_id)
        } else {
            alert(data.message);
        }
    }.bind(random_id))
    return false;
}

function msgModalOpen(selected_oppo = 0) {
    $('#message-modal').modal('show');
    $.ajax({
        url: '/message/list/' + selected_oppo,
        method: 'GET',
        dataType: 'HTML'
    }).done(function (data) {
        $('#message-modal-body').html(data);
        $('.opponent-item').click(select_oppo);
        if (selected_oppo != 0) {
            $('#opo-id-' + selected_oppo).click();
        }
        $('#chat-submit').click(send_msg);
        $('#chat-view').scroll(function () {
            if ($(this).scrollTop() === 0) {
                LoadMoreMessage();
            }
            if ($(this).scrollTop() === $(this).height()) {
                RefreshNewMessage();
            }
        });
    })
}

$().ready(function () {
    $('#message').click(function () {
        msgModalOpen();
    })
});