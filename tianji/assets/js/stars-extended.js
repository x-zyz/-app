/*
 * Modern rule tables adapted from chxb/shensha.
 * https://github.com/chxb/shensha/blob/main/LICENSE
 *
 * MIT License
 *
 * Copyright (c) 2024 chxb
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function (root) {
  'use strict';

  const branches = '子丑寅卯辰巳午未申酉戌亥';
  const yangStems = '甲丙戊庚壬';
  const yinStems = '乙丁己辛癸';
  const modern = 'https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js';
  const classics = 'https://zh.wikisource.org/wiki/三命通會/卷三';
  const modernVersion = '吉时雨规则（chxb/shensha）';
  const classicVersion = '《三命通会》卷三';

  const tianChu = { 丙: '巳', 丁: '午', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
  const tianDeHe = { 子: '申', 丑: '乙', 寅: '壬', 卯: '巳', 辰: '丁', 巳: '丙',
    午: '寅', 未: '己', 申: '戊', 酉: '亥', 戌: '辛', 亥: '庚' };
  const flyingBladeBasis = { 甲: '卯', 乙: '寅', 丙: '午', 丁: '未', 戊: '午',
    己: '未', 庚: '酉', 辛: '戌', 壬: '子', 癸: '丑' };
  const liuXia = { 甲: '酉', 乙: '戌', 丙: '未', 丁: '申', 戊: '巳',
    己: '午', 庚: '辰', 辛: '卯', 壬: '亥', 癸: '寅' };

  const seasons = [
    { name: '春', months: '寅卯辰', matches: '寅子' },
    { name: '夏', months: '巳午未', matches: '卯未辰' },
    { name: '秋', months: '申酉戌', matches: '寅子' },
    { name: '冬', months: '亥子丑', matches: '卯未辰' }
  ];
  const tongZiTones = { 金: '午卯', 木: '午卯', 水: '酉戌', 火: '酉戌', 土: '辰巳' };

  function shiftBranch(branch, offset) {
    const index = branches.indexOf(branch);
    return index < 0 ? '' : branches[(index + offset + 12) % 12];
  }

  function fromYearBranch(offset, direction) {
    return function (ctx, target) {
      const base = ctx.natal[0].zhi;
      return shiftBranch(base, offset) === target.zhi
        ? ['年支' + base + direction + ' → ' + target.label + '支' + target.zhi] : [];
    };
  }

  const rules = [
    {
      id: 'tian-chu', name: '天厨贵人', aliases: ['天厨'], category: '贵人', scope: 'any', common: true,
      version: modernVersion, source: modern + '#L190-L213', reference: '天厨贵人 · tianchu',
      description: '按年干、日干查地支。采用丙至癸的八组配支，甲、乙无配支。',
      match(ctx, target) {
        return [ctx.natal[0], ctx.natal[2]]
          .filter(base => tianChu[base.gan] === target.zhi)
          .map(base => base.label + '干' + base.gan + ' → ' + target.label + '支' + target.zhi);
      }
    },
    {
      id: 'san-qi', name: '三奇贵人', aliases: ['三奇'], category: '贵人', scope: 'natal', common: true,
      version: classicVersion + '顺布版', source: classics + '#论三奇', reference: '论三奇',
      description: '年、月、日或月、日、时三柱天干顺布乙丙丁或甲戊庚时，标注组成的三柱。',
      match(ctx, target, index) {
        const evidence = [];
        for (const start of [0, 1]) {
          if (index < start || index > start + 2) continue;
          const pillars = ctx.natal.slice(start, start + 3);
          const stems = pillars.map(pillar => pillar.gan).join('');
          if (stems === '乙丙丁' || stems === '甲戊庚') {
            evidence.push(pillars.map(pillar => pillar.label).join('、') + '三柱天干顺布' + stems);
          }
        }
        return evidence;
      }
    },
    {
      id: 'tian-de-he', name: '天德合', aliases: [], category: '贵人', scope: 'any', common: false,
      version: modernVersion, source: modern + '#L1451-L1476', reference: '天德合 · tiandehe',
      description: '按月支定天德合。寅、辰等月查天干，子、卯、午、酉月查地支。',
      match(ctx, target) {
        const month = ctx.natal[1].zhi;
        const symbol = tianDeHe[month];
        if (target.gan === symbol) return ['月支' + month + ' → ' + target.label + '干' + symbol];
        if (target.zhi === symbol) return ['月支' + month + ' → ' + target.label + '支' + symbol];
        return [];
      }
    },
    {
      id: 'fei-ren', name: '飞刃', aliases: [], category: '煞曜', scope: 'any', common: false,
      version: modernVersion + '十干版', source: modern + '#L1058-L1089', reference: '飞刃 · feiren',
      description: '按日干取该版本的刃位，再查刃位的六冲支。十干均有配支。',
      match(ctx, target) {
        const stem = ctx.natal[2].gan;
        const basis = flyingBladeBasis[stem];
        return basis && shiftBranch(basis, 6) === target.zhi
          ? ['日干' + stem + '的刃位' + basis + ' → 六冲见' + target.label + '支' + target.zhi] : [];
      }
    },
    {
      id: 'liu-xia', name: '流霞', aliases: ['流霞煞'], category: '煞曜', scope: 'any', common: false,
      version: modernVersion, source: modern + '#L1336-L1352', reference: '流霞 · liuxia',
      description: '按日干与地支的配对查流霞。',
      match(ctx, target) {
        const stem = ctx.natal[2].gan;
        return liuXia[stem] === target.zhi
          ? ['日干' + stem + ' → ' + target.label + '支' + target.zhi] : [];
      }
    },
    {
      id: 'gou-jiao', name: '勾绞煞', aliases: ['勾绞', '勾煞', '绞煞'], category: '煞曜', scope: 'any', common: false,
      version: classicVersion, source: classics + '#论勾绞', reference: '论勾绞',
      description: '按年干阴阳与性别定勾、绞方向，再从年支顺数或逆数三位查地支。',
      match(ctx, target) {
        const year = ctx.natal[0];
        const isYang = yangStems.includes(year.gan);
        if ((!isYang && !yinStems.includes(year.gan)) || !['m', 'f'].includes(ctx.gender)) return [];
        const forwardIsGou = isYang === (ctx.gender === 'm');
        const forward = shiftBranch(year.zhi, 3) === target.zhi;
        if (!forward && shiftBranch(year.zhi, -3) !== target.zhi) return [];
        const kind = forward === forwardIsGou ? '勾煞' : '绞煞';
        const polarity = (isYang ? '阳' : '阴') + (ctx.gender === 'm' ? '男' : '女');
        return ['年柱' + year.gz + '（' + polarity + '），年支' + year.zhi +
          (forward ? '顺' : '逆') + '数三位 → ' + target.label + '支' + target.zhi + '（' + kind + '）'];
      }
    },
    {
      id: 'tong-zi', name: '童子煞', aliases: ['童子'], category: '煞曜', scope: 'day-hour', common: false,
      version: modernVersion, source: modern + '#L1371-L1421', reference: '童子 · tongzi',
      description: '用月令季节及年柱纳音五行分别查本命日支、时支，任一口径符合即成立。',
      match(ctx, target) {
        const month = ctx.natal[1].zhi;
        const season = seasons.find(entry => entry.months.includes(month));
        const nayin = ctx.natal[0].nayin || '';
        const tone = nayin.slice(-1);
        const where = ' → ' + target.label + '支' + target.zhi;
        const evidence = [];
        if (season && season.matches.includes(target.zhi)) {
          evidence.push('月支' + month + '属' + season.name + '季' + where);
        }
        if (tongZiTones[tone] && tongZiTones[tone].includes(target.zhi)) {
          evidence.push('年柱纳音' + nayin + '属' + tone + where);
        }
        return evidence;
      }
    },
    {
      id: 'sang-men', name: '丧门', aliases: [], category: '煞曜', scope: 'any', common: false,
      version: classicVersion, source: classics + '#总论诸神煞', reference: '总论诸神煞 · 丧吊煞',
      description: '从年支顺数两位查丧门。',
      match: fromYearBranch(2, '顺数两位')
    },
    {
      id: 'diao-ke', name: '吊客', aliases: [], category: '煞曜', scope: 'any', common: false,
      version: classicVersion, source: classics + '#总论诸神煞', reference: '总论诸神煞 · 丧吊煞',
      description: '从年支逆数两位查吊客。',
      match: fromYearBranch(-2, '逆数两位')
    },
    {
      id: 'pi-ma', name: '披麻', aliases: [], category: '煞曜', scope: 'any', common: false,
      version: modernVersion, source: modern + '#L681-L726', reference: '披麻 · pima',
      description: '按该版本从年支逆数三位查披麻。',
      match: fromYearBranch(-3, '逆数三位')
    },
    {
      id: 'bing-fu', name: '病符', aliases: ['病符煞'], category: '煞曜', scope: 'any', common: false,
      version: classicVersion, source: classics + '#总论诸神煞', reference: '总论诸神煞 · 病符煞',
      description: '从年支逆数一位查病符。名称源自传统术数。',
      match: fromYearBranch(-1, '逆数一位')
    }
  ];

  if (typeof module === 'object' && module.exports) module.exports = rules;
  else root.TianjiExtendedStars = rules;
})(typeof globalThis === 'object' ? globalThis : this);
