function getChilds(array, parent) {
    let result = [];
    let groups = [];

    //добавляем выбранную группу
    array.Groups.filter(a => a.ID == parent).forEach(function (childGroup) {
        groups.push(childGroup);
    });
    //собираем все дочерние группы
    getChildGroups(array, parent).forEach(function (childGroup) {
        groups.push(childGroup);
    });
    //для каждой группы собираем все дочерние элементы
    groups.forEach(function (group) {
        getChildItemsFromGroup(array, group.ID).forEach(function (childItem) {
            result.push(childItem);
        });
    });
    return result;
}

function getChildGroups(array, parent) {
    let result = [];
    let groups = array.Groups.filter(a => a.ParentID == parent);
    groups.forEach(function (group) {
        result.push(group);
        getChildGroups(array, group.ID).forEach(function (childGroup) {
            result.push(childGroup);
        });
    });
    return result;
}

function getChildItemsFromGroup(array, parent) {
    let result = [];
    array.Items.filter(a => a.ParentID == parent).forEach(function (child) {
        result.push(child);
    });
    return result;
}
