
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
    if (birth.instant) {
      return '<section class="pro-birth"><p class="pro-kicker">即时盘 · 设备当地钟表时间</p><h2>' +
        timeLabel(birth) + ' <small>' + esc(offset(birth.offsetMinutes)) + '</small></h2>' +
        '<p class="tiny">日、时柱按设备当地钟表时间。年、月柱按当前瞬间对照节气。即时盘为临时查看。</p></section>';
    }
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

  function overview(result, chart) {
    return '<section class="pro-score pro-overview"><p class="pro-kicker">本命四柱</p><h2>命局提要</h2>' +
      result.overview.map(function (item) {
        return '<article><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p></article>';
      }).join('') +
      '<article><h3>岁运会改变什么</h3><p id="cycle-overview"></p></article>' +
      '<article><h3>命盘五行比例</h3><div class="overview-elements">' +
      A.WX_ORDER.map(function (wx) {
        var pct = chart.pct[wx];
        return '<div class="wx-' + wxClass[wx] + '">' + element(wx, wx) + '<strong>' + pct.toFixed(1) +
          '%</strong><span class="overview-track" aria-hidden="true"><i style="width:' + pct + '%"></i></span></div>';
      }).join('') + '</div><p class="tiny">按天干、地支与藏干加权计算。</p></article>' +
      '<details><summary>读盘依据</summary><ul>' + result.evidence.map(function (line) {
        return '<li>' + esc(line) + '</li>';
      }).join('') + '</ul></details></section>';
  }

  function usefulElements(chart) {
    var value = window.TianjiUseful.analyze(chart);
    return '<section class="section"><div class="section-hd"><h2 class="t">调候与喜用神</h2></div>' +
      '<div class="card useful-elements"><article><h3>调候用神参考 <small>' + esc(value.source) + '</small></h3><p>' +
      esc(value.note) + '</p>' + value.stems.map(function (item) {
        return '<p>' + element(item.gan + A.GAN_WX[item.gan], A.GAN_WX[item.gan]) + ' · ' + esc(item.evidence) + '</p>';
      }).join('') + '</article><article><h3>喜用神参考 <small>扶抑简化取法</small></h3>' +
      '<p><b>用神方向：</b>' + (value.first ? element(value.first,value.first) : '线索不足，暂不单列') + '</p>' +
      '<p><b>喜神方向：</b>' + (value.helpful.length ? value.helpful.map(function (wx) { return element(wx,wx); }).join('、') : '暂未单列') +
      '</p><p>' + esc(value.strength + '。' + value.why + '。') + '</p>' +
      (value.overlap.length ? '<p>需复核：' + esc(value.overlap.join('、')) + '同时出现在生扶或取用与制衡线索中，暂不列入建议。</p>' : '') +
      '<p class="tiny">调候看寒暖燥湿，扶抑看日主的生扶与泄耗，两栏分别读。</p></article></div></section>';
  }

  function cycleSummary(year, yun) {
    if (!year || !yun) return '出生排盘可在下方点选岁运查看对应关系。';
    var links = year.rels.concat(year.yunRel).slice(0, 3).map(function (rel) {
      return rel.text + (rel.pair ? '（' + rel.pair.split('').map(function (p) { return pillarNames[p]; }).join('、') + '）' : '');
    });
    return year.year + '年' + year.gz + ' · ' + yun.gz + '大运。' +
      (links.length ? '可对照' + links.join('、') + '。' : '按现有规则，未见流年与本命或大运的直接配对。');
  }

  function lifestyle(result) {
    return '<section class="section pro-reading"><div class="section-hd"><h2 class="t">生活小建议</h2></div>' +
      '<div class="card pro-reading-list"><article><p>把盘面当作自我观察的提示，按你实际遇到的事挑一条试试。</p></article>' +
      result.advice.map(function (item) {
        return '<article><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p></article>';
      }).join('') + '</div></section>';
  }

  function readings(result, chart) {
    return '<section class="section pro-reading"><div class="section-hd"><h2 class="t">命理解析</h2><span class="a">本命四柱</span></div>' +
      '<div class="card pro-reading-list">' + result.sections.map(function (section) {
        return '<article><h3>' + esc(section.title) + '</h3><p>' + esc(section.text) + '</p></article>';
      }).join('') + '</div></section>' + window.TianjiClassicReader.readings(chart);
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

  var palaceAdvice = [
    '和家里长辈讨论旧习惯时，先问它原来解决了什么问题，再提出一个可以试行的小调整。',
    '家里对安排有分歧时，先说明自己能做到什么、需要什么，再约定下一次商量的时间。',
    '和伴侣意见不同时，先各自说出最在意的一件事，再定一个双方都愿意试一周的做法。',
    '遇到照顾晚辈或长期计划的分歧，把任务拆成一个小步骤，先约定负责人和回看时间。'
  ];
  var kinAdvice = [
    '和父亲谈容易起争执的话题时，一次只讨论一个具体决定，把各自能承担的事说清楚。',
    '和母亲沟通时，先说你希望她倾听还是给建议。若意见不同，约一个双方方便再聊的时间。',
    '和兄弟姐妹分担家事前，把要做的事、各自负责的部分和时间写下来。',
    palaceAdvice[2],
    '和孩子或晚辈有分歧时，先问他们卡在哪一步，再一起定一个当周能做到的小目标。'
  ];

  function relationEvidence(chart, positions) {
    var links = chart.relations.filter(function (r) {
      if (r.pair) return positions.some(function (p) { return r.pair.includes(p.label); });
      var branches = r.text.split(' ')[0];
      return positions.some(function (p) { return branches.includes(p.zhi); });
    });
    return {
      together: links.filter(function (r) { return ['合', '干合', '三合', '三会'].includes(r.kind); }),
      tension: links.filter(function (r) { return ['冲', '干冲', '刑', '三刑', '害'].includes(r.kind); })
    };
  }

  function relationReading(chart, positions, advice) {
    if (!positions.length) return '<p class="rel-reading">线索有限。四柱未见这一取法对应的十神。</p>';
    var links = relationEvidence(chart, positions);
    var together = links.together.length > 0, tension = links.tension.length > 0;
    var tone = together && tension ? '合与牵制并见' : tension ? '有牵制' : together ? '有相合线索' : '合冲线索较少';
    function evidence(rows) {
      return rows.map(function (r) {
        var pair = r.pair ? '（' + Array.from(r.pair).map(function (label) { return pillarNames[label]; }).join('、') + '）' : '';
        return r.text + pair;
      }).join('、');
    }
    var why = (together ? '相合：' + evidence(links.together) + '。' : '') +
      (tension ? '牵制：' + evidence(links.tension) + '。' : '');
    return '<div class="rel-reading"><strong class="rel-outlook ' + (tension ? 'rel-outlook-watch' : together ? 'rel-outlook-together' : '') +
      '">' + tone + '</strong>' + (why ? '<p>' + esc(why) + '</p>' : '') +
      (tension ? '<p><b>生活小建议</b>　' + esc(advice) + '</p>' : '') + '</div>';
  }

  function palacesDiagram(chart) {
    var meanings = ['祖上与早年环境', '父母长辈与成长环境', '日主与伴侣宫', '子女与晚年'];
    var tiles = chart.pillars.map(function (p, i) {
      return '<div><h3>' + pillarNames[p.label] + '</h3><b>' + ganZhi(p.gz) + '</b><p>' + meanings[i] +
        '</p><small>' + esc(p.nayin) + ' · ' + esc(chart.dayStages[i]) + '</small>' + relationReading(chart, [p], palaceAdvice[i]) + '</div>';
    }).join('');
    return '<div class="palace-grid">' + tiles + '</div><div class="palace-extra">' +
      [['胎元', chart.taiYuan], ['命宫', chart.mingGong], ['身宫', chart.shenGong]].map(function (entry) {
        return '<div><span>' + entry[0] + '</span><b>' + ganZhi(entry[1]) + '</b></div>';
      }).join('') + '</div><p class="tiny">按各宫位所涉的合、冲、刑、害读盘。相合和牵制可以同时出现。</p>';
  }

  function kinDiagram(chart, gender) {
    var stars = [
      ['父亲', ['偏财']], ['母亲', ['正印']], ['兄弟姐妹', ['比肩', '劫财']]
    ];
    var hasGender = gender === 'm' || gender === 'f';
    if (hasGender) stars.push(
      [gender === 'f' ? '伴侣 · 坤造' : '伴侣 · 乾造', gender === 'f' ? ['正官', '七杀'] : ['正财', '偏财']],
      ['子女', gender === 'f' ? ['食神', '伤官'] : ['正官', '七杀']]
    );
    var matches = [];
    chart.pillars.forEach(function (p) {
      if (!p.isDay) matches.push({ pillar: p, label: p.label + '干', gan: p.gan, star: p.shiShenGan });
      p.hide.forEach(function (gan) {
        matches.push({ pillar: p, label: p.label + '支藏', gan: gan, star: A.shiShen(chart.dayMaster.gan, gan) });
      });
    });
    return '<div class="kin-hub"><b>' + element(chart.dayMaster.gan, chart.dayMaster.wx) +
      '</b><small>以日主起六亲</small></div><div class="kin-grid">' + stars.map(function (entry, i) {
        var found = matches.filter(function (m) { return entry[1].includes(m.star); });
        var positions = Array.from(new Set(found.map(function (m) { return m.pillar; })));
        return '<article><h3>' + entry[0] + '</h3><small>' + entry[1].join(' · ') + '</small><p>' +
          (found.length ? found.map(function (m) {
            return '<span class="kin-hit">' + m.label + element(m.gan, A.GAN_WX[m.gan]) + '<small>' + m.star + '</small></span>';
          }).join('') : '四柱与藏干未见该取象') + '</p>' + relationReading(chart, positions, kinAdvice[i]) + '</article>';
      }).join('') + '</div><p class="tiny">按本版六亲取法查看十神落柱，再看这些柱的合与牵制。</p>' +
      (hasGender ? '' : '<p class="tiny">当前命盘未选乾造或坤造。正式排盘时选择后，可查看伴侣和子女的取象。</p>');
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
    overview: overview, usefulElements: usefulElements, cycleSummary: cycleSummary, lifestyle: lifestyle, readings: readings, diagram: diagram
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
