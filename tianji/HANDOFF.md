# 天机 · 开发交接文档（Handoff）

> 交接对象：Codex / 后续开发者
> 版本：v1.0（versionCode 1）
> 最后更新：2026-11-08
> 作者：DeepSeek Harness 上一轮开发

---

## 1. 这是什么

「天机」是一个**离线安卓算命 App**：输入公历生辰与时辰，排出四柱八字，展示五行、十神、神煞、干支关系、大运与流年；另有每日运势与六十四卦求签。

- 包名：`app.tianji`
- 形态：**单 Activity + WebView**，界面是本地 HTML/CSS/JS（`file:///android_asset/`），无网络、无后端、无第三方 SDK。
- 体积：APK ≈ 0.19 MB（未压缩前的主要体积是 `lunar.js`，约 436 KB）。
- 权限：只申请 `VIBRATE`，没有 INTERNET / 存储 / 定位。
- 测试机：`127.0.0.1:16416`，SM-A5260（a52xq），Android 15 / API 35，1440×2560 @360dpi（即 640 CSS px 宽），竖屏锁定。

当前状态：**四柱 / 大运 / 流年 / 神煞 已完成并逐页截图验证；求签功能已实现但按用户要求“缓缓”，暂停继续打磨。**

---

## 2. 快速开始

```powershell
# 在源码根目录执行
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\build.ps1                # 编译 + 签名 + 安装到 127.0.0.1:16416 + 启动
.\build.ps1 -NoInstall     # 只出包
.\build.ps1 -Device 127.0.0.1:16384   # 换设备
```

产物：`tianji/build/tianji.apk`；签名用的 keystore 在仓库根目录 `tianji.keystore`（仅测试用，口令通过本机环境变量 `TIANJI_KEYSTORE_PASSWORD` 提供）。

工具链全部在 `tools/android-sdk/`（cmdline-tools + platform-tools + build-tools 35.0.0 + platforms;android-35），adb 来自 `C:\Program Files\AzurPilot\bootstrap\adb.exe`（不在 PATH，脚本里写死了路径）。

注意：**这台测试机其实没有 root**（`ro.build.type=user`，`su` 不存在，虽装了 KernelSU），所有实现都不依赖 root。

---

## 3. 目录结构

```
default-workspace/
├─ build.ps1                     # 一手包办：aapt2→javac→d8→打包→对齐→签名→安装
├─ tianji.keystore               # 测试签名
├─ tianji/
│  ├─ AndroidManifest.xml
│  ├─ java/app/tianji/MainActivity.java
│  ├─ res/…                      # 主题、图标（adaptive + 5 套 png）
│  ├─ assets/
│  │  ├─ index.html              # 应用外壳（顶栏 / #view / 底部 tab / splash）
│  │  ├─ css/app.css             # 全部样式（约 560 行）
│  │  ├─ js/vendor/lunar.js      # lunar-javascript 1.7.8（MIT）
│  │  ├─ js/data/hexagrams.js    # 六十四卦数据（卦辞/解签/吉凶/爻画）
│  │  ├─ js/astro.js             # 命理引擎（约 485 行）
│  │  └─ js/app.js               # 视图 / 路由 / 交互（约 760 行）
│  └─ screenshots/               # 验收截图
└─ tools/
   ├─ cdp.cjs                    # 通过 WebView DevTools 协议在页面里执行 JS（调试利器）
   ├─ make_icons.py              # Pillow 生成启动图标
   └─ patch*.cjs / viewchart.js  # 开发期一次性补丁脚本，可删
```

---

## 4. 架构与数据流

```
MainActivity(WebView, 竖屏, edge-to-edge)
   │  file:///android_asset/index.html
   ▼
index.html ── app.css
   │
   ├─ lunar.js        → 暴露全局 Solar / Lunar / LunarYear …（UMD 会把每个类挂到 window 上，
   │                    注意没有 window.Lunar 这个命名空间对象）
   ├─ hexagrams.js    → window.HEXAGRAMS
   ├─ astro.js        → window.Astro（纯函数，不碰 DOM）
   └─ app.js          → 渲染、状态、事件
```

