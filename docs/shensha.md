# 天机 2.3 神煞规则

本版共 53 项，常用视图包含其中 30 项，全部视图保留所有命中。用户清单中的名称均已覆盖，咸池、旬空等合并为别名。勾绞煞使用一个规则 ID，证据区分勾、绞。纳音、空亡、日柱格局标记等的底层类别仍分别记录。柱位、适用范围与命中依据由引擎返回。

下表的出处列注明采用口径。每项完整查表或条件在 [原有规则与引擎](../tianji/assets/js/stars.js)、[日柱与特殊格局规则](../tianji/assets/js/stars-special.js) 或 [新增规则](../tianji/assets/js/stars-extended.js) 中，可用 ID 搜索。详情弹窗会另外说明本盘从哪个字起查、查到了哪个干支。

| ID | 名称 | 分类 | 查法与出处 | 适用柱位 |
| --- | --- | --- | --- | --- |
| tianyi | 天乙贵人 | 贵人 | [论天乙贵人；年干与日干并查](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| taiji | 太极贵人 | 贵人 | [卷十三·太极贵；天机沿用辛庚、壬癸合组表](https://zh.wikisource.org/zh-hant/五行精紀)。tianji-2.2 | 四柱及岁运 |
| fuxing | 福星贵人 | 贵人 | [卷十三·福星贵；年干与日干并查](https://zh.wikisource.org/zh-hant/五行精紀)。tianji-2.2 | 四柱及岁运 |
| tiande | 天德贵人 | 贵人 | [论天月德](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| yuede | 月德贵人 | 贵人 | [论天月德](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| yuede-he | 月德合 | 贵人 | [天机沿用月德天干取五合](https://github.com/x-zyz/-app/blob/v2.2/tianji/assets/js/astro.js)。tianji-2.2 | 四柱及岁运 |
| dexiu | 德秀贵人 | 贵人 | [德秀表；至少一德干、至少一组秀干齐备，仅标对应落柱](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js)。tianji-2.3-paired | 四柱及岁运 |
| wenchang | 文昌贵人 | 贵人 | [天机日干查支表](https://github.com/x-zyz/-app/blob/v2.2/tianji/assets/js/astro.js)。tianji-2.2 | 四柱及岁运 |
| guoyin | 国印贵人 | 贵人 | [天机日干查支表](https://github.com/x-zyz/-app/blob/v2.2/tianji/assets/js/astro.js)。tianji-2.2 | 四柱及岁运 |
| xuetang | 学堂 | 禄与特殊格局 | [论学堂词馆；纳音同类正位法](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| ciguan | 词馆 | 禄与特殊格局 | [论学堂词馆；纳音同类正位法](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| lu | 禄神（建禄位） | 禄与特殊格局 | [论十干禄](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| jinyu | 金舆 | 禄与特殊格局 | [论金舆](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| taohua | 桃花（咸池） | 婚恋与人际 | [论咸池；年支与日支并查](https://zh.wikisource.org/zh-hant/三命通會/卷二)。tianji-2.2 | 四柱及岁运 |
| hongyan | 红艳煞（红艳） | 婚恋与人际 | [红艳煞表；现代戊辰、壬子口径](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js)。tianji-2.2 | 四柱及岁运 |
| hongluan | 红鸾 | 婚恋与人际 | [天机按年支查红鸾表](https://github.com/x-zyz/-app/blob/v2.2/tianji/assets/js/astro.js)。tianji-2.2 | 四柱及岁运 |
| tianxi | 天喜 | 婚恋与人际 | [天机以红鸾对宫为天喜](https://github.com/x-zyz/-app/blob/v2.2/tianji/assets/js/astro.js)。tianji-2.2 | 四柱及岁运 |
| yima | 驿马 | 行动与刑伤 | [论驿马；年支与日支并查](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| huagai | 华盖 | 禄与特殊格局 | [论将星华盖；年支日支并查且不以起查柱匹配自身](https://zh.wikisource.org/zh-hant/三命通會/卷二)。tianji-2.2 | 四柱及岁运 |
| jiangxing | 将星 | 禄与特殊格局 | [论将星华盖；年支与日支并查](https://zh.wikisource.org/zh-hant/三命通會/卷二)。tianji-2.2 | 四柱及岁运 |
| yangren | 羊刃（阳刃） | 行动与刑伤 | [论羊刃；五阳干取刃](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| guchen | 孤辰 | 婚恋与人际 | [论孤辰寡宿；年支三会组后一支](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| guasu | 寡宿 | 婚恋与人际 | [论孤辰寡宿；年支三会组前一支](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| xunkong | 空亡（旬空） | 旬空 | [空亡；按本命年柱、日柱旬空查目标地支](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js)。tianji-2.3-year-day | 四柱及岁运 |
| jiesha | 劫煞 | 行动与刑伤 | [论劫煞亡神；年支与日支并查](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| zaisha | 灾煞 | 行动与刑伤 | [论灾煞；年支与日支并查](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| wangshen | 亡神 | 行动与刑伤 | [论劫煞亡神；年支与日支并查](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| xueren | 血刃 | 行动与刑伤 | [论血刃杀；含十二月建丑见子](https://www.shidianguji.com/zh/book/NGJ8922642210287/chapter/1lnh0qifvq0j2)。tianji-2.2 | 四柱及岁运 |
| yuanchen | 元辰 | 行动与刑伤 | [论元辰；阳男阴女顺一、阴男阳女逆一](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| liue | 六厄 | 其他 | [论六厄；仅查年支三合五行死位](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| tianluo | 天罗 | 行动与刑伤 | [论天罗地网；火年命见戌亥](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| diwang | 地网 | 行动与刑伤 | [论天罗地网；水土年命见辰巳](https://zh.wikisource.org/zh-hant/三命通會/卷三)。tianji-2.2 | 四柱及岁运 |
| kuigang | 魁罡（魁罡日） | 格局 | [《三命通会》卷六·魁罡](https://zh.wikisource.org/wiki/三命通會/卷六#魁罡)。《三命通会》四日表 | 仅日柱 |
| jinshen | 金神 | 格局 | [chxb/shensha · 金神（jinshen）](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js#L521-L531)。近现代 chxb/shensha 日时查法 | 仅日、时柱 |
| ten-spirit-days | 十灵日（十灵） | 才学 | [chxb/shensha · 十灵日（shiling）](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js#L1255-L1272)。近现代 chxb/shensha 十日表 | 仅日柱 |
| six-elegance-days | 六秀日（六秀） | 才学 | [Astral Nexus · 六秀对应哪六个日柱](https://www.astralnex.com/wiki/zh-hans/bazi/fate-stars/six-elegance)。近现代流传表（Astral Nexus 所列） | 仅日柱 |
| heavenly-pardon | 天赦（天赦日） | 福德 | [《三命通会》卷三·论天月德](https://zh.wikisource.org/wiki/三命通會/卷三#論天月德)。《三命通会》四季日表 | 仅日柱 |
| guluan | 孤鸾（孤鸾煞、孤鸾寡鹊煞） | 关系 | [《三命通会》卷三·总论诸神煞·孤鸾寡鹊煞](https://zh.wikisource.org/wiki/三命通會/卷三#總論諸神煞)。《三命通会》八日表 | 仅日柱 |
| yin-yang-mismatch | 阴差阳错（阴差阳错日、阴阳差错、阴阳差错煞） | 关系 | [《三命通会》卷三·总论诸神煞·阴阳差错煞](https://zh.wikisource.org/wiki/三命通會/卷三#總論諸神煞)。《三命通会》十二日表（日柱） | 仅日柱 |
| four-wastes | 四废（四废日、正四废） | 杂曜 | [《永乐大典》卷二〇一二二·正四废](https://zh.wikisource.org/wiki/Page:永樂大典20122.pdf/4)。《永乐大典》正四废表 | 仅日柱 |
| ten-great-defeats | 十恶大败（十恶大败日） | 杂曜 | [chxb/shensha · 十恶大败（shiedabai）](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js#L1145-L1170)。chxb/shensha 十日表（日柱） | 仅日柱 |
| nine-uglies | 九丑（九丑日） | 关系 | [《三命通会》卷三·总论诸神煞·淫欲妨害煞](https://zh.wikisource.org/wiki/三命通會/卷三#總論諸神煞)。《三命通会》九日表（乙卯本） | 仅日柱 |
| tian-chu | 天厨贵人（天厨） | 贵人 | [天厨贵人 · tianchu](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js#L190-L213)。吉时雨规则（chxb/shensha） | 四柱及岁运 |
| san-qi | 三奇贵人（三奇） | 贵人 | [论三奇](https://zh.wikisource.org/wiki/三命通會/卷三#论三奇)。《三命通会》卷三顺布版 | 仅四柱 |
| tian-de-he | 天德合 | 贵人 | [天德合 · tiandehe](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js#L1451-L1476)。吉时雨规则（chxb/shensha） | 四柱及岁运 |
| fei-ren | 飞刃 | 煞曜 | [飞刃 · feiren](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js#L1058-L1089)。吉时雨规则（chxb/shensha）十干版 | 四柱及岁运 |
| liu-xia | 流霞（流霞煞） | 煞曜 | [流霞 · liuxia](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js#L1336-L1352)。吉时雨规则（chxb/shensha） | 四柱及岁运 |
| gou-jiao | 勾绞煞（勾绞、勾煞、绞煞） | 煞曜 | [论勾绞](https://zh.wikisource.org/wiki/三命通會/卷三#论勾绞)。《三命通会》卷三 | 四柱及岁运 |
| tong-zi | 童子煞（童子） | 煞曜 | [童子 · tongzi](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js#L1371-L1421)。吉时雨规则（chxb/shensha） | 仅日、时柱 |
| sang-men | 丧门 | 煞曜 | [总论诸神煞 · 丧吊煞](https://zh.wikisource.org/wiki/三命通會/卷三#总论诸神煞)。《三命通会》卷三 | 四柱及岁运 |
| diao-ke | 吊客 | 煞曜 | [总论诸神煞 · 丧吊煞](https://zh.wikisource.org/wiki/三命通會/卷三#总论诸神煞)。《三命通会》卷三 | 四柱及岁运 |
| pi-ma | 披麻 | 煞曜 | [披麻 · pima](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js#L681-L726)。吉时雨规则（chxb/shensha） | 四柱及岁运 |
| bing-fu | 病符（病符煞） | 煞曜 | [总论诸神煞 · 病符煞](https://zh.wikisource.org/wiki/三命通會/卷三#总论诸神煞)。《三命通会》卷三 | 四柱及岁运 |

## 口径与对照

- 公开对照案例为丁亥、辛亥、戊辰、己未。吉时雨与 chxb 规则结果分别命中 6、6、5、7 项。天机结果为 6、5、5、7 项。差项为月柱词馆，天机要求落柱纳音与年柱纳音同五行。
- 真一 2.0.2 在同一案例把德秀标在年柱、地网标在日柱。天机德秀要求至少一德干及一组完整秀干，地网要求纳音条件与辰巳并见。两个结果按各自配置解读。
- 红艳采用现代戊见辰、壬见子口径。《三命通会》另见戊见子、壬见巳。九丑采用《三命通会》乙卯版本，吉时雨以丁酉代乙卯。三奇采用《三命通会》顺布的乙丙丁、甲戊庚口径。空亡查年、日旬空。血刃含丑月见子。天厨采用吉时雨八干表，甲乙无配。童子采用该项目的日时口径。
- 扩展规则或替换某个 ID 的算法，可通过规则模块与引擎的 overrides 参数实现。目前设置只切换显示范围。
- 未纳入：三奇的辛壬癸变体、天厨十干异表、红艳古法异表、九丑丁酉异表、正学堂和正词馆单独标签。用户列出的规范名称均有规则。

### 公开来源快照

- [chxb/shensha](https://github.com/chxb/shensha/blob/5b90110e55feb92303ef7853ecacdb6f9ed59eac/shensha.js)
- [吉时雨实际模块](https://github.com/chxb/jishiyu/blob/04302bf979e2f8ca6c51a94c7a49abfba15b4440/js/shensha.js)
- [真一 2.0.2 规则表](https://github.com/ZHENYI-ORG/Zhenyi-bazi/blob/383a726437a81db2b87eed517ef5e6ccd30b7bd4/src/data/shensha-rules.json)

## 测试

运行 node --test。包含每条规则的命中与不命中用例、柱位限制、流派差异、公开实现对照以及更换出生日期和时辰后的更新检查。
