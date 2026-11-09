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
  var books = [];
  var index = Object.create(null);

  function book(id, title, author, edition, coverage) {
    var item = {id:id, title:title, author:author, edition:edition, coverage:coverage, chapters:[]};
    books.push(item);
    return item;
  }

  function chapter(book, key, volume, title, source, rows) {
    var item = {id:key, book:book, volume:volume, title:title, source:source, paragraphs:[]};
    book.chapters.push(item);
    rows.forEach(function (row) {
      var id = book.id + '/' + key + '/' + row[0];
      var paragraph = {id:id, title:row[1], text:row[2], note:row[3], chapter:item};
      if (index[id]) throw new Error('Duplicate classic paragraph: ' + id);
      index[id] = paragraph;
      item.paragraphs.push(paragraph);
    });
  }

  var sanming = book('sanming','三命通会','万民英','维基文库本及四库全书本','卷二、卷五节录及卷八、卷九已收录的日时条文');
  var commentary = book('ditian-commentary','滴天髓阐微','','维基文库本，含任氏注','已收录的天干、月令、衰旺、中和四篇');
  var ditian = book('ditian','滴天髓','','维基文库《滴天髓辑要》','天干论十干选读');
  var ziping = book('ziping','子平真诠','沈孝瞻','民国刊本影印','卷二〈论用神〉节录');
  var wuxing = book('wuxing','五行精纪','廖中','维基文库本','卷一〈论六甲纳音法〉节录');
  var shenfeng = book('shenfeng','神峰通考','张楠','维基文库本','张楠叙节录');
  var qiongtong = book('qiongtong','穷通宝鉴','','维基文库本','〈论戊土〉之〈三冬戊土〉');

  var sections = {
    天干:[commentary,'通神论','天干','#七、天干'],
    月令:[commentary,'通神论','月令','#十五、月令'],
    衰旺:[commentary,'通神论','衰旺','#十七、衰旺'],
    中和:[commentary,'通神论','中和','#十八、中和'],
    六合:[sanming,'卷二','论支元六合','#論支元六合'],
    三合:[sanming,'卷二','论支元三合','#論支元三合'],
    冲击:[sanming,'卷二','论冲击','#論衝擊'],
    十神:[sanming,'四库本卷五','论古人立印食官财名义（含后续条文）','']
  };
  Object.keys(window.TianjiClassicTexts).forEach(function (key) {
    var section = sections[key];
    var source = section[0] === commentary ? '滴天髓闡微' :
      key === '十神' ? '三命通會_(四庫全書本)/卷05' : '三命通會/卷二';
    chapter(section[0], 'source-' + key, section[1], section[2],
      'https://zh.wikisource.org/zh-hant/' + source + section[3],
      window.TianjiClassicTexts[key].map(function (text, i) { return [i + 1, '', text]; }));
  });

  Object.keys(window.TianjiClassicCases).forEach(function (key) {
    var record = window.TianjiClassicCases[key];
    chapter(sanming, 'time-' + key, '卷' + record.volume, record.title,
      'https://zh.wikisource.org/zh-hant/三命通會/卷' + record.volume + '#' + record.title,
      [['intro','篇首',record.intro]].concat(Object.keys(record.rows).map(function (day) {
        return [day, day + '日', record.rows[day]];
      })));
  });

  chapter(ditian, 'stems', '滴天髓辑要', '天干论', stemSource,
    Object.keys(stems).map(function (gan) { return [gan, gan + '干', stems[gan][0], stems[gan][1]]; }));
  chapter(ziping, 'method', '卷二', '论用神', month[4], [['1','',month[2],month[3]]]);
  chapter(wuxing, 'tone', '卷一', '论六甲纳音法', tone[4], [['1','',tone[2],tone[3]]]);
  chapter(shenfeng, 'preface', '', '张楠叙', balance[4], [['1','',balance[2],balance[3]]]);
  chapter(qiongtong, 'winter-wu', '论戊土', '三冬戊土',
    'https://zh.wikisource.org/wiki/穷通宝鉴#三冬戊土', [
      ['1','','十月戊土，时值小阳，阳气略出，先用甲木，次取丙火。非甲、土不灵。非丙、土不暖，安能生发万物。甲丙两出，富贵中人。或甲得长生，遇支藏得地之水，一丙高透，亦主身贵扬名。'],
      ['2','','支见庚金，入泮而已。若不见庚金，甲木藏支，丙火高透，科甲有之。若有庚，丁出制，必异路功名。或为典吏。即庚丁不透，甲丙藏支，亦云富贵。'],
      ['3','','壬透得戊救丙，主富贵取贵。丙甲俱无，必为僧道。'],
      ['4','例盘','时日月年 戊戊癸癸 午辰亥卯  | 时日月年 庚戊辛壬 甲寅亥申  | 时日月年 丙戊丁乙 辰戌亥卯'],
      ['5','','十一二月严寒冰冻，丙火为专，甲木为佐。丙甲两透，桃浪之人，丙出甲藏，采芹食饩。丙藏甲出，佐杂前程。有丙无甲者，豪富。有甲无丙者，清贫。丙甲全无，下流之造。'],
      ['6','','或一派丙火，加以丙透，运值火土，弱中复强，又一壬透，主清高荣禄。乏壬、僧道孤寒。'],
      ['7','','或一派壬水，不见比劫，可作从才而论。即有比劫，得甲出干，又主富贵，若寒土无丙，虽有甲木，亦是内虚外实之人。'],
      ['8','','或二癸透月时，名为争合，终属劳碌之人。得一己出干制癸，反为忠义之士，舍己从人而论。'],
      ['9','','年月透辛金者，又属土金伤官，异路功名可许。以金为妻、水为子。'],
      ['10','例盘','时日月年 壬戊壬壬 子子子子  | 时日月年 癸戊乙癸 丑申丑卯  | 时日月年 戊戊甲戊 午辰子寅']
    ]);

  function search(query, bookId) {
    var key = String(query).trim().toLowerCase();
    if (!key) return [];
    return Object.values(index).filter(function (p) {
      return (!bookId || p.chapter.book.id === bookId) &&
        [p.chapter.book.title, p.chapter.volume, p.chapter.title, p.title, p.text].some(function (value) {
          return value.toLowerCase().includes(key);
        });
    });
  }
  window.TianjiClassicLibrary = {books:books, paragraph:function (id) { return index[id]; }, search:search};
}());
