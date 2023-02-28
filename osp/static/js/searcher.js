const searcher = {
    nowPage: 1,
    MAX_PAGE: 1,
    activityType: 'article',
    init: function () {
        let _this = this;
        let targetBoard = "#board-searcher";
        let targetSearch = "#search-word";
        let targetTag = "#tag-searcher";

        // 통합 검색
        $('#search-btn').click(function() {
            targetBoard = "#board-searcher";
            targetSearch = "#search-word";
            targetTag = "#tag-filter";
            _this.redraw(targetSearch, targetTag, targetBoard, to_page_1=true);
        });
        // 유저 게시판 검색
        $('#user-search-btn').click(function() {
            targetBoard = "#user-board";
            targetSearch = "#search-username";
            targetTag = "#user-tag-filter";
            _this.redraw(targetSearch, targetTag, targetBoard, to_page_1=true);
        });
        // 내 활동 목록 검색
        $('#activity-search-btn').click(function() {
            targetBoard = "#activity-board";
            targetSearch = "#search-activity";
            targetTag = "#activity-tag-filter";
            _this.redraw(targetSearch, targetTag, targetBoard, to_page_1=true);
        });
        $('#pills-article-tab').click(function() {
            _this.activityType = 'article';
            _this.nowPage = 1;
            _this.draw();
        });
        $('#pills-scrap-tab').click(function() {
            _this.activityType = 'scrap';
            _this.nowPage = 1;
            _this.draw();
        });        
        $('#pills-comment-tab').click(function() {
            _this.activityType = 'comment';
            _this.nowPage = 1;
            _this.draw();
        });
        // 엔터키 검색 이벤트
        $(document).keypress(function(e) {
            if ($("#search-username").val() !== "" && $("#search-username").val() !== undefined){
                targetBoard = "#user-board";
                targetSearch = "#search-username";
                targetTag = "#user-tag-filter";
            }
            else if($("#search-activity").val() !== "" && $("#search-activity").val() !== undefined){
                targetBoard = "#activity-board";
                targetSearch = "#search-activity";
                targetTag = "#tag-select";
            }
            else if($("#search-word").val() !== ""){
                targetBoard = "#board-searcher";
                targetSearch = "#search-word";
                targetTag = "#tag-filter";
            }
            if(e.keyCode==13 && $(targetSearch).val() !== "") 
                _this.redraw(targetSearch, targetTag, targetBoard, to_page_1=true);
        });
        // 검색결과는 페이지 번호만 렌더링, 게시판은 전체 렌더링
        const boardValue = $("#board-title-bar").data("board-value");
        if(boardValue === "search") _this.drawSearchPage();
        else _this.draw();
    },
    pageSearchItem: function (page) {
        const pathname = location.pathname;
        const qeuryString = new URLSearchParams(location.search);
        if(isNaN(page)){
            special_code = $(page).attr('class');
            console.log(special_code);
            if(special_code == 'bi-chevron-left'){
                qeuryString.set('page', String(this.nowPage-1));
            }
            else if(special_code == 'bi-chevron-double-left'){
                qeuryString.set('page', '1');
            }
            else if(special_code == 'bi-chevron-right'){
                qeuryString.set('page', String(this.nowPage+1));
            }
            else if(special_code == 'bi-chevron-double-right'){
                qeuryString.set('page', String(this.MAX_PAGE));
            }
        }
        else{
            qeuryString.set('page', String(page));
        }

        let hrefLink = pathname + '?' + qeuryString;
        if(page == this.nowPage){
            return $('<div></div>').addClass('page-item').addClass('active').append(
                $('<a></a>').addClass('page-link').addClass('m-auto').attr('href', hrefLink).attr('value', page).html(page)
            )
        }
        return $('<div></div>').addClass('page-item').append(
            $('<a></a>').addClass('page-link').addClass('m-auto').attr('href', hrefLink).attr('value', page).html(page)
        )
    },
    pageItem: function (page) {
        if(page == this.nowPage){
            return $('<div></div>').addClass('page-item').addClass('active').append(
                $('<a></a>').addClass('page-link').addClass('m-auto').attr('href', '#').attr('value', page).html(page)
            )
        }
        return $('<div></div>').addClass('page-item').append(
            $('<a></a>').addClass('page-link').addClass('m-auto').attr('href', '#').attr('value', page).html(page)
        )
    },
    drawSearchPage: function () {
        const qeuryString = new URLSearchParams(location.search);
        this.nowPage = qeuryString.get("page");
        if (!isNaN(parseInt(this.nowPage))){
            this.nowPage=parseInt(this.nowPage);
        }
        else this.nowPage = 1;
        console.log("nowPage", this.nowPage);
        let pageBody = $('#pagination-body');
        let preRenderPage = pageBody.data("max-page");
        if (!isNaN(parseInt(preRenderPage))){
            this.MAX_PAGE = parseInt(preRenderPage);
        }
        console.log("searcher.MAX_PAGE", this.MAX_PAGE);
        
        pageBody.empty();
        if(this.nowPage != 1) {
            pageBody.append(this.pageSearchItem('<i class="bi-chevron-double-left">'));
            pageBody.append(this.pageSearchItem('<i class="bi-chevron-left">'));
        }
        else{
            pageBody.append(this.pageSearchItem('<i class="bi-chevron-double-left">').addClass('disabled'));
            pageBody.append(this.pageSearchItem('<i class="bi-chevron-left">').addClass('disabled'));
        }
        let startLimit = Math.max(1, this.nowPage - 2);
        let endLimit = Math.min(this.MAX_PAGE, this.nowPage + 2);
        if(endLimit - startLimit < 5){
            if(this.nowPage - startLimit < 2){
                endLimit = Math.min(this.MAX_PAGE, endLimit + 2 - (this.nowPage - startLimit));
            }
            if(endLimit - this.nowPage < 2){
                startLimit = Math.max(1, startLimit - (2 - (endLimit - this.nowPage)));
            }
        }
        for(i = startLimit; i <= endLimit; i++){
            pageBody.append(this.pageSearchItem(i));
        }
        if(this.nowPage < this.MAX_PAGE) {
            pageBody.append(this.pageSearchItem('<i class="bi-chevron-right">'));
            pageBody.append(this.pageSearchItem('<i class="bi-chevron-double-right">'));
        }
        else{
            pageBody.append(this.pageSearchItem('<i class="bi-chevron-right">').addClass('disabled'));
            pageBody.append(this.pageSearchItem('<i class="bi-chevron-double-right">').addClass('disabled'));
        }
    },
    drawPage: function() {
        console.log("footer this.nowPage", this.nowPage);
        var page_body = $('#pagination-body');
        page_body.empty();
        if(this.nowPage != 1) {
            page_body.append(this.pageItem('<i class="bi-chevron-double-left">'));
            page_body.append(this.pageItem('<i class="bi-chevron-left">'));
            console.log("footer if(this.nowPage != 1) {");
        }
        else{
            page_body.append(this.pageItem('<i class="bi-chevron-double-left">').addClass('disabled'));
            page_body.append(this.pageItem('<i class="bi-chevron-left">').addClass('disabled'));
        }
        var left_limit = Math.max(1, this.nowPage - 2);
        var right_limit = Math.min(this.MAX_PAGE, this.nowPage + 2);

        if(right_limit - left_limit < 5){
            if(this.nowPage - left_limit < 2){
                right_limit = Math.min(this.MAX_PAGE, right_limit + 2 - (this.nowPage - left_limit));
            }
            if(right_limit - this.nowPage < 2){
                left_limit = Math.max(1, left_limit - (2 - (right_limit - this.nowPage)));
            }
        }
        for(i = left_limit; i <= right_limit; i++){
            page_body.append(this.pageItem(i));
        }
        if(this.nowPage < this.MAX_PAGE) {
            page_body.append(this.pageItem('<i class="bi-chevron-right">'));
            page_body.append(this.pageItem('<i class="bi-chevron-double-right">'));
        }
        else{
            page_body.append(this.pageItem('<i class="bi-chevron-right">').addClass('disabled'));
            page_body.append(this.pageItem('<i class="bi-chevron-double-right">').addClass('disabled'));
        }
    },
    getUrl: function (board) {
        const url ={
            total: "/community/article-list/",
            user: "/community/account-cards/",
            activity: "/community/activity/contents/",
        }
        let urlKey = board.split("_")[0].toLowerCase();
        if (Object.keys(url).includes(urlKey)){
            return url[urlKey];
        }
        else{
            let lastIdx = board.lastIndexOf("_");
            let boardName = board.substring(0, lastIdx);
            let boardId = board.substring(lastIdx+1);
            return `/community/article-list/${boardName}/${boardId}/`; 
        }
    },
    getContainerId: function(board) {
        const container ={
            user: "#article-card-body",
            activity: "#pills-tabContent",
        }
        if (Object.keys(container).includes(board)){
            return container[board];
        }
        else{
            return "#article-list-body";
        }
    },
    redraw: function (wordFilter, tagFilter, boardFilter, to_page_1=false) {
        // 게시판 필터
        console.log("wordFilter", wordFilter);
        console.log("tagFilter", tagFilter);
        console.log("boardFilter", boardFilter);
        console.log("to_page_1", to_page_1);

        let board = $(boardFilter).val();
        let lastIdx = board.lastIndexOf("_");
        let boardName = board.substring(0, lastIdx);
        let boardId = board.substring(lastIdx+1);

        // 키워드 필터
        let searchWord = $(wordFilter).val();
        // 태그 필터
        const tag_list = [];
        for(let tag of $(tagFilter).find('.ss-value-text')){
            tag_list.push($(tag).html());
        }
        console.log("searchWord", searchWord, "tag_list", tag_list);

        if((searchWord === "" || searchWord === undefined) && tag_list.length === 0){
            // 전부 빈값이면 검색하지 않음
            return;
        }
        // 유저 추천에 사용하는 팀 필터 
        const team_li = [];
        $('#team-filter').children().each(function(){
            if($(this).hasClass('bg-gray')){
                console.log("team li", $(this).val());
                team_li.push($(this).attr('value'));
            }
        });
        console.log(team_li);
        
        // 페이지네이션 설정
        if(to_page_1){
            this.nowPage = 1;
        }
        data = {
            'page': this.nowPage,
            'keyword': searchWord,
            'tag': tag_list.join(','),
        }
        // boardId가 아이디 값이 아니면 통합검색 외의 검색으로 api 호출
        // 아이디 값이라면 통합검색이므로 링크 이동
        console.log("boardId", boardId);
        if(!isNaN(boardId)){
            data["board"] = boardId;
            console.log("get data", data);
            location.href = "/community/search/?" + jQuery.param(data);
        }

        let url = this.getUrl(board);
        console.log("url", url);
        let containerId = this.getContainerId(board);

        data["team_li"] = JSON.stringify(team_li);
        data["type"] = this.activityType;
        $.ajax({
            url: url,
            data: data,
            method: 'GET',
            dataType: 'JSON'
        }).done(function(data){
            $(containerId).html(data['html']);
            searcher.MAX_PAGE = data['max-page'];
            searcher.drawSearchPage();
        });
    },
    // 페이지네이션을 url로 하는 방법
    draw: function (to_page_1=false){
        console.log("call draw");
        const boardValue = $("#board-title-bar").data("board-value");
        if(boardValue === undefined) return;
        const url = this.getUrl(boardValue);
        console.log(url, "url");
        if(to_page_1){
            this.nowPage = 1;
        }
        let team_li = [];
        $('#team-filter').children().each(function(){
            if($(this).hasClass('bg-gray')){
                team_li.push($(this).attr('value'));
            }
        });
        console.log("js team_li", team_li);
        console.log("this.activityType", this.activityType);
        $.ajax(
            {
                url: url,
                data: {
                    'page': this.nowPage,
                    'team_li': JSON.stringify(team_li),
                    'type': this.activityType,
                },
                method: 'GET',
                dataType: 'JSON',
                beforeSend: function( xhr ) {
                    if(boardValue.split("_")[0].toLowerCase() === "user")
                        $('#article-card-body').html(`<div class="spinner-border m-auto mt-5" role="status"></div>`);
                },
            }
        )
        .done(function(data){
            console.log("draw get data");
            if(boardValue.split("_")[0].toLowerCase() === "user")
                $('#article-card-body').html(data['html']);
            if(boardValue.split("_")[0].toLowerCase() === "activity")
                $('#pills-tabContent').html(data['html']);
            else
                $('#article-list-body').html(data['html']);
            searcher.MAX_PAGE = data['max-page'];
            console.log("searcher.MAX_PAGE", searcher.MAX_PAGE);
            searcher.drawPage();
            $('.page-link').click(function(){
                var val = $(this).attr('value');
                if(isNaN(val)){
                    special_code = $(val).attr('class');
                    if(special_code == 'bi-chevron-left'){
                        searcher.nowPage -= 1;
                    }
                    if(special_code == 'bi-chevron-double-left'){
                        searcher.nowPage = 1;
                    }
                    if(special_code == 'bi-chevron-right'){
                        searcher.nowPage += 1
                    }
                    if(special_code == 'bi-chevron-double-right'){
                        searcher.nowPage = searcher.MAX_PAGE;
                    }
                }
                else{
                    searcher.nowPage = Number(val);
                }
                searcher.draw();
            });
        });
    }
}
searcher.init();
$().ready(function () {
    if($("#tag-searcher").length > 0 ){
        let tagSeacher = new SlimSelect({
            select: '#tag-searcher',
            onChange: (selected_list) => {
                for (let selected of selected_list) {
                    $(`.ss-value[data-id="${selected.id}"]`).addClass('bg-' + selected.class);
                }
                if(selected_list.length > 0){
                    $("#tag-btn").addClass("btn-primary");
                    $("#tag-btn").removeClass("btn-light");
                }else{
                    $("#tag-btn").removeClass("btn-primary");
                    $("#tag-btn").addClass("btn-light");
                }
            },
            placeholder: 'Tag',
        });
        // 이미 선택된 태그의 색도 변경하도록 한다.
        let selected_list = Array(0);
        for (let optionGroup of tagSeacher.data.data){
            let selectedOptions = optionGroup.options.filter(obj => obj.selected);
            selected_list = selected_list.concat(selectedOptions);
        }
        tagSeacher.onChange(selected_list);
    }
    $('#searcher').addClass('show');
});
