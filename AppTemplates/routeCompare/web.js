let get = function (url, data, callback) {
    $.ajax
    ({
        url: url,
        type: 'get',
        data: data,
        traditional: true,
        success: function (data) {
            callback(data);
        }
    });
}