**单向数据流**：`state`（内存）+ `localStorage` → `render()` 重建 `#view` 的 innerHTML → 事件委托（`document` 上监听 `[data-tab]` / `[data-act]` / `[data-yun]` / `[data-year]`）。

没有框架、没有构建工具、没有 ES module（`file://` 下 module 会被 CORS 拦）。所有脚本按顺序 `<script>` 引入，用全局命名空间通信。

### 4.1 原生壳（MainActivity.java）

| 能力 | 说明 |
|---|---|
| 竖屏锁定 | `android:screenOrientation="portrait"` |
| 全屏绘制 | `setDecorFitsSystemWindows(false)`，状态栏/导航栏透明 |
| 安全区 | `setOnApplyWindowInsetsListener` 把 insets 换算成 dp 后注入 `window.__insets`，并派发 `insets` 事件；前端写入 CSS 变量 `--sat / --sab` |
| JS 桥 | `Android.vibrate(ms)` / `Android.toast(msg)` / `Android.exitApp()` / `Android.platform()` |
| 返回键 | `onBackPressed()` → `window.__onBack()`：返回 `true` 表示前端处理了（关弹层 / 回首页），否则 `finish()` |
| 调试 | `WebView.setWebContentsDebuggingEnabled(true)`；console 输出打到 logcat tag `Tianji` |

### 4.2 状态与存储

```js
state = { tab, birth, chart, daily, draw, shaking, pref, yunIdx }
K_BIRTH = 'tj.birth'   // { y, m, d, zhi, gender:'m'|'f' }
K_DRAW  = 'tj.draw'    // { date, n, count, hex }
K_PREF  = 'tj.pref'    // { vibrate: true }
```

`chart` / `daily` 是派生缓存，改生辰时置空重算（`state.chart = null`）。

---

## 5. 命理引擎（astro.js）

### 5.1 对外 API

```js
Astro.chart({y, m, d, zhi, gender}) → chart
Astro.daily(chart, date, birth)     → 今日运势
Astro.liunian(chart, year, yunIdx)  → 单个流年
Astro.relations(pillars[])          → 刑冲合害数组（命局/大运/流年共用）
Astro.changSheng(gan, zhi)          → 十二长生
Astro.xunKong(gz)                   → 旬空两支
Astro.shiShen(dayGan, otherGan)     → 十神
```

`zhi` 是 0–11 的时辰序号（子=0…亥=11），内部取 `ZHI_HOUR[zhi] + 0.5` 小时。

### 5.2 chart 对象结构

```js
{
  solar:{y,m,d,zhi},
  lunar:{text, year, month, day, shengxiao},
  xingzuo,
  pillars:[ { label:'年|月|日|时', gan, zhi, gz, ganWx, zhiWx,
              hide:[…藏干], nayin, shiShenGan, shiShenZhi:[…], isDay } ],
  dayMaster:{ gan, wx, yy },
  counts, pct, total,                       // 五行加权与百分比
  strength:{ label:'身强|身弱|中和', ratio, verdict },
  favorable:{ use:[…], avoid:[…], why },
  missing:[…],                              // 权重 < 0.9 视为缺
  taiYuan, mingGong,
  shenSha:[ { name, pillars:[0..3], src } ],
  relations:[ { kind, text, pair } ],       // 如 {kind:'害', text:'申亥 相害', pair:'年月'}
  kong:[…],                                 // 旬空
  changSheng:[…],                           // 每柱本气天干对该柱地支的十二长生
  yun:{ startYear, startMonth,
        list:[ {gz, start, end, age, ss, stage} ] },
  jieQi:{ prev, prevDate, next, nextDate }
}
```

### 5.3 计算逻辑（按顺序）

