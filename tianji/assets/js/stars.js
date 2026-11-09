/* Versioned, deterministic 神煞 registry. The natal chart stays the source of context for cycles. */
(function (root) {
  'use strict';

  var commonjs = typeof module !== 'undefined' && module.exports;
  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var sanming = 'https://zh.wikisource.org/zh-hant/三命通會/卷三';
  var jingji = 'https://zh.wikisource.org/zh-hant/五行精紀';
  var yuanhai = 'https://www.shidianguji.com/zh/book/NGJ8922642210287/chapter/1lnh0qifvq0j2';
  var modern = 'https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js';
  var legacy = 'https://github.com/x-zyz/-app/blob/v2.2/tianji/assets/js/astro.js';
  var GAN_HE = ['甲己','乙庚','丙辛','丁壬','戊癸'];

  var TIANYI = { 甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'], 乙: ['子', '申'], 己: ['子', '申'], 丙: ['亥', '酉'], 丁: ['亥', '酉'], 壬: ['卯', '巳'], 癸: ['卯', '巳'], 辛: ['午', '寅'] };
  var WENCHANG = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
  var LUSHEN = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
  var YANGREN = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子' };
  var GUOYIN = { 甲: '戌', 乙: '亥', 丙: '丑', 丁: '寅', 戊: '丑', 己: '寅', 庚: '辰', 辛: '巳', 壬: '未', 癸: '申' };
  var JINYU = { 甲: '辰', 乙: '巳', 丙: '未', 丁: '申', 戊: '未', 己: '申', 庚: '戌', 辛: '亥', 壬: '丑', 癸: '寅' };
  var TAIJI = { 甲: ['子', '午'], 乙: ['子', '午'], 丙: ['卯', '酉'], 丁: ['卯', '酉'], 戊: ['辰', '戌', '丑', '未'], 己: ['辰', '戌', '丑', '未'], 庚: ['寅', '亥'], 辛: ['寅', '亥'], 壬: ['巳', '申'], 癸: ['巳', '申'] };
  var HONGLUAN = { 子: '卯', 丑: '寅', 寅: '丑', 卯: '子', 辰: '亥', 巳: '戌', 午: '酉', 未: '申', 申: '未', 酉: '午', 戌: '巳', 亥: '辰' };
  var TIANXI = { 子: '酉', 丑: '申', 寅: '未', 卯: '午', 辰: '巳', 巳: '辰', 午: '卯', 未: '寅', 申: '丑', 酉: '子', 戌: '亥', 亥: '戌' };
  var GUCHEN = { 亥: '寅', 子: '寅', 丑: '寅', 寅: '巳', 卯: '巳', 辰: '巳', 巳: '申', 午: '申', 未: '申', 申: '亥', 酉: '亥', 戌: '亥' };
  var GUASU = { 亥: '戌', 子: '戌', 丑: '戌', 寅: '丑', 卯: '丑', 辰: '丑', 巳: '辰', 午: '辰', 未: '辰', 申: '未', 酉: '未', 戌: '未' };
  var TIANDE = { 寅: '丁', 卯: '申', 辰: '壬', 巳: '辛', 午: '亥', 未: '甲', 申: '癸', 酉: '寅', 戌: '丙', 亥: '乙', 子: '巳', 丑: '庚' };
  var YUEDE = { 寅: '丙', 午: '丙', 戌: '丙', 申: '壬', 子: '壬', 辰: '壬', 亥: '甲', 卯: '甲', 未: '甲', 巳: '庚', 酉: '庚', 丑: '庚' };

  // 三合局：申子辰 / 亥卯未 / 寅午戌 / 巳酉丑
  var SANHE_GROUP = { 申: '子', 子: '子', 辰: '子', 亥: '卯', 卯: '卯', 未: '卯', 寅: '午', 午: '午', 戌: '午', 巳: '酉', 酉: '酉', 丑: '酉' };
  var TAOHUA = { 子: '酉', 午: '卯', 酉: '午', 卯: '子' };
  var YIMA = { 子: '寅', 午: '申', 酉: '亥', 卯: '巳' };
  var HUAGAI = { 子: '辰', 午: '戌', 酉: '丑', 卯: '未' };
  var JIANGXING = { 子: '子', 午: '午', 酉: '酉', 卯: '卯' };

  function from(slot, field, text) { return { slot:slot, field:field, text:text }; }
  var yearGan = from(0,'gan','年干'), dayGan = from(2,'gan','日干');
  var yearZhi = from(0,'zhi','年支'), dayZhi = from(2,'zhi','日支'), monthZhi = from(1,'zhi','月支');

  function lookup(origins, field, table, transform) {
    return function (ctx, target, index) {
      return origins.flatMap(function (origin) {
        var base = ctx.natal[origin.slot][origin.field];
        if (transform === otherPillarGroup && ctx.scope === 'natal' && origin.slot === index) return [];
        var expected = table[transform ? transform(base) : base];
        var targetField = field === 'mixed' ? (GAN.includes(expected) ? 'gan' : 'zhi') : field;
        if (!expected || !expected.includes(target[targetField])) return [];
        return [origin.text + base + (transform ? '（三合组旺支' + transform(base) + '）' : '') +
          ' → ' + (targetField === 'gan' ? '天干' : '地支') + Array.from(expected).join('、')];
      });
    };
  }

  function otherPillarGroup(base) { return SANHE_GROUP[base]; }

  function tri(table, origins) {
    return lookup(origins || [yearZhi,dayZhi], 'zhi', table, function (base) { return SANHE_GROUP[base]; });
  }

  function rule(id,name,category,match,source,reference,description,opts) {
    return Object.assign({id:id,name:name,aliases:[],category:category,scope:'any',version:'tianji-2.2',
      source:source,reference:reference,description:description,common:true,match:match},opts);
  }

  function inTone(stage) {
    return function (ctx, target) {
      var el = ctx.natal[0].nayin.slice(-1);
      var places = {木:'亥寅',火:'寅巳',土:'申亥',金:'巳申',水:'申亥'};
      var branch = places[el] && places[el][stage];
      return branch === target.zhi && target.nayin.endsWith(el) ?
        ['年柱纳音属' + el + '，' + (stage ? '临官' : '长生') + '在' + branch + '，落柱纳音同属' + el] : [];
    };
  }

  function net(branches, tones) {
    return function (ctx, target) {
      var el = ctx.natal[0].nayin.slice(-1);
      var pillars = ctx.scope === 'cycle' ? ctx.natal.concat(target) : ctx.natal;
      return el && tones.includes(el) && branches.includes(target.zhi) &&
        Array.from(branches).every(function (zhi) { return pillars.some(function (p) { return p.zhi === zhi; }); }) ?
        ['年柱纳音属' + el + '，地支同时见' + branches] : [];
    };
  }

  var base = [
    rule('tianyi','天乙贵人','贵人',lookup([yearGan,dayGan],'zhi',TIANYI),sanming,'论天乙贵人；年干与日干并查','传统取协助、提携之象。'),
    rule('taiji','太极贵人','贵人',lookup([yearGan,dayGan],'zhi',TAIJI),jingji,'卷十三·太极贵；天机沿用辛庚、壬癸合组表','传统取学问、义理与思考之象。'),
    rule('fuxing','福星贵人','贵人',lookup([yearGan,dayGan],'zhi',{甲:'寅子',乙:'丑卯',丙:'寅子',丁:'亥',戊:'申',己:'未',庚:'午',辛:'巳',壬:'辰',癸:'丑卯'}),jingji,'卷十三·福星贵；年干与日干并查','传统取助益、福禄之象。'),
    rule('tiande','天德贵人','贵人',lookup([monthZhi],'mixed',TIANDE),sanming,'论天月德','按月支分查天干或地支，取调和之象。'),
    rule('yuede','月德贵人','贵人',lookup([monthZhi],'gan',YUEDE),sanming,'论天月德','按月支三合局取天干，取协调之象。'),
    rule('yuede-he','月德合','贵人',function (ctx,target) {
      var month=ctx.natal[1].zhi, de=YUEDE[month];
      var pair=GAN_HE.find(function (g) { return g.includes(de); });
      return pair && target.gan !== de && pair.includes(target.gan) ? ['月支'+month+'取月德'+de+'，五合天干为'+target.gan] : [];
    },legacy,'天机沿用月德天干取五合','从月德对应干再查五合天干。'),
    rule('dexiu','德秀贵人','贵人',function (ctx,target) {
      var month=ctx.natal[1].zhi;
      var sets={午:['丙丁',['戊癸']],子:['壬癸戊己',['丙辛','甲己']],酉:['庚辛',['乙庚']],卯:['甲乙',['丁壬']]}[SANHE_GROUP[month]];
      var pillars=ctx.scope==='cycle'?ctx.natal.concat(target):ctx.natal;
      var has=function (gan) { return pillars.some(function (p) { return p.gan === gan; }); };
      var pairs=sets[1].filter(function (combo) { return Array.from(combo).every(has); });
      if (!pairs.length || !Array.from(sets[0]).some(has) || !(sets[0]+pairs.join('')).includes(target.gan)) return [];
      return ['月支'+month+'见德干'+sets[0]+'之一，秀干'+pairs.join('、')+'成对，落柱见'+target.gan];
    },modern,'德秀表；至少一德干、至少一组秀干齐备，仅标对应落柱','传统取学习、文秀之象。',{version:'tianji-2.3-paired'}),
    rule('wenchang','文昌贵人','贵人',lookup([dayGan],'zhi',WENCHANG),legacy,'天机日干查支表','传统取学习、文书和技艺之象。'),
    rule('guoyin','国印贵人','贵人',lookup([dayGan],'zhi',GUOYIN),legacy,'天机日干查支表','传统取印信、职责和规范之象。'),
    rule('xuetang','学堂','禄与特殊格局',inTone(0),sanming,'论学堂词馆；纳音同类正位法','传统取学习、专研之象。',{common:false}),
    rule('ciguan','词馆','禄与特殊格局',inTone(1),sanming,'论学堂词馆；纳音同类正位法','传统取文字、表达之象。',{common:false}),
    rule('lu','禄神','禄与特殊格局',lookup([dayGan],'zhi',LUSHEN),sanming,'论十干禄','日干在地支的临官禄位。',{aliases:['建禄位']}),
    rule('jinyu','金舆','禄与特殊格局',lookup([dayGan],'zhi',JINYU),sanming,'论金舆','传统借车舆取便利、供养之象。'),
    rule('taohua','桃花','婚恋与人际',tri(TAOHUA),'https://zh.wikisource.org/zh-hant/三命通會/卷二','论咸池；年支与日支并查','传统取社交、审美与吸引力之象。',{aliases:['咸池']}),
    rule('hongyan','红艳煞','婚恋与人际',lookup([dayGan],'zhi',{甲:'午',乙:'申',丙:'寅',丁:'未',戊:'辰',己:'辰',庚:'戌',辛:'酉',壬:'子',癸:'申'}),modern,'红艳煞表；现代戊辰、壬子口径','传统取情感表达、人际吸引之象。',{aliases:['红艳']}),
    rule('hongluan','红鸾','婚恋与人际',lookup([yearZhi],'zhi',HONGLUAN),legacy,'天机按年支查红鸾表','传统取喜庆与人际往来之象。'),
    rule('tianxi','天喜','婚恋与人际',lookup([yearZhi],'zhi',TIANXI),legacy,'天机以红鸾对宫为天喜','传统取喜庆与人际互动之象。'),
    rule('yima','驿马','行动与刑伤',tri(YIMA),sanming,'论驿马；年支与日支并查','传统取往来、移动、调动之象。'),
    rule('huagai','华盖','禄与特殊格局',lookup([yearZhi,dayZhi],'zhi',HUAGAI,otherPillarGroup),'https://zh.wikisource.org/zh-hant/三命通會/卷二','论将星华盖；年支日支并查且不以起查柱匹配自身','传统取独处、专注、艺术与学问之象。'),
    rule('jiangxing','将星','禄与特殊格局',tri(JIANGXING),'https://zh.wikisource.org/zh-hant/三命通會/卷二','论将星华盖；年支与日支并查','传统取组织与承担职责之象。'),
    rule('yangren','羊刃','行动与刑伤',lookup([dayGan],'zhi',YANGREN),sanming,'论羊刃；五阳干取刃','传统用来看旺极与制衡。',{aliases:['阳刃']}),
    rule('guchen','孤辰','婚恋与人际',lookup([yearZhi],'zhi',GUCHEN),sanming,'论孤辰寡宿；年支三会组后一支','传统取独立、偏静之象。'),
    rule('guasu','寡宿','婚恋与人际',lookup([yearZhi],'zhi',GUASU),sanming,'论孤辰寡宿；年支三会组前一支','传统取独处、偏静之象。'),
    rule('xunkong','空亡','旬空',function (ctx,target) {
      return [0,2].flatMap(function (i) {
        var source = ctx.natal[i], start=(ZHI.indexOf(source.zhi)-GAN.indexOf(source.gan)+12)%12;
        var kong=ZHI[(start+10)%12]+ZHI[(start+11)%12];
        return kong.includes(target.zhi)?[(i===0?'年柱':'日柱')+source.gz+' → 旬空'+kong]:[];
      });
    },modern,'空亡；按本命年柱、日柱旬空查目标地支','一旬内未配到天干的两个地支。',{aliases:['旬空'],version:'tianji-2.3-year-day'}),
    rule('jiesha','劫煞','行动与刑伤',tri({子:'巳',午:'亥',卯:'申',酉:'寅'}),sanming,'论劫煞亡神；年支与日支并查','传统用作观察争夺与变动的辅助线索。'),
    rule('zaisha','灾煞','行动与刑伤',tri({子:'午',午:'子',卯:'酉',酉:'卯'}),sanming,'论灾煞；年支与日支并查','传统用作复核冲动与牵制的辅助线索。'),
    rule('wangshen','亡神','行动与刑伤',tri({子:'亥',午:'巳',卯:'寅',酉:'申'}),sanming,'论劫煞亡神；年支与日支并查','传统取谋划、耗散之象。'),
    rule('xueren','血刃','行动与刑伤',lookup([monthZhi],'zhi',{寅:'丑',卯:'未',辰:'寅',巳:'申',午:'卯',未:'酉',申:'辰',酉:'戌',戌:'巳',亥:'亥',子:'午',丑:'子'}),yuanhai,'论血刃杀；含十二月建丑见子','以月支查地支的传统辅助标记。',{common:false}),
    rule('yuanchen','元辰','行动与刑伤',function (ctx,target) {
      if (ctx.gender!=='m' && ctx.gender!=='f') return [];
      var year=ctx.natal[0], step=((GAN.indexOf(year.gan)%2===0)===(ctx.gender==='m'))?1:-1;
      var zhi=ZHI[(ZHI.indexOf(year.zhi)+6+step)%12];
      return zhi===target.zhi?['年柱'+year.gz+'，'+(step>0?'阳男阴女顺':'阴男阳女逆')+'取对冲支后一位为'+zhi]:[];
    },sanming,'论元辰；阳男阴女顺一、阴男阳女逆一','传统取牵制与变动之象。',{common:false}),
    rule('liue','六厄','其他',tri({子:'卯',午:'酉',卯:'午',酉:'子'},[yearZhi]),sanming,'论六厄；仅查年支三合五行死位','传统取阻力之象。',{common:false}),
    rule('tianluo','天罗','行动与刑伤',net('戌亥','火'),sanming,'论天罗地网；火年命见戌亥','传统取约束之象。',{common:false}),
    rule('diwang','地网','行动与刑伤',net('辰巳','水土'),sanming,'论天罗地网；水土年命见辰巳','传统取约束之象。',{common:false})
  ];

  var special = commonjs ? require('./stars-special.js') : root.TianjiSpecialStars;
  var extended = commonjs ? require('./stars-extended.js') : root.TianjiExtendedStars;
  var rules = Object.freeze(base.concat(special,extended).map(function (item) { return Object.freeze(item); }));
  var names = new Map(rules.map(function (r) { return [r.name,r]; }));
  var ids = new Map(rules.map(function (r) { return [r.id,r]; }));
  if (names.size !== rules.length || ids.size !== rules.length) throw Error('Duplicate star definition');

  function allowed(rule, scope, index) {
    if (rule.scope === 'any') return true;
    if (scope !== 'natal') return false;
    return rule.scope === 'natal' || rule.scope === 'day' && index === 2 ||
      rule.scope === 'day-hour' && index >= 2;
  }

  function evaluate(ctx, targets, overrides) {
    var out = [];
    rules.forEach(function (rule) {
      var match = overrides && overrides[rule.id] || rule.match;
      targets.forEach(function (target,index) {
        if (!allowed(rule,ctx.scope,index)) return;
        var proof = Array.from(new Set(match(ctx,target,index)));
        if (proof.length) out.push({ id:rule.id, name:rule.name, pillars:[index], src:proof.join('；') });
      });
    });
    return out;
  }

  var api = {rules:rules, byId:function (id) { return ids.get(id); }, byName:function (name) { return names.get(name); }, evaluate:evaluate, allowed:allowed};
  if (commonjs) module.exports=api;
  else root.TianjiStars=api;
})(typeof globalThis === 'undefined' ? this : globalThis);
