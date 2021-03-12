function getChildren(array, parent) {
    let result = [];
    let groups = [];

    //добавляем выбранную группу
    array.Groups.filter(a => a.ID == parent).forEach(function (childGroup) {
        groups.push(childGroup);
    });
    //собираем все дочерние группы
    getChildrenGroups(array, parent).forEach(function (childGroup) {
        groups.push(childGroup);
    });
    //для каждой группы собираем все дочерние элементы
    groups.forEach(function (group) {
        getChildrenItemsFromGroup(array, group.ID).forEach(function (childItem) {
            result.push(childItem);
        });
    });
    return result;
}

function getChildrenItemsFromGroup(array, parent) {
    let result = [];
    array.Items.filter(a => a.ParentID == parent).forEach(function (child) {
        result.push(child);
    });
    return result;
}

function getChildrenGroups(array, parentID) {
    let result = [];
    array.Groups.filter(a => a.ParentID == parentID)
        .map(item => {
            return {Name: item.Name, ID: item.ID}
        }).forEach(function (item) {
        result.push(item);
    });
    return result;
}