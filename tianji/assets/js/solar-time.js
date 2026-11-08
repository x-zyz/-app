(function (root) {
  'use strict';

  var MINUTE_MS = 60000;
  var DAY_MS = 86400000;
  var RAD = Math.PI / 180;
  var formatters = Object.create(null);

  function wallMillis(birth) {
    var y = birth.y;
    var m = birth.m;
    var d = birth.d;
    var hour = birth.hour;
    var minute = birth.minute;
    if (![y, m, d, hour, minute].every(Number.isInteger) ||
        y < 1 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31 ||
        hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('请填写有效的公历出生日期和时间。');
    }
    var date = new Date(0);
    date.setUTCFullYear(y, m - 1, d);
    date.setUTCHours(hour, minute, 0, 0);
    if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
      throw new Error('请填写有效的公历出生日期。');
    }
    return date.getTime();
  }

  function formatterFor(zone) {
    if (!zone) throw new Error('请选择出生城市，以确定出生地时区。');
    if (!formatters[zone]) {
      try {
        formatters[zone] = new Intl.DateTimeFormat('en-GB', {
          timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric',
          hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
        });
        if (typeof formatters[zone].formatToParts !== 'function') {
          delete formatters[zone];
          throw new Error();
        }
      } catch (error) {
        throw new Error('此设备无法读取出生地时区。请更新系统浏览器，或填写出生时的 UTC 偏移。');
      }
    }
    return formatters[zone];
  }

  function offsetAt(formatter, utcMillis) {
    var parts = {};
    formatter.formatToParts(new Date(utcMillis)).forEach(function (part) {
      if (part.type !== 'literal') parts[part.type] = Number(part.value);
    });
    var local = new Date(0);
    local.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    local.setUTCHours(parts.hour % 24, parts.minute, parts.second, 0);
    return (local.getTime() - utcMillis) / MINUTE_MS;
  }

  function findOffsets(localMillis, zone) {
    var formatter = formatterFor(zone);
    var offsets = [];
    // Include offsets on both sides of any nearby civil-time transition.
    for (var hours = -36; hours <= 36; hours += 12) {
      var offset = offsetAt(formatter, localMillis + hours * 60 * MINUTE_MS);
      if (offsets.indexOf(offset) < 0 &&
          offsetAt(formatter, localMillis - Math.round(offset * MINUTE_MS)) === offset) {
        offsets.push(offset);
      }
    }
    return offsets.sort(function (a, b) { return a - b; });
  }

  function offsetCandidates(birth) {
    return findOffsets(wallMillis(birth), birth.city && birth.city.zone);
  }

  function wrapDegrees(angle) {
    return ((angle % 360) + 360) % 360;
  }

  // U.S. Naval Observatory, Computing Approximate Solar Coordinates.
  function equationOfTime(utcMillis) {
    var days = utcMillis / DAY_MS - 10957.5; // Days from J2000.0.
    var anomaly = wrapDegrees(357.529 + 0.98560028 * days) * RAD;
    var meanLongitude = wrapDegrees(280.459 + 0.98564736 * days);
    var apparentLongitude = (meanLongitude + 1.915 * Math.sin(anomaly) +
      0.020 * Math.sin(2 * anomaly)) * RAD;
    var obliquity = (23.439 - 0.00000036 * days) * RAD;
    var rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(apparentLongitude),
      Math.cos(apparentLongitude)) / RAD;
    return 4 * (wrapDegrees(meanLongitude - rightAscension + 180) - 180);
  }

  function correct(birth) {
    var localMillis = wallMillis(birth);
    var city = birth.city;
    if (!city || !Number.isFinite(city.lon) || Math.abs(city.lon) > 180) {
      throw new Error('请选择具有有效经度的出生城市。');
    }

    var offset = birth.offsetMinutes;
    if (offset == null) {
      var offsets = findOffsets(localMillis, city.zone);
      if (!offsets.length) throw new Error('出生地调钟时跳过了这个时间，请核对出生时间。');
      if (offsets.length > 1) throw new Error('出生地调钟时这个时间出现了两次，请选择当时的 UTC 偏移。');
      offset = offsets[0];
    } else if (!Number.isFinite(offset) || Math.abs(offset) > 14 * 60) {
      throw new Error('请填写有效的 UTC 偏移。');
    }

    var utcMillis = localMillis - Math.round(offset * MINUTE_MS);
    var longitudeMinutes = 4 * city.lon - offset;
    var equationMinutes = equationOfTime(utcMillis);
    var solarMillis = localMillis + (longitudeMinutes + equationMinutes) * MINUTE_MS;
    var solar = new Date(Math.floor(solarMillis / 1000) * 1000);
    return {
      y: solar.getUTCFullYear(),
      m: solar.getUTCMonth() + 1,
      d: solar.getUTCDate(),
      hour: solar.getUTCHours(),
      minute: solar.getUTCMinutes(),
      second: solar.getUTCSeconds(),
      offsetMinutes: offset,
      longitudeMinutes: longitudeMinutes,
      equationMinutes: equationMinutes,
      utcMillis: utcMillis
    };
  }

  root.TianjiSolar = {
    correct: correct,
    offsetCandidates: offsetCandidates
  };
}(typeof window === 'undefined' ? globalThis : window));
