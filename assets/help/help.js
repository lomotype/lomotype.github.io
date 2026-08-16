/* LomoType 帮助中心 - 主题应用 / 首页搜索 / 主题切换
   主题随 Android App 同步：在 App 内以 WebView 打开时，通过注入的
   window.LomoType.getTheme() 读取 App 主题（system/light/dark）；在独立
   浏览器中初始为跟随系统。页面底部按钮在亮色/深色间切换，选择保存在
   localStorage 并优先于 App 同步。 */

(function () {
  'use strict';

  var STORAGE_KEY = 'lomotype-help-theme';
  var TAG = '[LomoTheme]';

  var theme = 'system';
  var toggleUse = null;

  function currentTheme() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {
      console.log(TAG, 'localStorage.getItem threw:', e.message);
    }
    console.log(TAG, 'stored:', stored);

    if (['system', 'light', 'dark'].indexOf(stored) !== -1) {
      console.log(TAG, 'currentTheme -> stored:', stored);
      return stored;
    }
    try {
      var hasIface = !!(window.LomoType);
      console.log(TAG, 'window.LomoType exists:', hasIface);
      var t = window.LomoType && window.LomoType.getTheme();
      console.log(TAG, 'getTheme() returned:', t);
      var result = t || 'system';
      console.log(TAG, 'currentTheme -> interface:', result);
      return result;
    } catch (e) {
      console.log(TAG, 'getTheme threw:', e.message);
      return 'system';
    }
  }

  function systemDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function resolvedTheme() {
    return theme === 'system' ? (systemDark() ? 'dark' : 'light') : theme;
  }

  function apply(t) {
    var resolved = t === 'system' ? (systemDark() ? 'dark' : 'light') : t;
    console.log(TAG, 'apply(' + t + ') -> data-theme=' + resolved);
    document.documentElement.setAttribute('data-theme', resolved);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? '#111111' : '#f5f5f5');
    }
  }

  function updateToggleIcon() {
    var r = resolvedTheme();
    console.log(TAG, 'updateToggleIcon, resolved=' + r, 'toggleUse exists:', !!toggleUse);
    if (toggleUse) toggleUse.setAttribute('href', r === 'dark' ? '#i-dark' : '#i-light');
  }

  function initTheme() {
    theme = currentTheme();
    console.log(TAG, 'initTheme, theme=' + theme);
    apply(theme);

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        console.log(TAG, 'prefers-color-scheme changed, theme=' + theme);
        if (theme === 'system') {
          apply('system');
          updateToggleIcon();
        }
      });
    }
  }

  function initThemeToggle() {
    var btn = document.querySelector('.theme-toggle');
    console.log(TAG, 'initThemeToggle, button found:', !!btn);
    if (!btn) return;
    toggleUse = btn.querySelector('use');
    console.log(TAG, 'use element found:', !!toggleUse);
    updateToggleIcon();

    btn.addEventListener('click', function () {
      var before = resolvedTheme();
      theme = before === 'dark' ? 'light' : 'dark';
      console.log(TAG, 'CLICK: resolved was=' + before + ' -> new theme=' + theme);
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {
        console.log(TAG, 'localStorage.setItem threw:', e.message);
      }
      apply(theme);
      updateToggleIcon();
      console.log(TAG, 'CLICK done, data-theme=', document.documentElement.getAttribute('data-theme'));
    });
  }

  function initSearch() {
    var input = document.getElementById('search');
    if (!input) return;

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var visible = 0;
      var topics = document.querySelectorAll('.topic');

      topics.forEach(function (el) {
        var hay = ((el.dataset.keywords || '') + ' ' + el.textContent).toLowerCase();
        var hit = !q || hay.indexOf(q) !== -1;
        el.style.display = hit ? '' : 'none';
        if (hit) visible++;
      });

      var empty = document.getElementById('search-empty');
      if (empty) empty.style.display = visible ? 'none' : 'block';
    });
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done); });
    } else {
      legacyCopy(text, done);
    }
  }

  function legacyCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    if (ok) done();
  }

  function initCopyUrl() {
    var btn = document.querySelector('.dg-copy[data-copy-url]');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var label = btn.textContent;
      copyText(btn.getAttribute('data-copy-url'), function () {
        btn.textContent = '已复制';
        setTimeout(function () { btn.textContent = label; }, 1600);
      });
    });
  }

  function init() {
    console.log(TAG, 'init start, readyState=' + document.readyState);
    initTheme();
    initThemeToggle();
    initSearch();
    initCopyUrl();
    console.log(TAG, 'init done');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
