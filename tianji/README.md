# 天机（Tianji）· 源码包

离线安卓算命 App：四柱八字、五行十神、神煞、大运流年、每日运势、六十四卦求签。

- 完整开发交接文档：见 `HANDOFF.md`（架构、命理引擎、界面、坑位、扩展指南）。
- 安装包：同目录上一级的 `tianji-v1.0.apk`。
- 包名 `app.tianji`，minSdk 24 / target 35，单 Activity + WebView，完全离线。

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

- 完全离线，无网络权限；数据只存 localStorage（`tj.birth` / `tj.draw` / `tj.pref`）。
- 命理输出仅供文化娱乐，不构成决策依据。
