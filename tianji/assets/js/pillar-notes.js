/* 日时条文与四柱格子解读 */
(function () {
  'use strict';
  var A = window.Astro;
  var stages = {
    长生:'气开始生发', 沐浴:'初生而尚未稳定，古书也称败', 冠带:'形态渐成',
    临官:'力量成熟，常与禄位相对照', 帝旺:'气势达到高点', 衰:'由盛转弱',
    病:'气势进一步减弱', 死:'这一轮的气势衰尽', 墓:'气收敛入库',
    绝:'上一轮气机止息', 胎:'新一轮开始孕育', 养:'生发前蓄养'
  };
  var images = {
    海中金:'藏在海中的金', 炉中火:'炉中聚集的火', 大林木:'林中成片的树木',
    路旁土:'路旁承载往来的土', 剑锋金:'已经磨成锋刃的金', 山头火:'山头远望可见的火',
    涧下水:'山涧中流动的水', 城头土:'筑成城墙的土', 白蜡金:'以白蜡形容初成的金',
    杨柳木:'柔韧的杨柳', 泉中水:'由泉眼涌出的水', 屋上土:'用于屋顶瓦面的土',
    霹雳火:'雷电迅疾的火象', 松柏木:'四季常青的松柏', 长流水:'绵延流动的水',
    沙中金:'从砂中筛出的金', 山下火:'山脚近地的火', 平地木:'平地生长的草木',
    壁上土:'用于墙壁的土', 金箔金:'展成薄片的金', 覆灯火:'灯盏里聚光的火',
    天河水:'天河与降雨的水象', 大驿土:'驿道上广阔的土', 钗钏金:'制成首饰的金',
    桑柘木:'桑树和柘树', 大溪水:'溪谷中奔流的水', 沙中土:'疏松的砂土',
    天上火:'日光等高悬的火象', 石榴木:'石榴一类的树木', 大海水:'汇聚百川的海水'
  };
  var labels = { stage:'星运', seat:'自坐', void:'空亡', tone:'纳音' };
  var seasons = {寅:'春',卯:'春',辰:'春',巳:'夏',午:'夏',未:'夏',申:'秋',酉:'秋',戌:'秋',亥:'冬',子:'冬',丑:'冬'};
  function esc(value) {
    return String(value || '').replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function value(c, i, type) {
    var p = c.pillars[i];
    return { stage:c.dayStages[i], seat:c.changSheng[i], void:A.xunKong(p.gz).join(''), tone:p.nayin }[type];
  }
  function cell(c, i, type) {
    var text = value(c, i, type);
    return '<button class="pillar-explain" data-pillar-note="' + type + '" data-pillar-index="' + i +
      '" aria-label="' + c.pillars[i].label + '柱' + labels[type] + ' ' + esc(text) + '">' + esc(text) + '</button>';
  }
  var glossary = {
    stage: ['星运是本盘各柱地支相对于日主所处的十二长生阶段。',
      '先找日干，再用这个日干分别查年、月、日、时的地支。同一个日干贯穿四列。',
      '例如日干是甲、月支是亥，月柱星运就是长生。'],
    seat: ['自坐是某一柱的天干相对于自己地支所处的十二长生阶段。',
      '逐柱拿本柱天干查本柱地支。日柱的星运和自坐用的是同一个日干，所以日柱两项相同。',
      '例如月柱是乙亥，自坐用乙查亥，为死。若日干是甲，月柱星运则用甲查亥，为长生。这里的「死」是阶段名。'],
    void: ['空亡也叫旬空。六十甲子分六旬，每旬十组干支，有两个地支在这一旬里没有配到天干。',
      '表格逐柱按该柱干支查出两个空支。神煞行则另以日柱的空支，查哪些本命地支命中。',
      '例如甲子旬从甲子排到癸酉，剩下戌、亥，所以甲子旬空戌亥。'],
    tone: ['纳音是六十甲子的一套传统五行分类。每相邻两组干支共用一个名称。',
      '按整组干支查纳音表。命盘五行比例则按天干、地支和藏干加权。',
      '例如戊午、己未同属天上火，即使己是土、未也是土，己未的纳音仍叫天上火。']
  };

  function label(type) {
    return '<button class="pillar-term" data-pillar-term="' + type + '" aria-label="查看' +
      labels[type] + '词条">' + labels[type] + '</button>';
  }

  function termDetail(type) {
    var text = glossary[type], lore = window.TianjiLore;
    return '<div class="sheet-hd"><span class="t">' + labels[type] +
      '</span><button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
      '<div class="explain-body">' + lore.section('是什么意思', text[0]) + lore.section('怎么查', text[1]) +
      lore.section('举个例子', text[2]) + '<p class="tiny">点这一行右侧各柱的数值，可看本盘的具体解释。</p></div>';
  }

  function detail(c, i, type) {
    var p = c.pillars[i], text = value(c, i, type), body;
    if (type === 'stage' || type === 'seat') {
      var stem = type === 'stage' ? c.dayMaster.gan : p.gan;
      body = (type === 'stage' ? '以本命日干' : '以本柱天干') + stem + '对照' + p.label + '支' + p.zhi +
        '，在十二长生中为「' + text + '」，传统指' + stages[text] + '。这些名称描述气势阶段。';
    } else if (type === 'void') {
      var start = A.ZHI_LABEL[(A.ZHI_LABEL.indexOf(p.zhi) - '甲乙丙丁戊己庚辛壬癸'.indexOf(p.gan) + 12) % 12];
      var hits = c.pillars.filter(function (q) { return text.includes(q.zhi); }).map(function (q) { return q.label + '支' + q.zhi; });
      body = p.gz + '属甲' + start + '旬。这一旬十组干支没有配到' + text.split('').join('、') + '，所以列为旬空。' +
        (hits.length ? '以这一柱起查，本盘命中' + hits.join('、') + '。' : '以这一柱起查，四个本命地支均未落入这两个空支。') +
        '神煞列表的「空亡」采用日柱起查。';
    } else {
      var companions = [];
      var stems = '甲乙丙丁戊己庚辛壬癸', branches = A.ZHI_LABEL;
      for (var j = 0; j < 60; j++) {
        var gz = stems[j % 10] + branches[j % 12];
        if (gz === p.gz) {
          var other = j % 2 ? j - 1 : j + 1;
          companions.push(stems[other % 10] + branches[other % 12]);
          break;
        }
      }
      body = p.gz + '与' + companions[0] + '同属「' + text + '」，古法借' +
        (images[text] || text) + '取象。这里显示的是整组干支的纳音，五行比例按实际干、支和藏干计算。';
    }
    var lore = window.TianjiLore;
    var original = type === 'tone' && text === '天上火' ? lore.reader('《三命通会》卷一 · 天上火',
      '天上火者，溫暖山海，輝光宇宙。戊午為太陽則剛，己未為太陰則柔。',
      '古书借日月的光热形容这种纳音。戊午借太阳取象，偏刚；己未借月亮取象，偏柔。') : '';
    return '<div class="sheet-hd"><span class="t">' + p.label + '柱' + labels[type] + ' · ' +
      esc(text) + '</span><button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
      '<div class="explain-body">' + lore.section('本盘提要', p.label + '柱' + p.gz + '，' + labels[type] + '为' + text + '。') +
      lore.section('查法与解释', body) + original + '</div>';
  }

  function seasonalReading(c) {
    var day = c.pillars[2], month = c.pillars[1];
    if (day.gan !== '戊' || month.zhi !== '亥') return '';
    function placement(gan) {
      var exposed = c.pillars.filter(function (p) { return p.gan === gan; }).map(function (p) { return p.label + '干'; });
      var hidden = c.pillars.filter(function (p) { return p.hide.includes(gan); }).map(function (p) { return p.label + '支' + p.zhi; });
      return gan + '：' + (exposed.length ? '透于' + exposed.join('、') : '未透干') +
        (hidden.length ? '，藏于' + hidden.join('、') : '，四支未藏');
    }
    var lore = window.TianjiLore;
    return '<article class="classic-case"><h3>论戊生亥月</h3>' +
      lore.section('本盘对照', '戊日主、亥月，匹配本条。' + placement('甲') + '；' + placement('丙') + '。') +
      lore.reader('《穷通宝鉴》· 三冬戊土',
        '十月戊土，时值小阳，阳气略出，先用甲木，次取丙火。非甲、土不灵。非丙、土不暖，安能生发万物。',
        '戊土生在亥月，古书先看甲木能否疏土，再看丙火能否暖土。盘里出现甲或丙，还要区分它是露在天干，还是藏在地支。') + '</article>';
  }

  function caseReading(c) {
    var day = c.pillars[2], hour = c.pillars[3], month = c.pillars[1];
    var entry = window.TianjiClassicCases[day.gan + hour.gz];
    if (!entry) return '';
    var exact = entry.rows[day.gz];
    var lines = (exact || entry.intro).match(/[^。！？]+[。！？]?/g) || [];
    // Only positively stated, leading month/season clauses qualify as candidates.
    var seasonal = lines.filter(function (line) {
      var part = line.replace(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]時，/, '');
      var m = part.match(/^(?:若|如|生於)?([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]|[子丑寅卯辰巳午未申酉戌亥]+)月[，、：；]/);
      var season = part.match(/^([春夏秋冬]+)[，、：；]/);
      return (m && (m[1] === month.gz || m[1].includes(month.zhi) && !/^[甲乙丙丁戊己庚辛壬癸]/.test(m[1]))) ||
        (season && season[1].includes(seasons[month.zhi]));
    });
    var quote = seasonal[0] || lines.slice(0, 2).join('');
    var translated = quote.replace(/富貴|大貴|貴顯/g, '富足或显达').replace(/行北運/g, '行偏北方水气的大运')
      .replace(/身旺/g, '日主有力').replace(/身弱/g, '日主偏弱').replace(/印綬/g, '印星')
      .replace(/歲運/g, '大运与流年').replace(/時/g, '时').replace(/貴/g, '显达').replace(/無/g,'无');
    var note = '本盘为' + day.gz + '日、' + hour.gz + '时，月柱' + month.gz + '（' + seasons[month.zhi] + '季）。' +
      (exact ? '原文有相同日柱与时柱的分条。' : '当前底本匹配到同日干、同时柱的总论。') +
      (seasonal.length ? '引文中的月令或季节与本盘相符。句中若另提年柱、组合或行运，还需逐项核对。' :
      '本条仍须连同原文中的年月、干支及行运条件阅读。');
    return seasonalReading(c) + '<article class="classic-case"><h3>三命通会 <small>卷' + entry.volume + ' · ' + esc(entry.title) +
      '</small></h3><p>' + esc(note) + '</p>' +
      window.TianjiLore.reader('对应引文', quote, translated !== quote ? translated : '') +
      '<details><summary>展开对应条文</summary><p>' + esc(exact || entry.intro) + '</p></details>' +
      '<p class="tiny">古籍条文使用当时的术语与社会背景，原有论断可作为传统文本来读。</p></article>';
  }
  window.TianjiPillarNotes = {cell:cell,detail:detail,label:label,termDetail:termDetail,caseReading:caseReading};
}());
