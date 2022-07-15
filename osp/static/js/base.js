$().ready(function(){
    $('#message').click(function(){
        $.ajax({
            url: '/message/list',
            method: 'GET',
            dataType: 'HTML'
        }).done(function(data){
            $('#message-modal').html(data).modal('show');
        })
    })
    
});