const accountFinder = {
    init: function () {
        $('#btn-find-account').on("click", () => {
            const findAccountForm = document.getElementById("find-account-form");
            // email 정보가 들어있다.
            const ajaxFormData = new FormData(findAccountForm);
            $.ajax({
                type: "POST",
                url: "/accounts/api/v1/find_account",
                data: ajaxFormData,
                dataType: 'json',
                processData: false,
                contentType: false,
                
                success: function(data) {
                    console.log(data);
                    if(data['status']=="success"){
                        window.location.href = "/accounts/find_account/done/";
                    }
                    else{
                        $("#find-feedback").text(data['message']);
                    }
                },
                error: function(data){
                    alert('Error Occured');
                    $("#find-feedback").text(data['message']);
                }
            });
        })
    }
}
accountFinder.init();
console.log("account")
