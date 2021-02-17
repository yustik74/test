//создание html-объекта выпадающего списка по массиву значений
function createSelect(values) {
    var selectServiceDiv = document.getElementById('selectRouteService');
    var newSelect = document.createElement('select');
    values.forEach(function (value) {
        var selectOption = document.createElement('option');
        selectOption.textContent = value;
        newSelect.appendChild(selectOption);
    });
    newSelect.selectedIndex = 2;
    selectServiceDiv.appendChild(newSelect);
}

function updateTable(tableName, dataSource) {
    if (dataSource.length > 0)
        $('#' + tableName).kendoGrid({
            columns: columns,
            dataSource: {
                data: dataSource
            }
        });
}

function removeTables(instanceName, maxCounter = 1) {
    for (var counter = 0; counter < maxCounter; counter++) {
        document.getElementById(instanceName + counter).remove();
    }
}

var columns = [
    {field: 'CalculatedDistance', title: 'Рассчетное расстояние'},
    {field: 'TotalDistance', title: 'Фактическое расстояние'}
];