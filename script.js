// ===========================
// Логика GGSEL Quiz
// ===========================

// --- Прогресс ---
function updateProgress() {
  const allCards    = document.querySelectorAll('.card');
  const openedCards = document.querySelectorAll('.card.is-open');
  const total       = allCards.length;
  const opened      = openedCards.length;
  const pct         = total > 0 ? (opened / total) * 100 : 0;

  document.getElementById('progressBar').style.width  = pct + '%';
  document.getElementById('progressLabel').textContent = `${opened} / ${total} вопросов открыто`;

  document.getElementById('sideProgressBar').style.height = pct + '%';
  document.getElementById('sideProgressLabel').textContent = Math.round(pct) + '%';
}

// --- Поле ввода ответа в каждой карточке ---
document.querySelectorAll('.card-body').forEach(function(body) {
  var toggleBtn = body.querySelector('.toggle-btn');
  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'user-answer';
  input.placeholder = 'Введите ваш ответ...';
  body.insertBefore(input, toggleBtn);
});

// --- Перенос answer-block под кнопку ---
document.querySelectorAll('.card-body').forEach(function(body) {
  var answerBlock = body.querySelector('.answer-block');
  if (answerBlock) {
    body.appendChild(answerBlock);
  }
});

// --- Раскрытие/скрытие ответа ---
document.querySelectorAll('.toggle-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var card        = btn.closest('.card');
    var answerBlock = card.querySelector('.answer-block');
    var isOpen      = !answerBlock.classList.contains('hidden');

    if (isOpen) {
      // Закрываем
      answerBlock.classList.add('hidden');
      card.classList.remove('is-open');
      btn.textContent = 'Проверить ответ';
    } else {
      // Открываем
      answerBlock.classList.remove('hidden');
      card.classList.add('is-open');
      btn.textContent = 'Скрыть ответ';
    }

    updateProgress();
  });
});

// --- Фильтрация по разделам ---
document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    // Убираем active у всех кнопок
    document.querySelectorAll('.filter-btn').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');

    var filter = btn.getAttribute('data-filter');

    document.querySelectorAll('.question-section').forEach(function(section) {
      if (filter === 'all') {
        section.classList.remove('hidden');
      } else {
        if (section.getAttribute('data-section') === filter) {
          section.classList.remove('hidden');
        } else {
          section.classList.add('hidden');
        }
      }
    });

    updateProgress();
  });
});

// --- Инициализация прогресса ---
updateProgress();
