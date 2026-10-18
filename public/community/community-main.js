const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

$$('.js-trend-card').forEach((card) => {
  card.addEventListener('click', () => {
    $$('.js-trend-card').forEach((item) => item.classList.remove('selected'));
    card.classList.add('selected');
  });
});

$$('[data-category]').forEach((button) => {
  button.addEventListener('click', () => {
    const group = button.closest('[data-category-group]') || document;
    $$('[data-category]', group).forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const category = button.dataset.category;
    $$('.js-filterable').forEach((item) => {
      item.hidden = category !== 'all' && item.dataset.cat !== category;
    });
    const visible = $$('.js-filterable').some((item) => !item.hidden);
    const empty = document.querySelector('.js-empty');
    if (empty) empty.hidden = visible;
  });
});

$$('[data-rank-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    const wrap = button.closest('.ranking, .hub-side, .side-stack') || document;
    $$('[data-rank-tab]', wrap).forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    $$('[data-rank-panel]', wrap).forEach((panel) => {
      panel.hidden = panel.dataset.rankPanel !== button.dataset.rankTab;
    });
  });
});

const search = document.querySelector('.js-search');
if (search) {
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    $$('.js-searchable').forEach((item) => {
      item.hidden = query && !item.textContent.toLowerCase().includes(query);
    });
  });
}

const dialog = document.querySelector('.js-write-dialog');
$$('.js-write').forEach((button) => button.addEventListener('click', () => dialog?.showModal()));
$$('.js-close-dialog').forEach((button) => button.addEventListener('click', () => dialog?.close()));
document.querySelector('.js-write-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const submit = event.submitter;
  if (submit) submit.textContent = '임시 저장됨';
  setTimeout(() => dialog?.close(), 600);
});
