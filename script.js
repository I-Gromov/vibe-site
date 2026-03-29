// ===========================
// GGSEL Quiz — данные из data/questions.json
// ===========================

var ANSWER_PLACEHOLDER = '✏️ Ответ ещё не добавлен';

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function buildAnswerInner(answer) {
  var trimmed = (answer || '').trim();
  if (!trimmed) {
    return '<p class="answer-placeholder">' + ANSWER_PLACEHOLDER + '</p>';
  }
  return '<div class="answer-text">' + escapeHtml(trimmed).replace(/\n/g, '<br>') + '</div>';
}

function renderSections(data) {
  var mount = document.getElementById('quizSections');
  var html = '';
  data.sections.forEach(function (sec) {
    html += '<section class="question-section" data-section="' + escapeHtml(sec.id) + '">';
    html += '<h2 class="section-title"><span class="section-icon">' + escapeHtml(sec.icon || '') + '</span> ' + escapeHtml(sec.title) + '</h2>';
    html += '<div class="questions-grid">';
    sec.questions.forEach(function (q, idx) {
      var num = String(idx + 1).padStart(2, '0');
      html += '<div class="card" data-section="' + escapeHtml(sec.id) + '">';
      html += '<div class="card-number">' + num + '</div>';
      html += '<div class="card-body">';
      html += '<p class="question-text">' + escapeHtml(q.question) + '</p>';
      html += '<input type="text" class="user-answer" placeholder="Введите ваш ответ..." />';
      html += '<button type="button" class="toggle-btn">Проверить ответ</button>';
      html += '<div class="answer-block hidden">' + buildAnswerInner(q.answer) + '</div>';
      html += '</div></div>';
    });
    html += '</div></section>';
  });
  mount.innerHTML = html;
}

function renderFilterNav(data) {
  var nav = document.getElementById('filterNav');
  var html = '<button type="button" class="filter-btn active" data-filter="all">Все</button>';
  data.sections.forEach(function (sec) {
    html += '<button type="button" class="filter-btn" data-filter="' + escapeHtml(sec.id) + '">' + escapeHtml(sec.filterLabel || sec.title) + '</button>';
  });
  nav.innerHTML = html;
}

function updateProgress() {
  var allCards = document.querySelectorAll('.card');
  var openedCards = document.querySelectorAll('.card.is-open');
  var total = allCards.length;
  var opened = openedCards.length;
  var pct = total > 0 ? (opened / total) * 100 : 0;

  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = opened + ' / ' + total + ' вопросов открыто';

  document.getElementById('sideProgressBar').style.height = pct + '%';
  document.getElementById('sideProgressLabel').textContent = Math.round(pct) + '%';
}

function bindQuizInteractions() {
  document.getElementById('quizSections').addEventListener('click', function (e) {
    var btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    var card = btn.closest('.card');
    var answerBlock = card.querySelector('.answer-block');
    var isOpen = !answerBlock.classList.contains('hidden');

    if (isOpen) {
      answerBlock.classList.add('hidden');
      card.classList.remove('is-open');
      btn.textContent = 'Проверить ответ';
    } else {
      answerBlock.classList.remove('hidden');
      card.classList.add('is-open');
      btn.textContent = 'Скрыть ответ';
    }
    updateProgress();
  });

  document.getElementById('filterNav').addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;

    document.querySelectorAll('.filter-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');

    var filter = btn.getAttribute('data-filter');
    document.querySelectorAll('.question-section').forEach(function (section) {
      if (filter === 'all') {
        section.classList.remove('hidden');
      } else if (section.getAttribute('data-section') === filter) {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    });
    updateProgress();
  });
}

function showError(msg) {
  var el = document.getElementById('quizError');
  el.textContent = msg;
  el.hidden = false;
}

function main() {
  fetch('data/questions.json', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('Не удалось загрузить data/questions.json (HTTP ' + r.status + ')');
      return r.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.sections)) {
        throw new Error('Неверный формат JSON: ожидается { "sections": [...] }');
      }
      renderSections(data);
      renderFilterNav(data);
      bindQuizInteractions();
      updateProgress();
    })
    .catch(function (err) {
      showError(err.message || String(err));
    });
}

main();