1. **历法/八字**：`Solar.fromYmdHms(...)` → `getLunar()` → `getEightChar()`，月柱按节气（lunar 默认），年柱按立春。大运 `ec.getYun(gender==='f'?0:1)`。
2. **五行权重**：天干 1.0（月干 1.35），地支 1.15（月支 2.2），藏干本气 +0.35、中余气 +0.15；归一化成百分比。
3. **身强弱**：`support = 比劫 + 印`，`drain = 食伤 + 财 + 官`；`ratio ≥ 0.56 → 身强`，`≤ 0.44 → 身弱`，否则中和。
4. **喜用**：身弱取「印、比」；身强取「食伤/财/官中较少的两类」；中和取最弱五行 + 生我者。这是**启发式**，不是严格旺衰/格局法。
5. **十二长生**：每柱用**本柱天干**起长生（阳顺阴逆），不是按日干——这点踩过坑，已修正。
6. **旬空**：由日柱干支反推旬首，取其后两位地支。
7. **神煞**：见 5.4。
8. **关系**：见 5.5。
9. **大运**：取前 10 步，补 `ss`（十神）与 `stage`（日主临运支的十二长生）。

### 5.4 神煞（18 种）

取用基准写在每条 `src` 字段里，界面上直接展示，便于按流派调整：

| 神煞 | 取用 | 说明 |
|---|---|---|
| 天乙贵人 | 日干 | 甲戊庚→丑未；乙己→子申；丙丁→亥酉；壬癸→卯巳；辛→午寅 |
| 天德贵人 | 月支 | 可为天干或地支，两种都查 |
| 月德贵人 | 月支 | 三合局取干（寅午戌→丙…） |
| 文昌贵人 | 日干 | 甲巳乙午丙申丁酉戊申己酉庚亥辛子壬寅癸卯 |
| 太极贵人 | 日干 | 甲乙子午、丙丁卯酉、戊己辰戌丑未、庚辛寅亥、壬癸巳申 |
| 国印贵人 | 日干 | 甲戌乙亥丙丑丁寅戊丑己寅庚辰辛巳壬未癸申 |
| 禄神 | 日干 | 甲寅乙卯丙巳丁午戊巳己午庚申辛酉壬亥癸子 |
| 羊刃 | 日干 | **只取阳干**：甲卯丙午戊午庚酉壬子 |
| 金舆 | 日干 | 甲辰乙巳丙未丁申戊未己申庚戌辛亥壬丑癸寅 |
| 桃花 | 年支 + 日支（三合局） | 申子辰→酉、寅午戌→卯、巳酉丑→午、亥卯未→子 |
| 驿马 | 同上 | 申子辰→寅、寅午戌→申、巳酉丑→亥、亥卯未→巳 |
| 华盖 | 同上 | 申子辰→辰、寅午戌→戌、巳酉丑→丑、亥卯未→未 |
| 将星 | 同上 | 申子辰→子、寅午戌→午、巳酉丑→酉、亥卯未→卯 |
| 红鸾 / 天喜 | 年支 | 红鸾由年支查，天喜取红鸾对冲 |
| 孤辰 / 寡宿 | 年支 | 亥子丑→寅/戌…（三会局） |
| 空亡 | 日柱旬空 | 落在哪一柱就标哪一柱 |

结果按固定优先级排序，UI 自动渲染成「神煞名 / 取用来源 / 落在哪柱」。

### 5.5 干支关系（relations）

四柱 + 任意附加柱（大运 `label:'运'`、流年 `label:'流'`）两两比较：

- 地支：**六合、六冲、相害、相刑/自刑**（含 寅巳申 三刑、丑戌未 三刑）
- 天干：**五合、相冲**
- 全局：**三合局、三会局**
- 输出 `{kind, text, pair}`；`relChips()` 负责按 text 去重计数（同一组冲出现在两柱时显示「×2」，避免看起来像重复 bug）。

### 5.6 流年

```js
Astro.liunian(chart, 2026, yunIdx)
// → { year, gz, ss, stage, rels:[与命局], yunRel:[与大运], note }
```

- 年干支：`LunarYear.fromYear(year).getGanZhi()`（按农历年，**不是立春分界**，见第 8 节）。
- 与原局四柱算关系，只保留涉及「流」的项。
- 与大运算一对关系。
- `note` 规则：岁运并临 → 「吉凶加倍」；冲日支 → 「迁移/感情之变」；冲月令 → 「工作环境变动」；有合 → 「人事和顺」；刑害 → 「防口舌暗耗」。

