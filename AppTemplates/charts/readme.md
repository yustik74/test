<br />
<p align="center">
  <a href="https://www.tk-nav.ru/">
    <img src="img/logo_TK_big_ru.png" alt="Logo" width="133" height="29">
  </a>

<h3 align="center">Демо-приложение для демонстрации работы API и графиков</h3>

  <p align="center"> 
        Демонстрация возможностей внешних App
</p>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Содержание</h2></summary>
  <ol>
    <li>
      <a href="#о-проекте">О проекте</a>
    </li>
    <li>
      <a href="#перед-началом">Перед началом</a>
      <ul>
        <li><a href="#установка">Установка</a></li>
      </ul>
    </li>
    <li><a href="#использование">Использование</a></li>
    <li><a href="#контакты">Контакты</a></li>
  </ol>
</details>

## О проекте

<img src="img/screen.png" alt="Пример" width="800" height="400">

Данный пример показывает, как можно использовать Kendo Charts для построения графиков по данным, взятым из [AutoGRAPH
API](https://wiki.tk-chel.ru/index.php/AutoGRAPH.NET_Service_Methods).
При выборе группы устройств возникает событие onSelectCarGroup и выполняются запросы <a href="https://wiki.tk-chel.ru/index.php/AutoGRAPH.NET_Service_EnumDevices">EnumDevices</a>, <a href="https://wiki.tk-chel.ru/index.php/AutoGRAPH.NET_Service_GetTrips">GetTripsTotal</a>, результаты запросов выводится на график.

## Перед началом

Для работы примера нужен доступ к AutoGRAPH Web под учетной записью администратора.

### Установка

1. Скопируйте папку с App в AppTemplates
   
2. Зайдите в Apps
   
    <img src="img/menu-apps.png" alt="Меню" width="800" height="600">

3. Добавьте новый App, уделив внимание выделенным полям (Шаблон - название директории, в которой находится приложение).

    <img src="img/adding-app.png" alt="Меню" width="800" height="600">

4. Перезагрузите страницу и включите App в меню

    <img src="img/app-in-menu.png" alt="Меню" width="800" height="600">

<!-- USAGE EXAMPLES -->

## Использование

Выберите группу автомобилей из списка объектов, в окне приложения будут нарисованы итоговые пробеги по каждому автомобилю в группе. 

_Для других вариантов использования воспользуйтесь описанием нашего [API](https://wiki.tk-chel.ru/index.php/AutoGRAPH.NET_Service_Methods)._

<!-- CONTACT -->

## Контакты

E-mail: <a href="mailto:mail@tk-chel.ru">mail@tk-chel.ru</a>
