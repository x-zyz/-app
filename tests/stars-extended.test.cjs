'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const rules = require('../tianji/assets/js/stars-extended.js');

function pillar(gz, label, nayin = '') {
  return { gz, gan: gz[0], zhi: gz[1], label, nayin };
}

function chart(gz, gender = 'm', nayin = '', scope = 'natal') {
  return {
    gender,
    scope,
    natal: gz.split(' ').map((value, index) => pillar(value, '年月日时'[index], index === 0 ? nayin : ''))
  };
}

function rule(id) {
  const entry = rules.find(candidate => candidate.id === id);
  assert.ok(entry, 'Missing rule ' + id);
  return entry;
}

function match(id, ctx, index, target = ctx.natal[index]) {
  return rule(id).match(ctx, target, index);
}

test('天厨 takes both year and day stems using the eight-pair source', () => {
  const ctx = chart('丙子 辛巳 丙辰 辛卯');
  const evidence = match('tian-chu', ctx, 1).join(' ');
  assert.match(evidence, /年干丙/);
  assert.match(evidence, /日干丙/);
  assert.match(evidence, /月支巳/);
  assert.deepEqual(match('tian-chu', chart('甲子 己巳 乙亥 己卯'), 1), []);
});

test('三奇 requires a contiguous forward sequence in the natal stems', () => {
  const id = 'san-qi';
  assert.equal(rule(id).scope, 'natal');
  const first = chart('乙丑 丙寅 丁卯 戊辰');
  const second = chart('乙丑 甲寅 戊辰 庚申');
  for (const i of [0, 1, 2]) assert.match(match(id, first, i).join(' '), /乙丙丁/);
  assert.deepEqual(match(id, first, 3), []);
  for (const i of [1, 2, 3]) assert.match(match(id, second, i).join(' '), /甲戊庚/);
  assert.deepEqual(match(id, second, 0), []);
  for (const gz of ['丁卯 丙寅 乙丑 戊辰', '乙丑 戊辰 丙寅 丁卯', '辛卯 壬辰 癸巳 戊午']) {
    const ctx = chart(gz);
    assert.ok(ctx.natal.every((_, i) => match(id, ctx, i).length === 0));
  }
});

test('天德合 uses stem and branch entries in its month table', () => {
  assert.match(match('tian-de-he', chart('甲子 丙寅 壬辰 癸卯'), 2).join(' '), /月支寅.*日干壬/);
  const ctx = chart('甲子 丁卯 丁巳 庚子', 'm', '', 'cycle');
  assert.match(match('tian-de-he', ctx, 0, pillar('己巳', '岁')).join(' '), /月支卯.*岁支巳/);
  assert.deepEqual(match('tian-de-he', ctx, 0, pillar('庚申', '岁')), []);
});

test('飞刃 uses the source opposition for the day stem', () => {
  const ctx = chart('戊子 甲寅 辛巳 壬辰');
  assert.match(match('fei-ren', ctx, 3).join(' '), /日干辛.*戌.*时支辰/);
  assert.deepEqual(match('fei-ren', ctx, 3, pillar('戊戌', '时')), []);
});

test('流霞 uses the day stem and can differ from 飞刃', () => {
  const ctx = chart('甲子 丁卯 乙亥 丙戌');
  assert.match(match('liu-xia', ctx, 3).join(' '), /日干乙.*时支戌/);
  assert.deepEqual(match('liu-xia', ctx, 3, pillar('甲申', '时')), []);
  assert.deepEqual(match('fei-ren', ctx, 3), []);
});

test('勾绞 swaps the named directions for the other sex and year polarity', () => {
  const id = 'gou-jiao';
  const male = chart('甲子 丁卯 丁酉 庚子');
  assert.match(match(id, male, 1).join(' '), /顺.*勾煞/);
  assert.match(match(id, male, 2).join(' '), /逆.*绞煞/);
  assert.deepEqual(match(id, male, 3), []);
  const female = chart('甲子 丁卯 丁酉 庚子', 'f');
  assert.match(match(id, female, 1).join(' '), /顺.*绞煞/);
  assert.match(match(id, female, 2).join(' '), /逆.*勾煞/);
  const yinMale = chart('乙丑 庚辰 甲戌 甲子');
  assert.match(match(id, yinMale, 1).join(' '), /顺.*绞煞/);
  assert.match(match(id, yinMale, 2).join(' '), /逆.*勾煞/);
  assert.deepEqual(match(id, { ...male, gender: '' }, 1), []);
});

test('童子 reports season and natal year sound matches independently', () => {
  const id = 'tong-zi';
  assert.equal(rule(id).scope, 'day-hour');
  const ctx = chart('甲子 丙寅 丙子 甲午', 'm', '海中金');
  assert.match(match(id, ctx, 2).join(' '), /月支寅.*春.*日支子/);
  assert.match(match(id, ctx, 3).join(' '), /年柱纳音海中金.*时支午/);
  const overlap = chart('甲子 戊午 丁卯 庚子', 'm', '海中金');
  assert.equal(match(id, overlap, 2).length, 2);
  assert.deepEqual(match(id, overlap, 3), []);
});

test('丧门、吊客、披麻 distinguish the offsets with branch wraparound', () => {
  const ctx = chart('甲子 丙寅 甲戌 癸酉');
  assert.match(match('sang-men', ctx, 1).join(' '), /年支子.*顺.*月支寅/);
  assert.match(match('diao-ke', ctx, 2).join(' '), /年支子.*逆.*日支戌/);
  assert.match(match('pi-ma', ctx, 3).join(' '), /年支子.*逆.*时支酉/);
  assert.deepEqual(match('sang-men', ctx, 2), []);
  assert.deepEqual(match('diao-ke', ctx, 3), []);
  assert.deepEqual(match('pi-ma', ctx, 1), []);
  const cycle = chart('癸亥 甲子 甲戌 癸酉', 'm', '', 'cycle');
  assert.match(match('sang-men', cycle, 0, pillar('乙丑', '岁')).join(' '), /年支亥.*岁支丑/);
});

test('病符 uses the branch immediately behind the natal year', () => {
  const ctx = chart('甲子 丙寅 癸亥 丁丑');
  assert.match(match('bing-fu', ctx, 2).join(' '), /年支子.*逆.*日支亥/);
  assert.deepEqual(match('bing-fu', ctx, 3), []);
});