### 5.7 今日运势（daily）

当日干支 + 日主 → 十神 → 基调；`hash(日干支|日主|日期)` 作为种子（mulberry32）产生稳定的随机扰动，保证同一天多次打开结果一致。分数 = 68 + 十神修正 + 喜用命中 ± 抖动，四维（事业/财运/感情/健康）按十神再修正。宜忌合并了关系模板与 lunar 的 `getDayYi()/getDayJi()`。

这是**娱乐化模型**，不是严肃命理推断，文案里也写了「仅供文化娱乐与自我观照」。

---

## 6. 界面与交互

### 6.1 视觉规范

- 底色 `#05060A`，金色 `#C9A461` / 高光 `#F0DCAE`，正文 `#E9E3D6`，朱砂 `#B4463B`（印章），玉色 `#7FA99B`（宜）。
- 标题用 **Noto Serif CJK SC**（设备自带），正文 Noto Sans CJK；字距普遍偏大（`.2em~.3em`）营造碑刻感。
- 背景三层：`canvas#stars`（约 60 个呼吸星点，40fps 节流）+ 径向金色辉光 + 细噪点。
- 卡片：半透明白 + 金色 1px 边 + 顶部高光线 + 大圆角 16px；`corner` 角标只在需要时用。
- 动效：页面 `rise`（淡入上移 14px）、分数 count-up、进度条宽度过渡、答签 1.5s 摇筒。

### 6.2 页面

| Tab | 内容 |
|---|---|
| 今日 | 未排盘：空状态 + 起盘 CTA。已排盘：运势环（0–100）、关键词、四维条、幸运色/数/方位、宜忌（含冲煞）、命盘摘要卡、快捷入口、页脚「命由己造 · 相由心生」 |
| 排盘 | 见 6.3 |
| 求签 | 签筒（9 根签 + 摇动动画）→ 结果卡（卦象爻画、卦名、吉凶、卦辞、解签、谋事/求财/问情、收签/再求）。每日 3 签，结果按日期+生辰做确定性种子，可跨天留存 |
| 我的 | 头像（日主天干）、生辰、日主/强弱/起运三格、出生信息修改、震动开关、关于、清除记录（二次确认）、免责声明 |

### 6.3 排盘页结构（本轮的开发重点）

1. 盘头：乾造/坤造 + 公历生辰 + 农历/生肖/星座
2. 四柱表（7 行）：十神 / 天干 / 地支（旬空标「空」）/ 藏干 / 副星（藏干十神）/ 纳音 / 十二长生
3. 五行：五行百分比条 + 「缺 X」
4. 日主：日主 + 强弱 + 喜用忌 + 一句解释
5. 干支关系：彩色 chips（合=玉、冲/刑=朱、害=灰）
6. 神煞：列表（神煞名 / 取用来源 / 落在哪柱的方章）
7. 大运：横向滚动 10 步，显示干支、十神、起止年份；当前运带金点，选中态高亮；下方一行「辛巳大运 · 23–32岁 · 七杀 · 日主临沐浴」+ 大运与命局的冲合 chips
8. 流年：当前选中大运下的 10 年网格（年份/干支/十神，今年金色描边），点任意一格弹「流年详情」
9. 其他：胎元、命宫、旬空、节气
10. 重新排盘

### 6.4 弹层（sheet）

统一从底部升起，遮罩可点关闭。`sheetStack` 维护栈，返回键逐层关闭。

- 录入生辰：日期行（点开日期滚轮）+ 12 时辰网格 + 乾造/坤造分段 + 起盘
- 日期滚轮：年/月/日三列 `scroll-snap`，中间 44px 选中带，月/年变化时重建「日」列
- 流年详情：大字干支 + 十神/十二长生/虚岁/大运 + 与命局 chips + 与大运 chips + 短评
- 关于 / 清除确认

### 6.5 返回键行为

`window.__onBack()`：有弹层先关 → 不在首页则回首页 → 返回 `false` 交给原生 `finish()`。

---

## 7. 用户操作手册

### 首次使用

