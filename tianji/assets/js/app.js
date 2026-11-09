/* 天机 · 应用逻辑 */
(function () {
  'use strict';

  var A = window.Astro;
  var HEX = window.HEXAGRAMS;
  var Solar = window.Solar;
  var Pro = window.TianjiProChart;
  var Lore = window.TianjiLore;
  var Notes = window.TianjiPillarNotes;

  var K_BIRTH = 'tj.birth';
  var K_RECORDS = 'tj.records.v1';
  var K_DRAW = 'tj.draw';
  var K_PREF = 'tj.pref';

  var state = {
    tab: 'home',
    birth: null,
    starMode: 'all',
    records: { entries: [], own: null, active: null },
    chart: null,
    daily: null,
    draw: null,
    shaking: false,
    diagramTab: 'relations',
    diagramYear: null,
    pref: { vibrate: true }
  };

  var WEEK = ['日', '一', '二', '三', '四', '五', '六'];

  window.addEventListener('error', function (e) {
    try { console.log('JSERR ' + e.message + ' @' + (e.filename || '') + ':' + e.lineno); } catch (x) { }
  });

  function applyInsets() {
    var i = window.__insets;
    if (!i) return;
    var r = document.documentElement.style;
    r.setProperty('--sat', (i.top || 0) + 'px');
    r.setProperty('--sab', (i.bottom || 0) + 'px');
  }
  window.addEventListener('insets', applyInsets);

  /* ---------- 工具 ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function todayKey() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function store(k, v) {
    try {
      if (v === undefined) { var raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : null; }
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
  }
  function haptic(ms) {
    if (!state.pref.vibrate) return;
    try { if (window.Android && Android.vibrate) Android.vibrate(ms || 12); } catch (e) { }
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- 数据 ---------- */
  function getChart() {
    if (!state.birth) return null;
    if (!state.chart) {
      try { state.chart = A.chart(state.birth); } catch (e) { console.error(e); state.chart = null; }
    }
    return state.chart;
  }

  function ownRecord() {
    return state.records.entries.find(function (entry) { return entry.id === state.records.own; });
  }

  function getDaily() {
    var entry = ownRecord();
    if (!entry) return null;
    var day = todayKey();
    if (!state.daily || state.daily.day !== day || state.daily.id !== entry.id) {
      state.daily = null;
      try {
        var chart = A.chart(entry.birth);
        state.daily = { day: day, id: entry.id, chart: chart, result: A.daily(chart, new Date(), entry.birth) };
      } catch (e) { console.error(e); return null; }
    }
    return state.daily.result;
  }

  function commitRecords(records) {
    try {
      localStorage.setItem(K_RECORDS, JSON.stringify(records));
      state.records = records;
    } catch (e) { throw new Error('本机存储写入失败，请检查剩余空间后重试。'); }
  }

  function birthKey(b) {
    return [b.y, b.m, b.d, b.hour, b.minute, b.zhi, b.gender, b.city && b.city.id, b.offsetMinutes].join('|');
  }

  function birthLabel(b) {
    return b.y + '年' + b.m + '月' + b.d + '日 · ' +
      (b.city ? pad(b.hour) + ':' + pad(b.minute) + ' · ' + b.city.name : A.ZHI_LABEL[b.zhi] + '时') +
      ' · ' + (b.gender === 'm' ? '乾造' : '坤造');
  }

  function showChart(birth, chart) {
    state.birth = birth;
    state.chart = chart;
    state.yunIdx = null;
    state.diagramYear = null;
    state.diagramTab = 'relations';
    if (state.tab === 'chart') { render(); window.scrollTo(0, 0); }
    else go('chart');
  }

  function instantChart() {
    var now = new Date();
    var birth = { instant: now.getTime(), y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(),
      hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds(), offsetMinutes: -now.getTimezoneOffset() };
    showChart(birth, A.chart(birth));
  }

  function loadDraw() {
    var d = store(K_DRAW);
    if (!d || d.date !== todayKey()) return null;
    return d;
  }

  function hexOf(seed) {
    var h = A.hash(seed);
    return { n: h % 64, hex: HEX[h % 64] };
  }

  /* ---------- 顶部日期 ---------- */
  function paintTopDate() {
    try {
      var now = new Date();
      var l = Solar.fromDate(now).getLunar();
      $('#topDate').innerHTML = '<b>' + l.getMonthInChinese() + '月' + l.getDayInChinese() + '</b>' +
        l.getYearInGanZhi() + '年 · ' + WEEK[now.getDay()] + '曜';
    } catch (e) { }
  }

  function pageHeading(title, subtitle) {
    return '<header class="page-heading"><h1 class="h1">' + title + '</h1>' +
      '<p>' + subtitle + '</p></header>';
  }

  /* ---------- 首页 ---------- */
  function viewHome() {
    var d = getDaily();
    var me = ownRecord();
    var head = d ? '<p class="tiny today-profile">今日运势依据 · ' + esc(me.name || '本人命盘') + '</p>' + heroHTML(d) : emptyHTML();
    var lunar = Solar.fromDate(new Date()).getLunar();
    var term = lunar.getJieQi();
    var next = lunar.getNextJieQi(true);
    var date = next.getSolar();
    var calendar = term ? '今日节气 · ' + term :
      '下个节气 · ' + next.getName() + ' ' + date.getMonth() + '月' + date.getDay() + '日';
    return '<div class="page">' + pageHeading('今日', esc(calendar)) +
      '<div class="today-calendar"><button class="btn ghost" data-act="calendar">万年历 <span aria-hidden="true">›</span></button></div>' + head + yijiHTML(d) + panSummaryHTML() + quickHTML() +
      '<p class="home-foot">命由己造 · 相由心生</p></div>';
  }

  function panSummaryHTML() {
    var owner = ownRecord();
    var cached = state.daily;
    if (!owner || !cached || cached.id !== owner.id) return '';
    var c = cached.chart;
    var birth = owner.birth;
    var hourBranch = A.ZHI_LABEL[c.solar.zhi] + '时';
    var solarDate = c.solar.y + '.' + pad(c.solar.m) + '.' + pad(c.solar.d);
    var when = solarDate + ' ' + hourBranch;
    if (birth.city && c.corrected) {
      var wallDate = birth.y + '.' + pad(birth.m) + '.' + pad(birth.d);
      when = wallDate + ' · 钟表 ' + pad(birth.hour) + ':' + pad(birth.minute) +
        ' · 真太阳时 ' + (solarDate === wallDate ? '' : solarDate + ' ') +
        pad(c.corrected.hour) + ':' + pad(c.corrected.minute) + ' ' + hourBranch + ' · ' + esc(birth.city.name);
    }
    var zodiac = window.LunarUtil.SHENGXIAO[A.ZHI_LABEL.indexOf(c.pillars[0].zhi) + 1];
    var cells = c.pillars.map(function (p) {
      return '<div class="mp"><span class="l">' + p.label + '</span><span class="g">' + p.gan + p.zhi + '</span></div>';
    }).join('');
    return '<div class="section"><div class="section-hd"><span class="t">本人命盘 · 出生四柱</span>' +
      '<span class="a">' + c.dayMaster.gan + c.dayMaster.wx + ' · ' + c.strength.label + '</span></div>' +
      '<div class="card" style="padding:0 0 4px"><div class="mini-pillars">' + cells + '</div>' +
      '<div class="mini-meta">' + when + ' · ' + zodiac + '年 · ' + c.xingzuo + '座</div></div></div>';
  }

  function heroHTML(d) {
    var now = new Date();
    var dims = d.dims.map(function (x) {
      return '<div class="dim"><div class="dim-hd"><span>' + x.label + '</span><b>' + x.value + '</b></div>' +
        '<div class="track"><i class="fill" data-v="' + x.value + '"></i></div></div>';
    }).join('');
    var lucky = '<div class="lucky">' +
      '<div class="it"><span class="lab">幸运色</span><span class="val"><i class="swatch" style="background:' + d.lucky.color.hex + ';color:' + d.lucky.color.hex + '"></i>' + d.lucky.color.name + '</span></div>' +
      '<div class="it"><span class="lab">幸运数</span><span class="val">' + d.lucky.number + '</span></div>' +
      '<div class="it"><span class="lab">吉方</span><span class="val">' + d.lucky.dir + '</span></div>' +
      '</div>';

    return '<div class="card hero">' +
      '<svg class="wm" viewBox="0 0 120 120" fill="none" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="52" stroke="#C9A461" stroke-width=".6"/>' +
      '<circle cx="60" cy="60" r="38" stroke="#C9A461" stroke-width=".5" stroke-dasharray="2 4"/>' +
      '<path d="M60 8v12M60 100v12M8 60h12M100 60h12" stroke="#C9A461" stroke-width=".6"/>' +
      '</svg>' +
      '<div class="hero-date"><span class="eyebrow">' + (now.getMonth() + 1) + '月' + now.getDate() + '日</span>' +
      '<span class="dot"></span><span class="eyebrow">' + d.gz + '日</span>' +
      '<span class="dot"></span><span class="eyebrow">' + esc(d.relation) + '</span></div>' +
      '<div class="hero-main">' +
      '<div class="ring-wrap">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle class="ring-bg" cx="60" cy="60" r="52"/>' +
      '<circle class="ring-fg" id="ring" cx="60" cy="60" r="52"/></svg>' +
      '<div class="ring-mid"><span class="ring-score">' + d.score + '</span><span class="ring-unit">运势</span></div>' +
      '</div>' +
      '<div class="hero-say"><div class="k"><b>' + esc(d.theme) + '</b></div><p>' + esc(d.summary) + '</p></div>' +
      '</div>' +
      '<div class="dims">' + dims + '</div>' + lucky +
      '</div>';
  }

  function emptyHTML() {
    return '<div class="card empty-hero"><h2>设置本人命盘</h2>' +
      '<p>在「我的」里从本地记录选一张设为本人，今日运势会结合这张命盘和当日干支计算。</p>' +
      '<button class="btn" data-tab="me">前往我的</button></div>';
  }

  function yijiHTML(d) {
    if (!d) return '';
    var yi = d.yi.slice(0, 4).map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('');
    var ji = d.ji.slice(0, 3).map(function (x) { return '<span class="chip bad">' + esc(x) + '</span>'; }).join('');
    return '<div class="section"><div class="section-hd"><span class="t">宜忌</span>' +
      '<span class="a">' + esc(d.chong || '') + '</span></div>' +
      '<div class="card" style="padding:0"><div class="yiji">' +
      '<div class="col yi"><div class="lab">宜</div><div class="chips">' + yi + '</div></div>' +
      '<div class="col ji"><div class="lab">忌</div><div class="chips">' + ji + '</div></div>' +
      '</div></div></div>';
  }

  function quickHTML() {
    return '<div class="quick">' +
      '<button class="q tap" data-tab="chart"><span class="t">排盘</span><span class="s">四柱 · 五行 · 大运</span><span class="arrow">›</span></button>' +
      '<button class="q tap" data-tab="draw"><span class="t">求签</span><span class="s">六十四卦 · 每日三签</span><span class="arrow">›</span></button>' +
      '</div>';
  }

  /* ---------- 排盘 ---------- */
  function pickYunIndex(c) {
    if (!c.yun || !c.yun.list.length) return -1;
    if (state.yunIdx != null && state.yunIdx >= 0 && state.yunIdx < c.yun.list.length) return state.yunIdx;
    var now = new Date().getFullYear();
    for (var i = 0; i < c.yun.list.length; i++) {
      var d = c.yun.list[i];
      if (now >= d.start && now <= d.end) return i;
    }
    return 0;
  }

  function relClass(kind) {
    if (kind === '合' || kind === '干合' || kind === '三合' || kind === '三会') return 'c-he';
    if (kind === '冲' || kind === '干冲') return 'c-chong';
    if (kind === '刑' || kind === '三刑') return 'c-xing';
    if (kind === '害') return 'c-hai';
    return '';
  }

  function relChips(list, emptyText) {
    if (!list.length) return '<span class="rel-none">' + emptyText + '</span>';
    var map = {}, order = [];
    list.forEach(function (r) {
      if (!map[r.text]) { map[r.text] = { r: r, n: 1 }; order.push(r.text); }
      else { map[r.text].n++; }
    });
    return order.map(function (t) {
      var o = map[t];
      return '<span class="rel ' + relClass(o.r.kind) + '">' + t + (o.n > 1 ? ' ×' + o.n : '') + '</span>';
    }).join('');
  }

  function diagramFor(chart) {
    var index = pickYunIndex(chart);
    var yun = chart.yun && chart.yun.list[index];
    var year = yun ? A.liunian(chart, clamp(state.diagramYear || new Date().getFullYear(), yun.start, yun.end), index) : null;
    return { diagram: Pro.diagram(chart, state.diagramTab, yun, year, state.birth.gender), summary: Pro.cycleSummary(year, yun) };
  }

  function chartActions() {
    return '<div class="chart-actions"><button class="btn ghost" data-act="new-birth">新增排盘</button>' +
      '<button class="btn" data-act="instant-chart">即时排盘</button></div>';
  }

  function viewChart() {
    var c = getChart();
    if (!c) {
      return '<div class="page">' + pageHeading('四柱命盘', '从公历生辰起盘') + chartActions() +
        '<div class="card empty-hero">' +
        '<div class="glyph"><i></i><i></i><i class="b"></i><i></i><i></i><i class="b"></i></div>' +
        '<h2>先立命盘</h2><p>选择公历生日、钟表时分和出生城市。<br>按真太阳时排盘，查看本命解析与岁运。</p>' +
        '<button class="btn" data-act="open-birth">录入生辰</button>' +
        '</div></div>';
    }

    var p = c.pillars;
    var result = window.TianjiInterpretation.analyze(c);
    function row(cls, label, fn) {
      var cells = p.map(function (x, i) {
        return '<div class="' + (i === 2 ? 'd' : '') + ' ' + (cls || '') + '">' + fn(x, i) + '</div>';
      }).join('');
      return '<div class="p-row"><div class="p-lab">' + label + '</div>' + cells + '</div>';
    }

    var pillars =
      row('p-pillar', '四柱', function (x) { return esc(x.label) + '柱'; }) +
      row('p-ss', '十神', function (x) { return esc(x.shiShenGan); }) +
      row('p-gan', '天干', function (x) { return Pro.element(x.gan, x.ganWx); }) +
      row('p-zhi', '地支', function (x) { return Pro.element(x.zhi, x.zhiWx); }) +
      row('p-hide', '藏干', function (x) {
        return '<div class="pillar-stack">' + x.hide.map(function (gan) {
          return Pro.element(gan + A.GAN_WX[gan], A.GAN_WX[gan]);
        }).join('') + '</div>';
      }) +
      row('p-hide', '副星', function (x) {
        return '<div class="pillar-stack">' + x.hide.map(function (gan) {
          return '<span>' + A.shiShen(c.dayMaster.gan, gan) + '</span>';
        }).join('') + '</div>';
      }) +
      row('p-cs', Notes.label('stage'), function (x, i) { return Notes.cell(c, i, 'stage'); }) +
      row('p-cs', Notes.label('seat'), function (x, i) { return Notes.cell(c, i, 'seat'); }) +
      row('p-cs', Notes.label('void'), function (x, i) { return Notes.cell(c, i, 'void'); }) +
      row('p-nayin', Notes.label('tone'), function (x, i) { return Notes.cell(c, i, 'tone'); }) +
      row('p-stars', '神煞', function (x, i) { return Lore.pillarStars(c.shenSha, i, state.starMode); });

    var yunIdx = pickYunIndex(c);
    var yun = c.yun && c.yun.list[yunIdx];
    var yunRelHtml = '';
    if (yun) {
      var yp = { label: '运', gan: yun.gz[0], zhi: yun.gz[1] };
      var yrel = A.relations(c.pillars.concat([yp])).filter(function (r) { return (r.pair || '').indexOf('运') >= 0; });
      yunRelHtml = '<div class="yun-note">' +
        '<span class="yn-gz">' + yun.gz + '大运 · ' + yun.age + '–' + (yun.age + 9) + '岁 · ' + yun.ss + ' · 日主临' + yun.stage + '</span>' +
        '<div class="rel-wrap" style="margin-top:10px">' + relChips(yrel, '与命局无冲合') + '</div>' +
        '</div>';
    }
    var yunHtml = '';
    if (c.yun && c.yun.list.length) {
      var nowY = new Date().getFullYear();
      yunHtml = '<div class="section"><div class="section-hd"><span class="t">大运</span>' +
        '<span class="a">起运 ' + c.yun.startYear + '岁' + (c.yun.startMonth ? c.yun.startMonth + '月' : '') + (c.yun.startDay ? c.yun.startDay + '天' : '') + '</span></div>' +
        '<div class="yun-scroll">' + c.yun.list.map(function (y, i) {
          var cur = nowY >= y.start && nowY <= y.end;
          return '<button class="yun ' + (i === yunIdx ? 'on' : '') + ' ' + (cur ? 'now' : '') + '" aria-pressed="' + (i === yunIdx) + '" data-yun="' + i + '">' +
            '<span class="g">' + Pro.ganZhi(y.gz) + '</span><span class="ss">' + y.ss + '</span>' +
            '<span class="a">' + y.start + '–' + y.end + '</span></button>';
        }).join('') + '</div></div>';
    }

    var lnHtml = '';
    if (yun) {
      var years = [];
      for (var y2 = yun.start; y2 <= yun.end; y2++) years.push(y2);
      var thisYear = new Date().getFullYear();
      lnHtml = '<div class="section"><div class="section-hd"><span class="t">流年</span>' +
        '<span class="a">' + yun.gz + '大运 · ' + yun.start + '–' + yun.end + '</span></div>' +
        '<div class="ln-grid ln-strip" role="group" aria-label="流年，左右滑动">' + years.map(function (yy) {
          var gz = A.liunian(c, yy, yunIdx);
          if (!gz) return '';
          var selected = clamp(state.diagramYear || thisYear, yun.start, yun.end) === yy;
          return '<div class="ln-column"><button class="ln ' + (yy === thisYear ? 'now' : '') + (selected ? ' selected' : '') +
            '" aria-pressed="' + selected + '" data-year="' + yy + '">' +
            '<span class="y">' + yy + '</span><span class="g">' + Pro.ganZhi(gz.gz) + '</span>' +
            '<span class="s">' + gz.ss + '</span></button>' +
            Lore.yearColumn(A.cycleStars(c, gz.gz), yy, state.starMode) + '</div>';
        }).join('') + '</div>' +
        '<p class="tiny" style="margin-top:9px;letter-spacing:.14em">左右滑动查看年份。点年份看详情，点神煞看查法。</p></div>';
    }

    return '<div class="page pro-page">' + pageHeading('专业细盘', state.birth.instant ? '按设备当前时间起盘' : '本命四柱与岁运') + chartActions() +
      Pro.overview(result, c) + Pro.birthSummary(state.birth, c) +
      '<section class="section"><div class="section-hd"><h2 class="t">四柱命盘</h2>' +
      '<span class="a">' + c.dayMaster.gan + c.dayMaster.wx + '日主 · ' + c.strength.label + '</span></div>' +
      '<div class="star-filter" aria-label="神煞显示范围">' +
      [['common','常用神煞'],['all','全部神煞']].map(function (item) {
        return '<button data-star-mode="' + item[0] + '" aria-pressed="' + (state.starMode === item[0]) + '">' + item[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="card pillar-card"><div class="pillars">' + pillars + '</div></div>' +
      '<div class="pro-wx-legend">' + A.WX_ORDER.map(function (wx) { return Pro.element(wx, wx); }).join('') + '</div></section>' +
      yunHtml + lnHtml + (yun ? yunRelHtml +
        Lore.group('大运神煞', yun.gz + ' · ' + yun.start + '–' + yun.end, A.cycleStars(c, yun.gz), 'yun', null, state.starMode) : '') +
      '<div id="year-stars"></div>' +
      '<section class="section pro-diagram" id="chart-diagram"></section>' +
      Pro.usefulElements(c) + Pro.lifestyle(result) +
      Pro.readings(result, c) + '</div>';
  }

  /* ---------- 求签 ---------- */
  function tubeHTML(shaking) {
    var sticks = '';
    for (var i = 0; i < 9; i++) {
      var left = 38 + i * 6;
      var hgt = 46 + ((i * 23) % 40);
      var tilt = (i - 4) * 1.6;
      var hot = i === 4 ? ' hot' : '';
      sticks += '<i class="stick' + hot + '" style="left:' + left + 'px;height:' + hgt + 'px;transform:rotate(' + tilt + 'deg);animation-delay:' + (i * 55) + 'ms"></i>';
    }
    return '<div class="tube' + (shaking ? ' shake' : '') + '">' + sticks +
      '<div class="rim"></div><div class="body"></div><div class="band"></div></div>';
  }

  function viewDraw() {
    var saved = state.draw || loadDraw();
    if (saved && saved.hex) return drawResult(saved);

    return '<div class="page">' + pageHeading('求签', '六十四卦 · 每日最多三签') +
      '<div class="draw-stage">' + tubeHTML(state.shaking) +
      '<div class="draw-hint">心诚则灵 · 默念所求之事<br>摇动签筒，一卦定今日</div>' +
      '<button class="btn" data-act="shake" ' + (state.shaking ? 'disabled' : '') + '>' + (state.shaking ? '摇签中' : '摇一签') + '</button>' +
      '<p class="tiny draw-foot">所得签文可作闲读与参考。</p>' +
      '</div></div>';
  }

  function hexLines(hex, big) {
    return '<div class="hex' + (big ? ' big' : '') + '">' + hex.lines.map(function (l, i) {
      return '<i class="' + (l ? '' : 'y') + ' hex-line" style="animation-delay:' + (i * 70) + 'ms"></i>';
    }).join('') + '</div>';
  }

  function levelClass(lv) {
    if (lv === '大吉' || lv === '吉') return '';
    if (lv === '凶' || lv === '小凶') return 'bad';
    return 'mid';
  }

  var ADVICE = {
    '大吉': ['一举而成，宜早不宜迟', '正财偏财俱旺，宜进', '两情相悦，宜明言'],
    '吉': ['顺中有阻，耐心可成', '稳中有进，忌贪多', '渐入佳境，忌心急'],
    '平': ['宜守成，不宜开拓', '收支相抵，宜节用', '多沟通，勿猜疑'],
    '小凶': ['暂缓为上，蓄力待时', '防小耗，不宜投机', '有误会，宜忍让'],
    '凶': ['不可强求，退守为安', '守财为上，忌借贷', '冷静为上，勿争执']
  };

  function drawResult(d) {
    var h = d.hex;
    var remaining = 3 - (d.count || 1);
    var adv = ADVICE[h.level] || ADVICE['平'];
    return '<div class="page">' + pageHeading('签文', '六十四卦') +
      '<div class="card" style="text-align:center;padding-top:24px">' +
      '<div class="result-no">第 ' + h.n + ' 卦 · ' + h.up + '上' + h.lo + '下</div>' +
      '<div class="result-name">' + h.full + '</div>' +
      '<span class="result-lv ' + levelClass(h.level) + '">' + h.level + '</span>' +
      '<div class="divider"></div>' + hexLines(h, true) + '<div class="divider"></div>' +
      '<div class="ci">「' + h.ci + '」</div>' +
      '<p class="jie" style="margin-top:14px;text-align:left">' + h.jie + '</p>' +
      '<div class="divider"></div>' +
      '<div class="klist" style="text-align:left">' +
      '<div class="krow"><span class="k">谋事</span><span class="v">' + adv[0] + '</span></div>' +
      '<div class="krow"><span class="k">求财</span><span class="v">' + adv[1] + '</span></div>' +
      '<div class="krow"><span class="k">问情</span><span class="v">' + adv[2] + '</span></div>' +
      '</div>' +
      '</div>' +
      '<div style="margin-top:18px;display:flex;gap:10px">' +
      '<button class="btn ghost" style="flex:1" data-act="reset-draw">收签</button>' +
      '<button class="btn" style="flex:1" data-act="shake" ' + (remaining <= 0 ? 'disabled' : '') + '>' +
      (remaining <= 0 ? '今日已满' : '再求一签') + '</button>' +
      '</div>' +
      '<p class="tiny" style="text-align:center;margin-top:16px">' + (remaining > 0 ? '今日尚可再求 ' + remaining + ' 签' : '') + '</p>' +
      '<p class="draw-foot">此签应于今日 · 明日另有机缘</p>' +
      '</div>';
  }

  /* ---------- 我的 ---------- */
  function viewMe() {
    var me = ownRecord();
    var rows = state.records.entries.map(function (entry) {
      var mine = me && me.id === entry.id;
      return '<article class="record-row"><h3>' + esc(entry.name || '八字记录') +
        (mine ? ' <small class="record-badge">本人</small>' : '') + '</h3><p>' + esc(birthLabel(entry.birth)) +
        '</p><div class="record-actions"><button class="btn ghost" data-record-act="view" data-record-id="' + entry.id +
        '">查看</button><button class="btn ghost" data-record-act="manage" data-record-id="' + entry.id +
        '">管理</button>' + (mine ? '' : '<button class="btn ghost" data-record-act="own" data-record-id="' + entry.id +
        '">设为本人</button>') + '</div></article>';
    }).join('');
    return '<div class="page">' + pageHeading('我的', '本机八字记录与偏好') +
      '<div class="card me-hd"><div><div class="me-name">本人命盘</div><div class="me-sub">' +
      (me ? esc((me.name ? me.name + ' · ' : '') + birthLabel(me.birth)) : '尚未指定，可从下方记录选择') +
      '</div></div></div><section class="section"><div class="section-hd"><h2 class="t">查询记录</h2>' +
      '<button class="btn ghost" data-act="new-birth">新增排盘</button></div><div class="card records-list">' +
      (rows || '<p class="tiny">完成一次出生排盘后，资料会保存在这里。</p>') + '</div></section>' +
      '<div class="section"><div class="card" style="padding:2px 16px">' +
      '<div class="list">' +
      '<button class="list-row" data-act="toggle-vibrate" role="switch" aria-checked="' + state.pref.vibrate + '"><span>震动反馈</span><span aria-hidden="true" class="switch ' + (state.pref.vibrate ? 'on' : '') + '"></span></button>' +
      '<button class="list-row tap" data-act="check-update"><span>检查更新</span><span class="v">GitHub <span class="arrow">›</span></span></button>' +
      '<button class="list-row tap" data-act="about"><span>关于天机</span><span class="v">v2.8 <span class="arrow">›</span></span></button>' +
      '</div></div></div>' +
      '<div class="section"><div class="card" style="padding:2px 16px">' +
      '<div class="list"><button class="list-row tap danger" data-act="clear-all"><span>清除记录</span><span class="v">生辰 · 签</span></button>' +
      '</div></div></div>' +
      '<p class="disclaimer" style="margin-top:26px">天机以传统历法与子平法推演，仅作文化娱乐与自我观照之用，不构成任何决策依据。命由己造，相由心生。</p>' +
      '<div class="me-foot"><span class="seal seal-lg">天机</span></div>' +
      '<p class="tiny" style="text-align:center;margin-top:14px;letter-spacing:.34em">天机 · 2.8</p>' +
      '</div>';
  }

  /* ---------- 渲染 ---------- */
  function refreshDiagram() {
    var area = $('#chart-diagram');
    if (!area) return;
    var view = diagramFor(getChart());
    area.innerHTML = view.diagram;
    $('#cycle-overview').textContent = view.summary;
    var yearStars = $('#year-stars');
    if (yearStars) {
      var chart = getChart();
      var index = pickYunIndex(chart);
      var yun = chart.yun && chart.yun.list[index];
      if (!yun) return;
      var year = clamp(state.diagramYear || new Date().getFullYear(), yun.start, yun.end);
      var ln = A.liunian(chart, year, index);
      yearStars.innerHTML = Lore.group('流年神煞', year + '年 · ' + ln.gz, A.cycleStars(chart, ln.gz), 'year', year, state.starMode);
    }
  }

  function render() {
    var v = $('#view');
    var html = '';
    if (state.tab === 'home') html = viewHome();
    else if (state.tab === 'chart') html = viewChart();
    else if (state.tab === 'draw') html = viewDraw();
    else if (state.tab === 'learn') html = window.TianjiLearn.render(getChart(), state.birth && state.birth.instant);
    else html = viewMe();
    if (state.tab === 'home') state.homeDay = todayKey();
    v.innerHTML = html;
    refreshDiagram();
    var strip = $('.ln-strip');
    var selectedYear = strip && $('.ln.selected', strip);
    if (selectedYear) {
      var column = selectedYear.parentElement;
      strip.scrollLeft = Math.max(0, column.offsetLeft - (strip.clientWidth - column.offsetWidth) / 2);
    }
    var dark = state.tab === 'chart';
    document.body.classList.toggle('pro-chart', dark);
    document.documentElement.classList.toggle('pro-background', dark);
    if (window.Android && Android.setChartBars) Android.setChartBars(true);
    paintTopDate();
    $all('.tab').forEach(function (t) {
      var active = t.dataset.tab === state.tab;
      t.classList.toggle('active', active);
      if (active) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    requestAnimationFrame(animateNumbers);
  }

  function animateNumbers() {
    $all('.fill').forEach(function (el) {
      var v = +el.dataset.v;
      el.style.width = '0%';
      setTimeout(function () { el.style.width = v + '%'; }, 60);
    });
    var d = state.tab === 'home' ? getDaily() : null;
    if (!d) return;
    var ring = $('#ring');
    if (ring) ring.style.strokeDashoffset = (326.7 * (1 - clamp(d.score, 0, 100) / 100)).toFixed(1);
  }

  function go(tab) {
    if (state.tab === tab) return;
    state.tab = tab;
    haptic(8);
    render();
    window.scrollTo(0, 0);
  }

  /* ---------- 弹层 ---------- */
  var sheetStack = [];

  function openSheet(html, onMount) {
    var mask = document.createElement('div');
    mask.className = 'sheet-mask';
    mask.innerHTML = '<div class="sheet">' + html + '</div>';
    $('#sheet-root').appendChild(mask);
    sheetStack.push(mask);
    requestAnimationFrame(function () { mask.classList.add('show'); });
    mask.addEventListener('click', function (e) {
      if (e.target === mask) closeSheet();
    });
    if (onMount) onMount(mask);
    return mask;
  }

  function closeSheet() {
    var mask = sheetStack.pop();
    if (!mask) return;
    mask.classList.remove('show');
    setTimeout(function () { if (mask.parentNode) mask.parentNode.removeChild(mask); }, 300);
  }

  function closeAllSheets() { while (sheetStack.length) closeSheet(); }

  function aboutSheet() {
    openSheet(
      '<div class="sheet-hd"><span class="t">关于天机</span><button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
      '<p class="about-lead">天机 · v2.8</p>' +
      '<p class="about-p">命盘以出生地真太阳时取日、时柱，以实际出生瞬间对照节气取年、月柱；日运取当日干支与日主之十神生克，辅以五行喜忌推演。求签取六十四卦，卦辞、解签俱在本地。</p>' +
      '<p class="about-p">排盘与记录在本机处理。手动检查更新时只向 GitHub 查询公开版本，不上传生辰资料。</p>' +
      '<div class="divider"></div>' +
      '<div class="klist">' +
      '<div class="krow"><span class="k">历法</span><span class="v">农历 · 二十四节气</span></div>' +
      '<div class="krow"><span class="k">命理</span><span class="v">子平八字 · 十神 · 大运</span></div>' +
      '<div class="krow"><span class="k">签法</span><span class="v">六十四卦</span></div>' +
      '</div>' +
      '<p class="disclaimer" style="margin-top:18px">仅供文化娱乐与自我观照，不构成任何决策依据。</p>' +
      '<div class="sheet-actions"><button class="btn" data-act="close-sheet" style="flex:1">知 道 了</button></div>'
    );
  }

  function confirmClear() {
    openSheet(
      '<div class="sheet-hd"><span class="t">清除记录</span><button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
      '<p class="about-p">将删除本机全部八字记录、本人设置与今日签文，此操作不可撤销。</p>' +
      '<div class="sheet-actions" style="margin-top:22px">' +
      '<button class="btn ghost" data-act="close-sheet" style="flex:1">取消</button>' +
      '<button class="btn" data-act="do-clear" style="flex:1;border-color:rgba(196,117,107,.5);color:#E0A79E">清 除</button>' +
      '</div>'
    );
  }

  function liunianSheet(yearVal) {
    var c = getChart();
    if (!c || !c.yun) return;
    var idx = pickYunIndex(c);
    var ln = A.liunian(c, yearVal, idx);
    if (!ln) return;
    var yun = c.yun.list[idx];
    var yunChips = relChips(ln.yunRel, '与流年无冲合');
    var age = yearVal - state.birth.y + 1;

    openSheet(
      '<div class="sheet-hd"><span class="t">流年 ' + yearVal + '</span><button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
      '<div class="ln-detail">' +
      '<div class="ln-gz">' + Pro.ganZhi(ln.gz) + '</div>' +
      '<div class="ln-info"><div class="krow"><span class="k">十神</span><span class="v">' + ln.ss + '</span></div>' +
      '<div class="krow"><span class="k">十二长生</span><span class="v">' + ln.stage + '</span></div>' +
      '<div class="krow"><span class="k">虚岁</span><span class="v">' + age + '</span></div>' +
      '<div class="krow"><span class="k">大运</span><span class="v">' + (yun ? yun.gz + '（' + yun.ss + '）' : '未起运') + '</span></div></div>' +
      '</div>' +
      '<div class="field" style="margin-top:16px"><div class="lab">与命局</div><div class="rel-wrap">' +
      relChips(ln.rels, '与命局无冲无合') + '</div></div>' +
      '<div class="field"><div class="lab">与大运</div><div class="rel-wrap">' + yunChips + '</div></div>' +
      Lore.group('流年神煞', yearVal + '年 · ' + ln.gz, A.cycleStars(c, ln.gz), 'year', yearVal, state.starMode) +
      (ln.note ? '<p class="about-p" style="margin-top:4px">' + ln.note + '</p>' : '') +
      '<div class="sheet-actions" style="margin-top:14px"><button class="btn" data-act="close-sheet" style="flex:1">关 闭</button></div>'
    );
  }

  /* 生辰录入 */
  function openBirthSheet(initial) {
    window.TianjiBirthForm.open({
      birth: initial && !initial.instant ? initial : null,
      openSheet: openSheet,
      closeSheet: closeSheet,
      onSave: function (birth) {
        var chart = A.chart(birth);
        var entries = state.records.entries.slice();
        var existing = entries.find(function (item) { return birthKey(item.birth) === birthKey(birth); });
        var entry = existing || { id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8), name: '', birth: birth };
        if (existing) entries.splice(entries.indexOf(existing), 1);
        entries.unshift(entry);
        commitRecords({entries: entries, own: state.records.own, active: entry.id});
        haptic(16);
        showChart(birth, chart);
      }
    });
  }

  function recordAction(action, entry) {
    if (!entry) return;
    var records = state.records;
    if (action === 'view') {
      var chart = A.chart(entry.birth);
      commitRecords({entries: records.entries, own: records.own, active: entry.id});
      showChart(entry.birth, chart);
    } else if (action === 'own') {
      commitRecords({entries: records.entries, own: entry.id, active: records.active});
      state.daily = null;
      render();
    } else {
      openSheet('<div class="sheet-hd"><span class="t">管理八字记录</span><button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
        '<p class="about-p">' + esc(birthLabel(entry.birth)) + '</p><label class="record-name-label">备注名' +
        '<input class="record-name" maxlength="32" value="' + esc(entry.name) + '" placeholder="例如：我的、家人"></label>' +
        '<div class="sheet-actions"><button class="btn ghost" data-record-delete>删除</button><button class="btn" data-record-rename>保存备注</button></div>' +
        '<p class="tiny record-error" role="alert"></p>', function (mask) {
        mask.addEventListener('click', function (e) {
          var save = e.target.closest('[data-record-rename]'), remove = e.target.closest('[data-record-delete]');
          if (!save && !remove) return;
          if (remove && remove.dataset.confirm !== 'yes') {
            remove.dataset.confirm = 'yes';
            remove.textContent = '确认删除';
            return;
          }
          try {
            var name = $('.record-name', mask).value.trim();
            var next = save ? records.entries.map(function (item) {
              return item.id === entry.id ? { id: item.id, name: name, birth: item.birth } : item;
            }) : records.entries.filter(function (item) { return item.id !== entry.id; });
            commitRecords({ entries: next, own: remove && records.own === entry.id ? null : records.own,
              active: remove && records.active === entry.id ? null : records.active });
            if (remove && records.active === entry.id && !(state.birth && state.birth.instant)) { state.birth = null; state.chart = null; }
            state.daily = null;
            closeSheet();
            render();
          } catch (error) { $('.record-error', mask).textContent = error.message; }
        });
      });
    }
  }

  function shake() {
    if (state.shaking) return;
    var d = loadDraw();
    if (d && (d.count || 1) >= 3) { return; }

    state.shaking = true;
    render();
    haptic(30);
    var n = 0;
    var iv = setInterval(function () { haptic(10); if (++n >= 5) clearInterval(iv); }, 220);

    setTimeout(function () {
      var count = (d && d.count ? d.count : 0) + 1;
      var me = ownRecord();
      var seed = todayKey() + '|' + (me ? JSON.stringify(me.birth) : 'anon') + '|' + count;
      var pick = hexOf(seed);
      state.draw = { date: todayKey(), n: pick.n, count: count, hex: HEX[pick.n] };
      store(K_DRAW, state.draw);
      state.shaking = false;
      haptic(40);
      render();
      window.scrollTo(0, 0);
    }, 1500);
  }

  /* ---------- 事件 ---------- */
  function bind() {
    document.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-tab]');
      if (tab) { go(tab.dataset.tab); return; }

      var term = e.target.closest('[data-pillar-term]');
      if (term) {
        openSheet(Notes.termDetail(term.dataset.pillarTerm));
        return;
      }

      var note = e.target.closest('[data-pillar-note]');
      if (note) {
        openSheet(Notes.detail(getChart(), +note.dataset.pillarIndex, note.dataset.pillarNote));
        return;
      }

      var starMode = e.target.closest('[data-star-mode]');
      if (starMode) {
        state.starMode = starMode.dataset.starMode;
        store('tj.starMode', state.starMode);
        render();
        $('[data-star-mode="' + state.starMode + '"]').focus({preventScroll:true});
        return;
      }

      var star = e.target.closest('[data-star]');
      if (star) {
        var chart = getChart();
        var scope = star.dataset.scope;
        var cycle = null;
        if (scope === 'yun') cycle = chart.yun.list[pickYunIndex(chart)];
        if (scope === 'year') cycle = A.liunian(chart, +star.dataset.starYear, pickYunIndex(chart));
        var hits = cycle ? A.cycleStars(chart, cycle.gz) : chart.shenSha;
        openSheet(Lore.detail(chart, hits[+star.dataset.star].name, scope, cycle, hits, Number(star.dataset.starPillar)));
        return;
      }

      var diagramBtn = e.target.closest('[data-diagram]');
      if (diagramBtn) {
        state.diagramTab = diagramBtn.dataset.diagram;
        refreshDiagram();
        $('[data-diagram="' + state.diagramTab + '"]').focus({ preventScroll: true });
        return;
      }

      var yunBtn = e.target.closest('[data-yun]');
      if (yunBtn) {
        var scroll = yunBtn.parentNode.scrollLeft;
        state.yunIdx = +yunBtn.dataset.yun;
        state.diagramYear = null;
        haptic(8);
        render();
        $('.yun-scroll').scrollLeft = scroll;
        return;
      }

      var lnBtn = e.target.closest('[data-year]');
      if (lnBtn) {
        state.diagramYear = +lnBtn.dataset.year;
        $all('[data-year]').forEach(function (button) {
          var active = button === lnBtn;
          button.classList.toggle('selected', active);
          button.setAttribute('aria-pressed', active);
        });
        refreshDiagram();
        haptic(8);
        liunianSheet(state.diagramYear);
        return;
      }

      var record = e.target.closest('[data-record-act]');
      if (record) {
        try {
          recordAction(record.dataset.recordAct, state.records.entries.find(function (item) { return item.id === record.dataset.recordId; }));
        } catch (error) { window.alert(error.message); }
        return;
      }
      var act = e.target.closest('[data-act]');
      if (!act) return;
      var a = act.dataset.act;

      if (a === 'calendar') { window.TianjiCalendar.open(openSheet); return; }
      if (a === 'open-birth') { haptic(8); openBirthSheet(state.birth); }
      if (a === 'new-birth') { haptic(8); openBirthSheet(null); }
      if (a === 'instant-chart') { haptic(8); instantChart(); }
      if (a === 'shake') { shake(); }
      if (a === 'reset-draw') { state.draw = null; store(K_DRAW, null); render(); }
      if (a === 'toggle-vibrate') {
        state.pref.vibrate = !state.pref.vibrate;
        store(K_PREF, state.pref);
        act.setAttribute('aria-checked', state.pref.vibrate);
        $('.switch', act).classList.toggle('on', state.pref.vibrate);
        haptic(14);
      }
      if (a === 'check-update') { window.TianjiUpdates.open(openSheet); return; }
      if (a === 'about') { haptic(8); aboutSheet(); }
      if (a === 'clear-all') { haptic(8); confirmClear(); }
      if (a === 'do-clear') {
        try { commitRecords({ entries: [], own: null, active: null }); }
        catch (error) { window.alert(error.message); return; }
        localStorage.removeItem(K_BIRTH);
        localStorage.removeItem(K_DRAW);
        state.birth = null; state.chart = null; state.daily = null; state.draw = null;
        closeSheet();
        render();
      }
      if (a === 'close-sheet') closeSheet();
    });

    function refreshToday() {
      if (!document.hidden && state.tab === 'home' && state.homeDay !== todayKey()) render();
    }
    document.addEventListener('visibilitychange', refreshToday);
    setInterval(refreshToday, 30000);

    window.__onBack = function () {
      if (sheetStack.length) { closeSheet(); return true; }
      if (state.tab !== 'home') { go('home'); return true; }
      return false;
    };
  }

  /* ---------- 启动 ---------- */
  function boot() {
    var records = store(K_RECORDS);
    var legacy = !records && store(K_BIRTH);
    if (records && Array.isArray(records.entries)) state.records = records;
    if (legacy) {
      var migrated = { entries: [{id:'legacy', name:'原有命盘', birth:legacy}], own:null, active:'legacy' };
      try { commitRecords(migrated); localStorage.removeItem(K_BIRTH); }
      catch (error) { state.records = migrated; console.error(error); }
    }
    var active = state.records.entries.find(function (entry) { return entry.id === state.records.active; });
    state.birth = active ? active.birth : null;
    state.starMode = store('tj.starMode') === 'common' ? 'common' : 'all';
    var pref = store(K_PREF);
    if (pref) state.pref = pref;
    state.draw = loadDraw();

    applyInsets();
    paintTopDate();
    bind();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
