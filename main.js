(() => {
  'use strict';

  const data = window.UNFOLD_DATA;
  if (!data) return;
  const voteConfig = data.vote || { quorum: 50, threshold: 65, days: 3 };

  const root = document.documentElement;
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  };

  function renderFeatures() {
    const host = $('#featureGrid');
    if (!host) return;
    const symbols = ['◇', '↗', '⌁', '◉', '◎'];
    data.features.forEach((feature, index) => {
      const card = createElement('article', 'feature-card reveal');
      card.style.setProperty('--reveal-delay', `${index * 65}ms`);
      const top = createElement('div', 'feature-topline');
      top.append(createElement('span', 'feature-number', feature.number));
      top.append(createElement('span', 'feature-glyph', symbols[index % symbols.length]));
      card.append(top, createElement('h4', '', feature.title), createElement('p', '', feature.description), createElement('span', 'feature-meta', feature.meta));
      host.append(card);
    });
  }

  function renderSteps() {
    const host = $('#stepsGrid');
    if (!host) return;
    data.steps.forEach((step, index) => {
      const item = createElement('li', 'step-card reveal');
      item.style.setProperty('--reveal-delay', `${index * 75}ms`);
      item.append(createElement('h3', '', step.title), createElement('p', '', step.description));
      host.append(item);
    });
  }

  const ruleCategories = [
    { id: 'all', label: 'Все правила', color: 'var(--blue)' },
    { id: 'ban', label: 'Бой', color: '#fb8290' },
    { id: 'change', label: 'Изменено', color: '#7baaff' },
    { id: 'item', label: 'Предметы', color: '#81dccc' },
    { id: 'forbid', label: 'Недопустимо', color: '#b09aff' },
    { id: 'process', label: 'Процедура', color: '#81dba8' }
  ];

  function renderRules() {
    const filtersHost = $('#ruleFilters');
    const grid = $('#rulesGrid');
    if (!filtersHost || !grid) return;

    ruleCategories.forEach((category, index) => {
      const button = createElement('button', 'rule-filter');
      button.type = 'button';
      button.dataset.filter = category.id;
      button.style.setProperty('--filter-color', category.color);
      button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
      button.append(createElement('i'), document.createTextNode(category.label));
      button.addEventListener('click', () => filterRules(category.id));
      filtersHost.append(button);
    });

    data.rules.forEach((group, index) => {
      const card = createElement('article', `rule-card kind-${group.kind} reveal`);
      card.dataset.kind = group.kind;
      card.style.setProperty('--reveal-delay', `${index * 55}ms`);

      const head = createElement('div', 'rule-card-head');
      head.append(createElement('span', 'rule-kind-mark'));
      const heading = createElement('div', 'rule-heading');
      heading.append(createElement('h3', '', group.title));
      if (group.note) heading.append(createElement('p', 'rule-note', group.note));
      head.append(heading, createElement('span', 'rule-chip', group.label));

      const items = createElement('div', 'rule-items');
      group.items.forEach((rule) => {
        const row = createElement('div', 'rule-item');
        row.append(createElement('span', 'rule-item-mark'));
        const body = createElement('div');
        body.append(createElement('h4', '', rule.title), createElement('p', '', rule.description));
        row.append(body);
        items.append(row);
      });
      card.append(head, items);
      grid.append(card);
    });
    updateRulesCount('all');
  }

  function filterRules(kind) {
    $$('.rule-filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === kind)));
    $$('.rule-card').forEach(card => {
      card.hidden = kind !== 'all' && card.dataset.kind !== kind;
    });
    updateRulesCount(kind);
    refreshRevealObserver();
  }

  function updateRulesCount(kind) {
    const visibleGroups = data.rules.filter(group => kind === 'all' || group.kind === kind);
    const visibleRules = visibleGroups.reduce((total, group) => total + group.items.length, 0);
    const count = $('#rulesCount');
    const plural = (n, one, few, many) => {
      const n100 = n % 100;
      if (n100 >= 11 && n100 <= 14) return many;
      const n10 = n % 10;
      if (n10 === 1) return one;
      if (n10 >= 2 && n10 <= 4) return few;
      return many;
    };
    if (count) count.textContent = `${visibleGroups.length} ${plural(visibleGroups.length, 'раздел', 'раздела', 'разделов')} · ${visibleRules} ${plural(visibleRules, 'пункт', 'пункта', 'пунктов')}`;
  }

  function renderMembers() {
    const host = $('#membersGrid');
    if (!host) return;
    data.members.forEach(member => {
      const card = createElement('article', 'member-card reveal');
      const head = createElement('div', 'member-head');
      const avatar = createElement('div', 'member-avatar');
      const initials = createElement('span', 'member-initials', member.nick.slice(0, 2).toUpperCase());
      const img = document.createElement('img');
      img.src = member.avatar;
      img.alt = `Скин игрока ${member.nick}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => img.remove(), { once: true });
      avatar.append(initials, img);
      const details = createElement('div');
      details.append(createElement('h3', 'member-name', member.nick), createElement('span', 'member-role', member.role));
      head.append(avatar, details);
      card.append(head);
      if (member.description) card.append(createElement('p', 'member-description', member.description));
      else card.append(createElement('p', 'member-description', 'Участник первого состава проекта.'));
      const footer = createElement('div', 'member-bottom');
      footer.append(createElement('span', '', 'UNFOLD SMP'), createElement('span', '', member.status));
      card.append(footer);
      host.append(card);
    });
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(date).replace(' г.', '');
  }

  function renderNews() {
    const host = $('#newsList');
    if (!host) return;
    if (!data.news.length) {
      host.append(createElement('p', 'empty-state', 'Пока нет опубликованных новостей.'));
      return;
    }
    data.news.forEach((news, index) => {
      const item = createElement('article', 'news-item reveal');
      item.style.setProperty('--reveal-delay', `${index * 60}ms`);
      item.append(createElement('time', 'news-date', formatDate(news.date)));
      const body = createElement('div');
      body.append(createElement('span', 'news-mark', '↗'), createElement('h3', '', news.title), createElement('p', '', news.text));
      item.append(body);
      host.append(item);
    });
  }

  function renderFaq() {
    const host = $('#faqList');
    if (!host) return;
    data.faq.forEach((entry, index) => {
      const item = createElement('details', 'faq-item');
      if (index === 0) item.open = true;
      const summary = createElement('summary');
      summary.append(document.createTextNode(entry.question), createElement('span', 'faq-plus', '+'));
      const answer = createElement('div', 'faq-answer');
      answer.append(createElement('p', '', entry.answer));
      item.append(summary, answer);
      host.append(item);
    });
  }

  function applySiteConfig() {
    const site = data.site || {};
    const setText = (selector, value) => {
      if (value === undefined || value === null || value === '') return;
      $$(selector).forEach(element => { element.textContent = value; });
    };
    setText('[data-max-players]', site.maxPlayers);
    setText('[data-probation-days]', site.probationDays);
    setText('[data-vote-threshold]', voteConfig.threshold);
    setText('[data-season-name]', site.season);
    const recruitStatus = site.recruitOpen ? 'Сбор участников открыт' : 'Набор временно закрыт';
    setText('#recruitStatusText', recruitStatus);
    setText('#seasonRecruitStatus', recruitStatus);
    if (site.recruitFrom) {
      const date = new Date(`${site.recruitFrom}T12:00:00`);
      if (!Number.isNaN(date.getTime())) setText('[data-recruit-date]', new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date));
    }
    const title = `${site.name || 'Unfold SMP'} — ${site.tagline || 'сервер Minecraft'}`;
    document.title = title;
  }

  function setupTheme() {
    const toggle = $('[data-theme-toggle]');
    if (!toggle) return;
    const syncThemeMetadata = () => {
      const isDark = root.dataset.theme !== 'light';
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.content = isDark ? '#0b0e13' : '#f4f7fa';
      toggle.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
    };
    syncThemeMetadata();
    toggle.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('unfold-theme', next); } catch (_) {}
      syncThemeMetadata();
    });
  }

  function setupMobileMenu() {
    const toggle = $('[data-menu-toggle]');
    const shell = $('.nav-shell');
    if (!toggle || !shell) return;
    const close = () => {
      shell.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Открыть меню');
    };
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
      shell.classList.toggle('menu-open', !isOpen);
    });
    $$('#navLinks a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    document.addEventListener('click', event => {
      if (!shell.contains(event.target)) close();
    });
  }

  function setupNavigation() {
    const header = $('#siteHeader');
    const navLinks = $$('.nav-link');
    const sections = navLinks.map(link => $(link.getAttribute('href'))).filter(Boolean);

    const updateHeader = () => {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
      const toTop = $('[data-to-top]');
      if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 650);
    };
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    if ('IntersectionObserver' in window) {
      const navObserver = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`));
      }, { rootMargin: '-25% 0px -58% 0px', threshold: [0, .15, .3, .55] });
      sections.forEach(section => navObserver.observe(section));
    }
    const toTop = $('[data-to-top]');
    if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  let revealObserver;
  function refreshRevealObserver() {
    const elements = $$('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
    }
    elements.forEach(element => revealObserver.observe(element));
  }

  function setupVoteDemo() {
    const people = $('#participantsRange');
    const votes = $('#votesRange');
    const yes = $('#yesRange');
    if (!people || !votes || !yes) return;
    const peopleValue = $('#participantsValue');
    const votesValue = $('#votesValue');
    const yesValue = $('#yesValue');
    const votesMax = $('#votesMax');
    const yesMax = $('#yesMax');
    const result = $('#voteResult');

    const update = (changed) => {
      const participantCount = Number(people.value);
      votes.max = String(participantCount);
      if (Number(votes.value) > participantCount || changed === people) votes.value = String(Math.min(Number(votes.value), participantCount));
      yes.max = votes.value;
      if (Number(yes.value) > Number(votes.value) || changed === votes || changed === people) yes.value = String(Math.min(Number(yes.value), Number(votes.value)));

      const voteCount = Number(votes.value);
      const yesCount = Number(yes.value);
      const quorumNeeded = Math.ceil(participantCount * voteConfig.quorum / 100);
      const ratio = voteCount > 0 ? yesCount / voteCount : 0;
      peopleValue.textContent = participantCount;
      votesValue.textContent = voteCount;
      yesValue.textContent = yesCount;
      votesMax.textContent = participantCount;
      yesMax.textContent = voteCount;

      let state, title, description, mark;
      if (voteCount < quorumNeeded) {
        state = 'fail'; title = 'Кворум не набран';
        description = `Нужно не менее ${quorumNeeded} голосов из ${participantCount}. Если за ${voteConfig.days} дня кворума не будет, решение принимает администрация.`;
        mark = '×';
      } else if (voteCount > 0 && ratio >= voteConfig.threshold / 100) {
        state = 'pass'; title = 'Порог пройден';
        description = `Есть кворум. «За» — ${Math.round(ratio * 100)}% голосов при требуемых ${voteConfig.threshold}%.`;
        mark = '✓';
      } else {
        state = 'fail'; title = 'Не хватает голосов «за»';
        description = `Кворум есть, но «за» — ${Math.round(ratio * 100)}%. Для кика нужно не менее ${voteConfig.threshold}% голосов.`;
        mark = '×';
      }
      result.dataset.result = state;
      $('.result-mark', result).textContent = mark;
      $('strong', result).textContent = title;
      $('.vote-description', result).textContent = description;
    };
    [people, votes, yes].forEach(input => input.addEventListener('input', () => update(input)));
    update(null);
  }

  function init() {
    applySiteConfig();
    renderFeatures();
    renderSteps();
    renderRules();
    renderMembers();
    renderNews();
    renderFaq();
    setupTheme();
    setupMobileMenu();
    setupNavigation();
    setupVoteDemo();
    const year = $('#currentYear');
    if (year) year.textContent = new Date().getFullYear();
    refreshRevealObserver();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
