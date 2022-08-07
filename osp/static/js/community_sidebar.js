$().ready(function () {
  $('#team-create').click(function () {
    if (!$('#AddTeamModal').hasClass('ready')) {
      $.ajax({
        url: "/team/api/team-create",
        type: "GET",
        dataType: 'HTML'
      }).done(function (data) {
        $('#AddTeamModal').addClass('ready').html(data)
        $('#AddTeamModal').modal('show');
        new_team_tag = new SlimSelect({
          select: 'select[name=tag]',
          onChange: (selected_list) => {
            for (selected of selected_list) {
              $(`.ss-value[data-id="${selected.id}"]`).addClass('bg-' + selected.class)
            }
          }
        });
        $('#team-submit').click(function () {
          console.log('Submit');
          var form = $('#team-create-form')[0];
          var formData = new FormData(form);
          $.ajax({
            url: "/team/api/team-create",
            type: "POST",
            data: formData,
            dataType: 'JSON',
            cache: false,
            contentType: false,
            processData: false
          }).done(function (data) {
            console.log(data);
            if (data.status == 'fail') {
              for (const [field, errors] of Object.entries(data.errors)) {
                console.log(field, errors)
                $(`[name=${field}`).addClass('is-invalid')
                $(`.invalid-feedback[for=team-${field}`).html(errors)
              }
            } else {
              window.location.reload();
            }
          }).fail(function (data) {
            alert('Server Error!');
          });
        });
      })
    } else {
      $('#AddTeamModal').modal('show');
    }
  });

  $('#team-apply-list').click(function () {
    if (!$('#ApplyTeamModal').hasClass('ready')) {
      $.ajax({
        url: "/team/api/team-apply-list",
        type: "GET",
        dataType: 'HTML'
      }).done(function (data) {
        $('#ApplyTeamModal').addClass('ready').html(data)
        $('#ApplyTeamModal').modal('show');
        $('.bi-caret-down-fill').click(function(){
          if(this.style.transform==''){
            this.style.transform = 'rotate(180deg)';
          }
          else{
            this.style.transform = '';
          }
          var tr_id = '#msg-id-'+this.attributes.val.value;
           if($(tr_id).css('display') === 'none')
            {
                $(tr_id).removeClass("d-none");
            }
            else
            {
              $(tr_id).addClass("d-none");

            }
        });
      })
    } else {
      $('#ApplyTeamModal').modal('show');
    }
  });
});