
/* 本地古籍导读与神煞取法。 */
(function () {
  'use strict';
  var A = window.Astro;
  var names = { 年:'年柱', 月:'月柱', 日:'日柱', 时:'时柱', 运:'大运', 流:'流年' };
  var meanings = {
    天乙贵人:'古法用它标记容易得到协助、提携的取象，常和落柱的十神一起看。',
    天德贵人:'按月支起查，古法用作宽缓、解纷的辅助线索。',
    月德贵人:'按月支的三合组取天干，古法常用于观察协力、缓和。',
    文昌贵人:'常取学习、文书、表达、技艺之象，可对照落柱的印星和食伤。',
    国印贵人:'传统取印信、规范、职责之象，读盘时可与官印的位置对照。',
    太极贵人:'传统常取对学问、义理和思考的兴趣之象。',
    禄神:'日干的临官地支，传统看作日干在地支的一处根气。',
    羊刃:'本版采用阳干取刃法。传统用来观察旺极、刚决和制衡，先看日主与全局。',
    金舆:'传统以车舆比喻便利、供养和生活条件。',
    桃花:'又称咸池，传统用来看社交、审美和吸引力的取象。',
    驿马:'传统取移动、往来、调动和迁移之象，可看该支是否被合冲。',
    华盖:'传统多取独处、专注、艺术与学问之象。',
    将星:'传统取组织、统领、承担职责之象。',
    红鸾:'按本命年支起查，传统取喜庆、关系和人际往来之象。',
    天喜:'在红鸾对支，传统多取喜庆、聚会和人际互动之象。',
    孤辰:'按年支所在的三会组起查，古法常取独立、少依赖之象。',
    寡宿:'按年支所在的三会组起查，传统取偏静、独处之象。名称源于古法术语。',
    空亡:'六十甲子每旬十日，有两个地支未配到天干，称为旬空。本版以本命日柱起查。',
    劫煞:'按年支、日支的三合组起查。古法取资源争夺或变化之象。',
    灾煞:'按三合旺支的对冲支查得。古法用作复核冲动与牵制的辅助标记。',
    亡神:'按年支、日支的三合组起查。古法取心思、谋划或耗散之象。'
  };
  var notes = {
    天干:'古书依日干的阴阳五行分别说明其性质。读具体命盘时，还要看这个日干生于何月、四柱如何生扶或制约。',
    月令:'月令像一座房屋的总纲。月支藏干中当令的气，就像决定房屋朝向的因素，应先辨清它。',
    中和:'先理解怎样才叫适中，再观察这张盘的气势和取用。',
    衰旺:'日主偏旺时，古法考虑用泄耗或克制来疏导。偏弱时考虑生扶。原注随后说明，旺弱走到极端时另有取法。',
    六合:'合指两支相配。六合是子丑、寅亥、卯戌、辰酉、巳申、午未六组。',
    三合:'以申子辰为例，申是水的生地，子是旺地，辰是库地。三个字齐备才具备讨论完整三合局的条件。',
    冲击:'从一个地支顺着十二地支数，起点也计入，第七个地支与它相冲，如子午、卯酉。',
    十神:'作者用甲乙为例，说明应以出生日的天干为参照，解释其他干支与日主之间的关系。'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  function read(source) {
    var key = Object.keys(notes).find(function (name) { return source.section.includes(name); }) || '十神';
    var paragraphs = window.TianjiClassicTexts[key] || [];
    var matching = paragraphs.find(function (p) { return p.includes(source.quote); });
    var translation = source.quote.includes('水多宜火') ? '戊土生在秋冬，若命盘水气多，古法考虑用火温暖湿冷的土。' : notes[key];
    return '<p><b>白话译读</b>　' + esc(translation) + '</p>' +
      (matching ? '<details><summary>查看原文上下文</summary><p>' + esc(matching) + '</p></details>' : '') +
      '<details><summary>离线阅读本篇原文</summary><div class="lore-original">' +
      paragraphs.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      '</div><p class="pro-source">底本：维基文库 · ' + esc(source.title + ' · ' + source.section) + '<br>' +
      esc(source.url) + '</p></details>';
  }

  function group(title, subtitle, hits, scope, year) {
    var seen = new Set();
    var buttons = hits.map(function (hit, i) {
      if (seen.has(hit.name)) return '';
      seen.add(hit.name);
      var pillars = scope === 'natal' ? Array.from(new Set(hits.filter(function (h) {
        return h.name === hit.name;
      }).flatMap(function (h) { return h.pillars; }))).map(function (j) { return '年月日时'[j]; }).join('、') : '';
      return '<button class="rel lore-hit" data-star="' + i + '" data-scope="' + scope +
        '" data-star-year="' + (year || '') + '">' + esc(hit.name) +
        (pillars ? ' <small>' + pillars + '</small>' : '') + '</button>';
    }).join('');
    return '<section class="section"><div class="section-hd"><h2 class="t">' + esc(title) +
      '</h2><span class="a">' + esc(subtitle) + '</span></div><div class="card rel-wrap">' +
      (buttons || '<span class="tiny">按本版取法，这一组无命中。</span>') + '</div></section>';
  }

  function detail(chart, name, scope, cycle, hits) {
    var natal = chart.pillars;
    var all = natal.slice();
    if (cycle) all.push({ label: scope === 'yun' ? '运' : '流', gan: cycle.gz[0], zhi: cycle.gz[1], gz: cycle.gz });
    var relations = A.relations(all);
    var matched = hits.filter(function (hit) { return hit.name === name; });
    var locations = Array.from(new Set(matched.flatMap(function (hit) { return hit.pillars; })));
    if (cycle) locations = [4];
    var natalHits = Array.from(new Set(chart.shenSha.filter(function (hit) {
      return hit.name === name;
    }).flatMap(function (hit) { return hit.pillars; })));
    var rows = locations.map(function (i) {
      var p = all[i];
      var evidence = matched.filter(function (hit) { return hit.pillars.includes(cycle ? 0 : i); });
      var links = relations.filter(function (rel) {
        if (rel.pair) return rel.pair.includes(p.label);
        var branches = rel.text.split(' ')[0];
        return branches.includes(p.zhi) && Array.from(branches).every(function (z) {
          return z === p.zhi || all.some(function (other) { return other !== p && other.zhi === z; });
        });
      }).map(function (rel) {
        return rel.text + (rel.pair ? '（' + Array.from(rel.pair).map(function (k) { return names[k]; }).join('、') + '）' : '（三支组合）');
      });
      return '<article><h3>' + names[p.label] + ' ' + p.gz + ' · ' +
        (p.shiShenGan || A.shiShen(chart.dayMaster.gan, p.gan)) + '</h3><p>取法：' +
        esc(evidence.map(function (h) { return h.src; }).join('；')) + '</p><p>与八字联动：' +
        esc(links.length ? links.join('、') : '按本版规则，未检出涉及此柱的合、冲、刑、害。') + '</p></article>';
    }).join('');
    return '<div class="sheet-hd"><span class="t">' + esc(name) +
      '</span><button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
      '<p class="about-p">' + esc(meanings[name] || '传统命理中的辅助取象。') + '</p>' +
      '<div class="lore-details">' + rows + '</div>' +
      (cycle && natalHits.length ? '<p class="about-p">本命同名神煞：' +
        natalHits.map(function (i) { return names[natal[i].label] + natal[i].gz; }).join('、') + '。</p>' : '') +
      '<p class="tiny">神煞按本命起查，作为读盘辅助，结合月令、十神与干支关系理解。</p>';
  }

  window.TianjiLore = { read:read, group:group, detail:detail };
}());
