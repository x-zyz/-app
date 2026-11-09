const assert = require('node:assert/strict');
const test = require('node:test');
const stars = require('../tianji/assets/js/stars-special.js');

function fixture(month, day, hour = '甲子') {
  const natal = ['甲子', month, day, hour].map((gz, i) => ({
    gan: gz[0], zhi: gz[1], gz, label: '年月日时'[i]
  }));
  return { natal, gender: 'female', scope: 'natal' };
}

function rule(id) {
  return stars.find(star => star.id === id);
}

function match(id, ctx, index = 2) {
  return rule(id).match(ctx, ctx.natal[index], index);
}

test('day markers use exact pillar pairs, with a named convention for each list', () => {
  const cases = [
    ['kuigang', '壬辰', '甲辰'],
    ['ten-spirit-days', '丙辰', '戊辰'],
    ['six-elegance-days', '丁未', '癸未'],
    ['guluan', '辛亥', '丁亥'],
    ['yin-yang-mismatch', '癸巳', '丁巳'],
    ['ten-great-defeats', '己丑', '乙丑'],
    ['nine-uglies', '乙卯', '丁酉']
  ];
  for (const [id, yes, no] of cases) {
    const star = rule(id);
    assert.equal(star.scope, 'day', id);
    assert.ok(star.version && star.source.startsWith('https://') && star.reference, id);
    assert.ok(match(id, fixture('丙寅', yes)).some(line => line.includes(yes)), id);
    assert.deepEqual(match(id, fixture('丙寅', no)), [], id);
  }
  assert.match(rule('six-elegance-days').version, /近现代/);
  assert.match(rule('nine-uglies').version, /三命通会/);
});

test('金神 follows the modern day and hour convention', () => {
  const ctx = fixture('丙寅', '乙丑', '癸酉');
  assert.equal(rule('jinshen').scope, 'day-hour');
  assert.match(match('jinshen', ctx)[0], /日柱乙丑/);
  assert.match(match('jinshen', ctx, 3)[0], /时柱癸酉/);
  assert.deepEqual(match('jinshen', fixture('丙寅', '辛酉')), []);
  assert.match(rule('jinshen').version, /chxb/);
});

test('天赦 and 四废 check the day against the season of the natal month branch', () => {
  const cases = [
    ['甲寅', '春', '戊寅', '庚申', '辛酉'],
    ['丁未', '夏', '甲午', '壬子', '癸亥'],
    ['庚戌', '秋', '戊申', '甲寅', '乙卯'],
    ['丁丑', '冬', '甲子', '丙午', '丁巳']
  ];
  for (const [month, season, pardon, firstWaste, secondWaste] of cases) {
    for (const [id, day] of [
      ['heavenly-pardon', pardon],
      ['four-wastes', firstWaste],
      ['four-wastes', secondWaste]
    ]) {
      assert.equal(rule(id).scope, 'day', id);
      const proof = match(id, fixture(month, day)).join(' ');
      assert.ok(proof.includes(month[1]) && proof.includes(season) && proof.includes(day), id);
      assert.deepEqual(match(id, fixture(month === '甲寅' ? '丁丑' : '甲寅', day)), [], id);
    }
  }
});
