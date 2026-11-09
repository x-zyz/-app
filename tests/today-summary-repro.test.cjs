'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {Solar, LunarUtil} = require('../tianji/assets/js/vendor/lunar.js');
require('../tianji/assets/js/solar-time.js');
require('../tianji/assets/js/astro.js');

const A = globalThis.Astro;
const window = {LunarUtil};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const assets = path.join(__dirname, '../tianji/assets/js');
const source = fs.readFileSync(path.join(assets, 'app.js'), 'utf8');
const renderer = source.match(/^  function panSummaryHTML\(\) \{[\s\S]*?^  \}/m);
assert.ok(renderer, 'find the real Today summary renderer');
const beijing = {name:'北京', lon:116.4074, zone:'Asia/Shanghai'};
const urumqi = {name:'乌鲁木齐', lon:87.6168, zone:'Asia/Shanghai'};
const today = new Date(2026, 10, 8, 12);

function run(birth) {
  const chart = A.chart(birth);
  const result = A.daily(chart, today, birth);
  const html = vm.runInNewContext(renderer[0] + '\npanSummaryHTML()', {
    A, window, esc, state:{daily:{id:'current', chart, result}}, ownRecord:()=>({id:'current',birth}), pad:n=>String(n).padStart(2, '0')
  });
  return {chart, result, html};
}

test('Today summary labels the natal chart and follows the year pillar before Lunar New Year', t => {
  const birth = {y:2026, m:2, d:10, hour:12, minute:0, city:beijing, gender:'m'};
  const expected = Solar.fromYmdHms(2026, 2, 10, 12, 0, 0).getLunar();
  const current = Solar.fromYmd(2026, 11, 8).getLunar();
  assert.equal(expected.getEightChar().getYear(), '丙午');
  assert.equal(expected.getYearShengXiaoExact(), '马');
  assert.equal(expected.getYearShengXiao(), '蛇');
  const {chart, result, html} = run(birth);
  assert.equal(chart.pillars[0].gz, expected.getEightChar().getYear());
  assert.equal(result.gz, current.getDayInGanZhi());
  assert.notEqual(chart.pillars[2].gz, result.gz);
  assert.match(html, /class="l">年<\/span><span class="g">丙午/);
  assert.match(html, /本人命盘 · 出生四柱/);
  assert.match(html, new RegExp('class="mini-meta">[^<]*' + expected.getYearShengXiaoExact() + '年'));
  assert.doesNotMatch(html, /蛇年/);
  t.diagnostic('Rendered: 丙午年柱 · 马年; Today card day: ' + result.gz);
});

test('Today summary distinguishes corrected solar time from the original clock', t => {
  const birth = {y:2026, m:11, d:8, hour:12, minute:0, city:urumqi, gender:'m'};
  // Longitude alone gives about 09:50 solar time. Even a ±17 minute equation
  // of time remains in 巳时, so this expectation is independent of app correction code.
  const meanMinutes = 12 * 60 + (urumqi.lon - 120) * 4;
  assert.ok(meanMinutes - 17 >= 9 * 60 && meanMinutes + 17 < 11 * 60);
  const expected = Solar.fromYmdHms(2026, 11, 8, 10, 0, 0).getLunar().getEightChar();
  const wall = Solar.fromYmdHms(2026, 11, 8, 12, 0, 0).getLunar().getEightChar();
  assert.equal(expected.getTimeZhi(), '巳');
  assert.equal(wall.getTimeZhi(), '午');
  const {chart, html} = run(birth);
  assert.equal(chart.pillars[3].gz, expected.getTime());
  const shown = html.match(/钟表 12:00 · 真太阳时 (\d\d):(\d\d) 巳时 · 乌鲁木齐/);
  assert.ok(shown);
  const minutes = +shown[1] * 60 + +shown[2];
  assert.ok(minutes >= Math.floor(meanMinutes - 17) && minutes <= Math.ceil(meanMinutes + 17));
  assert.equal(Solar.fromYmdHms(2026,11,8,+shown[1],+shown[2],0).getLunar().getEightChar().getTimeZhi(), '巳');
  t.diagnostic(shown[0]);
});
test('a failed recalculation discards the previous owner summary', () => {
  const oldBirth = {y:2026, m:2, d:10, hour:12, minute:0, city:beijing, gender:'m'};
  const old = run(oldBirth);
  const stale = {daily:{day:'2026-11-08', id:'old', chart:old.chart, result:old.result}};
  const getDaily = source.match(/^  function getDaily\(\) \{[\s\S]*?^  \}/m);
  assert.ok(getDaily);
  const result = vm.runInNewContext(getDaily[0] + '\n' + renderer[0] + '\n[getDaily(), panSummaryHTML()]', {
    A, window, esc, state:stale, todayKey:()=> '2026-11-08',
    ownRecord:()=>({id:'new', birth:{...oldBirth, city:{name:'失效城市', zone:'Asia/Shanghai'}}}),
    pad:n=>String(n).padStart(2, '0'), console:{error() {}}
  });
  assert.equal(result[0], null);
  assert.equal(result[1], '');
  assert.equal(stale.daily, null);
});

test('old records retain date and branch without invented clock time', () => {
  const {html} = run({y:1995,m:8,d:12,zhi:6,gender:'m'});
  const expected = Solar.fromYmdHms(1995,8,12,12,30,0).getLunar().getEightChar();
  assert.ok(html.includes('1995.08.12 ' + expected.getTimeZhi() + '时'));
  assert.doesNotMatch(html, /钟表|真太阳时|12:30/);
});

test('a corrected midnight crossing shows both dates', () => {
  const {html} = run({y:2026,m:11,d:8,hour:0,minute:30,city:urumqi,gender:'m'});
  const expected = Solar.fromYmdHms(2026,11,7,22,30,0).getLunar().getEightChar();
  assert.match(html,/2026\.11\.08 · 钟表 00:30 · 真太阳时 2026\.11\.07 \d\d:\d\d/);
  assert.ok(html.includes(expected.getTimeZhi() + '时 · 乌鲁木齐'));
});