1. 打开「天机」→ 启动动画（约 1.4s）→ 今日页显示「未排命盘」。
2. 点 **起盘**（或底部「盘」→「录入生辰」）。
3. 选择公历生日（点日期行 → 滚轮选年月日 → 确定）。
4. 选时辰（12 个格子，如「午时 11-13」），选性别（乾造/坤造，决定大运顺逆）。
5. 点 **起盘** 保存。

### 看命盘

1. 底部「盘」：从上往下依次是四柱、五行、日主、干支关系、神煞、大运、流年、胎元命宫。
2. 点某个大运 → 下方流年切换成该十年的年份。
3. 点某个流年 → 弹出详情：十神、十二长生、虚岁、与大运关系、与命局冲合、一句提示。
4. 想改生辰：底部「我」→ 出生信息，或排盘页底部「重新排盘」。

### 看今日运势

底部「今」：分数环、四维、幸运色/数/方位、宜忌、冲煞；下方命盘摘要可快速回顾四柱。

### 求签（已实现，暂不迭代）

底部「签」→ 摇一签（签筒抖动 + 震动反馈）→ 结果卡；「再求一签」每天最多 3 次，「收签」清空当天结果。

### 其他

- 「我」→ 震动反馈开关；关于天机（方法论说明）；清除记录（删生辰与签文，二次确认）。
- 系统返回键：先关弹层，再回首页，再退出。

---

## 8. 已知限制与待办

| 项 | 现状 | 建议 |
|---|---|---|
| 求签 | 64 卦数据、每日三签、动画都已完成 | 用户要求暂停；后续可补「摇签音效/分享/签文收藏」 |
| 真太阳时 | 未做经度/均时差修正，只有 12 时辰 | 若要专业向，引入出生地经度 + 均时差 |
| 早/晚子时 | 未区分，用 lunar 默认 | 可加 sect 选项 |
| 流年分界 | 用农历年干支（`LunarYear`），非立春 | 换 `Solar` 立春判断即可，注意跨年 1–2 月 |
| 起运显示 | 大运格子显示起止年份，说明行显示虚岁区间 | 起运精确到月，与首运虚岁会差 1 左右，已在 UI 规避 |
| 强弱/喜用 | 五行权重 + 阈值启发式 | 可扩展为月令旺衰、通根、格局法 |
| 神煞 | 18 种，取用基准已标注 | 各派不同，按需增删；加新神煞只需改表和 `shenSha()` |
| 大运/流年关系 | 只有合冲刑害文字提示 | 可加十神组合断语、流月 |
| 无网络 | 完全离线，无分享/云同步 | 如需分享，用 `Android.toast` 或加导出图片 |
| 性能 | 每次切页重建 innerHTML，数据量小无感 | 若加长列表再考虑虚拟滚动 |

---

## 9. 开发期踩过的坑（对 Codex 很重要）

1. **aapt2 在 Windows 下把 assets 写成反斜杠**：`aapt2 link -A` 产出的条目是 `assets/css\app.css`，WebView 请求 `assets/css/app.css` 全部 404，页面无样式。
   → 解法：`link` 时**不要**传 `-A`，改在 `build.ps1` 里用 `ZipArchive` 手动写入，路径统一 `Replace('\','/')`。
2. **PowerShell 执行策略**：直接 `.\build.ps1` 会被拦；需 `Set-ExecutionPolicy -Scope Process Bypass`（每次新进程都要）。
3. **`$ErrorActionPreference='Stop'` + 原生程序 stderr**：javac 的 deprecation note 会变成 `NativeCommandError` 直接中断。已改为 `Continue` + 显式检查 `$LASTEXITCODE`。
4. **UTF-8 BOM**：`Set-Content` 会写 BOM，`javac` 报 `illegal character '\ufeff'`。改用 `[System.IO.File]::WriteAllText(path, text, New-Object System.Text.UTF8Encoding($false))`。
5. **`getWindow().getInsetsController()` NPE**：decorView 还没创建。先 `w.getDecorView()` 再取 controller。
6. **PowerShell splatting**：`@srcs` 对原生 exe 不生效，会传字面量 `:`；用 `$srcs`。
7. **lunar.js 的全局导出**：UMD 会把 `Solar`、`Lunar` 等**逐个挂到 window**，没有 `window.Lunar` 命名空间；Node `require()` 才返回命名空间对象。`astro.js` 已按环境分支处理。
8. **设备密度**：1440×2560 @360dpi = 640 CSS px 宽，不是常见 360–430，布局用了 `max-width: 560px` 居中，别按 360 的直觉调字号。
9. **WebView 调试**：
   ```powershell
   $pid = (adb shell pidof app.tianji).Trim()
   adb forward tcp:9222 localabstract:webview_devtools_remote_$pid
   node tools/cdp.cjs "document.querySelector('[data-tab=chart]').click()"
   ```
   `tools/cdp.cjs` 会连 `http://127.0.0.1:9222/json` 并在页面里 eval，比反复算坐标点屏幕快得多。
