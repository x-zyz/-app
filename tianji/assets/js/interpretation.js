/* 天机 · 本命结构解读
 * 解释 Astro.chart 的输出，古籍摘录仅用于说明传统读盘术语。
 */
(function (root) {
  'use strict';

  var SEASON = { 寅: '孟春', 卯: '仲春', 辰: '季春', 巳: '孟夏', 午: '仲夏', 未: '季夏',
    申: '孟秋', 酉: '仲秋', 戌: '季秋', 亥: '孟冬', 子: '仲冬', 丑: '季冬' };
  var PRODUCES = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var CONTROLS = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  var DI_TIAN_SUI = 'https://zh.wikisource.org/zh-hant/滴天髓闡微';
  var SAN_MING = 'https://zh.wikisource.org/zh-hant/三命通會/卷二';
  var STEM_LINES = {
    甲: '甲木參天', 乙: '乙木雖柔', 丙: '丙火猛烈', 丁: '丁火柔中', 戊: '戊土固重',
    己: '己土卑濕', 庚: '庚金帶煞', 辛: '辛金軟弱', 壬: '壬水通河', 癸: '癸水至弱'
  };
  var SAN_MING_FIVE = 'https://zh.wikisource.org/zh-hant/三命通會_(四庫全書本)/卷05';

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
    var foundUse = useLocations.filter(function (locations) { return locations.length; }).length;
    var overlap = use.filter(function (element) { return avoid.indexOf(element) >= 0; });
    // 每对柱只计一次。三支组合覆盖其成员之间的柱对。
    var linkedPairs = [];
    pillars.forEach(function (first, firstIndex) {
      pillars.slice(firstIndex + 1).forEach(function (second) {
        var pair = first.label + second.label;
        var linked = relations.some(function (relation) {
          if (relation.pair) return relation.pair === pair;
          var group = relation.text.split(' ')[0];
          return first.zhi !== second.zhi && group.indexOf(first.zhi) >= 0 && group.indexOf(second.zhi) >= 0;
        });
        if (linked) linkedPairs.push(pair);
      });
    });

    var factors = [
      { label: '月令透干', value: Math.round(30 * shownMonth.length / month.hide.length), max: 30,
        detail: month.zhi + '支藏干有 ' + shownMonth.length + '/' + month.hide.length + ' 见于年、月、时干'
          + (shownMonth.length ? '（' + shownMonth.join('、') + '）' : '') + '，按比例计分。' },
      { label: '天干见根', value: Math.round(25 * rootedStems.length / 4), max: 25,
        detail: '四处天干中有 ' + rootedStems.length + '/4 可在地支找到同字藏干'
          + (rootedStems.length ? '（' + rootedStems.map(function (pillar) { return pillar.label + '干' + pillar.gan; }).join('、') + '）' : '') + '，按比例计分。' },
      { label: '取用落点', value: Math.round(25 * foundUse / use.length), max: 25,
        detail: '参考取用的' + use.join('、') + '中，有 ' + foundUse + '/' + use.length + ' 项见于干、支或藏干，按比例计分。' },
      { label: '跨柱关联', value: Math.round(20 * linkedPairs.length / 6), max: 20,
        detail: '六对柱中有 ' + linkedPairs.length + '/6 对存在干支组合'
          + (linkedPairs.length ? '（' + linkedPairs.join('、') + '）' : '') + '，各类组合等权，同一柱对只计一次。' }
    ];

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

    var earthInColdSeason = day.gan === '戊' && '申酉戌亥子丑'.includes(month.zhi);
    var classics = [{
      title: '滴天髓阐微',
      section: earthInColdSeason ? '通神论 · 天干 · 戊土任注' : '通神论 · 天干 · ' + day.gan,
      quote: earthInColdSeason ? '生於秋冬，水多宜火暖之' : STEM_LINES[day.gan],
      reason: earthInColdSeason ?
        '本盘为戊土日主，生于' + month.zhi + '月（' + SEASON[month.zhi] + '）。盘中水约占' +
        chart.pct['水'] + '%，火约占' + chart.pct['火'] + '%。古籍这句带有水多的条件，可与本盘火水分布对读。' :
        '本盘日干为' + day.gan + '，对应本篇同一日干的段落。' + day.wx +
        '在本盘加权约占' + chart.pct[day.wx] + '%，月令为' + month.zhi + '（' + SEASON[month.zhi] + '）。',
      url: DI_TIAN_SUI + '#七、天干'
    }, {
      title: '滴天髓阐微', section: '通神论 · 月令', quote: '月令乃提綱之府',
      reason: '本盘从' + month.zhi + '月（' + SEASON[month.zhi] + '）入手，再看月支本气' + mainHidden + '和全盘的生扶比例。',
      url: DI_TIAN_SUI + '#十五、月令'
    }];
    var middle = chart.strength.label === '中和';
    classics.push({
      title: '滴天髓阐微', section: middle ? '通神论 · 中和' : '通神论 · 衰旺原注',
      quote: middle ? '既識中和之正理' : chart.strength.label === '身强' ? '旺則宜泄宜傷' : '衰則喜幫喜助',
      reason: '本盘生扶约占' + supportPct + '%，读作' + chart.strength.label + '。这段文字对应取用时所观察的'
        + (middle ? '相对均衡' : chart.strength.label === '身强' ? '泄耗与制衡' : '生扶') + '。',
      url: DI_TIAN_SUI + (middle ? '#十八、中和' : '#十七、衰旺')
    });

    var triple = relations.find(function (relation) { return relation.kind === '三合'; });
    var branchClash = relations.find(function (relation) { return relation.kind === '冲'; });
    var branchUnion = relations.find(function (relation) { return relation.kind === '合'; });
    if (triple) {
      classics.push({ title: '三命通会', section: '卷二 · 论支元三合', quote: '若三字缺一則化不成局',
        reason: '本盘见' + describeRelation(triple) + '，三支齐备，对应书中核对三字的条件。成局后的五行变化另有细则。',
        url: SAN_MING + '#論支元三合' });
    } else if (branchClash) {
      classics.push({ title: '三命通会', section: '卷二 · 论冲击', quote: '地支取七位為沖',
        reason: '本盘见' + describeRelation(branchClash) + '，两支按地支顺序从起支数到第七位，对应相冲的排法。',
        url: SAN_MING + '#論衝擊' });
    } else if (branchUnion) {
      classics.push({ title: '三命通会', section: '卷二 · 论支元六合', quote: '夫合者，和也',
        reason: '本盘见' + describeRelation(branchUnion) + '，对应本篇所列的地支六合配对。',
        url: SAN_MING + '#論支元六合' });
    } else {
      classics.push({ title: '三命通会', section: '四库本卷五 · 论古人立印食官财名义', quote: '今指甲乙為例以日干論',
        reason: '书中以甲乙为例说明以日干为参照的读法。本盘以' + day.gan + '为参照，排出' + stemText + '。',
        url: SAN_MING_FIVE });
    }

    return {
      score: factors.reduce(function (sum, factor) { return sum + factor.value; }, 0),
      factors: factors,
      sections: sections,
      classics: classics
    };
  }

  root.TianjiInterpretation = { analyze: analyze };
})(typeof globalThis !== 'undefined' ? globalThis : this);
