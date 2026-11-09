/* Public-domain excerpts, with Tianji's own modern-Chinese explanations. */
(function () {
  'use strict';
  var stemSource = 'https://zh.wikisource.org/wiki/滴天髓#天干論';
  var stems = {
    甲:['甲木參天，脱胎要火，春不容金，秋不容土。','以大树比喻甲木，先看它生于什么季节，再看火、金、土分别起什么作用。'],
    乙:['乙木雖柔，刲羊解牛，懷丁抱丙，跨雞乘猴。','乙木取柔木之象。原文以丑未指土、申酉指金，提出见丙丁时要重新看整体配合。'],
    丙:['丙火猛烈，欺霜侮雪，能煆庚金，逄辛反怯。','丙火取烈火之象。遇庚是火克金，遇辛还涉及丙辛相合，关系不能一概而论。'],
    丁:['丁火柔中，內性昭融，抱乙而考，合壬而忠。','丁火取温火之象。这里以乙木生丁、丁壬相合说明它和其他天干的关系。'],
    戊:['戊土固重，既中且正，靜翕動闢，萬物司命，水旺物生，火燥囍潤，若在坤艮，怕沖宜靜。','以厚土比喻戊，侧重寒暖燥湿。火旺而土燥时看有没有水润土，支位还要结合全盘冲合。'],
    己:['己土卑濕，中正蓄藏，不愁木盛，不畏水旺。','己土取田园湿土之象，强调承载和蓄藏。木、水的作用要从组合看。'],
    庚:['庚金帶煞，剛強為最，得水而清，得火而銳。','庚金取刚金之象。水泄金、火炼金，都是观察刚性如何得到调节的角度。'],
    辛:['辛金軟弱，溫潤而清，畏土之疊，樂水之盈。','辛金取柔金之象。土叠有埋金之意，水可泄金，但仍要结合季节与全盘。'],
    壬:['壬水汪洋，能洩金氣，剛中之德，周流不滯。','壬水取江河之象。金生水时，水也承接并疏泄金气。'],
    癸:['癸水至弱，達於天津，龍德而運，功化斯神。','癸水取细水之象。原文强调细水仍可借其他干支发挥作用。']
  };
  var month = ['子平真诠','卷二 · 论用神','八字用神，專求月令，以日干配月令地支，而生克不同，格局分焉。',
    '先把日干与月支对照，以月令当旺之气为分析起点，再看其他干支的配合。这里的格局取用与调候有各自的着眼点。',
    'https://upload.wikimedia.org/wikipedia/commons/d/d5/NLC416-13jh002326-46443_淵海子平_子平真詮_第2卷.pdf'];
  var tone = ['五行精纪','卷一 · 论六甲纳音法','七金三是火，九木一中央，得五皆為水，納音宜審詳。',
    '这段歌诀说明古籍如何把纳音计算结果配入五行。纳音按整组干支取，与天干、地支分别所属的五行是两套口径。',
    'https://zh.wikisource.org/wiki/五行精紀#論六甲納音法'];
  var balance = ['神峰通考','张楠叙','日為身主，月為巢穴，歲與時為門戶，得於此而不遺於彼，通於上而不遺於下，抑有餘，補不足。',
    '日干作为参照，月令提供季节背景，年、时也应纳入全盘。文中的抑补强调结合各柱看偏盛和不足。',
    'https://zh.wikisource.org/zh-hant/神峰通考'];
  function stem(gan) {
    var entry = stems[gan];
    return ['滴天髓','天干论 · ' + gan,entry[0],entry[1],stemSource];
  }
  function entry(item, context) {
    var lore = window.TianjiLore;
    return '<article class="classic-case">' + (context ? lore.section('本盘对照', context) : '') +
      lore.reader('《' + item[0] + '》· ' + item[1], item[2], item[3]) +
      '<p class="tiny pro-source">底本：' + item[4] + '</p></article>';
  }
  function shelf() {
    return [month, tone, balance, stem('甲')].map(function (item) {
      var content = item[0] === '滴天髓' ? Object.keys(stems).map(function (gan) {
        return entry(stem(gan));
      }).join('') : entry(item);
      return '<details><summary>《' + item[0] + '》</summary>' + content + '</details>';
    }).join('');
  }
  function forChart(chart) {
    var day = chart.pillars[2], monthly = chart.pillars[1];
    return entry(stem(day.gan), '你的日主是' + day.gan + '，月柱为' + monthly.gz + '，对应《滴天髓》的' + day.gan + '干条。') +
      entry(month, '日干' + day.gan + '，月令' + monthly.zhi + '；月支藏干为' + monthly.hide.join('、') + '。') +
      entry(tone, '本盘四柱纳音依次为' + chart.pillars.map(function (pillar) { return pillar.nayin; }).join('、') + '。') +
      entry(balance, '以' + day.gz + '日柱为身主，结合' + monthly.gz + '月柱、' + chart.pillars[0].gz + '年柱和' + chart.pillars[3].gz + '时柱看配合。');
  }
  window.TianjiClassicLibrary = {shelf:shelf, forChart:forChart};
}());
