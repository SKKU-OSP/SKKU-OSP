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
        $('.bi-caret-down-fill').click(function () {
          if (this.style.transform == '') {
            this.style.transform = 'rotate(180deg)';
          } else {
            this.style.transform = '';
          }
          var tr_id = '#msg-id-' + this.attributes.val.value;
          if ($(tr_id).css('display') === 'none') {
            $(tr_id).removeClass("d-none");
          } else {
            $(tr_id).addClass("d-none");

          }
        });
      })
    } else {
      $('#ApplyTeamModal').modal('show');
    }
  });
});

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

function ArticleScrap(obj, article_id, user_id) {
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
        if (data['result']) {
          $('#article-bookmark').html('bookmark');
        } else {
          $('#article-bookmark').html('bookmark_border');
        }
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

function CommentLike(comment_id, user_id) {
  if (user_id == -1) {
    alert("로그인 후 이용해주세요.");
    return;
  }
  ajax_form_data = new FormData();
  ajax_form_data.append('comment_id', comment_id);
  ajax_form_data.append('csrfmiddlewaretoken', csrftoken);
  $.ajax({
    type: "POST",
    url: "/community/api/comment/like/",
    data: ajax_form_data,
    dataType: 'json',
    processData: false,
    contentType: false,

    success: function (data) {
      if (data['status'] == 'success') {
        $(`#comment-${comment_id} .comment-item-like > span`).toggleClass('material-icons-outlined');
        $(`#comment-${comment_id} .comment-item-like > span`).toggleClass('material-icons');
        $(`#comment-${comment_id} .comment-item-like-cnt`).html(data['result']);
      }
    },
  });
}