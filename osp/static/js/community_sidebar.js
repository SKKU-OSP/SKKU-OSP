$().ready(function () {
  $('#team-create').click(function () {
    // 팀 만들기 모달 창을 띄우는 함수
    if (!$('#AddTeamModalBody').hasClass('ready')) {
      $.ajax({
        url: "/team/api/team-create",
        type: "GET",
        dataType: 'HTML'
      }).done(function (data) {
        $('#AddTeamModalBody').addClass('ready').html(data);
        $('#AddTeamModal').modal('show');
        new_team_tag = new SlimSelect({
          select: 'select[name=tag]',
          onChange: (selected_list) => {
            for (let selected of selected_list) {
              $(`.ss-value[data-id="${selected.id}"]`).addClass('bg-' + selected.class)
            }
          },
          placeholder: 'Tag',
        });
        $('#team-submit').click(function () {
          createTeam();
        });
      });
    } else {
      $('#AddTeamModal').modal('show');
    }
  });

  // 현재 주소를 체크해서 사이드바의 아이템의 폰트 색을 변경
  $('.sidebar-link').each(function() {
      if($(this).attr('href') === window.location.pathname) {
        $(this).parent().addClass('selected');
      }
  });
  $('.folder').click(function () {
    var target = $(this).data('fold-target');
    if ($(target).hasClass("none")) {
      $(this).addClass('bi-chevron-up');
      $(this).removeClass('bi-chevron-down');
      $(target).removeClass('none');
    }
    else {
      $(this).addClass('bi-chevron-down');
      $(this).removeClass('bi-chevron-up');
      $(target).addClass('none');
    }
  });
});

const createTeam = function () {
  if(confirm("팀을 만드시겠습니까?")) {
    $('#team-submit').unbind('click');
    console.log('Submit');
    const form = $('#team-create-form')[0];
    const formData = new FormData(form);
    $.ajax({
      url: "/team/api/team-create",
      type: "POST",
      data: formData,
      dataType: 'JSON',
      cache: false,
      contentType: false,
      processData: false,
      async: false,
    }).done(function (data) {
      console.log(data);
      if (data.status == 'fail') {
        $('input').removeClass('is-invalid');
        const createForm = $('#team-create-form');
        createForm.find('.invalid-feedback').html("");
        for (const [field, errors] of Object.entries(data.errors)) {
          console.log(field, errors);
          if(createForm.find(`[name=${field}]`).length > 0){
            createForm.find(`[name=${field}]`).addClass('is-invalid');
            createForm.find(`.invalid-feedback[data-feedback-type=team-${field}]`).html(errors);
          }else{
            alert(data['message']);
          }
        }
      } else {
        alert(data["message"]);
        window.location.reload();
      }
      $('#team-submit').bind('click', function() {
        createTeam();
      });
    }).fail(function (data) {
      alert(data['message']);
      $('#team-submit').bind('click', function() {
        createTeam();
      });
    });
  }
}

function inviteTeamModalOpen (user_id=-1, team_id=-1, rec_team_id=-1) {
  console.log(rec_team_id);
  $.ajax({
    url: "/team/api/team-invite",
    type: "GET",
    data:{'user_id':user_id, 'team_id':team_id, 'recommend_team': rec_team_id},
    dataType: 'HTML'
  }).done(function (data) {
    $('#InviteTeamModalBody').addClass('ready').html(data);
    $('#InviteTeamModal').modal('show');
    if(user_id==-1){
      option_select = new SlimSelect({
        select: '#invite-team-username',
        placeholder: '팀원 선택',
      });
    }else{
      option_select = new SlimSelect({
        select: '#invite-team-id',
        placeholder: '팀 선택',
      });
    }
    $('#team-invite-submit').click(function () {
      inviteTeam();
    });
  });
}

const inviteTeam = function () {
  $('#team-invite-submit').unbind('click');
  ajax_form_data=new FormData();
  ajax_form_data.append('username',$('#invite-team-username').val());
  if ($('#invite-team-id').attr('team_id')==undefined){
    ajax_form_data.append('team_id',$('#invite-team-id').val());
  }else{
    ajax_form_data.append('team_id',$('#invite-team-id').attr('team_id'));
  }
  ajax_form_data.append('invite_msg',$('#team-invite-msg').val());
  ajax_form_data.append('csrfmiddlewaretoken', csrftoken);
  if(confirm('초대 메세지를 보내시겠습니까?')){
    $.ajax({
      url: "/team/api/team-invite",
      type: "POST",
      data: ajax_form_data,
      dataType: 'JSON',
      cache: false,
      contentType: false,
      processData: false,
      async:false
    }).done(function (data) {
      console.log(data);
      if (data.status == 'fail') {
        for (const [field, errors] of Object.entries(data.errors)) {
          $(`[name=${field}]`).addClass('is-invalid')
          $(`.invalid-feedback[data-feedback-type=team-${field}]`).html(errors)
        }
        $('#team-invite-submit').bind('click', function () {
          inviteTeam();
        });
      } else {
        alert('초대 메세지를 전송하였습니다!');
        window.location.reload();
      }
    }).fail(function (data) {
      alert('Server Error!');
      $('#team-invite-submit').bind('click', function () {
        inviteTeam();
      });
    });
  }
}

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
      else {
        alert(data["message"]);
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


function invite_result(team_id, username, is_okay) {

  var status = is_okay ? "수락" : "거절";

  if (!confirm("팀 초대를 " + status + "하시겠습니까?")) {
    return;
  }

  ajax_form_data = new FormData();
  ajax_form_data.append('team_id', team_id);
  ajax_form_data.append('username', username);
  ajax_form_data.append('is_okay', is_okay);
  ajax_form_data.append('direction', 'TO_ACCOUNT');
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
        window.location.reload();
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
      else {
        alert(data["message"]);
      }
    },
  });
}
