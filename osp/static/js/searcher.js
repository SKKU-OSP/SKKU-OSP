const searcher = {
    nowPage: 1,
    MAX_PAGE: 1,
    init: function () {
        let _this = this;
        let targetBoard = "#board-searcher";
        let targetSearch = "#search-word";
        let targetTag = "#tag-searcher";
    
        // 통합 검색
        $('#search-btn').click(function() {
            targetBoard = "#board-searcher";
            targetSearch = "#search-word";
            targetTag = "#article-filter";
            _this.redraw(targetSearch, targetTag, targetBoard, to_page_1=true);
        });
        // 유저 게시판 검색
        $('#user-search-btn').click(function() {
            targetBoard = "#user-board";
            targetSearch = "#search-username";
            targetTag = "#user-tag-filter";
            _this.redraw(targetSearch, targetTag, targetBoard, to_page_1=1);
        });
        // 내 활동 목록 검색
        $('#activity-search-btn').click(function() {
            targetBoard = "#activity-searcher";
            targetSearch = "#search-activity";
            targetTag = "#tag-select";
            _this.redraw(targetSearch, targetTag, targetBoard, to_page_1=true);
        });
        // 엔터키 검색 이벤트
        $(document).keypress(function(e) {
            if ($("#search-username").val() !== "" && $("#search-username").val() !== undefined){
                targetBoard = "#user-board";
                targetSearch = "#search-username";
                targetTag = "#user-tag-filter";
            }
            else if($("#search-activity").val() !== "" && $("#search-activity").val() !== undefined){
                targetBoard = "#activity-searcher";
                targetSearch = "#search-activity";
                targetTag = "#tag-select";
            }
            else if($("#search-word").val() !== ""){
                targetBoard = "#board-searcher";
                targetSearch = "#search-word";
                targetTag = "#article-filter";
            }
            if(e.keyCode==13 && $(targetSearch).val() !== "") 
                _this.redraw(targetSearch, targetTag, targetBoard, to_page_1=true);
        });
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
    drawPage: function () {
        console.log("nowPage", this.nowPage);
        let pageBody = $('#pagination-body');
        pageBody.empty();
        if(this.nowPage != 1) {
            pageBody.append(this.pageItem('<i class="bi-chevron-double-left">'));
            pageBody.append(this.pageItem('<i class="bi-chevron-left">'));
        }
        else{
            pageBody.append(this.pageItem('<i class="bi-chevron-double-left">').addClass('disabled'));
            pageBody.append(this.pageItem('<i class="bi-chevron-left">').addClass('disabled'));
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
            pageBody.append(this.pageItem(i));
        }
        if(this.nowPage < this.MAX_PAGE) {
            pageBody.append(this.pageItem('<i class="bi-chevron-right">'));
            pageBody.append(this.pageItem('<i class="bi-chevron-double-right">'));
        }
        else{
            pageBody.append(this.pageItem('<i class="bi-chevron-right">').addClass('disabled'));
            pageBody.append(this.pageItem('<i class="bi-chevron-double-right">').addClass('disabled'));
        }
        $('.page-link').click(function(){
            var val = $(this).attr('value');
            if(isNaN(val)){
                console.log('Special: value is NaN');
                special_code = $(val).attr('class');
                if(special_code == 'bi-chevron-left'){
                    this.nowPage -= 1;
                }
                if(special_code == 'bi-chevron-double-left'){
                    this.nowPage = 1;
                }
                if(special_code == 'bi-chevron-right'){
                    this.nowPage += 1
                }
                if(special_code == 'bi-chevron-double-right'){
                    this.nowPage = this.MAX_PAGE;
                }
            }
            else{
                this.nowPage = Number(val);
            }
            redraw();
        })
        
    },
    getUrl: function (board) {
        const url ={
            total: "/community/article-list/",
            user: "/community/account-cards/",
            activity: "/community/activity/",
        }
        if (Object.keys(url).includes(board)){
            return url[board];
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
            user: "#article-card-body"
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

        

        let url = this.getUrl(board);
        console.log("url", url);
        
        let containerId = this.getContainerId(board);
        
        // 키워드 필터
        let searchWord = $(wordFilter).val();
        // 태그 필터
        const tag_list = [];
        console.log("$(tagFilter)", $(tagFilter));

        for(let tag of $(tagFilter).find('.ss-value-text')){
            tag_list.push($(tag).html());
        }
        console.log("tag_list", tag_list);
        
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
            'team_li': JSON.stringify(team_li),
        }
        // boardId가 아이디 값이 아니면 통합검색 외의 검색으로 api 호출
        // 아이디 값이라면 통합검색이므로 링크 이동
        if(!isNaN(boardId)){
            data["board"] = boardId;
            console.log("get data", data);
            location.href = "/community/search/?" + jQuery.param(data);
        }

        $.ajax(
            {
                url: url,
                data: data,
                method: 'GET',
                dataType: 'JSON'
            }
        ).done(function(data){
            $(containerId).html(data['html']);
            this.MAX_PAGE = data['max-page'];
            draw_page();
        });
    },

}
searcher.init();
