(function () {
  const KEY = 'thinking-org-course-v1';
  const PARTS = ['home', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'practice'];

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { return {}; }
  }
  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function getProgress() {
    const d = load();
    d.done = d.done || {};
    d.quiz = d.quiz || {};
    return d;
  }

  function markDone(id, val) {
    const d = getProgress();
    d.done[id] = !!val;
    save(d);
    updateUI();
  }

  function recordQuiz(qid, correct) {
    const d = getProgress();
    d.quiz[qid] = { correct: !!correct, at: Date.now() };
    save(d);
    updateUI();
  }

  function score() {
    const d = getProgress();
    const doneCount = PARTS.filter(p => p !== 'home' && d.done[p]).length;
    const quizIds = Object.keys(d.quiz);
    const quizOk = quizIds.filter(id => d.quiz[id].correct).length;
    const totalParts = PARTS.length - 1;
    const pct = Math.round((doneCount / totalParts) * 100);
    return { doneCount, totalParts, quizOk, quizTotal: quizIds.length, pct };
  }

  function updateUI() {
    const s = score();
    document.querySelectorAll('[data-progress-pct]').forEach(el => {
      el.textContent = s.pct + '%';
    });
    document.querySelectorAll('[data-progress-bar]').forEach(el => {
      el.style.width = s.pct + '%';
    });
    document.querySelectorAll('[data-progress-detail]').forEach(el => {
      el.textContent = `已完成 ${s.doneCount}/${s.totalParts} 單元 · 答對 ${s.quizOk} 題`;
    });
    const page = document.body.dataset.page;
    if (page) {
      const cb = document.querySelector('#mark-done');
      if (cb) {
        cb.checked = !!getProgress().done[page];
        cb.onchange = () => markDone(page, cb.checked);
      }
      document.querySelectorAll('.sidebar nav a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
      });
    }
  }

  function initQuiz(root) {
    const qid = root.dataset.qid;
    const answer = root.dataset.answer;
    const labels = root.querySelectorAll('label');
    const feedback = root.querySelector('.feedback');
    const btn = root.querySelector('.check-btn');
    let chosen = null;

    labels.forEach(lab => {
      lab.addEventListener('click', () => {
        if (root.dataset.locked) return;
        labels.forEach(l => l.classList.remove('selected'));
        lab.classList.add('selected');
        chosen = lab.dataset.opt;
      });
    });

    if (btn) {
      btn.addEventListener('click', () => {
        if (!chosen) {
          feedback.textContent = '請先選一個答案。';
          feedback.classList.add('show');
          return;
        }
        root.dataset.locked = '1';
        labels.forEach(lab => {
          if (lab.dataset.opt === answer) lab.classList.add('correct');
          else if (lab.dataset.opt === chosen) lab.classList.add('wrong');
        });
        const ok = chosen === answer;
        feedback.innerHTML = ok
          ? '<strong style="color:var(--ok)">答對了！</strong> ' + (root.dataset.okHint || '')
          : '<strong style="color:var(--bad)">再想想。</strong> ' + (root.dataset.badHint || '');
        feedback.classList.add('show');
        recordQuiz(qid, ok);
      });
    }
  }

  function injectSidebar() {
    const host = document.getElementById('sidebar');
    if (!host) return;
    const page = document.body.dataset.page || 'home';
    const base = page === 'home' ? '' : '../';
    host.innerHTML = `
      <div class="brand">思考的整理學</div>
      <div class="brand-sub">互動教學 · 消化版</div>
      <nav>
        <a href="${base}index.html" data-page="home">總覽首頁</a>
        <div class="part-label">六部核心</div>
        <a href="${base}parts/p1.html" data-page="p1">Ⅰ 獨立飛行：滑翔機與飛機</a>
        <a href="${base}parts/p2.html" data-page="p2">Ⅱ 醞釀：發酵與雞尾酒</a>
        <a href="${base}parts/p3.html" data-page="p3">Ⅲ 蒐集：後設化與積讀</a>
        <a href="${base}parts/p4.html" data-page="p4">Ⅳ 整理：遺忘與捨棄</a>
        <a href="${base}parts/p5.html" data-page="p5">Ⅴ 表達：談笑與諺語</a>
        <a href="${base}parts/p6.html" data-page="p6">Ⅵ 進階：擴散收束與電腦</a>
        <div class="part-label">練習</div>
        <a href="${base}parts/practice.html" data-page="practice">紙筆思考練習</a>
      </nav>
      <div class="progress-box">
        <div>學習進度 <strong data-progress-pct>0%</strong></div>
        <div class="progress-bar"><span data-progress-bar></span></div>
        <div style="margin-top:.45rem;opacity:.9" data-progress-detail>已完成 0/7 單元 · 答對 0 題</div>
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
    document.querySelectorAll('.quiz').forEach(initQuiz);
    const toggle = document.querySelector('.menu-toggle');
    const side = document.getElementById('sidebar');
    if (toggle && side) {
      toggle.addEventListener('click', () => side.classList.toggle('open'));
    }
    updateUI();
  });

  window.ThinkingOrg = { getProgress, markDone, score };
})();
