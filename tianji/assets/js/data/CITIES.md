# 出生地资料与真太阳时

- 中国大陆目录采用 [AreaCity 2025.251231.260403](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/releases/tag/2025.251231.260403) 的行政区名称、拼音和中心坐标，覆盖直辖市、地级行政区和县级行政区。合并了上游为补齐行政层级生成的同名记录。中心坐标由 GCJ-02 近似逆转换为 WGS84，使用 [coordtransform](https://github.com/wandergis/coordtransform) 的坐标偏移公式。
- 香港、澳门、台湾及国际目录中的位置、别名、时区来自 [GeoNames](https://www.geonames.org/) 的 [2026-11-08 公共数据快照](https://download.geonames.org/export/dump/)，按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。国际目录包括首都、人口至少 75 万的城市，以及留学、移居和旅游常见城市。对原始数据进行了筛选、译名与别名整理和坐标舍入。
- 和康县和和安县以公告指定的政府驻地为代表点，坐标采用 GeoNames 的 Xaidulla（1279771）与 Dahongliutan（1281441）。[和康县公告](https://www.xinjiang.gov.cn/xinjiang/tzgg/202412/624c97cbd6ef462e8b4ce0f234ac58c1.shtml) · [和安县公告](https://www.xinjiang.gov.cn/xinjiang/tzgg/202412/a0b3b3ac363546589618dd9d49cc7fd7.shtml)
- 各地坐标代表所选城市中心或行政驻地。真实出生位置与代表点的经度每差 1°，太阳时约差 4 分钟。目录采用现行区划，并补充了原重庆江北区、渝北区供旧出生记录选择。
- 算法以出生瞬间的 UTC 加上东经每度 4 分钟和均时差。均时差采用美国海军天文台的近似太阳坐标公式，以 J2000.0 为历元。时区使用设备中 IANA 数据，由 WebView 的 Intl 接口读取。[美国海军天文台公式](https://aa.usno.navy.mil/faq/sun_approx) · [IANA 时区数据库](https://www.iana.org/time-zones)
- 大陆目录按北京时间（Asia/Shanghai）解释出生记录，包含时区资料中的夏令时。新疆本地钟表时间（例如 UTC+06:00）和个别旧记录可使用明确的 UTC 偏移。调钟后被跳过的本地时间无法按该时区换算，重复的本地时间需指定当时采用的偏移。[IANA 中国时区说明](https://data.iana.org/time-zones/tzdb/asia)

## AreaCity MIT License

Copyright (c) 2019 xiangyuecn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The coordinate conversion is based on coordtransform (Copyright (c) 2015 记忆的残骸),
distributed under the [MIT License](https://github.com/wandergis/coordtransform/blob/master/LICENSE).
