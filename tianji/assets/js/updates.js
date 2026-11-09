/* User-initiated release check. The Android bridge performs the HTTPS request. */
(function (root) {
  'use strict';
  var serial = 0;
  var pending = null;

  function compare(left, right) {
    function parts(value) {
      return /^v?[0-9]{1,6}\.[0-9]{1,6}(?:\.[0-9]{1,6})?$/.test(value || '')
        ? value.replace(/^v/, '').split('.').map(Number) : null;
    }
    var a = parts(left), b = parts(right);
    if (!a || !b) return null;
    for (var i = 0; i < 3; i++) {
      var diff = (a[i] || 0) - (b[i] || 0);
      if (diff) return Math.sign(diff);
    }
    return 0;
  }

  function received(id, result) {
    if (!pending || pending.id !== id) return;
    var complete = pending.complete;
    pending = null;
    complete(result);
  }

  function open(openSheet) {
    var native = root.Android;
    var current = native && native.appVersion ? native.appVersion() : '2.8';
    openSheet('<div class="sheet-hd"><span class="t">检查更新</span>' +
      '<button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
      '<p class="about-p" data-update-status role="status"></p>' +
      '<div class="sheet-actions"><button class="btn" data-update-retry hidden>重试</button>' +
      '<button class="btn" data-update-download hidden></button></div>', function (mask) {
      var status = mask.querySelector('[data-update-status]');
      var retry = mask.querySelector('[data-update-retry]');
      var download = mask.querySelector('[data-update-download]');
      var latest = null;
      download.addEventListener('click', function () {
        if (latest) native.openUpdate(latest.tag, latest.apk === true);
      });
      function check() {
        retry.hidden = true;
        download.hidden = true;
        status.textContent = '当前版本 ' + current + '。正在检查…';
        if (!native || !native.checkForUpdate) {
          status.textContent = '请在天机 Android 应用中检查更新。';
          return;
        }
        var id = ++serial;
        pending = { id:id, complete:function (result) {
          if (!mask.isConnected) return;
          var order = result && !result.error ? compare(result.tag, current) : null;
          if (order === null) {
            status.textContent = '当前版本 ' + current + '。暂时无法检查更新，请稍后重试。';
            retry.hidden = false;
          } else if (order > 0) {
            latest = result;
            status.textContent = '当前版本 ' + current + '，发现新版 ' + result.tag + '。';
            download.textContent = result.apk ? '在浏览器下载 APK' : '打开 GitHub 发布页';
            download.hidden = false;
          } else {
            status.textContent = '当前版本 ' + current + (order === 0 ? '，已是最新正式版。' : '，已高于 GitHub 最新正式版 ' + result.tag + '。');
          }
        }};
        native.checkForUpdate(id);
      }
      retry.addEventListener('click', check);
      check();
    });
  }
  root.TianjiUpdates = {open:open, received:received, compare:compare};
})(typeof window === 'undefined' ? globalThis : window);
