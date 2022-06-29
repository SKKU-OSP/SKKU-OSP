$(function () {
    new SlimSelect({
        select: '#tag-select',
        searchingText: 'Searching...',
        ajax: function (search, callback) {
            fetch('/tag/api/?keyword=' + search)
                .then(function (res) {
                    return res.json()
                })
                .then(function (json) {
                    let data_by_type = {}
                    for(i = 0; i < json['data'].length; i++){
                        if(!(json['data'][i].type in data_by_type)){
                            data_by_type[json['data'][i].type] = []
                        }
                        data_by_type[json['data'][i].type]
                        .push({'text': json['data'][i].name})
                    }
                    let data = []
                    for(type of Object.keys(data_by_type)){
                        data.push({
                            'label': type,
                            'options': data_by_type[type]
                        })
                        // for(x of data_by_type[type]){
                        //     data.push(x)
                        // }
                    }
                    console.log(data)
                    callback(data)
                })
        }
    })
})