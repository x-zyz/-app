/* 天机 · 生辰录入 */
(function (global) {
  'use strict';

  var MIN_YEAR = 1930;
  var SEARCH_LIMIT = 60;

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function dateText(birth) {
    return birth.y + '-' + pad(birth.m) + '-' + pad(birth.d);
  }

  function timeText(birth) {
    return pad(birth.hour) + ':' + pad(birth.minute);
  }

  function daysIn(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function offsetText(minutes) {
    var absolute = Math.abs(minutes);
    return (minutes < 0 ? '−' : '+') + pad(Math.floor(absolute / 60)) + ':' + pad(absolute % 60);
  }

  function readOffset(text) {
    var match = /^([+\-−])(\d{1,2}):([0-5]\d)$/.exec(text);
    if (!match) throw new Error('请输入带正负号的时区偏移，例如 +08:00。');
    var minutes = Number(match[2]) * 60 + Number(match[3]);
    if (minutes > 14 * 60) throw new Error('时区偏移须在 −14:00 至 +14:00 之间。');
    return match[1] === '+' ? minutes : -minutes;
  }

  function sheetTitle(id, title, eyebrow) {
    return '<header class="birth-header"><div><p class="birth-kicker">' + eyebrow + '</p>' +
      '<h2 id="' + id + '">' + title + '</h2></div>' +
      '<button type="button" class="birth-close" data-act="close-sheet" aria-label="关闭">×</button></header>';
  }

  function mountSheet(options, id, html, mount) {
    return options.openSheet(html, function (mask) {
      var sheet = mask.querySelector('.sheet');
      mask.classList.add('birth-mask');
      sheet.classList.add('birth-sheet');
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-labelledby', id);
      sheet.tabIndex = -1;
      sheet.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          options.closeSheet();
        }
        if (event.key !== 'Tab') return;
        var focusable = Array.from(sheet.querySelectorAll('button, input, summary, [tabindex="0"]')).filter(function (element) {
          return !element.disabled && element.tabIndex >= 0 && element.getClientRects().length;
        });
        if (!focusable.length) {
          event.preventDefault();
          return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        var active = document.activeElement;
        if (event.shiftKey && (active === first || active === sheet)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (active === last || active === sheet)) {
          event.preventDefault();
          first.focus();
        }
      });
      mount(sheet);
      sheet.focus({ preventScroll: true });
    });
  }

  function wheelMarkup(key, label) {
    return '<div class="birth-wheel-group"><div class="birth-wheel-label" aria-hidden="true">' + label + '</div>' +
      '<div class="birth-wheel" data-wheel="' + key + '" role="spinbutton" aria-label="' + label + '" tabindex="0"></div></div>';
  }

  function mountWheel(wheel, min, max, value, format, onChange) {
    var current;
    var selected;
    var rowHeight;

    function mark(next) {
      if (selected) selected.classList.remove('birth-wheel-selected');
      selected = wheel.children[next - min + 1];
      selected.classList.add('birth-wheel-selected');
      current = next;
      wheel.setAttribute('aria-valuenow', next);
      wheel.setAttribute('aria-valuetext', format(next));
    }

    function show(next) {
      next = Math.max(min, Math.min(max, next));
      wheel.scrollTop = (next - min) * rowHeight;
      mark(next);
    }

    function get() {
      return Math.max(min, Math.min(max, min + Math.round(wheel.scrollTop / rowHeight)));
    }

    function rebuild(last, next) {
      max = last;
      var items = '<div class="birth-wheel-pad"></div>';
      for (var i = min; i <= max; i++) {
        items += '<div class="birth-wheel-item" data-value="' + i + '">' + format(i) + '</div>';
      }
      wheel.innerHTML = items + '<div class="birth-wheel-pad"></div>';
      wheel.setAttribute('aria-valuemin', min);
      wheel.setAttribute('aria-valuemax', max);
      rowHeight = wheel.children[1].offsetHeight || 40;
      show(next);
    }

    rebuild(max, value);
    wheel.addEventListener('scroll', function () {
      var next = get();
      if (current === next) return;
      mark(next);
      if (onChange) onChange();
    }, { passive: true });
    wheel.addEventListener('click', function (event) {
      var item = event.target.closest('[data-value]');
      if (item) {
        show(Number(item.dataset.value));
        if (onChange) onChange();
      }
    });
    wheel.addEventListener('keydown', function (event) {
      var next = get();
      switch (event.key) {
        case 'ArrowUp': next++; break;
        case 'ArrowDown': next--; break;
        case 'PageUp': next += 10; break;
        case 'PageDown': next -= 10; break;
        case 'Home': next = min; break;
        case 'End': next = max; break;
        default: return;
      }
      event.preventDefault();
      show(next);
      if (onChange) onChange();
    });
    return { get: get, rebuild: rebuild };
  }

  function pickDate(options, birth, trigger, done) {
    return mountSheet(options, 'birth-date-title',
      sheetTitle('birth-date-title', '公历生日', '日期') +
      '<div class="birth-wheels">' + wheelMarkup('year', '年') + wheelMarkup('month', '月') + wheelMarkup('day', '日') + '</div>' +
      '<button type="button" class="birth-primary birth-confirm">确定日期</button>',
      function (sheet) {
        var maximumDay = daysIn(birth.y, birth.m);
        var year = mountWheel(sheet.querySelector('[data-wheel="year"]'), MIN_YEAR,
          Math.max(new Date().getFullYear(), birth.y), birth.y, String, updateDays);
        var month = mountWheel(sheet.querySelector('[data-wheel="month"]'), 1, 12, birth.m, pad, updateDays);
        var day = mountWheel(sheet.querySelector('[data-wheel="day"]'), 1, maximumDay, birth.d, pad);

        function updateDays() {
          var nextMaximum = daysIn(year.get(), month.get());
          if (maximumDay === nextMaximum) return;
          maximumDay = nextMaximum;
          day.rebuild(maximumDay, day.get());
        }

        sheet.querySelector('.birth-confirm').addEventListener('click', function () {
          updateDays();
          done(year.get(), month.get(), day.get());
          options.closeSheet();
          trigger.focus();
        });
      });
  }

  function pickTime(options, birth, trigger, done) {
    return mountSheet(options, 'birth-time-title',
      sheetTitle('birth-time-title', '钟表时间', '24 小时制') +
      '<div class="birth-wheels">' + wheelMarkup('hour', '时') + wheelMarkup('minute', '分') + '</div>' +
      '<button type="button" class="birth-primary birth-confirm">确定时间</button>',
      function (sheet) {
        var hour = mountWheel(sheet.querySelector('[data-wheel="hour"]'), 0, 23, birth.hour, pad);
        var minute = mountWheel(sheet.querySelector('[data-wheel="minute"]'), 0, 59, birth.minute, pad);
        sheet.querySelector('.birth-confirm').addEventListener('click', function () {
          done(hour.get(), minute.get());
          options.closeSheet();
          trigger.focus();
        });
      });
  }

  function fold(text) {
    return String(text || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function pickCity(options, chosen, trigger, done) {
    return mountSheet(options, 'birth-city-title',
      sheetTitle('birth-city-title', '出生城市', '离线城市库') +
      '<label class="birth-search-label" for="birth-city-search">搜索城市</label>' +
      '<input type="search" class="birth-input" id="birth-city-search" placeholder="城市、地区、拼音或英文" autocomplete="off" spellcheck="false">' +
      '<p class="birth-hint birth-search-status" role="status"></p><div class="birth-city-results" aria-label="城市搜索结果"></div>',
      function (sheet) {
        var cities = Array.isArray(global.TianjiCities) ? global.TianjiCities : [];
        var indexed = cities.map(function (city) {
          return { city: city, text: fold([city.name, city.region, city.id, city.zone, city.search].join(' ')) };
        });
        var search = sheet.querySelector('#birth-city-search');
        var list = sheet.querySelector('.birth-city-results');
        var status = sheet.querySelector('.birth-search-status');

        function render() {
          var terms = fold(search.value).trim().split(/\s+/).filter(Boolean);
          var matches = indexed.filter(function (item) {
            return terms.every(function (term) { return item.text.indexOf(term) !== -1; });
          });
          status.textContent = cities.length === 0 ? '城市库暂不可用。' :
            matches.length === 0 ? '没有找到城市，请试试城市别名或地区。' :
            matches.length > SEARCH_LIMIT ? '显示前 ' + SEARCH_LIMIT + ' 个结果，可继续输入缩小范围。' :
            '共 ' + matches.length + ' 个城市';
          list.textContent = '';
          var rows = document.createDocumentFragment();
          matches.slice(0, SEARCH_LIMIT).forEach(function (item) {
            var city = item.city;
            var button = document.createElement('button');
            var name = document.createElement('span');
            var region = document.createElement('span');
            button.type = 'button';
            button.className = 'birth-city-result';
            name.className = 'birth-city-name';
            name.textContent = city.name;
            region.className = 'birth-city-region';
            region.textContent = city.region || city.zone;
            button.appendChild(name);
            button.appendChild(region);
            if (chosen && chosen.id === city.id) {
              button.setAttribute('aria-current', 'true');
              button.classList.add('birth-city-selected');
            }
            button.addEventListener('click', function () {
              done(city);
              options.closeSheet();
              trigger.focus();
            });
            rows.appendChild(button);
          });
          list.appendChild(rows);
          list.scrollTop = 0;
        }
        search.addEventListener('input', render);
        render();
      });
  }

  function open(options) {
    var original = options.birth;
    var legacy = original && !Number.isInteger(original.hour) &&
      Number.isInteger(original.zhi) && original.zhi >= 0 && original.zhi < 12;
    var dateEntered = Boolean(original);
    var timeEntered = Boolean(original && (legacy || Number.isInteger(original.hour)));
    var birth = original ? {
      y: original.y, m: original.m, d: original.d,
      hour: legacy ? original.zhi * 2 : timeEntered ? original.hour : 12,
      minute: legacy ? 30 : Number.isInteger(original.minute) ? original.minute : 0,
      city: original.city || null, gender: original.gender
    } : { y: 1995, m: 1, d: 1, hour: 12, minute: 0, city: null, gender: null };

    return mountSheet(options, 'birth-main-title',
      sheetTitle('birth-main-title', original ? '编辑出生资料' : '录入出生资料', '四柱排盘') +
      (legacy ? '<p class="birth-legacy">旧档案仅存时辰。请核对带入的代表时间，再选择出生城市。</p>' : '') +
      '<div class="birth-fields">' +
        '<button type="button" class="birth-field" data-birth="date"><span>公历生日</span><strong>选择日期</strong></button>' +
        '<button type="button" class="birth-field" data-birth="time"><span>钟表时间</span><strong>选择时间</strong></button>' +
        '<button type="button" class="birth-field birth-field-city" data-birth="city"><span>出生城市</span><strong>搜索城市</strong></button>' +
      '</div>' +
      '<div class="birth-gender" role="group" aria-label="性别，定大运顺逆">' +
        '<span class="birth-label">性别</span>' +
        '<button type="button" data-gender="m" aria-pressed="false">乾造 · 男</button>' +
        '<button type="button" data-gender="f" aria-pressed="false">坤造 · 女</button>' +
      '</div>' +
      '<details class="birth-offset"><summary>手动设置 UTC 偏移</summary>' +
        '<label for="birth-offset-input">出生时的时区偏移</label>' +
        '<input id="birth-offset-input" type="text" class="birth-input" maxlength="6" placeholder="例如 +08:00" autocomplete="off" aria-describedby="birth-offset-help">' +
        '<p class="birth-hint" id="birth-offset-help">留空时按城市和出生日期推算。夏令时切换导致时间重复时，可填入出生当时的实际偏移。</p>' +
      '</details>' +
      '<div class="birth-preview" aria-live="polite"><dl>' +
        '<div><dt>出生地钟表</dt><dd data-preview="clock">—</dd></div>' +
        '<div><dt>真太阳时</dt><dd data-preview="solar">—</dd></div>' +
      '</dl><p class="birth-preview-detail" data-preview="detail"></p></div>' +
      '<p class="birth-error" role="alert" hidden></p>' +
      '<button type="button" class="birth-primary birth-save">开始排盘</button>',
      function (sheet) {
        var dateButton = sheet.querySelector('[data-birth="date"]');
        var timeButton = sheet.querySelector('[data-birth="time"]');
        var cityButton = sheet.querySelector('[data-birth="city"]');
        var genderButtons = sheet.querySelectorAll('[data-gender]');
        var clock = sheet.querySelector('[data-preview="clock"]');
        var solar = sheet.querySelector('[data-preview="solar"]');
        var detail = sheet.querySelector('[data-preview="detail"]');
        var error = sheet.querySelector('.birth-error');
        var offset = sheet.querySelector('#birth-offset-input');
        var save = sheet.querySelector('.birth-save');

        if (original && Number.isInteger(original.offsetMinutes)) {
          offset.value = offsetText(original.offsetMinutes);
          sheet.querySelector('.birth-offset').open = true;
        }

        function showError(message) {
          error.textContent = message;
          error.hidden = !message;
        }

        function readBirth() {
          var data = Object.assign({}, birth);
          var offsetValue = offset.value.trim();
          if (offsetValue) data.offsetMinutes = readOffset(offsetValue);
          return data;
        }

        function calculate(data) {
          if (!global.TianjiSolar) throw new Error('真太阳时计算模块暂不可用。');
          return global.TianjiSolar.correct(data);
        }

        function render() {
          dateButton.querySelector('strong').textContent = dateEntered ? dateText(birth) : '选择日期';
          timeButton.querySelector('strong').textContent = timeEntered ? timeText(birth) : '选择时间';
          cityButton.querySelector('strong').textContent = birth.city ? [birth.city.name, birth.city.region].filter(Boolean).join(' · ') : '搜索城市';
          genderButtons.forEach(function (button) {
            button.setAttribute('aria-pressed', String(button.dataset.gender === birth.gender));
          });
          clock.textContent = dateEntered && timeEntered ? dateText(birth) + ' ' + timeText(birth) : '—';
          solar.textContent = '—';
          detail.textContent = birth.city ? '选择出生日期和时间后计算' : '选择出生城市后计算';
          showError('');
          if (!dateEntered || !timeEntered || !birth.city) return;
          try {
            var corrected = calculate(readBirth());
            solar.textContent = dateText(corrected) + ' ' + timeText(corrected) + ':' + pad(corrected.second);
            detail.textContent = '出生地 UTC' + offsetText(corrected.offsetMinutes);
          } catch (problem) {
            detail.textContent = '等待有效的出生资料';
            showError(problem.message);
          }
        }

        dateButton.addEventListener('click', function () {
          pickDate(options, birth, dateButton, function (year, month, day) {
            birth.y = year;
            birth.m = month;
            birth.d = day;
            dateEntered = true;
            render();
          });
        });
        timeButton.addEventListener('click', function () {
          pickTime(options, birth, timeButton, function (hour, minute) {
            birth.hour = hour;
            birth.minute = minute;
            timeEntered = true;
            render();
          });
        });
        cityButton.addEventListener('click', function () {
          pickCity(options, birth.city, cityButton, function (city) {
            if (!birth.city || birth.city.id !== city.id) {
              offset.value = '';
              sheet.querySelector('.birth-offset').open = false;
            }
            birth.city = city;
            render();
          });
        });
        genderButtons.forEach(function (button) {
          button.addEventListener('click', function () {
            birth.gender = button.dataset.gender;
            render();
          });
        });
        offset.addEventListener('input', render);
        save.addEventListener('click', function () {
          if (!dateEntered) {
            showError('请选择公历生日。');
            dateButton.focus();
            return;
          }
          if (!timeEntered) {
            showError('请选择出生时的钟表时间。');
            timeButton.focus();
            return;
          }
          if (!birth.city) {
            showError('请选择出生城市。');
            cityButton.focus();
            return;
          }
          if (birth.gender !== 'm' && birth.gender !== 'f') {
            showError('请选择性别。');
            genderButtons[0].focus();
            return;
          }
          try {
            var data = readBirth();
            calculate(data);
            options.onSave(data);
            options.closeSheet();
          } catch (problem) {
            showError(problem.message);
          }
        });
        render();
      });
  }

  global.TianjiBirthForm = { open: open };
})(typeof window === 'undefined' ? globalThis : window);
