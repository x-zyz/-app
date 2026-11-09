const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const ctx = vm.createContext({});
ctx.window = ctx;
for (const name of ['classic-texts', 'classic-cases', 'classic-library', 'classic-rules']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../tianji/assets/js/data', name + '.js'), 'utf8'), ctx);
}
const library = ctx.TianjiClassicLibrary;
const rules = ctx.TianjiClassicRules;
const pillars = (gzs, hidden) => gzs.map((gz, i) => ({
  gz, gan: gz[0], zhi: gz[1], hide: hidden[i], label: '年月日时'[i],
  shiShenZhi: i === 1 && gzs[2][0] === '甲' && hidden[i] && hidden[i][0] === '辛' ? ['正官'] : []
}));
const chart = (gzs, hidden, relations = []) => ({pillars: pillars(gzs, hidden), relations});

test('the reader retains every imported source paragraph and each indexed quote resolves verbatim', () => {
  for (const [key, row] of Object.entries(ctx.TianjiClassicCases)) {
    assert.equal(library.paragraph('sanming/time-' + key + '/intro').text, row.intro);
    for (const [day, text] of Object.entries(row.rows)) {
      assert.equal(library.paragraph('sanming/time-' + key + '/' + day).text, text);
    }
  }
  for (const [key, paragraphs] of Object.entries(ctx.TianjiClassicTexts)) {
    const book = ['天干', '月令', '衰旺', '中和'].includes(key) ? 'ditian-commentary' : 'sanming';
    paragraphs.forEach((text, i) => assert.equal(library.paragraph(book + '/source-' + key + '/' + (i + 1)).text, text));
  }
  assert.ok(rules.entries.some(row => row.type === 'methodology'));
  for (const row of rules.entries) {
    assert.ok(library.paragraph(row.paragraph).text.includes(row.quote));
    assert.equal(rules.forParagraph(row.paragraph).some(item => item.id === row.id), true);
  }
});

test('matching uses exact clauses and the same day/hour yields different month results', () => {
  const natal = (month, hidden) => chart(['戊寅',month,'甲子','甲子'], [['甲','丙','戊'],hidden,['癸'],['癸']]);
  assert.deepEqual(Array.from(rules.match(natal('辛酉',['辛'])).full, x => x.rule.id), ['jiazi-you']);
  assert.deepEqual(Array.from(rules.match(natal('甲辰',['戊','乙','癸'])).full, x => x.rule.id), ['jiazi-jiachen']);
  assert.equal(rules.match(natal('癸亥',['壬','甲'])).full.length, 0);
});

test('day/month themes, missing evidence, and exclusion conditions cannot promote a result', () => {
  const hidden = [['甲','丙','戊'],['壬','甲'],['戊','乙','癸'],['己','丁','乙']];
  const c = chart(['丙寅','己亥','戊辰','己未'], hidden);
  assert.equal(rules.match(c).full.length, 1);
  assert.equal(rules.match(c).full[0].rule.id, 'wu-hai-hidden-jia');
  const excluded = chart(['丙申','己亥','戊辰','己未'], [['庚','壬','戊'], ...hidden.slice(1)]);
  assert.equal(rules.match(excluded).full.length, 0);
  const incomplete = chart(['丙寅','己亥','戊辰','己未'], [undefined,...hidden.slice(1)]);
  assert.equal(rules.match(incomplete).full.length, 0);
  assert.ok(rules.match(incomplete).partial.length);
});

test('full-text search scans preserved paragraphs and scopes to a book when selected', () => {
  const results = library.search('地支取七位');
  assert.ok(results.some(result => result.id === 'sanming/source-冲击/1'));
  assert.equal(library.search('地支取七位', 'ziping').length, 0);
  assert.equal(library.search('  ').length, 0);
});

test('the rendered main list excludes methodology and links to exact paragraphs', () => {
  ctx.localStorage = {getItem: () => null};
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../tianji/assets/js/classic-reader.js'), 'utf8'), ctx);
  const reader = ctx.TianjiClassicReader;
  const natal = chart(['戊寅','辛酉','甲子','甲子'], [['甲','丙','戊'],['辛'],['癸'],['癸']]);
  const html = reader.readings(natal);
  assert.match(html, /data-classic-open="sanming\/time-甲甲子\/甲子" data-classic-rule="jiazi-you"/);
  assert.match(html, /酉月，只以正官格論，大貴。/);
  assert.doesNotMatch(html, /八字用神|月令乃提綱之府/);
  const noMatch = chart(['戊寅','癸亥','甲子','甲子'], [['甲','丙','戊'],['壬','甲'],['癸'],['癸']]);
  assert.match(reader.readings(noMatch), /暂无可验证匹配的断语/);
});

test('a relation-dependent clause is partial without relation data and full with the exact clash', () => {
  const gzs = ['戊寅','戊午','甲子','甲子'];
  const hidden = [['甲','丙','戊'],['丁','己'],['癸'],['癸']];
  const incomplete = chart(gzs, hidden);
  delete incomplete.relations;
  assert.ok(rules.match(incomplete).partial.some(item => item.rule.id === 'jiazi-wu-clash'));
  assert.equal(rules.match(incomplete).full.length, 0);
  assert.equal(rules.match(chart(gzs, hidden, [{kind:'冲',pair:'月时'}])).full.length, 0);
  assert.equal(rules.match(chart(gzs, hidden, [{kind:'冲',pair:'月日'}])).full[0].rule.id, 'jiazi-wu-clash');
});

test('a direct-officer branch needs the computed month main-qi ten-god', () => {
  const c = chart(['戊寅','辛酉','甲子','甲子'], [['甲','丙','戊'],['辛'],['癸'],['癸']]);
  delete c.pillars[1].shiShenZhi;
  assert.equal(rules.match(c).full.length, 0);
  assert.ok(rules.match(c).partial.some(item => item.rule.id === 'jiazi-you'));
  c.pillars[1].shiShenZhi = ['七杀'];
  assert.equal(rules.match(c).full.length, 0);
});
