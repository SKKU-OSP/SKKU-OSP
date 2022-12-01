function openTeamApplyModal(team_id){
    if (!$('#AddTeamApplyModal').hasClass('ready')) {
        $.ajax({
            url: "/team/api/team-apply"+"/"+team_id,
            type: "GET",
            dataType: 'HTML'
        }).done(function (data) {
            $('#AddTeamApplyModal').addClass('ready').html(data);
            $('#AddTeamApplyModal').modal('show');
        })
    }
    else {
        $('#AddTeamApplyModal').modal('show');
    }
}