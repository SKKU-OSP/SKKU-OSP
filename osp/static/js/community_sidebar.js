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
          },
          placeholder: 'Tag',
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
});

function ArticleThumbUp(article_id, user_id) {
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
        $('#article-like-btn > span').toggleClass('material-icons-outlined');
        $('#article-like-btn > span').toggleClass('material-icons');
        $('#article-like-cnt').html(data['result']);
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
        if (data['created']) {
          $('#article-scrap-btn').html('<span  class="material-icons-outlined" >bookmark </span>');
        } else {
          $('#article-scrap-btn').html('<span  class="material-icons-outlined" >bookmark_border </span>');
        }
        $('#article-scrap-cnt').html(data['result']);
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

function ApplyDelete(msg_id){

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
      } else {
        alert(data['message']);
      }
    }
  })
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