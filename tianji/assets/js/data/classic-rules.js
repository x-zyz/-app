/* Reviewed conditions point to immutable spans of the shared offline corpus. */
(function () {
  'use strict';
  var Library = window.TianjiClassicLibrary;

  function pillar(index, field, expected, label) {
    return [label, function (chart) {
      var value = chart.pillars[index][field];
      return value ? value === expected : null;
    }];
  }
  function location(field, stem, label) {
    return [label, function (chart) {
      var values = chart.pillars.map(function (p) { return p[field]; });
      if (values.some(function (value) { return value && value.includes(stem); })) return true;
      return values.every(function (value) { return field === 'hide' ? Array.isArray(value) : !!value; }) ? false : null;
    }];
  }
  function relation(kind, pair, label) {
    return [label, function (chart) {
      return Array.isArray(chart.relations) ? chart.relations.some(function (item) {
        return item.kind === kind && item.pair === pair;
      }) : null;
    }];
  }

  var jiazi = [pillar(2,'gz','甲子','日柱为甲子'), pillar(3,'gz','甲子','时柱为甲子')];
  var wuHai = [pillar(2,'gan','戊','日干为戊'), pillar(1,'zhi','亥','月令为亥')];
  var showJia = location('gan','甲','甲木透干');
  var showBing = location('gan','丙','丙火透干');
  var hideJia = location('hide','甲','地支藏甲');
  var geng = location('hide','庚','地支见庚金');
  var rules = [
    {id:'ziping-method',type:'methodology',paragraph:'ziping/method/1',
      quote:'八字用神，專求月令，以日干配月令地支，而生克不同，格局分焉。', tags:['格局','月令']},
    {id:'wu-hai-method',type:'methodology',paragraph:'qiongtong/winter-wu/1',
      quote:'十月戊土，时值小阳，阳气略出，先用甲木，次取丙火。',tags:['调候','月令']},
    {id:'ditian-month-method',type:'methodology',paragraph:'ditian-commentary/source-月令/1',
      quote:'月令乃提綱之府，譬之宅也，人元為用事之神，宅之定向也，不可以不卜。',tags:['月令','旺衰']},
    {id:'sanming-clash-method',type:'methodology',paragraph:'sanming/source-冲击/1',
      quote:'地支取七位為沖，猶天干取七位為煞之義。',tags:['地支','六冲']},
    {id:'jiazi-you',type:'interpretation',paragraph:'sanming/time-甲甲子/甲子',
      quote:'酉月，只以正官格論，大貴。', tags:['正官格','正官'], group:'格局相关论断',
      required:jiazi.concat([pillar(1,'zhi','酉','月令为酉'), ['月令本气为正官', function (chart) {
        var gods = chart.pillars[1].shiShenZhi;
        return gods && gods[0] ? gods[0] === '正官' : null;
      }]]),
      explanation:'此书对甲子日、甲子时又逢酉月的这一特例按正官论，并给出古代的正面评价。'},
    {id:'jiazi-jiachen',type:'interpretation',paragraph:'sanming/time-甲甲子/甲子',
      quote:'甲辰月亦貴。', tags:['月柱','日时'], group:'命局结构论断',
      required:jiazi.concat([pillar(1,'gz','甲辰','月柱为甲辰')]),
      explanation:'同一甲子日、甲子时条目中，作者另外评价了月柱恰为甲辰的分支。'},
    {id:'jiazi-wu-clash',type:'interpretation',paragraph:'sanming/time-甲甲子/甲子',
      quote:'午月，甲死子沖，尤不吉。',tags:['日时','月令','子午冲'],group:'命局结构论断',
      required:jiazi.concat([pillar(1,'zhi','午','月令为午'),relation('冲','月日','已排出月支午冲日支子')]),
      explanation:'作者把午月的甲木状态与子午冲合在一起，作为此日时组合的不利分支。'},
    {id:'wu-hai-both-shown',type:'interpretation',paragraph:'qiongtong/winter-wu/1',
      quote:'甲丙两出，富贵中人。',tags:['调候','偏印','七杀'],group:'十神与透藏论断',
      required:wuHai.concat([showJia,showBing]),
      explanation:'这条以亥月戊土为前提。甲木、丙火同时透干时，原文作正面评价，理由来自本篇疏土与暖土的取法。'},
    {id:'wu-hai-hidden-jia',type:'interpretation',paragraph:'qiongtong/winter-wu/2',
      quote:'若不见庚金，甲木藏支，丙火高透，科甲有之。',tags:['调候','偏印','七杀'],group:'十神与透藏论断',
      required:wuHai.concat([hideJia,showBing]),
      exclude:[geng, location('gan','庚','天干见庚金'), showJia],
      explanation:'本篇另论甲藏支、丙透干、无庚的组合，以传统科举语汇评价。甲也透干时，改走本篇两透分支。'},
    {id:'wu-hai-rooted-water',type:'interpretation',paragraph:'qiongtong/winter-wu/1',
      quote:'或甲得长生，遇支藏得地之水，一丙高透，亦主身贵扬名。',tags:['调候','长生'],group:'命局结构论断',
      required:wuHai.concat([showBing,['甲得长生且支藏之水得地（原书条件尚未建立判定规则）',function () { return null; }]]),
      optional:[hideJia],
      explanation:'这是两透之外的另一分支，书中还要求甲得长生、支藏的水得地。'}
  ];

  function evaluate(rule, chart) {
    var met = [], missing = [], unverified = [];
    function inspect(check, excluded) {
      var result = check[1](chart);
      if (result == null) unverified.push((excluded ? '待排查：' : '') + check[0]);
      else if (excluded ? result : !result) missing.push((excluded ? '触发排除：' : '未满足：') + check[0]);
      else met.push((excluded ? '未见：' : '') + check[0]);
    }
    rule.required.forEach(function (check) { inspect(check, false); });
    (rule.exclude || []).forEach(function (check) { inspect(check, true); });
    var extra = (rule.optional || []).filter(function (check) { return check[1](chart) === true; });
    return {rule:rule, met:met, missing:missing, unverified:unverified,
      score:met.length + extra.length,
      status:missing.length ? 'reference' : unverified.length ? 'partial' : 'full'};
  }

  function match(chart) {
    var results = {full:[],partial:[],reference:[]};
    rules.forEach(function (rule) {
      if (rule.type !== 'interpretation') return;
      // Candidate gates are literal day and month/hour requirements from the source.
      var gate = rule.required.slice(0, 2);
      if (!gate.every(function (check) { return check[1](chart) === true; })) return;
      var result = evaluate(rule, chart);
      results[result.status].push(result);
    });
    Object.values(results).forEach(function (items) { items.sort(function (a,b) { return b.score - a.score; }); });
    return results;
  }

  rules.forEach(function (rule) {
    var paragraph = Library.paragraph(rule.paragraph);
    if (!paragraph || !paragraph.text.includes(rule.quote)) throw new Error('Invalid classic citation: ' + rule.id);
    rule.scope = paragraph.chapter.book.title === '三命通会' ?
      '限于《三命通会》本篇日时分支，不代替全盘格局成败判断。' :
      '限于《穷通宝鉴》本篇调候口径，不与其他流派的格局判法合并。';
  });
  window.TianjiClassicRules = {entries:rules, match:match, evaluate:evaluate, forParagraph:function (id) {
    return rules.filter(function (rule) { return rule.paragraph === id; });
  }};
}());
