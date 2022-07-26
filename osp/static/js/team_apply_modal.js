
function openTeamApplyModal(team_id){
  if (!$('#AddTeamApplyModal').hasClass('ready')) {
      // var id = $(this).data('team-id');
      $.ajax({
        url: "/team/api/team-apply"+"/"+team_id,
        type: "GET",
        dataType: 'HTML'
      }).done(function (data) {
        $('#AddTeamModal').addClass('ready').html(data);
        $('#AddTeamModal').modal('show');
      })
    } else {
      $('#AddTeamModal').modal('show');
    }
}

function teamApply(team_id){

      if(confirm('지원을 완료하시겠습니까?')){
        var form = $('#team-apply-form')[0];
        var formData = new FormData(form);
        $.ajax({
          url: "/team/api/team-apply"+"/"+team_id,
          type: "POST",
          data: formData,
          dataType: 'JSON',
          cache: false,
          contentType: false,
          processData: false
        }).done(function (data) {
          console.log(data);
          if (data.status == 'fail') {
            // for (const [field, errors] of Object.entries(data.errors)) {
              // console.log(field, errors)
              // $(`[name=${field}`).addClass('is-invalid')
              // $(`.invalid-feedback[for=team-${field}`).html(errors)
            // }
            alert('다시 시도해주세요.');
          }
          // else {
            window.location.reload();
          // }
        }).fail(function (data) {
          alert('Server Error!');
        });
      }
}