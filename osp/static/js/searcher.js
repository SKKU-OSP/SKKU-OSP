const searcher = {
    nowPage: 1,
    MAX_PAGE: 1,
    activityType: 'article',
    item: null,
    offset: 1,
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
        // 엔터키 검색 이벤트 - 검색어를 입력했을 때만 이벤트 실행
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
        // 맞춤 유저 추천 팀 적용
        $('#btn-team-filter').click(function(e) {
            _this.draw(true);
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
        return searcher.pageItem(page, hrefLink);
    },
    pageItem: function (page, hrefLink='#') {
        let pageEle = $('<a></a>').addClass('page-item').attr('href', hrefLink).attr('data-page', page);
        let pageNum = $('<span></span>').addClass('page-link').addClass('m-auto').html(page);
        if(page == this.nowPage)
            pageEle.addClass('active');
        return pageEle.append(pageNum);
    },
    drawSearchPage: function () {
        console.log("searcher.drawSearchPage");
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
        console.log("searcher.drawPage this.nowPage", this.nowPage);
        const page_body = $('#pagination-body');
        page_body.empty();
        if(this.nowPage != 1) {
            page_body.append(this.pageItem('<i class="bi-chevron-double-left">'));
            page_body.append(this.pageItem('<i class="bi-chevron-left">'));
        }
        else{
            page_body.append(this.pageItem('<i class="bi-chevron-double-left">').addClass('disabled'));
            page_body.append(this.pageItem('<i class="bi-chevron-left">').addClass('disabled'));
        }
        let left_limit = Math.max(1, this.nowPage - 2);
        let right_limit = Math.min(this.MAX_PAGE, this.nowPage + 2);

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

        $('.page-item:not(.disabled)').click(function(){
            const page = $(this).data('page');
            // 클릭한 페이지번호로 설정
            if(isNaN(page)){
                special_code = $(page).attr('class');
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
                searcher.nowPage = Number(page);
            }
            // 페이지번호를 클릭하고 페이지와 페이지네이션을 다시 렌더링
            if(searcher.item !== null) {
                searcher.movePage(searcher.offset);
                searcher.drawPage();
            }
            else
                searcher.draw();
        });
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
        const team_li = searcher.getTeamList();
        
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
        let containerId = "#body-content";

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

        // 유저 추천에 사용하는 팀 필터 
        const team_li = searcher.getTeamList();

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
                        $('#body-content').html(`<div class="spinner-border m-auto mt-5" role="status"></div>`);
                },
            }
        )
        .done(function(data){
            console.log("draw get data");

            if(typeof(data['html']) !== "string") {
                searcher.item = data['html'];
                searcher.offset = data['offset'];
                searcher.movePage(searcher.offset);
            }
            else{
                $('#body-content').html(data['html']);
            }

            searcher.MAX_PAGE = data['max-page'];
            console.log("searcher.MAX_PAGE", searcher.MAX_PAGE);
            searcher.drawPage();
        });
    },
    getTeamList: function () {
        // 유저 추천에 사용하는 팀 필터 
        const teamFilter = document.getElementById("team-filter");
        console.log("teamFilter", teamFilter);
        if (teamFilter === null) return [];
        const teamFilterForm = new FormData(teamFilter);
        const team_li = teamFilterForm.getAll('teams');
        console.log(team_li);
        return team_li;
    },
    movePage: function (offset) {
        let pageIdx = offset*searcher.nowPage;
        let itemList = searcher.item.slice(pageIdx-offset, pageIdx);
        $('#body-content').html(itemList);
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
