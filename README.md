# 天机（Tianji）· 源码包

离线安卓算命 App：四柱八字、五行十神、神煞、大运流年、每日运势、六十四卦求签。

- 完整开发交接文档：见 `HANDOFF.md`（架构、命理引擎、界面、坑位、扩展指南）。
- 应用版本 3.0（专业细盘）。安装包 `tianji-v3.0.apk` 与本源码包分别提供。
- 包名 `app.tianji`，minSdk 24 / target 35，单 Activity + WebView，排盘离线。

## 专业细盘

- 调候和扶抑喜用神分别展示。调候含已核对古籍的戊土冬月、己土春月条文，其他使用标明口径的季节筛查。全局使用离线静态星空。

- 流年在大运下一排横向显示。每个年份下列出该年神煞，可逐项查看。

- 藏干、副星分行对齐。神煞由独立规则表计算，可切换常用与全部。逐项口径、来源与对照测试见 [神煞规则](docs/shensha.md)。

- 四柱神煞在纳音下方按年、月、日、时分列，下接大运与流年。点击神煞可查看该柱的查法和联动。星运、自坐、空亡、纳音的行名可点开通用词条，各柱数值可点开本盘释义。

- 底部「学习」包含读盘顺序、五行生克、干支合冲、十二长生、十神和当前命盘示例。

- 我的保存本机八字查询记录，可备注、查看、删除和设为本人。今日运势依据本人命盘与当天干支。即时排盘使用设备当地钟表时间。

- 今日页提供 1900—2100 年离线万年历。释义按本盘解读、查法与古籍分段，古籍可切换原文、今译、对照。

- 宫位、六亲逐项显示相合及牵制的依据。有牵制的条目附生活小建议。

- 星运、自坐、空亡、纳音逐柱可点。古籍优先展示《三命通会》卷八、卷九的对应日時条文，标明匹配层级。

- 古籍匹配段落提供白话译文，并附离线原文。四柱、大运、流年神煞可以点开查看命中依据和干支联动。

- 公历日期、24 小时时分滚轮，以及 4,356 条离线地点记录。城市覆盖与坐标、时区、均时差算法见 [出生地资料与真太阳时](tianji/assets/js/data/CITIES.md)。
- 按出生地真太阳时取日柱与时柱。年柱、月柱和起运用实际出生瞬间与节气比较。旧版时辰资料继续可读，补录时分和出生城市后才应用校正。
- 彩色四柱、星运、自坐、空亡、藏干十神。干支图随所选大运和流年联动，另有本命流通、宫位、六亲图。
- 命局提要展示本命线索、岁运关系、五行比例和生活小建议。命理解读及古籍参照按本命数据匹配。
- 新版模拟器截图在 `tianji/screenshots/pro/`。交接文档中的旧截图与视觉规范记录 1.0。

## 构建

需要 Android SDK：build-tools 35.0.0、platforms;android-35、cmdline-tools，放在仓库根的 `tools/android-sdk/` 下（`build.ps1` 里写死了这个路径），JDK 17+。

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\build.ps1 -NoInstall        # 只出包
.\build.ps1                   # 出包并安装到 127.0.0.1:16416
.\build.ps1 -Device <serial>  # 安装到其它设备
```

产物：`tianji/build/tianji.apk`。首次构建会自动生成测试 keystore `tianji.keystore`，口令通过本机环境变量 `TIANJI_KEYSTORE_PASSWORD` 提供。

## 目录

```
build.ps1                     # aapt2 → javac → d8 → 打包 assets/dex → zipalign → apksigner → adb install
tianji/
  java/app/tianji/MainActivity.java   # WebView 壳、安全区、震动、返回键
  assets/index.html                   # 外壳与 tab
  assets/css/app.css                  # 全部样式
  assets/js/vendor/lunar.js           # lunar-javascript 1.7.8（MIT，许可见 lunar.LICENSE.txt）
  assets/js/data/hexagrams.js         # 六十四卦
  assets/js/astro.js                  # 命理引擎（纯函数）
  assets/js/app.js                    # 视图与交互
  screenshots/                        # 验收截图
tools/
  cdp.cjs                             # 通过 WebView DevTools 在页面里执行 JS（调试用）
  make_icons.py                       # Pillow 生成图标
```

## 说明

- 手动检查更新会查询 GitHub 公开 Release，排盘和生辰资料在本机处理，数据存于 localStorage（`tj.birth` / `tj.draw` / `tj.pref`）。
- 命理输出仅供文化娱乐，不构成决策依据。
