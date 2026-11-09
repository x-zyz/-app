/* 今日页的离线万年历。 */
(function () {
  'use strict';
  var Solar = window.Solar;
  var min = 1900, max = 2100;
  var weekdays = '日一二三四五六';
  function today() {
    var now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  }
  function days(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function options(start, end, selected) {
    var html = '';
    for (var n = start; n <= end; n++) html += '<option value="' + n + '"' +
      (n === selected ? ' selected' : '') + '>' + n + '</option>';
    return html;
  }
  function open(openSheet) {
    var date = today();
    openSheet('<div class="sheet-hd"><span class="t">万年历</span>' +
      '<button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
      '<div class="calendar" data-calendar></div>', function (mask) {
      var root = mask.querySelector('[data-calendar]');
      function render(focus) {
        var now = today();
        var prev = date.y > min || date.m > 1, next = date.y < max || date.m < 12;
        var cells = '';
        var start = new Date(Date.UTC(date.y, date.m - 1, 1)).getUTCDay();
        for (var gap = 0; gap < start; gap++) cells += '<span aria-hidden="true"></span>';
        for (var d = 1; d <= days(date.y, date.m); d++) {
          var l = Solar.fromYmd(date.y, date.m, d).getLunar();
          var term = l.getJieQi(), lunar = l.getDayInChinese();
          var label = term || (l.getDay() === 1 ? l.getMonthInChinese() + '月' : lunar);
          var isToday = now.y === date.y && now.m === date.m && now.d === d;
          cells += '<button data-calendar-day="' + d + '" aria-label="' + d + '日，农历' + lunar +
            (term ? '，' + term : '') + '" aria-pressed="' + (d === date.d) + '"' +
            (isToday ? ' aria-current="date"' : '') + '><b>' + d + '</b><small>' + label + '</small></button>';
        }
        var selected = Solar.fromYmd(date.y, date.m, date.d).getLunar();
        var terms = selected.getJieQi();
        var festivals = selected.getFestivals().concat(Solar.fromYmd(date.y,date.m,date.d).getFestivals());
        var yi = selected.getDayYi(), ji = selected.getDayJi();
        root.innerHTML = '<div class="calendar-controls"><button class="calendar-step" data-month-step="-1" aria-label="上个月"' +
          (prev ? '' : ' disabled') + '>‹</button><label><select data-calendar-year aria-label="年份">' + options(min,max,date.y) +
          '</select>年</label><label><select data-calendar-month aria-label="月份">' + options(1,12,date.m) +
          '</select>月</label><button class="calendar-step" data-month-step="1" aria-label="下个月"' +
          (next ? '' : ' disabled') + '>›</button><button class="calendar-today" data-calendar-today>回今天</button></div>' +
          '<div class="calendar-grid">' + Array.from(weekdays).map(function (w) { return '<span class="calendar-week">' + w + '</span>'; }).join('') +
          cells + '</div><section class="calendar-detail" aria-live="polite"><h3>' + date.y + '年' + date.m + '月' + date.d + '日</h3>' +
          '<p>农历' + selected.getMonthInChinese() + '月' + selected.getDayInChinese() +
          ' · ' + selected.getDayInGanZhi() + '日' + (terms ? ' · ' + terms : '') + '</p>' +
          (festivals.length ? '<p>节日：' + festivals.join('、') + '</p>' : '') +
          '<p><b>宜</b>　' + yi.join('、') + '</p><p><b>忌</b>　' + ji.join('、') + '</p>' +
          '<p class="tiny">宜忌采用内置传统历法数据。</p></section>';
        var focused = focus && root.querySelector(focus);
        if (focused) focused.focus({preventScroll:true});
      }
      root.addEventListener('change', function (e) {
        var field = e.target;
        if (field.matches('[data-calendar-year]')) date.y = +field.value;
        else if (field.matches('[data-calendar-month]')) date.m = +field.value;
        else return;
        date.d = Math.min(date.d, days(date.y,date.m));
        render(field.matches('[data-calendar-year]') ? '[data-calendar-year]' : '[data-calendar-month]');
      });
      root.addEventListener('click', function (e) {
        var button = e.target.closest('button');
        if (!button || button.disabled) return;
        if (button.hasAttribute('data-calendar-today')) {
          date = today();
          render('[data-calendar-today]');
        } else if (button.dataset.monthStep) {
          var next = new Date(Date.UTC(date.y, date.m - 1 + +button.dataset.monthStep, 1));
          date.y = next.getUTCFullYear();
          date.m = next.getUTCMonth() + 1;
          date.d = Math.min(date.d, days(date.y,date.m));
          render('[data-month-step="' + button.dataset.monthStep + '"]');
        } else if (button.dataset.calendarDay) {
          date.d = +button.dataset.calendarDay;
          render('[data-calendar-day="' + date.d + '"]');
        }
      });
      render();
    });
  }
  window.TianjiCalendar = {open:open};
}());
