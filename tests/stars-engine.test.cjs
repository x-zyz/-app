'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const Stars = require('../tianji/assets/js/stars.js');
const lunar = require('../tianji/assets/js/vendor/lunar.js');
require('../tianji/assets/js/astro.js');
const Astro = globalThis.Astro;

const gan = '甲乙丙丁戊己庚辛壬癸';
const zhi = '子丑寅卯辰巳午未申酉戌亥';
const gz = Array.from({length:60}, (_,i) => gan[i%10]+zhi[i%12]);
const pillar = (pair,label) => ({label,gz:pair,gan:pair[0],zhi:pair[1],nayin:lunar.LunarUtil.NAYIN[pair]});
const natal = pairs => pairs.map((pair,i)=>pillar(pair,'年月日时'[i]));
const fixture = natal(['丁亥','辛亥','戊辰','己未']);

test('registry has 53 unique, traceable entries and keeps scope categories', () => {
  assert.equal(Stars.rules.length,53);
  assert.equal(new Set(Stars.rules.map(r=>r.id)).size,53);
  for (const rule of Stars.rules) {
    assert.equal(Stars.byId(rule.id),rule);
    assert.equal(Stars.byName(rule.name),rule);
    assert.ok(Array.isArray(rule.aliases));
    assert.ok(rule.category && rule.description && rule.version && rule.reference);
    assert.match(rule.source,/^https:\/\//);
    assert.match(rule.scope,/^(any|natal|day|day-hour)$/);
  }
  assert.equal(Stars.byId('xunkong').category,'旬空');
  assert.ok(Stars.byId('kuigang').scope==='day');
});

const groups = [fixture, natal(['乙卯','丙寅','丁亥','庚戌']), natal(['甲子','戊辰','庚子','丙辰']),
  natal(['甲子','己酉','庚午','乙巳'])];
for (let n=0;n<720;n++) {
  groups.push(natal([gz[n%60],gz[(n*7+Math.floor(n/60))%60],
    gz[(n*13+Math.floor(n/60)*7)%60],gz[(n*17+Math.floor(n/60)*3)%60]]));
}
const contexts = groups.flatMap(pillars => ['m','f'].map(gender=>({natal:pillars,gender,scope:'natal'})));

for (const rule of Stars.rules) {
  test(rule.id+' · '+rule.name+' positive, negative and position gating', () => {
    let hit, miss;
    for (const ctx of contexts) {
      for (const [i,p] of ctx.natal.entries()) {
        if (!Stars.allowed(rule,'natal',i)) continue;
        if (rule.match(ctx,p,i).length) hit ||= [ctx,i];
        else miss ||= [ctx,i];
      }
      if (hit && miss) break;
    }
    assert.ok(hit,'positive example must be reachable');
    assert.ok(miss,'negative example must be reachable');
    for (const [item, expected] of [[hit,true],[miss,false]]) {
      const [ctx,i]=item;
      const results=Stars.evaluate(ctx,ctx.natal);
      const matches=results.filter(h=>h.id===rule.id&&h.pillars[0]===i);
      assert.equal(matches.length,Number(expected));
      if (expected) assert.ok(matches[0].src.length>0);
      assert.ok(results.filter(h=>h.id===rule.id).every(h=>Stars.allowed(rule,'natal',h.pillars[0])));
    }
    const ctx = {...hit[0],scope:'cycle'};
    if (rule.scope!=='any') {
      for (const pair of gz) assert.ok(!Stars.evaluate(ctx,[pillar(pair,'岁')]).some(h=>h.id===rule.id));
    }
  });
}

test('explicit variants: year + day origins, paired 德秀, red and blood tables', () => {
  const ctx={natal:fixture,gender:'m',scope:'natal'};
  const hits=Stars.evaluate(ctx,fixture);
  const get=(name,i)=>hits.find(h=>h.name===name&&h.pillars[0]===i);
  assert.match(get('天乙贵人',0).src,/年干丁/);
  assert.match(get('天乙贵人',3).src,/日干戊/);
  assert.match(get('空亡',3).src,/年柱丁亥/);
  assert.match(get('空亡',0).src,/日柱戊辰/);
  assert.equal(get('华盖',2),undefined);
  assert.ok(get('红艳煞',2));
  assert.equal(get('德秀贵人',0),undefined);
  const full=natal(['乙卯','己酉','庚午','丁亥']);
  assert.ok(Stars.evaluate({natal:full,gender:'m',scope:'natal'},full).some(h=>h.id==='dexiu'));
  const lone=natal(['丁卯','己酉','庚午','丁亥']);
  assert.ok(!Stars.evaluate({natal:lone,gender:'m',scope:'natal'},lone).some(h=>h.id==='dexiu'));
  const winter=natal(['甲子','乙丑','甲寅','丙子']);
  assert.ok(Stars.evaluate({natal:winter,gender:'f',scope:'natal'},winter).some(h=>h.id==='xueren'&&h.pillars[0]===3));
});

test('published modern profiles, including documented school differences', () => {
  // Replayed at pinned upstream revisions. Names below use Tianji's canonical aliases.
  const jishiyu=[
    ['天乙贵人','福星贵人','词馆','血刃','空亡','亡神'],
    ['天乙贵人','福星贵人','词馆','血刃','空亡','亡神'],
    ['太极贵人','红鸾','红艳煞','童子煞','元辰'],
    ['天乙贵人','太极贵人','月德合','华盖','金舆','空亡','童子煞']
  ];
  const chart=Astro.chart({y:2007,m:11,d:30,zhi:7,gender:'m'});
  assert.deepEqual(chart.pillars.map(p=>p.gz),fixture.map(p=>p.gz));
  for (const [i,expected] of jishiyu.entries()) {
    const actual=chart.shenSha.filter(h=>h.pillars[0]===i).map(h=>h.name).sort();
    const adjusted=expected.filter(name=>i!==1||name!=='词馆').sort();
    assert.deepEqual(actual,adjusted);
  }
  const later=Astro.chart({y:2007,m:11,d:30,zhi:8,gender:'m'});
  const tomorrow=Astro.chart({y:2007,m:12,d:1,zhi:7,gender:'m'});
  assert.notDeepEqual(later.shenSha,chart.shenSha);
  assert.notDeepEqual(tomorrow.shenSha,chart.shenSha);
  assert.notDeepEqual(Astro.cycleStars(chart,'己未'),Astro.cycleStars(chart,'甲子'));
});