10. **截图**：`adb shell screencap -p /sdcard/s.png` + `adb pull`（不要用管道重定向，二进制会坏）。
11. **PowerShell 里写中文 JS**：`node -e "…"` 很容易被引号和 `||` 打断，改文件请用 `write`/`edit` 工具或独立的 `.cjs` 脚本。

---

## 10. 扩展指南

### 加一个神煞

1. 在 `astro.js` 顶部加映射表；
2. 在 `shenSha()` 里用 `byZhi(name, [...], '取用来源')` 或 `byGan(...)`；
3. 把名字加进 `order` 数组控制排序；
4. UI 自动渲染，无需改 app.js。

### 加流年字段

在 `liunian()` 的返回对象里加字段 → `liunianSheet()` 里补一行 `.krow`。

### 加页面

`viewXxx()` + `render()` 分支 + `index.html` 的 tab 按钮（`data-tab`）。

### 改配色

`app.css` 顶部 `:root` 变量集中控制；五行颜色在 `astro.js` 的 `WX_COLOR`。

### 本地自测（无设备）

```powershell
node -e "require('./tianji/assets/js/data/hexagrams.js');require('./tianji/assets/js/astro.js');const A=globalThis.Astro;console.log(A.chart({y:1995,m:8,d:12,zhi:6,gender:'m'}))"
```

已知命例：`1995-08-12 午时`（男）→ `乙亥 甲申 乙亥 壬午`，旬空申酉，月支申空亡，申亥相害、亥亥自刑，起运 1 岁 4 月。

---

## 11. 验收记录

均在该模拟器上截图确认：

- 首页（运势环 / 四维 / 宜忌 / 命盘摘要）：`screenshots/home.png`
- 四柱 + 副星 + 长生 + 五行 + 日主：`screenshots/bazi.png`
- 神煞 / 大运 / 流年网格：`screenshots/dayun-liunian.png`
- 流年详情弹层：`screenshots/liunian-detail.png`
- 我的：`screenshots/me.png`

引擎断言（Node）：四柱、十二长生、旬空、神煞落柱、三合/冲刑、大运十神、流年关系均已对过；另用女命 `1992-03-05 子时`（壬申 壬寅 庚辰 丙子）交叉验证申子辰合水、寅申冲刑、驿马华盖将星禄神定位。

---

## 12. 交接清单

- [x] 可构建、可安装、可启动（`build.ps1` 一键）
- [x] 四柱八字：十神、藏干、副星、纳音、十二长生、旬空
- [x] 五行分布、日主强弱、喜用忌
- [x] 干支关系：六合/三合/三会/六冲/三刑/相害/天干合冲
- [x] 神煞 18 种（含取用来源与落柱）
- [x] 大运 10 步（可选中、当前标识、与命局冲合）
- [x] 流年 10 年（详情：十神/长生/虚岁/岁运关系）
- [x] 每日运势（确定性种子，离线）
- [x] 求签 64 卦（已实现，暂停迭代）
- [x] 生辰录入（滚轮 + 时辰 + 性别）、修改、清除
- [x] 返回键、安全区、震动反馈、关于页
- [ ] 真太阳时 / 早晚子时 / 流月 / 格局法（未做）
- [ ] 求签的后续打磨（未做）
