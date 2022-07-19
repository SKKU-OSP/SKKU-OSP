function select_oppo(){
    $('.opponent-item').each(function(){
        $(this).removeClass('selected');
    });
    $(this).addClass('selected');
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
    var oppo_id = $(this).attr('value');
    $.ajax({
        url: '/message/chat/' + $(this).attr('value'),
        method: 'GET',
        dataType: 'JSON'
    }).done(function(data){
        $('#chat-view').html('');
        $('#chat-input').removeAttr('disabled');
        for(msg of data['data']){
            msg_date = new Date(msg.send_date);
            console.log(msg_date)
            $('#chat-view').append(
                $('<div></div>').append(
                    $('<div></div>')
                    .addClass('chat-text')
                    .html(msg.body)
                ).append(
                    $('<div></div>')
                    .addClass('chat-date')
                    .html(msg_date.toLocaleString(
                        'en-US',
                        {
                            hour: 'numeric',
                            hour12: true,
                            minute: 'numeric'
                        }
                    ))
                ).addClass('chat-box')
                .addClass(msg.sender_id == oppo_id ? 'receive' : 'send')
            )
            console.log(msg);
        }
    });
    console.log($(this).attr('value'));
}

function send_msg(event){
    var form_data = new FormData($('#chat-input-form')[0])
    console.log(form_data)
}

$().ready(function(){
    $('#message').click(function(){
        $('#message-modal').modal('show');
        $.ajax({
            url: '/message/list',
            method: 'GET',
            dataType: 'HTML'
        }).done(function(data){
            $('#message-modal-body').html(data);
            $('.opponent-item').click(select_oppo);
        })
    })
    
});