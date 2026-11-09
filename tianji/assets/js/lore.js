
/* 本地古籍导读与神煞取法。 */
(function () {
  'use strict';
  var A = window.Astro;
  var names = { 年:'年柱', 月:'月柱', 日:'日柱', 时:'时柱', 运:'大运', 流:'流年' };
  var Stars = window.TianjiStars;
  function isVisible(hit, mode) {
    return mode !== 'common' || Stars.byId(hit.id).common;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  var readerId = 0;
  function section(title, text) {
    return '<section class="explain-section"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></section>';
  }

  function reader(title, original, translation) {
    if (!original) return section('今译 · ' + title, translation);
    if (!translation) return section('原文 · ' + title, original);
    var id = 'reading-' + (++readerId);
    return '<fieldset class="reading-modes"><legend>' + esc(title) + '</legend>' +
      ['原文','今译','对照'].map(function (label, i) {
        return '<input class="reading-option mode-' + i + '" type="radio" name="' + id + '" id="' + id + '-' + i + '"' +
          (i === 2 ? ' checked' : '') + '><label for="' + id + '-' + i + '">' + label + '</label>';
      }).join('') + '<div class="reading-panels"><div class="reading-original">' + section('原文', original) +
      '</div><div class="reading-translation">' + section('今译', translation) + '</div></div></fieldset>';
  }

  function group(title, subtitle, hits, scope, year, mode) {
    var seen = new Set();
    var buttons = hits.map(function (hit, i) {
      if (!isVisible(hit, mode) || seen.has(hit.name)) return '';
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

  function yearColumn(hits, year, mode) {
    var buttons = hits.map(function (hit, i) {
      if (!isVisible(hit, mode)) return '';
      return '<button class="pillar-star" data-star="' + i + '" data-scope="year" data-star-year="' +
        year + '" aria-label="' + year + '年流年神煞 ' + esc(hit.name) + '">' + esc(hit.name) + '</button>';
    }).join('');
    return '<div class="ln-column-stars">' + (buttons || '<span class="pillar-star-empty">—</span>') + '</div>';
  }

  function pillarStars(hits, index, mode) {
    var seen = new Set();
    var buttons = hits.map(function (hit, i) {
      if (!isVisible(hit, mode) || !hit.pillars.includes(index) || seen.has(hit.name)) return '';
      seen.add(hit.name);
      return '<button class="pillar-star" data-star="' + i + '" data-scope="natal" data-star-pillar="' +
        index + '" aria-label="' + '年月日时'[index] + '柱神煞 ' + esc(hit.name) + '">' + esc(hit.name) + '</button>';
    }).join('');
    return '<div class="pillar-star-list">' + (buttons || '<span class="pillar-star-empty" aria-label="无神煞命中">—</span>') + '</div>';
  }

  function detail(chart, name, scope, cycle, hits, pillarIndex) {
    var rule = Stars.byName(name);
    var natal = chart.pillars;
    var all = natal.slice();
    if (cycle) all.push({ label: scope === 'yun' ? '运' : '流', gan: cycle.gz[0], zhi: cycle.gz[1], gz: cycle.gz });
    var relations = A.relations(all);
    var matched = hits.filter(function (hit) { return hit.name === name; });
    var locations = Array.from(new Set(matched.flatMap(function (hit) { return hit.pillars; })));
    if (cycle) locations = [4];
    else if (Number.isInteger(pillarIndex)) locations = locations.filter(function (i) { return i === pillarIndex; });
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
      '<div class="explain-body">' +
      section('本盘提要', locations.map(function (i) { return names[all[i].label] + all[i].gz; }).join('、') + '见' + name + '。') +
      section('传统含义', rule.description) +
      (name === '天乙贵人' ? reader('《三命通会》卷三 · 论天乙贵人',
        '其神最尊貴，所至之處，一切凶煞隱然而避。',
        '书中把天乙比作尊贵的护助之神，遇到它时，古人会留意是否有缓和、助力的条件。') : '') +
      '<div class="lore-details"><h3>查法与本盘联动</h3>' + rows + '</div></div>' +
      (cycle && natalHits.length ? '<p class="about-p">本命同名神煞：' +
        natalHits.map(function (i) { return names[natal[i].label] + natal[i].gz; }).join('、') + '。</p>' : '') +
      section('规则与出处', rule.category + ' · ' + rule.version + '。' + rule.reference +
        (rule.aliases.length ? '。别名：' + rule.aliases.join('、') : '')) +
      '<details><summary>查看来源地址</summary><p class="pro-source">' + esc(rule.source) + '</p></details>';
  }

  window.TianjiLore = { reader:reader, section:section, group:group, yearColumn:yearColumn, pillarStars:pillarStars, detail:detail };
}());
