/* 天机 · 命理引擎
 * 依赖 lunar.js（历法/节气/八字/宜忌）
 */
(function (root) {
  'use strict';

  var L;
  if (typeof module !== 'undefined' && module.exports) { L = require('./vendor/lunar.js'); }
  else { L = { Solar: root.Solar, Lunar: root.Lunar, LunarUtil: root.LunarUtil }; }

  var Stars = typeof module !== 'undefined' && module.exports ? require('./stars.js') : root.TianjiStars;

  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var ZHI_HOUR = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  var ZHI_LABEL = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var ZHI_RANGE = ['23-01', '01-03', '03-05', '05-07', '07-09', '09-11', '11-13', '13-15', '15-17', '17-19', '19-21', '21-23'];

  var GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var ZHI_WX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  var GAN_YY = { 甲: '阳', 乙: '阴', 丙: '阳', 丁: '阴', 戊: '阳', 己: '阴', 庚: '阳', 辛: '阴', 壬: '阳', 癸: '阴' };

  var WX_ORDER = ['木', '火', '土', '金', '水'];
  var WX_SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };   // 我生
  var WX_KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };       // 我克
  var SHENG_WX = { 火: '木', 土: '火', 金: '土', 水: '金', 木: '水' };   // 生我
  var KE_WX = { 木: '金', 火: '水', 土: '木', 金: '火', 水: '土' };       // 克我

  var WX_COLOR = {
    木: { name: '青碧', hex: '#6FA37E' },
    火: { name: '朱砂', hex: '#C25B4A' },
    土: { name: '赭黄', hex: '#C9A461' },
    金: { name: '素白', hex: '#D8D5CC' },
    水: { name: '玄青', hex: '#5B7C99' }
  };
  var WX_NUM = { 木: [3, 8], 火: [2, 7], 土: [5, 10], 金: [4, 9], 水: [1, 6] };
  var WX_DIR = { 木: '东', 火: '南', 土: '中', 金: '西', 水: '北' };

  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 十神：以日干为我
  function shiShen(dayGan, otherGan) {
    var me = GAN_WX[dayGan], ot = GAN_WX[otherGan];
    var same = GAN_YY[dayGan] === GAN_YY[otherGan];
    if (me === ot) return same ? '比肩' : '劫财';
    if (WX_SHENG[me] === ot) return same ? '食神' : '伤官';
    if (WX_KE[me] === ot) return same ? '偏财' : '正财';
    if (KE_WX[me] === ot) return same ? '七杀' : '正官';
    if (SHENG_WX[me] === ot) return same ? '偏印' : '正印';
    return '比肩';
  }

  function pillar(label, ganZhi, hide, nayin, shiShenGan, shiShenZhi) {
    var gan = ganZhi[0], zhi = ganZhi[1];
    return {
      label: label,
      gan: gan, zhi: zhi, gz: ganZhi,
      ganWx: GAN_WX[gan], zhiWx: ZHI_WX[zhi],
      hide: hide || [],
      nayin: nayin || '',
      shiShenGan: shiShenGan || '',
      shiShenZhi: shiShenZhi || [],
      isDay: label === '日'
    };
  }

  function chart(birth) {
    var corrected = birth.city ? root.TianjiSolar.correct(birth) : null;
    var clock = corrected || (birth.instant ? birth : {
      y: birth.y, m: birth.m, d: birth.d, hour: ZHI_HOUR[birth.zhi], minute: 30, second: 0
    });
    var solar = L.Solar.fromYmdHms(clock.y, clock.m, clock.d, clock.hour, clock.minute, clock.second);
    var lunar = solar.getLunar();
    var ec = lunar.getEightChar();
    // The ephemeris in lunar.js expresses solar terms in UTC+08:00.
    // Use the physical birth instant for year, month and 起运, and the
    // apparent solar clock at the birthplace for the day and hour pillars.
    var terms = lunar;
    if (corrected || birth.instant) {
      var china = new Date((corrected ? corrected.utcMillis : birth.instant) + 8 * 3600000);
      terms = L.Solar.fromYmdHms(china.getUTCFullYear(), china.getUTCMonth() + 1, china.getUTCDate(),
        china.getUTCHours(), china.getUTCMinutes(), china.getUTCSeconds()).getLunar();
    }
    var termsEC = terms.getEightChar();

    function fromTerms(label, gz, hidden, nayin) {
      var day = ec.getDayGan();
      return pillar(label, gz, hidden, nayin, shiShen(day, gz[0]),
        hidden.map(function (gan) { return shiShen(day, gan); }));
    }

    var pillars = [
      fromTerms('年', termsEC.getYear(), termsEC.getYearHideGan(), termsEC.getYearNaYin()),
      fromTerms('月', termsEC.getMonth(), termsEC.getMonthHideGan(), termsEC.getMonthNaYin()),
      pillar('日', ec.getDay(), ec.getDayHideGan(), ec.getDayNaYin(), '日主', ec.getDayShiShenZhi()),
      pillar('时', ec.getTime(), ec.getTimeHideGan(), ec.getTimeNaYin(), ec.getTimeShiShenGan(), ec.getTimeShiShenZhi())
    ];

    var dayGan = pillars[2].gan;
    var dayWx = GAN_WX[dayGan];

    // 五行权重：月令最重
    var w = { 年: 1, 月: 1.35, 日: 1.1, 时: 1 };
    var counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    pillars.forEach(function (p) {
      var k = w[p.label];
      var zk = p.label === '月' ? 2.2 : k * 1.15;
      counts[p.ganWx] += k;
      counts[p.zhiWx] += zk;
      (p.hide || []).forEach(function (h, i) {
        counts[GAN_WX[h]] += (i === 0 ? 0.35 : 0.15) * k;
      });
    });

    var total = 0;
    WX_ORDER.forEach(function (k) { total += counts[k]; });
    var pct = {};
    WX_ORDER.forEach(function (k) { pct[k] = Math.round((counts[k] / total) * 1000) / 10; });

    var support = counts[dayWx] + counts[SHENG_WX[dayWx]];
    var drain = counts[WX_SHENG[dayWx]] + counts[WX_KE[dayWx]] + counts[KE_WX[dayWx]];
    var ratio = support / (support + drain);
    var label, verdict;
    if (ratio >= 0.56) { label = '身强'; verdict = '日主得势，元气充盈'; }
    else if (ratio <= 0.44) { label = '身弱'; verdict = '日主失势，宜扶宜助'; }
    else { label = '中和'; verdict = '日主中和，五行流通'; }

    var use, avoid, why;
    if (label === '身弱') {
      use = [SHENG_WX[dayWx], dayWx];
      avoid = [WX_KE[dayWx], WX_SHENG[dayWx]];
      why = '喜印比生扶，忌财官食伤过度耗泄';
    } else if (label === '身强') {
      var cands = [WX_SHENG[dayWx], WX_KE[dayWx], KE_WX[dayWx]];
      cands.sort(function (a, b) { return counts[a] - counts[b]; });
      use = [cands[0], cands[1]];
      avoid = [dayWx, SHENG_WX[dayWx]];
      why = '喜食伤财官泄秀，忌比劫印星再助';
    } else {
      var weak = WX_ORDER.slice().sort(function (a, b) { return counts[a] - counts[b]; })[0];
      use = [weak, SHENG_WX[dayWx]];
      avoid = [WX_ORDER.slice().sort(function (a, b) { return counts[b] - counts[a]; })[0]];
      why = '五行贵在流通，补其不足者';
    }
    use = use.filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    avoid = avoid.filter(function (v, i, arr) { return arr.indexOf(v) === i; });

    var missing = WX_ORDER.filter(function (k) { return counts[k] < 0.9; });

    var yun = null;
    if (!birth.instant) try {
      var y = termsEC.getYun(birth.gender === 'f' ? 0 : 1);
      var list = y.getDaYun().filter(function (d) { return d.getGanZhi(); }).slice(0, 10);
      yun = {
        startYear: y.getStartYear(),
        startMonth: y.getStartMonth(),
        startDay: y.getStartDay(),
        list: list.map(function (d) {
          var gz = d.getGanZhi();
          return {
            gz: gz, start: d.getStartYear(), end: d.getEndYear(), age: d.getStartAge(),
            ss: shiShen(dayGan, gz[0]), stage: changSheng(dayGan, gz[1])
          };
        })
      };
    } catch (e) { /* ignore */ }

    var jq = null;
    try {
      var prev = terms.getPrevJieQi();
      var next = terms.getNextJieQi();
      jq = {
        prev: prev.getName(), prevDate: prev.getSolar().toYmd(),
        next: next.getName(), nextDate: next.getSolar().toYmd()
      };
    } catch (e) { /* ignore */ }

    // These two library calculations use year/month and hour, but never day.
    var timeZhi = ec.getTimeZhi();
    termsEC.getTimeZhi = function () { return timeZhi; };
    return {
      solar: { y: clock.y, m: clock.m, d: clock.d, zhi: ZHI.indexOf(pillars[3].zhi) },
      corrected: corrected,
      lunar: {
        text: lunar.toString(),
        year: lunar.getYearInGanZhi(),
        month: lunar.getMonthInChinese() + '月',
        day: lunar.getDayInChinese(),
        shengxiao: lunar.getYearShengXiao()
      },
      xingzuo: solar.getXingZuo(),
      pillars: pillars,
      dayMaster: { gan: dayGan, wx: dayWx, yy: GAN_YY[dayGan] },
      counts: counts, pct: pct, total: total,
      strength: { label: label, ratio: Math.round(ratio * 100) / 100, verdict: verdict },
      favorable: { use: use, avoid: avoid, why: why },
      missing: missing,
      taiYuan: termsEC.getTaiYuan(),
      mingGong: termsEC.getMingGong(),
      shenGong: termsEC.getShenGong(),
      gender: birth.gender,
      shenSha: Stars.evaluate({ natal:pillars, gender:birth.gender, scope:'natal' }, pillars),
      relations: relations(pillars),
      kong: xunKong(pillars[2].gz),
      changSheng: pillars.map(function (p) { return changSheng(p.gan, p.zhi); }),
      dayStages: pillars.map(function (p) { return changSheng(dayGan, p.zhi); }),
      yun: yun,
      jieQi: jq
    };
  }

  // ---------- 每日运势 ----------

  var REL = {
    '正官': { tone: '稳', theme: '规矩与担子', adj: 4 },
    '七杀': { tone: '压', theme: '压力与破局', adj: -6 },
    '正印': { tone: '养', theme: '贵人与学习', adj: 7 },
    '偏印': { tone: '思', theme: '独处与灵感', adj: 0 },
    '正财': { tone: '实', theme: '正业与进账', adj: 7 },
    '偏财': { tone: '活', theme: '人脉与机会', adj: 3 },
    '食神': { tone: '舒', theme: '口福与才华', adj: 8 },
    '伤官': { tone: '锐', theme: '锋芒与表达', adj: -2 },
    '比肩': { tone: '同', theme: '同侪与并肩', adj: 3 },
    '劫财': { tone: '分', theme: '竞争与耗损', adj: -5 }
  };

  var REL_LINE = {
    '正官': '官星临日，规矩立而事情顺，宜守约、宜见上级。',
    '七杀': '杀气当头，压力与机会同来，宜硬撑不如巧避。',
    '正印': '印星护身，心安而学有所得，宜读书、宜求助长者。',
    '偏印': '偏印入日，思绪纷杂，宜独处钻研，忌胡思乱想。',
    '正财': '财星入命，正业有进，宜收账、宜谈实事。',
    '偏财': '偏财照拂，人缘活络，意外之喜多在饭局与旧识。',
    '食神': '食神吐秀，口福与灵感俱佳，宜创作、宜下厨、宜约会。',
    '伤官': '伤官见日，锋芒毕露，宜表达不宜争辩，言多必失。',
    '比肩': '比肩同气，同侪助力，宜合作、宜健身，忌争强好胜。',
    '劫财': '劫财临日，防人情耗财，宜AA、忌借贷与冲动消费。'
  };

  var YI_MAP = {
    '正官': ['签约', '见贵人', '守时'],
    '七杀': ['决断', '止损', '运动'],
    '正印': ['读书', '祈福', '请教'],
    '偏印': ['独处', '钻研', '整理'],
    '正财': ['收账', '谈薪', '置办'],
    '偏财': ['社交', '出行', '试新'],
    '食神': ['美食', '创作', '约会'],
    '伤官': ['表达', '表演', '断舍'],
    '比肩': ['合作', '健身', '聚会'],
    '劫财': ['守财', '独行', '记账']
  };

  var JI_MAP = {
    '正官': ['顶撞', '迟到'],
    '七杀': ['冒进', '逞强'],
    '正印': ['久坐', '拖延'],
    '偏印': ['多疑', '熬夜'],
    '正财': ['投机', '铺张'],
    '偏财': ['借贷', '赌性'],
    '食神': ['贪食', '化忌'],
    '伤官': ['口舌', '越界'],
    '比肩': ['攀比', '抢功'],
    '劫财': ['借钱', '合伙']
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function daily(ch, date, birth) {
    var d = date || new Date();
    var solar = L.Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, 0);
    var lunar = solar.getLunar();
    var gz = lunar.getDayInGanZhi();
    var dayGan = gz[0];

    var rel = shiShen(ch.dayMaster.gan, dayGan);
    var info = REL[rel] || REL['比肩'];
    var seed = hash(gz + '|' + ch.dayMaster.gan + '|' + solar.toYmd());
    var r = rng(seed);

    var favHit = ch.favorable.use.indexOf(GAN_WX[dayGan]) >= 0;
    var avoidHit = ch.favorable.avoid.indexOf(GAN_WX[dayGan]) >= 0;

    var base = 68 + info.adj + (favHit ? 7 : 0) - (avoidHit ? 6 : 0) + Math.round(r() * 10) - 5;
    var score = clamp(base, 45, 96);

    var career = clamp(score + (rel === '正官' ? 8 : rel === '七杀' ? -7 : rel === '正印' ? 6 : 0) + Math.round(r() * 6) - 3, 40, 98);
    var wealth = clamp(score + (rel === '正财' ? 9 : rel === '偏财' ? 5 : rel === '劫财' ? -9 : 0) + Math.round(r() * 6) - 3, 40, 98);
    var male = (birth && birth.gender === 'f') ? false : true;
    var loveBase = male ? (rel === '正财' ? 8 : rel === '偏财' ? 3 : 0) : (rel === '正官' ? 8 : rel === '七杀' ? 2 : 0);
    var love = clamp(score + loveBase + (rel === '食神' ? 4 : 0) + Math.round(r() * 7) - 3, 40, 98);
    var health = clamp(score + (rel === '七杀' ? -6 : rel === '伤官' ? -3 : rel === '正印' ? 4 : 0) + Math.round(r() * 6) - 3, 40, 98);

    var useWx = ch.favorable.use[0] || GAN_WX[dayGan];
    var luckyColor = WX_COLOR[useWx];
    var nums = WX_NUM[useWx];

    var yi = (YI_MAP[rel] || []).slice(0, 2);
    var ji = (JI_MAP[rel] || []).slice(0, 2);
    try {
      var ly = lunar.getDayYi() || [];
      var lj = lunar.getDayJi() || [];
      ly.slice(0, 4).forEach(function (x) { if (x && x !== '无' && yi.indexOf(x) < 0 && yi.length < 4) yi.push(x); });
      lj.slice(0, 4).forEach(function (x) { if (x && x !== '无' && ji.indexOf(x) < 0 && ji.length < 3) ji.push(x); });
    } catch (e) { /* ignore */ }

    var chong = '';
    try { chong = '冲' + lunar.getDayChongDesc().replace(/[（）()]/g, '') + ' · 煞' + lunar.getDaySha(); } catch (e) { /* ignore */ }

    var kw = [info.theme.split('与')[0], rel === '食神' || rel === '伤官' ? '灵思' : rel === '正财' || rel === '偏财' ? '财气' : rel === '正官' || rel === '七杀' ? '上进' : '守正'];

    return {
      date: { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() },
      solarText: solar.toYmd(),
      lunarText: lunar.getMonthInChinese() + '月' + lunar.getDayInChinese(),
      lunarYear: lunar.getYearInGanZhi(),
      gz: gz,
      dayGan: dayGan,
      relation: rel,
      tone: info.tone,
      theme: info.theme,
      score: score,
      dims: [
        { key: 'career', label: '事业', value: career },
        { key: 'wealth', label: '财运', value: wealth },
        { key: 'love', label: '感情', value: love },
        { key: 'health', label: '健康', value: health }
      ],
      keywords: kw,
      summary: REL_LINE[rel] || '',
      lucky: { color: luckyColor, number: nums[0] + Math.floor(r() * 0), dir: WX_DIR[useWx] },
      yi: yi, ji: ji,
      chong: chong,
      jieQi: ch.jieQi
    };
  }

  // ---------- 神煞 / 刑冲合害 / 十二长生 ----------

  var CS_START = { 甲: '亥', 乙: '午', 丙: '寅', 丁: '酉', 戊: '寅', 己: '酉', 庚: '巳', 辛: '子', 壬: '申', 癸: '卯' };
  var CS_STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

  function changSheng(gan, zhi) {
    var s = ZHI.indexOf(CS_START[gan]);
    var d = GAN_YY[gan] === '阳' ? 1 : -1;
    var i = ((ZHI.indexOf(zhi) - s) * d) % 12;
    if (i < 0) i += 12;
    return CS_STAGES[i];
  }

  var ZHI_HE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
  var ZHI_HAI = { 子: '未', 未: '子', 丑: '午', 午: '丑', 寅: '巳', 巳: '寅', 卯: '辰', 辰: '卯', 申: '亥', 亥: '申', 酉: '戌', 戌: '酉' };
  var XING = { '寅巳': 1, '巳申': 1, '寅申': 1, '丑戌': 1, '戌未': 1, '丑未': 1, '子卯': 1, '辰辰': 1, '午午': 1, '酉酉': 1, '亥亥': 1 };
  var SANHE = [['申', '子', '辰', '水'], ['亥', '卯', '未', '木'], ['寅', '午', '戌', '火'], ['巳', '酉', '丑', '金']];
  var SANHUI = [['寅', '卯', '辰', '木'], ['巳', '午', '未', '火'], ['申', '酉', '戌', '金'], ['亥', '子', '丑', '水']];
  var GAN_HE = [['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'], ['丁', '壬', '木'], ['戊', '癸', '火']];
  var GAN_CHONG = [['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸']];

  function xunKong(gz) {
    var g = GAN.indexOf(gz[0]), z = ZHI.indexOf(gz[1]);
    var start = ((z - g) % 12 + 12) % 12;
    return [ZHI[(start + 10) % 12], ZHI[(start + 11) % 12]];
  }

  function cycleStars(chart, gz) {
    var cycle = { label: '岁', gan: gz[0], zhi: gz[1], gz: gz, nayin: L.LunarUtil.NAYIN[gz] || '' };
    return Stars.evaluate({ natal:chart.pillars, gender:chart.gender, scope:'cycle' }, [cycle]);
  }

  function relations(list) {
    var out = [];
    var seen = {};
    function add(kind, text, pair) {
      var k = kind + text + pair;
      if (seen[k]) return;
      seen[k] = 1;
      out.push({ kind: kind, text: text, pair: pair });
    }
    var n = list.length;
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var a = list[i], b = list[j];
        var pair = (a.label || '') + (b.label || '');
        if (ZHI_HE[a.zhi] === b.zhi) add('合', a.zhi + b.zhi + ' 六合', pair);
        if ((ZHI.indexOf(a.zhi) + 6) % 12 === ZHI.indexOf(b.zhi)) add('冲', a.zhi + b.zhi + ' 相冲', pair);
        if (ZHI_HAI[a.zhi] === b.zhi) add('害', a.zhi + b.zhi + ' 相害', pair);
        if (XING[a.zhi + b.zhi] || XING[b.zhi + a.zhi]) {
          add('刑', (a.zhi === b.zhi ? a.zhi + b.zhi + ' 自刑' : a.zhi + b.zhi + ' 相刑'), pair);
        }
        for (var k = 0; k < GAN_HE.length; k++) {
          var g = GAN_HE[k];
          if ((g[0] === a.gan && g[1] === b.gan) || (g[1] === a.gan && g[0] === b.gan)) add('干合', a.gan + b.gan + ' 合' + g[2], pair);
        }
        for (var m = 0; m < GAN_CHONG.length; m++) {
          var c = GAN_CHONG[m];
          if ((c[0] === a.gan && c[1] === b.gan) || (c[1] === a.gan && c[0] === b.gan)) add('干冲', a.gan + b.gan + ' 相冲', pair);
        }
      }
    }
    var zset = list.map(function (p) { return p.zhi; });
    function has(z) { return zset.indexOf(z) >= 0; }
    SANHE.forEach(function (g) {
      if (has(g[0]) && has(g[1]) && has(g[2])) add('三合', g[0] + g[1] + g[2] + ' 合' + g[3] + '局', '');
    });
    SANHUI.forEach(function (g) {
      if (has(g[0]) && has(g[1]) && has(g[2])) add('三会', g[0] + g[1] + g[2] + ' 会' + g[3] + '局', '');
    });
    if (has('寅') && has('巳') && has('申')) add('三刑', '寅巳申 三刑', '');
    if (has('丑') && has('戌') && has('未')) add('三刑', '丑戌未 三刑', '');
    var ord = { '三合': 1, '三会': 2, '三刑': 3, '干合': 4, '合': 5, '冲': 6, '刑': 7, '害': 8, '干冲': 9 };
    out.sort(function (a, b) { return (ord[a.kind] || 9) - (ord[b.kind] || 9); });
    return out;
  }

  function yearGanZhi(year) {
    try {
      if (L.LunarYear && L.LunarYear.fromYear) return L.LunarYear.fromYear(year).getGanZhi();
    } catch (e) { /* ignore */ }
    try {
      return L.Solar.fromYmd(year, 6, 1).getLunar().getYearInGanZhi();
    } catch (e) { return ''; }
  }

  function liunian(ch, year, yunIndex) {
    var gz = yearGanZhi(year);
    if (!gz) return null;
    var f = { label: '流', gan: gz[0], zhi: gz[1], gz: gz };
    var rels = relations(ch.pillars.concat([f])).filter(function (r) { return (r.pair || '').indexOf('流') >= 0; });
    var yun = ch.yun && ch.yun.list[yunIndex];
    var yunRel = [];
    if (yun) {
      var y = { label: '运', gan: yun.gz[0], zhi: yun.gz[1] };
      yunRel = relations([y, f]);
    }
    var ss = shiShen(ch.dayMaster.gan, gz[0]);
    var note = '';
    if (yun && yun.gz === gz) note = '岁运并临，吉凶加倍，起伏较大。';
    else if (rels.some(function (r) { return r.kind === '冲' && r.pair.indexOf('日') >= 0; })) note = '冲日支，主迁移、住所或感情之变。';
    else if (rels.some(function (r) { return r.kind === '冲' && r.pair.indexOf('月') >= 0; })) note = '冲月令，工作环境易有变动。';
    else if (rels.some(function (r) { return r.kind === '合'; })) note = '流年合命，人事和顺，易得助力。';
    else if (rels.some(function (r) { return r.kind === '刑' || r.kind === '害'; })) note = '流年刑害，防口舌与暗耗。';
    return {
      year: year, gz: gz, ss: ss, stage: changSheng(ch.dayMaster.gan, gz[1]),
      rels: rels, yunRel: yunRel, note: note
    };
  }

  // ---------- 求签 ----------

  function drawHexagram(seedStr) {
    var h = hash(seedStr);
    var idx = h % 64;
    return { index: idx, hex: root.HEXAGRAMS ? root.HEXAGRAMS[idx] : null };
  }

  root.Astro = {
    chart: chart,
    daily: daily,
    drawHexagram: drawHexagram,
    liunian: liunian,
    cycleStars: cycleStars,
    relations: relations,
    changSheng: changSheng,
    xunKong: xunKong,
    shiShen: shiShen,
    hash: hash,
    rng: rng,
    WX_ORDER: WX_ORDER,
    WX_COLOR: WX_COLOR,
    WX_NUM: WX_NUM,
    WX_DIR: WX_DIR,
    GAN_WX: GAN_WX,
    ZHI_WX: ZHI_WX,
    ZHI_HIDE_GAN: L.LunarUtil.ZHI_HIDE_GAN,
    WX_SHENG: WX_SHENG,
    WX_KE: WX_KE,
    ZHI_LABEL: ZHI_LABEL,
    ZHI_RANGE: ZHI_RANGE,
    ZHI_HOUR: ZHI_HOUR
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
