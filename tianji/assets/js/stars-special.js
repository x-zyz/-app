(function () {
  'use strict';

  var sanming3 = 'https://zh.wikisource.org/wiki/三命通會/卷三';
  var sanming6 = 'https://zh.wikisource.org/wiki/三命通會/卷六';
  var chxb = 'https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js';
  var seasons = [
    { name:'春', branches:'寅卯辰', pardon:['戊寅'], waste:['庚申', '辛酉'] },
    { name:'夏', branches:'巳午未', pardon:['甲午'], waste:['壬子', '癸亥'] },
    { name:'秋', branches:'申酉戌', pardon:['戊申'], waste:['甲寅', '乙卯'] },
    { name:'冬', branches:'亥子丑', pardon:['甲子'], waste:['丙午', '丁巳'] }
  ];

  function byPillar(pairs, rule) {
    rule.match = function (ctx, target) {
      return pairs.includes(target.gz) ? [
        target.label + '柱' + target.gz + '在' + rule.name + '所列干支中（' + pairs.join('、') + '）。'
      ] : [];
    };
    return rule;
  }

  function bySeason(kind, rule) {
    rule.match = function (ctx, target) {
      var month = ctx.natal[1];
      var season = seasons.find(function (entry) { return month && entry.branches.includes(month.zhi); });
      if (!season || !season[kind].includes(target.gz)) return [];
      return [
        '本命月支' + month.zhi + '属' + season.name + '季（' + season.branches + '月）。',
        season.name + '季' + rule.name + '取' + season[kind].join('、') + '日，日柱为' + target.gz + '。'
      ];
    };
    return rule;
  }

  var stars = [
    byPillar(['庚辰', '壬辰', '戊戌', '庚戌'], {
      id:'kuigang', name:'魁罡', aliases:['魁罡日'], category:'格局', scope:'day',
      version:'《三命通会》四日表', source:sanming6 + '#魁罡', reference:'《三命通会》卷六·魁罡',
      description:'按日柱完整干支查四个魁罡日。古书另结合月令、财官和四柱重见讨论格局。',
      common:true
    }),
    byPillar(['乙丑', '己巳', '癸酉'], {
      id:'jinshen', name:'金神', aliases:[], category:'格局', scope:'day-hour',
      version:'近现代 chxb/shensha 日时查法', source:chxb + '#L521-L531', reference:'chxb/shensha · 金神（jinshen）',
      description:'日柱或时柱见乙丑、己巳、癸酉，标为金神。《三命通会》的金神格另查日干、时柱及月令等条件。',
      common:true
    }),
    byPillar(['甲辰', '乙亥', '丙辰', '丁酉', '戊午', '庚寅', '庚戌', '辛亥', '壬寅', '癸未'], {
      id:'ten-spirit-days', name:'十灵日', aliases:['十灵'], category:'才学', scope:'day',
      version:'近现代 chxb/shensha 十日表', source:chxb + '#L1255-L1272', reference:'chxb/shensha · 十灵日（shiling）',
      description:'按日柱完整干支查十个十灵日。传统解读常把十灵日与文章才艺联系起来。',
      common:false
    }),
    byPillar(['丙午', '丁未', '戊子', '戊午', '己丑', '己未'], {
      id:'six-elegance-days', name:'六秀日', aliases:['六秀'], category:'才学', scope:'day',
      version:'近现代流传表（Astral Nexus 所列）', source:'https://www.astralnex.com/wiki/zh-hans/bazi/fate-stars/six-elegance',
      reference:'Astral Nexus · 六秀对应哪六个日柱',
      description:'按日柱完整干支查六个六秀日。传统解读常把六秀日与才艺联系起来。',
      common:false
    }),
    bySeason('pardon', {
      id:'heavenly-pardon', name:'天赦', aliases:['天赦日'], category:'福德', scope:'day',
      version:'《三命通会》四季日表', source:sanming3 + '#論天月德', reference:'《三命通会》卷三·论天月德',
      description:'按本命月支定春夏秋冬，再核对该季天赦日的完整干支。',
      common:true
    }),
    byPillar(['甲寅', '乙巳', '丙午', '丁巳', '戊申', '戊午', '辛亥', '壬子'], {
      id:'guluan', name:'孤鸾', aliases:['孤鸾煞', '孤鸾寡鹊煞'], category:'关系', scope:'day',
      version:'《三命通会》八日表', source:sanming3 + '#總論諸神煞', reference:'《三命通会》卷三·总论诸神煞·孤鸾寡鹊煞',
      description:'按古书所列八个日柱查孤鸾，作为传统关系类标签。',
      common:false
    }),
    byPillar(['丙子', '丁丑', '戊寅', '辛卯', '壬辰', '癸巳', '丙午', '丁未', '戊申', '辛酉', '壬戌', '癸亥'], {
      id:'yin-yang-mismatch', name:'阴差阳错', aliases:['阴差阳错日', '阴阳差错', '阴阳差错煞'], category:'关系', scope:'day',
      version:'《三命通会》十二日表（日柱）', source:sanming3 + '#總論諸神煞', reference:'《三命通会》卷三·总论诸神煞·阴阳差错煞',
      description:'古书列出十二组干支，也提到月、日、时重见。这里记录日柱命中。',
      common:false
    }),
    bySeason('waste', {
      id:'four-wastes', name:'四废', aliases:['四废日', '正四废'], category:'杂曜', scope:'day',
      version:'《永乐大典》正四废表', source:'https://zh.wikisource.org/wiki/Page:永樂大典20122.pdf/4',
      reference:'《永乐大典》卷二〇一二二·正四废',
      description:'按本命月支分四季，各季核对两组正四废的日柱干支。',
      common:false
    }),
    byPillar(['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'], {
      id:'ten-great-defeats', name:'十恶大败', aliases:['十恶大败日'], category:'杂曜', scope:'day',
      version:'chxb/shensha 十日表（日柱）', source:chxb + '#L1145-L1170', reference:'chxb/shensha · 十恶大败（shiedabai）',
      description:'按日柱完整干支查十恶大败。此表采用己丑，对应日干的禄支落在本旬空亡。',
      common:false
    }),
    byPillar(['乙卯', '戊子', '戊午', '己卯', '己酉', '辛卯', '辛酉', '壬子', '壬午'], {
      id:'nine-uglies', name:'九丑', aliases:['九丑日'], category:'关系', scope:'day',
      version:'《三命通会》九日表（乙卯本）', source:sanming3 + '#總論諸神煞', reference:'《三命通会》卷三·总论诸神煞·淫欲妨害煞',
      description:'按《三命通会》所列九组日柱查九丑。该版本列乙卯，另有流传版本用丁酉。',
      common:false
    })
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = stars;
  if (typeof window !== 'undefined') window.TianjiSpecialStars = stars;
})();
