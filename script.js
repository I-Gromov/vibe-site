// ===========================
// GGSEL Quiz — данные из data/questions.json (варианты A–D + answer-комментарий)
// ===========================

var LETTERS = ['A', 'B', 'C', 'D'];
var quizData = null;

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeTextWithLineBreaks(text) {
  return escapeHtml(String(text || '')).replace(/\n/g, '<br>');
}

function clampIndex(i) {
  i = parseInt(i, 10);
  if (isNaN(i)) return 0;
  return Math.max(0, Math.min(3, i));
}

function normalizeQuestion(q) {
  if (q && Array.isArray(q.options) && q.options.length === 4) {
    return {
      question: q.question || '',
      options: q.options.map(function (o) {
        return String(o == null ? '' : o);
      }),
      correctIndex: clampIndex(q.correctIndex),
      answer: String(q.answer || ''),
    };
  }

  // Back-compat: если в старом JSON был только { question, answer }
  var a = String(q && q.answer ? q.answer : '');
  return { question: (q && q.question) || '', options: ['', '', '', ''], correctIndex: 0, answer: a };
}

function optionLabelText(text) {
  var t = String(text || '').trim();
  return t ? t : '—';
}

function getQuestionFromCard(card) {
  if (!quizData || !Array.isArray(quizData.sections)) return null;
  var secId = card.getAttribute('data-section');
  var qIdx = Number(card.getAttribute('data-q-index'));
  if (!secId || isNaN(qIdx)) return null;

  var sec = quizData.sections.find(function (s) {
    return String(s.id) === String(secId);
  });
  if (!sec || !Array.isArray(sec.questions)) return null;
  return sec.questions[qIdx] || null;
}

function clearMcqResult(card) {
  card.querySelectorAll('.quiz-option').forEach(function (label) {
    label.classList.remove('is-correct-answer', 'is-user-choice', 'is-wrong-choice');
  });

  var fb = card.querySelector('.mcq-feedback');
  if (fb) fb.textContent = '';

  var ex = card.querySelector('.mcq-explanation');
  if (ex) ex.innerHTML = '';
}

function applyMcqResult(card, correctIdx, pickedIdx, explanation) {
  var labels = card.querySelectorAll('.quiz-option');
  var fb = card.querySelector('.mcq-feedback');
  var ex = card.querySelector('.mcq-explanation');

  labels.forEach(function (label, i) {
    if (i === correctIdx) label.classList.add('is-correct-answer');
    if (pickedIdx !== null && pickedIdx !== undefined && i === pickedIdx) {
      label.classList.add('is-user-choice');
      if (i !== correctIdx) label.classList.add('is-wrong-choice');
    }
  });

  if (fb) {
    if (pickedIdx === null || pickedIdx === undefined) {
      fb.textContent = 'Правильный вариант: ' + LETTERS[correctIdx] + '.';
    } else if (pickedIdx === correctIdx) {
      fb.textContent = 'Верно.';
    } else {
      fb.textContent = 'Неверно. Правильный вариант: ' + LETTERS[correctIdx] + '.';
    }
  }

  if (ex) {
    var t = String(explanation || '').trim();
    ex.innerHTML = t ? escapeTextWithLineBreaks(t) : '';
  }
}

function renderSections(data) {
  var mount = document.getElementById('quizSections');
  var html = '';

  data.sections.forEach(function (sec) {
    html += '<section class="question-section" data-section="' + escapeHtml(sec.id) + '">';
    html += '<h2 class="section-title"><span class="section-icon">' + escapeHtml(sec.icon || '') + '</span> ' + escapeHtml(sec.title) + '</h2>';
    html += '<div class="questions-grid">';

    sec.questions.forEach(function (raw, idx) {
      var q = normalizeQuestion(raw);
      var num = String(idx + 1).padStart(2, '0');
      var radioName = 'quiz-' + sec.id + '-' + idx;

      html += '<div class="card" data-section="' + escapeHtml(sec.id) + '" data-q-index="' + idx + '" data-correct-index="' + q.correctIndex + '">';
      html += '<div class="card-number">' + num + '</div>';
      html += '<div class="card-body">';
      html += '<p class="question-text">' + escapeHtml(q.question) + '</p>';
      html += '<div class="quiz-options" role="radiogroup" aria-label="Варианты ответа">';

      q.options.forEach(function (opt, oi) {
        var oid = radioName + '-opt-' + oi;
        html += '<label class="quiz-option" for="' + escapeHtml(oid) + '">';
        html += '<span class="quiz-option-letter">' + LETTERS[oi] + '</span>';
        html += '<input type="radio" id="' + escapeHtml(oid) + '" name="' + escapeHtml(radioName) + '" value="' + oi + '" />';
        html += '<span class="quiz-option-text">' + escapeHtml(optionLabelText(opt)) + '</span>';
        html += '</label>';
      });

      html += '</div>';
      html += '<button type="button" class="toggle-btn">Проверить ответ</button>';
      html += '<div class="answer-block hidden"><p class="mcq-feedback"></p><div class="mcq-explanation"></div></div>';
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
      clearMcqResult(card);
    } else {
      var correct = parseInt(card.getAttribute('data-correct-index'), 10);
      if (isNaN(correct)) correct = 0;

      var picked = card.querySelector('.quiz-options input[type=radio]:checked');
      var pickedIdx = picked ? parseInt(picked.value, 10) : null;

      var qObj = getQuestionFromCard(card);
      var explanation = qObj ? qObj.answer : '';

      answerBlock.classList.remove('hidden');
      card.classList.add('is-open');
      btn.textContent = 'Скрыть ответ';

      applyMcqResult(card, correct, pickedIdx, explanation);
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
  if (!el) return;
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

      quizData = data;
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
