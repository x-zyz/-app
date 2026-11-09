/* 调候和扶抑分别呈现。季节提示仅在本版能识别的条件下给候选。 */
(function (root) {
  'use strict';
  var exact = {
    戊亥: { stems:['甲','丙'], note:'《穷通宝鉴》亥月戊土，先看甲木疏土，再看丙火暖土。' },
    戊子: { stems:['丙','甲'], note:'《穷通宝鉴》子月戊土，以丙火为先，甲木为辅。' },
    戊丑: { stems:['丙','甲'], note:'《穷通宝鉴》丑月戊土，以丙火为先，甲木为辅。' },
    己寅: { stems:['丙'], note:'《穷通宝鉴》寅月己土，先看丙火是否能温解余寒。' },
    己卯: { stems:['甲','癸'], note:'《穷通宝鉴》卯月己土，先看甲木疏土，再看癸水润土。' },
    己辰: { stems:['丙','癸','甲'], note:'《穷通宝鉴》辰月己土，先丙后癸，再看甲木疏土。' }
  };

  function analyze(chart) {
    var month = chart.pillars[1].zhi;
    var entry = exact[chart.dayMaster.gan + month];
    var water = chart.counts['水'], fire = chart.counts['火'];
    var note, stems;
    if (entry) {
      stems = entry.stems;
      note = entry.note;
    } else if ('亥子丑'.includes(month) && water > fire) {
      stems = ['丙'];
      note = month + '月属冬，且本盘水权重高于火，可先查丙火是否透出或通根。';
    } else if ('巳午未'.includes(month) && fire > water) {
      stems = ['癸'];
      note = month + '月属夏，且本盘火权重高于水，可先查癸水是否透出或通根。';
    } else {
      stems = [];
      note = month + '月在本版没有明确的调候候选。可结合全盘寒暖、燥湿及相关五行是否有根再判断。';
    }
    var locations = stems.map(function (gan) {
      var exposed = [], hidden = [];
      chart.pillars.forEach(function (p) {
        if (p.gan === gan) exposed.push(p.label + '干');
        if (p.hide.includes(gan)) hidden.push(p.label + '支' + p.zhi);
      });
      return { gan:gan, evidence:(exposed.length ? '透于' + exposed.join('、') : '未透干') +
        (hidden.length ? '，藏于' + hidden.join('、') : '，四支未见同字藏干') };
    });
    var use = chart.favorable.use;
    var avoid = chart.favorable.avoid;
    var overlap = use.filter(function (el) { return avoid.includes(el); });
    var clear = use.filter(function (el) { return !overlap.includes(el); });
    return { source:entry ? '古籍对应月令' : '季节简化筛查', stems:locations, note:note,
      first:clear[0] || '', helpful:clear.slice(1), overlap:overlap,
      why:chart.favorable.why, strength:chart.strength.label };
  }
  var api = { analyze:analyze };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TianjiUseful = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
