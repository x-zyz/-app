/* Offline reader and chart citations share paragraph IDs from the source catalog. */
(function () {
  'use strict';
  var Library = window.TianjiClassicLibrary;
  var Rules = window.TianjiClassicRules;
  var KEY = 'tj.classicReader.v1';
  var prefs = {size:18, progress:{}, bookmarks:[]};
  try {
    var saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.progress && Array.isArray(saved.bookmarks)) {
      prefs = {size:Math.max(15, Math.min(28, Number(saved.size) || 18)),
        progress:saved.progress, bookmarks:saved.bookmarks};
    }
  } catch (error) { /* The reader still works without storage. */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); }
    catch (error) { /* Keep this session's reading state. */ }
  }

  function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function citation(p) {
    return '《' + p.chapter.book.title + '》 · ' +
      [p.chapter.volume,p.chapter.title,p.title].filter(Boolean).join(' · ');
  }

  function link(p, label, rule) {
    return '<button class="classic-link" data-classic-open="' + esc(p.id) + '"' +
      (rule ? ' data-classic-rule="' + esc(rule.id) + '"' : '') + '>' + esc(label) + '</button>';
  }

  function shelf() {
    return '<p>所有已收录正文均可离线阅读和搜索。书架标明各书收录范围。</p>' +
      '<button class="btn ghost" data-classic-search>搜索全部原文</button><div class="classic-shelf">' +
      Library.books.map(function (book) {
        var progress = prefs.progress[book.id];
        var saved = progress && Library.paragraph(progress.id);
        var target = saved || book.chapters[0].paragraphs[0];
        return '<article><h3>《' + esc(book.title) + '》</h3><p>' +
          esc([book.author,book.edition].filter(Boolean).join(' · ')) + '</p><p>' + esc(book.coverage) + '</p>' +
          (saved ? '<p>上次读到 ' + esc(saved.chapter.title + (saved.title ? ' · ' + saved.title : '')) + '</p>' : '') +
          '<button class="btn ghost" data-classic-resume="' + esc(target.id) + '">' +
          (saved ? '继续阅读' : '开始阅读') + '</button></article>';
      }).join('') + '</div>';
  }

  function evidence(result) {
    return (result.met.length ? '<p><b>已核对</b> ' + esc(result.met.join('；')) + '</p>' : '') +
      (result.missing.length ? '<p><b>未满足</b> ' + esc(result.missing.join('；')) + '</p>' : '') +
      (result.unverified.length ? '<p><b>未验证</b> ' + esc(result.unverified.join('；')) + '</p>' : '');
  }

  function renderMatch(result) {
    var rule = result.rule;
    var p = Library.paragraph(rule.paragraph);
    return '<article class="classic-case"><h3>' + esc(rule.group) + ' · ' +
      (result.status === 'full' ? '完全匹配' : result.status === 'partial' ? '部分匹配' : '相关参考') +
      '</h3>' + link(p, citation(p), rule) +
      '<blockquote lang="zh">' + esc(rule.quote) + '</blockquote><p><b>现代解释</b> ' + esc(rule.explanation) +
      '</p>' + evidence(result) + '<p><b>适用范围</b> ' + esc(rule.scope) + '</p></article>';
  }

  function readings(chart) {
    var found = Rules.match(chart);
    var reference = found.partial.concat(found.reference);
    return '<section id="classic-readings" class="section pro-reading"><div class="section-hd">' +
      '<h2 class="t" tabindex="-1">古籍论断</h2><span class="a">按原文条件核对</span></div>' +
      '<div class="card pro-reading-list"><article><p>以下是传统文献观点。匹配只表示命盘满足该条索引核对的条件。</p></article>' +
      (found.full.length ? found.full.map(renderMatch).join('') :
        '<article><p>当前离线古籍库中暂无可验证匹配的断语。</p></article>') +
      (reference.length ? '<details class="classic-references"><summary>部分匹配与相关参考（' +
        reference.length + '）</summary>' + reference.map(renderMatch).join('') + '</details>' : '') +
      '<article><button class="btn ghost" data-classic-shelf>前往古籍阅读</button></article></div></section>';
  }

  function highlighted(text, term) {
    if (!term) return esc(text);
    var at = text.toLowerCase().indexOf(term.toLowerCase());
    if (at < 0) return esc(text);
    return esc(text.slice(0, at)) + '<mark>' + esc(text.slice(at, at + term.length)) +
      '</mark>' + esc(text.slice(at + term.length));
  }

  function open(openSheet, initialId, options) {
    var chart = options.chart;
    var paragraph = Library.paragraph(initialId);
    var chapter = paragraph && paragraph.chapter;
    var book = chapter && chapter.book;
    var mode = chapter ? 'chapter' : 'search';
    var query = '';
    var searchBook = '';
    var selectedQuote = options.rule && Rules.entries.find(function (rule) { return rule.id === options.rule; });
    var highlight = selectedQuote ? selectedQuote.quote : '';
    var selectedId = initialId;
    var sheet, header, toolbar, content, searchInput;

    function showChapter(p, offset) {
      if (!p) return;
      chapter = p.chapter;
      book = chapter.book;
      mode = 'chapter';
      selectedId = p.id;
      render(offset);
    }

    function textOf(p) {
      var indexed = Rules.forParagraph(p.id);
      var body = '<section class="classic-paragraph" data-classic-paragraph="' + esc(p.id) + '">' +
        (p.title ? '<h3>' + esc(p.title) + '</h3>' : '') +
        '<p class="classic-original" lang="zh">' + highlighted(p.text, p.id === selectedId ? highlight : '') + '</p>' +
        '<button class="classic-bookmark" data-classic-mark="' + esc(p.id) + '" aria-pressed="' +
        prefs.bookmarks.includes(p.id) + '">' + (prefs.bookmarks.includes(p.id) ? '取消书签' : '添加书签') + '</button>';
      if (p.note) body += '<details><summary>今译</summary><p>' + esc(p.note) + '</p></details>';
      if (indexed.length) body += '<details><summary>段落索引与命盘条件</summary>' + indexed.map(function (rule) {
        var explanation = '<p><b>' + (rule.type === 'methodology' ? '判断方法' : '命局论断') + '</b> · ' +
          esc(rule.tags.join('、')) + '</p>';
        if (rule.type === 'methodology') return explanation;
        return explanation + '<p>' + esc(rule.explanation) + '</p>' +
          (chart ? evidence(Rules.evaluate(rule, chart)) + '<p>' + esc(rule.scope) +
            '</p><button class="classic-link" data-classic-chart>查看当前命盘</button>' :
            '<p>完成排盘后可核对这些条件。</p>');
      }).join('') + '</details>';
      return body + '</section>';
    }

    function scrollToParagraph(id, offset) {
      var paragraphs = content.querySelectorAll('[data-classic-paragraph]');
      var target = Array.from(paragraphs).find(function (node) { return node.dataset.classicParagraph === id; });
      if (!target) return;
      var top = target.getBoundingClientRect().top - sheet.getBoundingClientRect().top + sheet.scrollTop;
      var mark = target.querySelector('mark');
      if (mark) top += mark.getBoundingClientRect().top - target.getBoundingClientRect().top;
      sheet.scrollTop = Math.max(0, top - header.offsetHeight - 12 + (offset || 0));
    }

    function remember() {
      if (mode !== 'chapter' || !book) return;
      var edge = header.getBoundingClientRect().bottom + 12;
      var nodes = Array.from(content.querySelectorAll('[data-classic-paragraph]'));
      var p = nodes.find(function (node) { return node.getBoundingClientRect().bottom > edge; }) || nodes[nodes.length - 1];
      if (!p) return;
      prefs.progress[book.id] = {id:p.dataset.classicParagraph, offset:Math.max(0, Math.round(edge - p.getBoundingClientRect().top))};
      save();
    }

    function render(offset) {
      sheet.style.setProperty('--classic-font', prefs.size + 'px');
      toolbar.innerHTML = '<button class="btn ghost" data-classic-mode="contents"' + (!book ? ' disabled' : '') +
        '>目录</button><button class="btn ghost" data-classic-mode="search">搜索</button>' +
        (chapter && mode !== 'chapter' ? '<button class="btn ghost" data-classic-return>返回正文</button>' : '') +
        '<button class="btn ghost" data-classic-mode="bookmarks">书签</button>' +
        '<button class="btn ghost" data-classic-font="-1" aria-label="缩小字号"' + (prefs.size <= 15 ? ' disabled' : '') + '>字−</button>' +
        '<button class="btn ghost" data-classic-font="1" aria-label="放大字号"' + (prefs.size >= 28 ? ' disabled' : '') + '>字＋</button>';
      sheet.scrollTop = 0;
      if (mode === 'chapter') {
        var n = book.chapters.indexOf(chapter);
        content.innerHTML = '<h2>' + esc([book.title,chapter.volume,chapter.title].filter(Boolean).join(' · ')) + '</h2>' +
          chapter.paragraphs.map(textOf).join('') + '<p class="classic-source">底本 ' + esc(chapter.source) +
          '</p><div class="classic-tools">' +
          (n > 0 ? link(book.chapters[n - 1].paragraphs[0], '上一章') : '') +
          (n + 1 < book.chapters.length ? link(book.chapters[n + 1].paragraphs[0], '下一章') : '') + '</div>';
        scrollToParagraph(selectedId, offset);
        remember();
      } else if (mode === 'contents') {
        var previousVolume;
        content.innerHTML = '<h2>《' + esc(book.title) + '》目录</h2>' + book.chapters.map(function (item) {
          var heading = item.volume !== previousVolume && item.volume ? '<h3>' + esc(item.volume) + '</h3>' : '';
          previousVolume = item.volume;
          return heading + '<p>' + link(item.paragraphs[0], item.title) + '</p>';
        }).join('');
      } else if (mode === 'bookmarks') {
        content.innerHTML = '<h2>书签</h2>' + (prefs.bookmarks.map(Library.paragraph).filter(Boolean).map(function (p) {
          return '<p>' + link(p, citation(p)) + '</p>';
        }).join('') || '<p>还没有书签。阅读时可在段落下方添加。</p>');
      } else {
        content.innerHTML = '<form class="classic-search"><label>搜索范围<select>' +
          '<option value="">全部古籍</option>' + Library.books.map(function (item) {
            return '<option value="' + esc(item.id) + '"' + (searchBook === item.id ? ' selected' : '') + '>' +
              esc(item.title) + '</option>';
          }).join('') + '</select></label><label>关键词<input type="search" maxlength="80" value="' +
          esc(query) + '"></label><button class="btn ghost" type="submit">搜索原文</button></form><div class="classic-results" aria-live="polite"></div>';
        searchInput = content.querySelector('input');
        renderResults();
      }
    }

    function renderResults() {
      var results = Library.search(query, searchBook);
      content.querySelector('.classic-results').innerHTML = !query ? '<p>输入关键词后可定位到原文段落。</p>' :
        '<p>' + (results.length ? '找到 ' + results.length + ' 段' : '未找到原文') + '</p>' +
        results.map(function (p) {
          var at = p.text.toLowerCase().indexOf(query.toLowerCase());
          var start = Math.max(0, at - 14);
          return '<article>' + link(p, citation(p)) + '<p>' +
            (start ? '…' : '') + highlighted(p.text.slice(start, start + Math.max(68, query.length + 24)), query) + '…</p></article>';
        }).join('');
    }

    openSheet('<div class="classic-reader-head"><div class="sheet-hd"><span class="t">古籍阅读</span>' +
      '<button class="x" data-act="close-sheet" aria-label="关闭">×</button></div>' +
      '<nav class="classic-tools" aria-label="阅读工具"></nav></div><div class="classic-content"></div>', function (mask) {
      sheet = mask.querySelector('.sheet');
      sheet.classList.add('classic-reader');
      header = sheet.querySelector('.classic-reader-head');
      toolbar = header.querySelector('.classic-tools');
      content = sheet.querySelector('.classic-content');
      var progress = book && prefs.progress[book.id];
      render(options.resume && progress && progress.id === initialId ? progress.offset : 0);
      sheet.addEventListener('scroll', remember, {passive:true});
      sheet.addEventListener('submit', function (event) {
        event.preventDefault();
        query = searchInput.value.trim();
        searchBook = content.querySelector('select').value;
        renderResults();
      });
      sheet.addEventListener('click', function (event) {
        var button = event.target.closest('button');
        if (!button) return;
        var data = button.dataset;
        if (data.classicOpen) {
          event.stopPropagation();
          highlight = mode === 'search' ? query : '';
          showChapter(Library.paragraph(data.classicOpen));
        } else if ('classicReturn' in data) {
          var previous = prefs.progress[book.id];
          highlight = '';
          showChapter((previous && Library.paragraph(previous.id)) || chapter.paragraphs[0], previous && previous.offset);
        } else if (data.classicMode) {
          if (mode === 'chapter') remember();
          if (data.classicMode === 'search' && !query) searchBook = book ? book.id : '';
          mode = data.classicMode;
          render();
        } else if (data.classicMark) {
          var at = prefs.bookmarks.indexOf(data.classicMark);
          if (at === -1) prefs.bookmarks.push(data.classicMark);
          else prefs.bookmarks.splice(at, 1);
          button.setAttribute('aria-pressed', at === -1);
          button.textContent = at === -1 ? '取消书签' : '添加书签';
          save();
        } else if (data.classicFont) {
          remember();
          prefs.size += Number(data.classicFont);
          save();
          sheet.style.setProperty('--classic-font', prefs.size + 'px');
          toolbar.querySelector('[data-classic-font="-1"]').disabled = prefs.size <= 15;
          toolbar.querySelector('[data-classic-font="1"]').disabled = prefs.size >= 28;
          var position = book && prefs.progress[book.id];
          if (mode === 'chapter' && position) scrollToParagraph(position.id, position.offset);
        }
      });
    });
  }

  window.TianjiClassicReader = {shelf:shelf, readings:readings, open:open};
}());
