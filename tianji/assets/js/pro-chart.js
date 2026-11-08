
/* 专业细盘：图示与排盘摘要 */
(function (root) {
  'use strict';

  var A = root.Astro;
  var wxClass = { 木: 'wood', 火: 'fire', 土: 'earth', 金: 'metal', 水: 'water' };
  var tabLabels = { relations: '干支', flow: '流通', palaces: '宫位', kin: '六亲' };
  var pillarNames = { 年: '年柱', 月: '月柱', 日: '日柱', 时: '时柱', 运: '大运', 流: '流年' };
  var branchCombos = [
    ['申', '子', '辰', '水'], ['亥', '卯', '未', '木'],
    ['寅', '午', '戌', '火'], ['巳', '酉', '丑', '金']
  ];
  var breaks = ['子酉', '卯午', '辰丑', '未戌', '寅亥', '巳申'];
  var stemCombos = ['甲己', '乙庚', '丙辛', '丁壬', '戊癸'];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function element(text, wx) {
    return '<span class="wx-glyph wx-' + (wxClass[wx] || 'plain') + '">' + esc(text) + '</span>';
  }

  function ganZhi(gz) {
    return gz ? element(gz[0], A.GAN_WX[gz[0]]) + element(gz[1], A.ZHI_WX[gz[1]]) : '—';
  }

  function offset(value) {
    var abs = Math.abs(value);
    var hours = Math.floor(abs / 60);
    var minutes = Math.floor(abs % 60);
    var seconds = Math.round((abs - Math.floor(abs)) * 60);
    return 'UTC' + (value < 0 ? '−' : '+') + String(hours).padStart(2, '0') +
      ':' + String(minutes).padStart(2, '0') + (seconds ? ':' + String(seconds).padStart(2, '0') : '');
  }

  function timeLabel(c) {
    return c.y + '-' + String(c.m).padStart(2, '0') + '-' + String(c.d).padStart(2, '0') +
      ' ' + String(c.hour).padStart(2, '0') + ':' + String(c.minute).padStart(2, '0') +
      (Number.isInteger(c.second) ? ':' + String(c.second).padStart(2, '0') : '');
  }

  function birthSummary(birth, chart) {
    var header = '<div class="pro-birth-title"><div><p class="pro-kicker">排盘资料</p><h2>' +
      (birth.gender === 'm' ? '乾造' : '坤造') + ' <small>' + esc(chart.lunar.text) + '</small></h2></div>' +
      '<button class="btn ghost" data-act="open-birth">编辑生辰</button></div>';
    if (!chart.corrected) {
      return '<section class="pro-birth">' + header + '<p>' + esc(birth.y + '年' + birth.m + '月' + birth.d + '日 ' +
        A.ZHI_LABEL[birth.zhi] + '时') + ' · 旧版时辰记录</p><p class="tiny">补录时分和出生地后可校正真太阳时。</p></section>';
    }
    var c = chart.corrected;
    var city = birth.city;
    var fmt = function (value) { return (value >= 0 ? '+' : '−') + Math.abs(value).toFixed(1) + ' 分'; };
    return '<section class="pro-birth">' + header + '<dl><div><dt>出生地</dt><dd>' + esc(city.name + ' · ' + city.region) +
      '</dd></div><div><dt>钟表时间</dt><dd>' + timeLabel(birth) + ' <small>' + esc(offset(c.offsetMinutes)) +
      '</small></dd></div><div><dt>真太阳时</dt><dd class="pro-corrected">' + timeLabel(c) +
      ' <small>' + A.ZHI_LABEL[chart.solar.zhi] + '时</small></dd></div></dl>' +
      '<details><summary>校正依据</summary><p>纬度 ' + Number(city.lat).toFixed(4) + '° · 经度 ' +
      Number(city.lon).toFixed(4) + '°<br>' + esc(city.zone) + ' · ' +
      (birth.offsetMinutes == null ? '按历史时区记录' : '手动 UTC 偏移') +
      '<br>经度 ' + fmt(c.longitudeMinutes) + ' · 均时差 ' + fmt(c.equationMinutes) +
      '<br>年、月柱及起运按实际出生瞬间与节气比较。日、时柱取出生地真太阳时。</p></details></section>';
  }

  function scoreCard(result, chart) {
    return '<section class="pro-score"><div class="pro-score-top"><div><p class="pro-kicker">命局评分 · 结构参考</p>' +
      '<h2>' + result.score + '<small> / 100</small></h2></div><div class="pro-score-glyph">' +
      element(chart.dayMaster.gan, chart.dayMaster.wx) + '<small>日主</small></div></div>' +
      '<p>反映四柱中可对应的结构线索，供读盘参考。</p><details><summary>查看评分依据</summary><ul>' +
      result.factors.map(function (factor) {
        return '<li><b>' + esc(factor.label) + ' · ' + factor.value + '/' + factor.max + '</b><span>' +
          esc(factor.detail) + '</span></li>';
      }).join('') + '</ul></details></section>';
  }

  function readings(result) {
    return '<section class="section pro-reading"><div class="section-hd"><h2 class="t">命理解析</h2><span class="a">本命四柱</span></div>' +
      '<div class="card pro-reading-list">' + result.sections.map(function (section) {
        return '<article><h3>' + esc(section.title) + '</h3><p>' + esc(section.text) + '</p></article>';
      }).join('') + '</div></section>' +
      '<section class="section pro-reading"><div class="section-hd"><h2 class="t">古籍参照</h2><span class="a">原文与匹配依据</span></div>' +
      '<div class="card pro-reading-list">' + result.classics.map(function (source) {
        return '<article><h3>' + esc(source.title) + ' <small>' + esc(source.section) + '</small></h3><blockquote>' +
          esc(source.quote) + '</blockquote><p>' + esc(source.reason) + '</p>' +
          (source.url ? '<details><summary>原文出处</summary><p class="pro-source">' + esc(source.url) + '</p></details>' : '') +
          '</article>';
      }).join('') + '</div></section>';
  }

  function withCycle(pillars, yun, year) {
    function cycle(label, entry) {
      return { label: label, gan: entry.gz[0], zhi: entry.gz[1], gz: entry.gz };
    }
    var out = pillars.slice();
    if (yun) out.unshift(cycle('运', yun));
    if (year) out.unshift(cycle('流', year));
    return out;
  }

  function linkRows(pillars, kind) {
    var rows = A.relations(pillars).filter(function (r) {
      return (r.kind === '干冲' || r.kind === '干合') === (kind === 'gan');
    }).map(function (r) {
      var [chars, label] = r.text.split(' ');
      var indexes = [];
      pillars.forEach(function (p, i) {
        if (r.pair ? r.pair.includes(p.label) : chars.includes(p[kind])) indexes.push(i);
      });
      return { indexes: indexes, label: label };
    });
    for (var i = 0; i < pillars.length; i++) {
      for (var j = i + 1; j < pillars.length; j++) {
        var a = pillars[i][kind], b = pillars[j][kind];
        var indexes = [i, j];
        if (kind === 'gan') {
          var wa = A.GAN_WX[a], wb = A.GAN_WX[b];
          if (A.WX_KE[wa] === wb || A.WX_KE[wb] === wa) {
            rows.push({ indexes: indexes, label: (A.WX_KE[wa] === wb ? a + '克' + b : b + '克' + a) });
          }
          continue;
        }
        if (breaks.includes(a + b) || breaks.includes(b + a)) rows.push({ indexes: indexes, label: '相破' });
        var group = branchCombos.find(function (g) {
          return a !== b && g.slice(0, 3).includes(a) && g.slice(0, 3).includes(b);
        });
        if (group) {
          var third = group.slice(0, 3).find(function (z) { return z !== a && z !== b; });
          if (!pillars.some(function (p) { return p.zhi === third; })) {
            rows.push({ indexes: indexes, label: (a === group[1] || b === group[1] ? '半合' : '拱合') + group[3] });
          }
        }
        if (a !== b) {
          var hides = A.ZHI_HIDE_GAN;
          var hiddenPair = hides[a].some(function (first) {
            return hides[b].some(function (second) {
              return stemCombos.includes(first + second) || stemCombos.includes(second + first);
            });
          });
          if (hiddenPair) rows.push({ indexes: indexes, label: '藏干相合' });
        }
      }
    }
    return rows;
  }

  function columnTiles(pillars) {
    return '<div class="diagram-columns" style="--columns:' + pillars.length + '">' +
      pillars.map(function (p) {
        return '<div><small>' + pillarNames[p.label] + '</small><b>' +
          element(p.gan, A.GAN_WX[p.gan]) + element(p.zhi, A.ZHI_WX[p.zhi]) + '</b></div>';
      }).join('') + '</div>';
  }

  function relationLines(pillars, rows, kind) {
    if (!rows.length) return '<p class="tiny diagram-empty">这一层未检出所列规则的配对。</p>';
    return '<ul class="diagram-links" style="--columns:' + pillars.length + '">' + rows.map(function (row) {
      var first = row.indexes[0], last = row.indexes[row.indexes.length - 1];
      var hint = row.indexes.map(function (i) { return pillarNames[pillars[i].label] + pillars[i][kind]; }).join('、');
      return '<li aria-label="' + hint + ' ' + esc(row.label) + '"><span class="diagram-line" style="grid-column:' +
        (first + 1) + '/' + (last + 2) + ';--span:' + (last - first + 1) + '"><span>' + esc(row.label) + '</span></span>' +
        row.indexes.map(function (i) {
          var p = pillars[i];
          var wx = kind === 'gan' ? A.GAN_WX[p.gan] : A.ZHI_WX[p.zhi];
          return '<span class="diagram-node" style="grid-column:' + (i + 1) + '">' + element(p[kind], wx) + '</span>';
        }).join('') + '</li>';
    }).join('') + '</ul>';
  }

  function relationsDiagram(chart, yun, year) {
    var pillars = withCycle(chart.pillars, yun, year);
    return columnTiles(pillars) + ['gan', 'zhi'].map(function (kind) {
      var title = kind === 'gan' ? '天干' : '地支';
      var rows = linkRows(pillars, kind);
      return '<h3 class="diagram-layer">' + title + ' <small>' + rows.length + ' 项</small></h3>' +
        '<div class="diagram-rel-scroll" tabindex="0" aria-label="' + title + '关系">' +
        relationLines(pillars, rows, kind) + '</div>';
    }).join('') +
      '<p class="tiny">图示随选定的岁运联动。合、半合与拱合显示配对，成化另看月令和全局。藏干相合按两支藏干五合标注。</p>';
  }

  function flowDiagram(chart) {
    var order = A.WX_ORDER;
    var points = [[150, 32], [249, 105], [213, 220], [87, 220], [51, 105]];
    function edge(from, to, className) {
      var p = points[from], q = points[to];
      var dx = q[0] - p[0], dy = q[1] - p[1], length = Math.hypot(dx, dy);
      var ux = dx / length, uy = dy / length;
      return '<line class="' + className + '" x1="' + (p[0] + ux * 26) + '" y1="' + (p[1] + uy * 26) +
        '" x2="' + (q[0] - ux * 29) + '" y2="' + (q[1] - uy * 29) + '" marker-end="url(#' + className + ')"/>';
    }
    var lines = order.map(function (wx, i) {
      return edge(i, order.indexOf(A.WX_SHENG[wx]), 'flow-sheng') +
        edge(i, order.indexOf(A.WX_KE[wx]), 'flow-ke');
    }).join('');
    var nodes = order.map(function (wx, i) {
      return '<g class="wx-' + wxClass[wx] + '" transform="translate(' + points[i].join(' ') + ')">' +
        '<circle r="25"/><text y="-1">' + wx + '</text><text class="flow-pct" y="14">' + chart.pct[wx].toFixed(1) + '%</text></g>';
    }).join('');
    return '<svg class="flow-svg" viewBox="0 0 300 252" role="img" aria-label="木火土金水相生相克及本命权重">' +
      '<defs><marker id="flow-sheng" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#9cb6a7"/></marker>' +
      '<marker id="flow-ke" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#bd8c80"/></marker></defs>' +
      lines + nodes + '</svg><p class="tiny diagram-key">实线相生 · 虚线相克 · 百分比为本命加权占比</p>';
  }

  function palacesDiagram(chart) {
    var meanings = ['祖上与早年环境', '父母长辈与成长环境', '日主与伴侣宫', '子女与晚年'];
    var tiles = chart.pillars.map(function (p, i) {
      return '<div><h3>' + pillarNames[p.label] + '</h3><b>' + ganZhi(p.gz) + '</b><p>' + meanings[i] +
        '</p><small>' + esc(p.nayin) + ' · ' + esc(chart.dayStages[i]) + '</small></div>';
    }).join('');
    return '<div class="palace-grid">' + tiles + '</div><div class="palace-extra">' +
      [['胎元', chart.taiYuan], ['命宫', chart.mingGong], ['身宫', chart.shenGong]].map(function (entry) {
        return '<div><span>' + entry[0] + '</span><b>' + ganZhi(entry[1]) + '</b></div>';
      }).join('') + '</div><p class="tiny">宫位按传统四柱象意标注，可与六亲十神一起看。</p>';
  }

  function kinDiagram(chart, gender) {
    var stars = [
      ['父亲', ['偏财']], ['母亲', ['正印']], ['兄弟姐妹', ['比肩', '劫财']],
      [gender === 'f' ? '伴侣 · 坤造' : '伴侣 · 乾造', gender === 'f' ? ['正官', '七杀'] : ['正财', '偏财']],
      ['子女', gender === 'f' ? ['食神', '伤官'] : ['正官', '七杀']]
    ];
    var matches = [];
    chart.pillars.forEach(function (p) {
      if (!p.isDay) matches.push({ label: p.label + '干', gan: p.gan, star: p.shiShenGan });
      p.hide.forEach(function (gan) {
        matches.push({ label: p.label + '支藏', gan: gan, star: A.shiShen(chart.dayMaster.gan, gan) });
      });
    });
    return '<div class="kin-hub"><b>' + element(chart.dayMaster.gan, chart.dayMaster.wx) +
      '</b><small>以日主起六亲</small></div><div class="kin-grid">' + stars.map(function (entry) {
        var found = matches.filter(function (m) { return entry[1].includes(m.star); });
        return '<article><h3>' + entry[0] + '</h3><small>' + entry[1].join(' · ') + '</small><p>' +
          (found.length ? found.map(function (m) {
            return '<span class="kin-hit">' + m.label + element(m.gan, A.GAN_WX[m.gan]) + '<small>' + m.star + '</small></span>';
          }).join('') : '四柱与藏干未见该取象') + '</p></article>';
      }).join('') + '</div><p class="tiny">按常见子平取象列出十神所在位置，六亲取法随流派而异。</p>';
  }

  function diagram(chart, tab, yun, year, gender) {
    var content;
    if (tab === 'flow') content = flowDiagram(chart);
    else if (tab === 'palaces') content = palacesDiagram(chart);
    else if (tab === 'kin') content = kinDiagram(chart, gender);
    else content = relationsDiagram(chart, yun, year);
    return '<div class="section-hd"><h2 class="t">智能图示</h2><span class="a">' +
      (year && tab === 'relations' ? year.year + ' 流年 · ' + yun.gz + '大运' : '四柱结构') +
      '</span></div><div class="card diagram-card"><div class="diagram-tabs" aria-label="图示类型">' +
      Object.keys(tabLabels).map(function (key) {
        return '<button data-diagram="' + key + '" aria-pressed="' + (key === tab) + '">' + tabLabels[key] + '</button>';
      }).join('') + '</div><div class="diagram-body">' + content + '</div></div>';
  }

  root.TianjiProChart = {
    element: element, ganZhi: ganZhi, birthSummary: birthSummary,
    scoreCard: scoreCard, readings: readings, diagram: diagram
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
