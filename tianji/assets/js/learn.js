/* 命理学习：以应用中的排盘口径为例。 */
(function () {
  'use strict';
  var A = window.Astro;
  var Pro = window.TianjiProChart;
  var ten = [
    ['比肩','同我 · 同阴阳','同辈、独立、并行'],
    ['劫财','同我 · 异阴阳','合作、竞争、资源分配'],
    ['食神','我生 · 同阴阳','表达、产出、技艺'],
    ['伤官','我生 · 异阴阳','表达、变通、突破惯例'],
    ['偏财','我克 · 同阴阳','流动资源、机会和经营'],
    ['正财','我克 · 异阴阳','日常资源、安排和管理'],
    ['七杀','克我 · 同阴阳','压力、约束和应对挑战'],
    ['正官','克我 · 异阴阳','规则、职责和秩序'],
    ['偏印','生我 · 同阴阳','间接支持、专门学习'],
    ['正印','生我 · 异阴阳','照应、资源和学习支持']
  ];
  var stages = [
    ['长生','开始生发'],['沐浴','初生未稳'],['冠带','形态渐成'],['临官','趋于成熟'],
    ['帝旺','气势高点'],['衰','由盛转弱'],['病','气势渐弱'],['死','一轮气势衰尽'],
    ['墓','收敛入库'],['绝','旧一轮止息'],['胎','新一轮孕育'],['养','生发前蓄养']
  ];
  var routes = [
    ['找日主','四柱从年、月、日、时排列，日柱上方的天干就是日主。看十神时，先把它当作「我」。'],
    ['看月令','月柱下方的地支是月令，提示季节与当令之气。再看日主有没有同类藏干或印星生扶。'],
    ['读五行和十神','先看天干、地支和藏干各有什么，再对照五行比例及十神。比例是天机的加权显示，读取用时还要结合月令和位置。'],
    ['找实际合冲','打开干支图，指出哪两个字发生关系、在哪几柱。看到合先记组合，是否化成另一五行还要看条件。'],
    ['最后叠加岁运','先读本命。切换大运、流年后，再找新出现的干支关系和受影响的柱。神煞放在最后辅助对读。']
  ];

  function termList(rows) {
    return '<dl class="learn-terms">' + rows.map(function (row) {
      return '<div><dt>' + row[0] + '</dt><dd>' + row.slice(1).join('。') + '。</dd></div>';
    }).join('') + '</dl>';
  }

  function lesson(id, title, subtitle, html, expanded) {
    return '<details class="card learn-lesson" id="' + id + '"' + (expanded ? ' open' : '') +
      '><summary><span>' + title + '<small>' + subtitle + '</small></span></summary><div class="learn-body">' + html + '</div></details>';
  }

  function cycle(label, order, rule) {
    return '<div class="learn-cycle"><h3>' + label + '</h3><p aria-label="' + order.join(rule) + '">' +
      order.map(function (wx) { return Pro.element(wx,wx); }).join('<span aria-hidden="true"> → </span>') +
      '</p></div>';
  }

  function example(chart, temporary) {
    if (!chart) return '<section class="card learn-example"><h2>拿自己的盘练习</h2><p>完成一次排盘，这里会显示日主、月令和一个十神例子。</p><button class="btn ghost" data-tab="chart">前往排盘</button></section>';
    var day = chart.pillars[2], month = chart.pillars[1], hour = chart.pillars[3];
    return '<section class="card learn-example"><h2>用当前命盘练习</h2><p class="tiny">' +
      (temporary ? '以下示例来自刚才的即时盘。' : '以下示例来自排盘页正在看的命盘。') +
      '</p><p>先找日干 <b>' + Pro.element(day.gan,day.ganWx) + '</b>，再看月令 <b>' +
      Pro.element(month.zhi,month.zhiWx) + '</b>。以' + day.gan + '为「我」，时干' + hour.gan +
      '对应<b>' + A.shiShen(day.gan,hour.gan) + '</b>。日干看时支是<b>' + chart.dayStages[3] +
      '</b>，时干看同一个时支则是<b>' + chart.changSheng[3] + '</b>。</p>' +
      '<button class="btn ghost" data-tab="chart">回排盘对照</button></section>';
  }

  function render(chart, temporary) {
    var wx = A.WX_ORDER;
    var control = [wx[0]];
    for (var i = 0; i < 5; i++) control.push(A.WX_KE[control[control.length - 1]]);
    return '<div class="page learn-page"><header class="page-heading"><h1 class="h1">命理学习</h1>' +
      '<p>按顺序读一张四柱命盘</p></header>' + example(chart,temporary) +
      lesson('learn-classics','古籍书架','四部典籍选读 · 原文与今译', window.TianjiClassicLibrary.shelf()) +
      lesson('learn-route','01 如何看自己的盘','日主、月令、组合、岁运',
        '<ol class="learn-route">' + routes.map(function (r) { return '<li><b>' + r[0] + '</b><p>' + r[1] + '</p></li>'; }).join('') + '</ol>',true) +
      lesson('learn-elements','02 五行相生相克','先记两条循环，再看方向',
        cycle('相生',wx.concat(wx[0]),'生') + cycle('相克',control,'克') +
        '<p><b>例：</b>甲木见癸水，水生木，方向是癸生甲。甲木见戊土，木克土，方向是甲克戊。生有扶助也有泄耗，克可以制衡，也可能过重。</p>') +
      lesson('learn-combine','03 干支合冲','查表找配对，再回命盘定位',
        termList([['天干五合','甲己、乙庚、丙辛、丁壬、戊癸'],['地支六合','子丑、寅亥、卯戌、辰酉、巳申、午未'],
          ['地支三合','申子辰水、亥卯未木、寅午戌火、巳酉丑金'],['地支六冲','子午、丑未、寅申、卯酉、辰戌、巳亥']]) +
        '<p><b>例：</b>日支为卯、流年为酉，图上会看到卯酉冲。先写下「流年酉冲本命日支卯」，再看日柱的其他关系。</p>') +
      lesson('learn-stages','04 十二长生','同一个地支，星运和自坐可能不同',
        '<p>本版按阳干顺行、阴干逆行排列。星运以日干查该柱地支，自坐以该柱天干查自己的地支。下表是气势阶段的名称。</p>' +
        termList(stages) + '<p><b>例：</b>甲在亥为长生，乙在亥为死。差别来自起点与方向，名称用来描述传统气势阶段。</p>') +
      lesson('learn-ten','05 十神入门','食神、伤官、财、官、印与比劫',
        '<p>十神以日干为「我」。先判五行是同我、生我、我生、克我或我克，再判阴阳相同还是相异。</p>' +
        '<p><b>食神例：</b>日主是甲木，见丙火。木生火，是「我生」。甲和丙同属阳，所以丙是甲的食神。若见丁火，阴阳相异，则为伤官。</p>' +
        termList(ten) + '<p class="tiny">各项是传统取象。读具体命盘时，结合透干、藏干、月令和所在柱。</p>') +
      '<p class="tiny learn-source">古籍参照：《三命通会》卷二〈论天干阴阳生死〉、〈论支元六合〉、〈论支元三合〉、〈论冲击〉及四库本卷五〈论古人立印食官财名义〉。</p></div>';
  }

  window.TianjiLearn = {render:render};
}());
