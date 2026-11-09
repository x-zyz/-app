
const fs=require('node:fs');
const E=require('../tianji/assets/js/stars.js');
const scopes={any:'四柱及岁运',natal:'仅四柱',day:'仅日柱', 'day-hour':'仅日、时柱'};
const guide=[
'# 天机 2.3 神煞规则',
'',
'本版共 53 项，常用视图包含其中 30 项，全部视图保留所有命中。用户清单中的名称均已覆盖，咸池、旬空等合并为别名。勾绞煞使用一个规则 ID，证据区分勾、绞。纳音、空亡、日柱格局标记等的底层类别仍分别记录。柱位、适用范围与命中依据由引擎返回。',
'',
'下表的出处列注明采用口径。每项完整查表或条件在 [原有规则与引擎](../tianji/assets/js/stars.js)、[日柱与特殊格局规则](../tianji/assets/js/stars-special.js) 或 [新增规则](../tianji/assets/js/stars-extended.js) 中，可用 ID 搜索。详情弹窗会另外说明本盘从哪个字起查、查到了哪个干支。',
'',
'| ID | 名称 | 分类 | 查法与出处 | 适用柱位 |',
'| --- | --- | --- | --- | --- |'
];
E.rules.forEach(r=>guide.push('| '+r.id+' | '+r.name+(r.aliases.length?'（'+r.aliases.join('、')+'）':'')+' | '+r.category+' | ['+r.reference+']('+r.source+')。'+r.version+' | '+scopes[r.scope]+' |'));
guide.push('', '## 口径与对照', '',
'- 公开对照案例为丁亥、辛亥、戊辰、己未。吉时雨与 chxb 规则结果分别命中 6、6、5、7 项。天机结果为 6、5、5、7 项。差项为月柱词馆，天机要求落柱纳音与年柱纳音同五行。',
'- 真一 2.0.2 在同一案例把德秀标在年柱、地网标在日柱。天机德秀要求至少一德干及一组完整秀干，地网要求纳音条件与辰巳并见。两个结果按各自配置解读。',
'- 红艳采用现代戊见辰、壬见子口径。《三命通会》另见戊见子、壬见巳。九丑采用《三命通会》乙卯版本，吉时雨以丁酉代乙卯。三奇采用《三命通会》顺布的乙丙丁、甲戊庚口径。空亡查年、日旬空。血刃含丑月见子。天厨采用吉时雨八干表，甲乙无配。童子采用该项目的日时口径。',
'- 扩展规则或替换某个 ID 的算法，可通过规则模块与引擎的 overrides 参数实现。目前设置只切换显示范围。',
'- 未纳入：三奇的辛壬癸变体、天厨十干异表、红艳古法异表、九丑丁酉异表、正学堂和正词馆单独标签。用户列出的规范名称均有规则。'
,'','### 公开来源快照','',
'- [chxb/shensha](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js)',
'- [吉时雨实际模块](https://github.com/chxb/jishiyu/blob/04302bf979e2f8ca6c51a94c7a49abfba15b4440/js/shensha.js)',
'- [真一 2.0.2 规则表](https://github.com/ZHENYI-ORG/Zhenyi-bazi/blob/383a726437a81db2b87eed517ef5e6ccd30b7bd4/src/data/shensha-rules.json)',
'', '## 测试', '',
'运行 node --test。包含每条规则的命中与不命中用例、柱位限制、流派差异、公开实现对照以及更换出生日期和时辰后的更新检查。');
fs.writeFileSync('docs/shensha.md',guide.join('\n')+'\n');
