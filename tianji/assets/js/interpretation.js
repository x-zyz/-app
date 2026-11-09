/* 天机 · 本命结构解读
 * 解释 Astro.chart 的输出。
 */
(function (root) {
  'use strict';

  var SEASON = { 寅: '孟春', 卯: '仲春', 辰: '季春', 巳: '孟夏', 午: '仲夏', 未: '季夏',
    申: '孟秋', 酉: '仲秋', 戌: '季秋', 亥: '孟冬', 子: '仲冬', 丑: '季冬' };
  var PRODUCES = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var CONTROLS = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  function describeRelation(relation) {
    return relation.text.replace(/\s+/g, '') + (relation.pair ? '（' + relation.pair.split('').join('、') + '柱）' : '');
  }

  function rankedRelations(relations) {
    function rank(relation) {
      if (!relation.pair) return 0;
      if (relation.pair.indexOf('月') >= 0) return 1;
      return relation.pair.indexOf('日') >= 0 ? 2 : 3;
    }
    return relations.slice().sort(function (a, b) { return rank(a) - rank(b); });
  }

  function elementRole(element, dayElement) {
    if (element === dayElement) return '同类帮身';
    if (PRODUCES[element] === dayElement) return '印星生扶';
    if (PRODUCES[dayElement] === element) return '食伤泄秀';
    if (CONTROLS[dayElement] === element) return '日主所克，为财星';
    return '官杀克制日主';
  }

  function analyze(chart) {
    var pillars = chart.pillars;
    var month = pillars[1];
    var day = chart.dayMaster;
    var nonDay = pillars.filter(function (pillar) { return !pillar.isDay; });
    var relations = rankedRelations(chart.relations);
    var use = chart.favorable.use;
    var avoid = chart.favorable.avoid;

    var monthMatches = month.hide.map(function (stem) {
      return nonDay.filter(function (pillar) { return pillar.gan === stem; });
    });
    var shownMonth = month.hide.filter(function (_, index) { return monthMatches[index].length; });
    var stemRoots = pillars.map(function (stemPillar) {
      return pillars.filter(function (branchPillar) { return branchPillar.hide.indexOf(stemPillar.gan) >= 0; });
    });
    var rootedStems = pillars.filter(function (_, index) { return stemRoots[index].length; });
    var useLocations = use.map(function (element) {
      var locations = [];
      pillars.forEach(function (pillar) {
        if (pillar.ganWx === element) locations.push(pillar.label + '干' + pillar.gan);
        if (pillar.zhiWx === element) locations.push(pillar.label + '支' + pillar.zhi);
        pillar.hide.forEach(function (stem) {
          if (root.Astro.GAN_WX[stem] === element) locations.push(pillar.label + '支藏' + stem);
        });
      });
      return locations;
    });
    var overlap = use.filter(function (element) { return avoid.indexOf(element) >= 0; });

    var mainHidden = month.hide[0];
    var supportElement = root.Astro.WX_ORDER.find(function (element) { return PRODUCES[element] === day.wx; });
    var supportPct = (100 * (chart.counts[day.wx] + chart.counts[supportElement]) / chart.total).toFixed(1);
    var shownMonthText = shownMonth.map(function (stem) {
      return stem + '见于' + monthMatches[month.hide.indexOf(stem)].map(function (pillar) {
        return pillar.label + '干';
      }).join('、');
    }).join('，');
    var dayRoots = stemRoots[2].map(function (pillar) { return pillar.label + '支' + pillar.zhi; });
    var stemText = nonDay.map(function (pillar) {
      return pillar.label + '干' + pillar.gan + '为' + pillar.shiShenGan;
    }).join('、');
    var useText = use.map(function (element, index) {
      var locations = useLocations[index];
      return element + '（' + elementRole(element, day.wx) + '）' + (locations.length
        ? '约占' + chart.pct[element] + '%，见于' + locations.slice(0, 3).join('、') + (locations.length > 3 ? '等处' : '')
        : '在干、支及藏干中均未出现');
    }).join('。');
    var union = relations.find(function (relation) { return ['三合', '三会', '合', '干合'].indexOf(relation.kind) >= 0; });
    var clash = relations.find(function (relation) { return ['冲', '干冲', '刑', '三刑', '害'].indexOf(relation.kind) >= 0; });
    var noteworthy = [union, clash].filter(Boolean);
    relations.forEach(function (relation) {
      if (noteworthy.length < 4 && noteworthy.indexOf(relation) < 0) noteworthy.push(relation);
    });
    var relationText = noteworthy.length
      ? '本盘可见' + noteworthy.map(describeRelation).join('、')
        + (relations.length > noteworthy.length ? '等 ' + relations.length + ' 项组合' : '')
        + '。' + (union && clash ? '合与冲刑害类线索可以并存，宜结合各自涉及的柱位阅读。' : '可结合月令与日柱查看这些组合的位置。')
        + (union ? '合局、干合等名称在这里用来标记组合，五行权重仍按原盘计算。' : '')
      : '按本盘列出的规则，四柱未形成刑、冲、合、害或三支组合。可从月令、透干与藏干看其结构。';

    var sections = [
      { title: '月令与旺衰', text: '日主' + day.gan + '为' + day.yy + day.wx + '。月令为' + month.zhi + '（' + SEASON[month.zhi]
        + '），本气' + mainHidden + '属' + month.zhiWx + '，相对日主为' + month.shiShenZhi[0]
        + '。综合天干、地支及藏干的加权五行，生扶项' + day.wx + '、' + supportElement
        + '约占' + supportPct + '%，本盘归为' + chart.strength.label + '。' },
      { title: '透干与藏干', text: stemText + '。' + month.zhi + '支藏' + month.hide.map(function (stem, index) {
        return stem + '（' + month.shiShenZhi[index] + '）';
      }).join('、') + '，' + (shownMonthText || '未见于年、月、时干') + '。'
        + (dayRoots.length ? '日主同字可在' + dayRoots.join('、') + '的藏干中找到。' : '日主同字在四支藏干中未见，可结合其他同类与印星看生扶。') },
      { title: '取用与制衡', text: '按本盘的简化取用规则，参考取' + use.join('、') + '，留意' + avoid.join('、') + '的比重。'
        + useText + '。' + (overlap.length ? overlap.join('、') + '兼具生扶作用且比重最高，所以取用与制衡两项都列出了它。' : '')
        + '这一步关注' + (chart.strength.label === '身弱' ? '日主可获得的生扶'
          : chart.strength.label === '身强' ? '生扶之外的泄、耗或制' : '已有生扶与比重较轻的五行') + '。' },
      { title: '四柱组合', text: relationText }
    ];

    var lens = {
      身强: ['给主动推进留反馈', '选一件你想推进的事，先做一个小版本。请一位信任的人给具体反馈，再决定下一步。'],
      身弱: ['先给任务找支点', '把本周最费力的一件事拆成一个能独立完成的小步骤，再列出一项可以求助或借用的资源。'],
      中和: ['给计划留出余量', '本周只选一件优先事项，并给它留一点缓冲时间。周末回看哪些安排顺手，哪些需要调整。']
    }[chart.strength.label];
    return {
      overview: [
        { title: '本命怎么看', text: day.gan + day.wx + '日主生于' + month.zhi + '月（' + SEASON[month.zhi] +
          '），月支本气' + mainHidden + '为' + month.shiShenZhi[0] + '。按本盘加权口径，日主归为' + chart.strength.label + '。' },
        { title: '哪里相助，哪里牵制', text:
          (dayRoots.length ? '日主在' + dayRoots.join('、') + '有同字藏干。' : '日主同字在四支藏干中未见，可结合印星与同类五行看生扶。') +
          (noteworthy.length ? '盘中可对照' + noteworthy.slice(0, 2).map(describeRelation).join('、') + '。其作用要结合所在柱位和月令。' : '') }
      ],
      evidence: [
        shownMonth.length ? '月支藏干透出：' + shownMonthText + '。' : '月支藏干在年、月、时干中未见同字。',
        rootedStems.length ? '见根天干：' + rootedStems.map(function (p) { return p.label + '干' + p.gan; }).join('、') + '。' : '四个天干在地支中均未见同字藏干。'
      ],
      advice: [
        { title: lens[0], text: lens[1] },
        clash ? { title: '先确认再回应', text: '把盘里的' + describeRelation(clash) + '当成复盘提示。沟通有分歧时，先复述对方的重点，再提出一个可以验证的下一步。' }
          : { title: '做一次轻量复盘', text: '每周留十分钟，记下一件顺手的事和一件卡住的事，从中挑一个小调整试一周。' }
      ],
      sections: sections
    };
  }

  root.TianjiInterpretation = { analyze: analyze };
})(typeof globalThis !== 'undefined' ? globalThis : this);
