// Локальная админка: state → скачать JSON → заменить data/questions.json в репозитории

var state = { sections: [] };

function setStatus(msg, isError) {
  var el = document.getElementById('adminStatus');
  el.textContent = msg || '';
  el.classList.toggle('error', !!isError);
}

function slugId(s) {
  var base = (s || 'section')
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  if (!base) base = 'section';
  return base + '-' + String(Date.now()).slice(-6);
}

function normalizeQuestion(q) {
  if (q && Array.isArray(q.options) && q.options.length === 4) {
    return {
      question: q.question || '',
      options: q.options.map(function (o) {
        return String(o == null ? '' : o);
      }),
      correctIndex: Math.max(0, Math.min(3, parseInt(q.correctIndex, 10) || 0)),
      answer: String(q.answer || ''),
    };
  }
  var a = (q && (q.answer || '')).trim();
  if (a) {
    return { question: q.question || '', options: ['', '', '', ''], correctIndex: 0, answer: a };
  }
  return { question: (q && q.question) || '', options: ['', '', '', ''], correctIndex: 0, answer: '' };
}

function normalizeState(data) {
  data.sections.forEach(function (sec) {
    sec.questions = sec.questions.map(normalizeQuestion);
  });
  return data;
}

function emptyQuestion() {
  return { question: '', options: ['', '', '', ''], correctIndex: 0, answer: '' };
}

function render() {
  var root = document.getElementById('adminRoot');
  var html = '';
  var letters = ['A', 'B', 'C', 'D'];
  state.sections.forEach(function (sec, si) {
    html += '<div class="admin-section-block" data-section-index="' + si + '">';
    html += '<div class="admin-section-head">';
    html += '<div class="admin-field"><label>Заголовок</label><input type="text" class="inp-title" value="' + escAttr(sec.title) + '" /></div>';
    html += '<div class="admin-field"><label>Иконка</label><input type="text" class="inp-icon" value="' + escAttr(sec.icon || '') + '" /></div>';
    html += '<div class="admin-field"><label>В фильтре</label><input type="text" class="inp-filter" value="' + escAttr(sec.filterLabel || '') + '" /></div>';
    html += '<div class="admin-field id-field"><label>ID (латиница, без пробелов)</label><input type="text" class="inp-id" value="' + escAttr(sec.id) + '" spellcheck="false" /></div>';
    html += '<div class="admin-section-actions">';
    html += '<button type="button" class="admin-btn btn-remove-section">Удалить раздел</button>';
    html += '</div></div>';

    sec.questions.forEach(function (q, qi) {
      var nq = normalizeQuestion(q);
      html += '<div class="admin-question" data-q-index="' + qi + '">';
      html += '<div class="admin-question-head"><span class="admin-question-num">Вопрос ' + (qi + 1) + '</span>';
      html += '<button type="button" class="admin-btn btn-remove-q">Удалить</button></div>';
      html += '<div class="q-label">Текст вопроса</div>';
      html += '<textarea class="ta-q" rows="3">' + escTextarea(nq.question) + '</textarea>';

      html += '<div class="q-label">Варианты ответа (4 шт.) — отметьте один верный</div>';
      html += '<div class="admin-options">';
      for (var oi = 0; oi < 4; oi++) {
        var checked = nq.correctIndex === oi ? ' checked' : '';
        html += '<div class="admin-opt-row">';
        html += '<span class="opt-letter">' + letters[oi] + '</span>';
        html += '<input type="text" class="inp-opt" data-opt-index="' + oi + '" value="' + escAttr(nq.options[oi]) + '" placeholder="Текст варианта ' + letters[oi] + '" />';
        html += '<label class="opt-correct-lbl"><input type="radio" class="radio-correct" name="corr-' + si + '-' + qi + '" value="' + oi + '"' + checked + ' /><span>верный</span></label>';
        html += '</div>';
      }
      html += '</div>';

      html += '<div class="q-label">Комментарий (логика правильного ответа)</div>';
      html += '<textarea class="ta-a" rows="4">' + escTextarea(nq.answer || '') + '</textarea>';

      html += '</div>';
    });

    html += '<div class="admin-add-q"><button type="button" class="admin-btn primary btn-add-q">+ Вопрос в раздел</button></div>';
    html += '</div>';
  });
  root.innerHTML = html;
  bindAdmin();
}

function escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escTextarea(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

function readDomToState() {
  var blocks = document.querySelectorAll('.admin-section-block');
  var next = { sections: [] };
  blocks.forEach(function (block, si) {
    var sec = state.sections[si];
    if (!sec) return;
    sec.title = block.querySelector('.inp-title').value;
    sec.icon = block.querySelector('.inp-icon').value;
    sec.filterLabel = block.querySelector('.inp-filter').value;
    sec.id = block.querySelector('.inp-id').value.trim() || sec.id;

    var questions = [];
    block.querySelectorAll('.admin-question').forEach(function (qel) {
      var qi = Number(qel.getAttribute('data-q-index'));
      var opts = [];
      for (var oi = 0; oi < 4; oi++) {
        var inp = qel.querySelector('input.inp-opt[data-opt-index="' + oi + '"]');
        opts.push(inp ? inp.value : '');
      }
      var name = 'corr-' + si + '-' + qi;
      var corr = qel.querySelector('input[name="' + name + '"]:checked');
      var correctIndex = corr ? parseInt(corr.value, 10) : 0;
      if (isNaN(correctIndex)) correctIndex = 0;
      questions.push({
        question: qel.querySelector('.ta-q').value,
        options: opts,
        correctIndex: Math.max(0, Math.min(3, correctIndex)),
        answer: qel.querySelector('.ta-a') ? qel.querySelector('.ta-a').value : '',
      });
    });
    sec.questions = questions;
    next.sections.push(sec);
  });
  state = next;
}

function bindAdmin() {
  document.querySelectorAll('.admin-section-block').forEach(function (block, si) {
    block.querySelector('.btn-remove-section').addEventListener('click', function () {
      readDomToState();
      if (!confirm('Удалить раздел «' + (state.sections[si].title || '') + '»?')) return;
      state.sections.splice(si, 1);
      render();
      setStatus('Раздел удалён.');
    });

    block.querySelector('.btn-add-q').addEventListener('click', function () {
      readDomToState();
      state.sections[si].questions.push(emptyQuestion());
      render();
      setStatus('Добавлен вопрос.');
    });

    block.querySelectorAll('.btn-remove-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qel = btn.closest('.admin-question');
        var qi = Number(qel.getAttribute('data-q-index'));
        if (!confirm('Удалить этот вопрос?')) return;
        readDomToState();
        state.sections[si].questions.splice(qi, 1);
        render();
        setStatus('Вопрос удалён.');
      });
    });
  });
}

function downloadJson() {
  readDomToState();
  var json = JSON.stringify(state, null, 2) + '\n';
  var blob = new Blob([json], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'questions.json';
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus('Файл questions.json скачан. Положите его в папку data/ проекта.');
}

function loadFromServer() {
  setStatus('Загрузка…');
  fetch('data/questions.json', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.sections)) throw new Error('Нужен объект { sections: [...] }');
      state = normalizeState(data);
      render();
      setStatus('Загружено с сервера.');
    })
    .catch(function (e) {
      setStatus('Ошибка: ' + (e.message || e), true);
    });
}

document.getElementById('btnDownload').addEventListener('click', downloadJson);

document.getElementById('btnReload').addEventListener('click', loadFromServer);

document.getElementById('btnAddSection').addEventListener('click', function () {
  readDomToState();
  state.sections.push({
    id: slugId('новый-раздел'),
    title: 'Новый раздел',
    icon: '📌',
    filterLabel: 'Раздел',
    questions: [emptyQuestion()],
  });
  render();
  setStatus('Добавлен раздел. Задайте заголовок и при необходимости скорректируйте id.');
});

document.getElementById('fileInput').addEventListener('change', function (e) {
  var f = e.target.files[0];
  if (!f) return;
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.sections)) throw new Error('Нужен { "sections": [...] }');
      state = normalizeState(data);
      render();
      setStatus('Файл «' + f.name + '» загружен.');
    } catch (err) {
      setStatus('Ошибка JSON: ' + err.message, true);
    }
    e.target.value = '';
  };
  reader.readAsText(f, 'UTF-8');
});

loadFromServer();
