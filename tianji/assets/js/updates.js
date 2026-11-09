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
    var current = native && native.appVersion ? native.appVersion() : '3.2';
    openSheet('<div class="sheet-hd"><span class="t">检查更新</span>' +
      '<button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
      '<p class="about-p" data-update-status role="status"></p>' +
      '<div class="sheet-actions"><button class="btn" data-update-retry hidden>重试</button>' +
      '<button class="btn" data-update-download hidden></button></div>', function (mask) {
      var status = mask.querySelector('[data-update-status]');
      var retry = mask.querySelector('[data-update-retry]');
      var download = mask.querySelector('[data-update-download]');
      var latest = null;
      var timer;
      function watch(progress) {
        clearTimeout(timer);
        if (!mask.isConnected) return;
        if (progress === 'error') {
          status.textContent = '下载未完成，请重试。';
          download.textContent = '重新下载';
          download.disabled = false;
        } else if (progress === 'ready') {
          status.textContent = '下载完成。点「安装更新」打开 Android 安装确认。';
          download.textContent = '安装更新';
          download.disabled = false;
        } else if (progress !== 'none') {
          status.textContent = progress === 'paused' ? '下载暂停，等待网络恢复…' : '正在下载更新… ' + progress + '%';
          download.disabled = true;
          timer = setTimeout(function () {
            if (mask.isConnected) watch(native.updateProgress(latest.tag));
          }, 600);
        }
      }
      download.addEventListener('click', function () {
        if (!latest) return;
        if (!latest.apk) {
          native.openUpdate(latest.tag);
        } else if (native.updateProgress(latest.tag) === 'ready') {
          download.disabled = true;
          status.textContent = '正在校验安装包…';
          var id = ++serial;
          pending = { id:id, complete:function (result) {
            if (!mask.isConnected) return;
            download.disabled = false;
            if (result.settings) {
              status.textContent = '请在系统设置允许天机安装应用，返回后再点「安装更新」。';
            } else if (result.installer) {
              status.textContent = '请在 Android 安装确认页完成更新。';
            } else {
              status.textContent = '无法打开安装，校验失败时请重新下载。';
              download.textContent = native.updateProgress(latest.tag) === 'ready' ? '再次安装' : '重新下载';
            }
          }};
          native.installUpdate(id, latest.tag);
        } else {
          watch(native.downloadUpdate(latest.tag));
        }
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
            download.textContent = result.apk ? '下载更新' : '打开 GitHub 发布页';
            download.hidden = false;
            if (result.apk) watch(native.updateProgress(result.tag));
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
