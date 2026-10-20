// Game board: shared code for the How to Play page (index.html) and the board (board.html).
// Real game content comes from content.json, demo tiles from demo.json. No code changes
// are needed to change the game: edit those files and swap files in assets/.
(function () {
  'use strict';

  const PLAYED_KEY = 'gameboard-played-v1';
  const ASSETS = 'assets/';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Helpers ---------- */

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === false || value == null) continue;
      if (key === 'class') node.className = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      node.append(child instanceof Node ? child : String(child));
    }
    return node;
  }

  const ICONS = {
    play: '<path d="M7 4.5v15l12.5-7.5z"/>',
    pause: '<path d="M6 4.5h4.5v15H6zM13.5 4.5H18v15h-4.5z"/>',
    restart: '<path d="M12 4.5V1.5L7 6l5 4.5V7.5a5 5 0 1 1-5 5H4a8 8 0 1 0 8-8z"/>',
    stop: '<path d="M5.5 5.5h13v13h-13z"/>',
    timer: '<path d="M9 1.5h6v2H9zM12 5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zm1 9.2-4.2 2.4-1-1.7 3.2-1.9V8.5h2z"/>',
  };

  function icon(name) {
    const span = el('span', { class: 'icon', 'aria-hidden': 'true' });
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">${ICONS[name]}</svg>`;
    return span;
  }

  function button(label, cls, onclick, iconName) {
    return el('button', { type: 'button', class: `btn ${cls || ''}`, onclick },
      iconName && icon(iconName), el('span', { class: 'label' }, label));
  }

  function setLabel(btn, text) {
    btn.querySelector('.label').textContent = text;
  }

  function loadJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status}).`);
      return res.json().catch(() => {
        throw new Error(`${url} has a formatting mistake. Check for a missing comma, quote or bracket.`);
      });
    });
  }

  function assetUrl(name) {
    return ASSETS + name;
  }

  // 154 -> "2:34"
  function formatClock(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  // Two short tones, used when a countdown runs out.
  let audioCtx;
  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25].forEach((delay) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const t = audioCtx.currentTime + delay;
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch (e) {}
  }

  // "1:24" -> 84 seconds. Plain numbers are taken as seconds.
  function parseTime(value) {
    if (value == null || value === '') return null;
    const parts = String(value).split(':').map(Number);
    if (parts.some(isNaN)) return null;
    return parts.reduce((total, part) => total * 60 + part, 0);
  }

  function tileLabel(category, row, cfg) {
    return category.type === 'character' ? String(row + 1) : String(cfg.values[row]);
  }

  function setTitle(title) {
    if (!title) return;
    document.querySelectorAll('[data-title]').forEach((n) => { n.textContent = title; });
  }

  /* ---------- Played state (saved in this browser) ---------- */

  function loadPlayed() {
    try {
      return new Set(JSON.parse(localStorage.getItem(PLAYED_KEY) || '[]'));
    } catch (e) {
      return new Set();
    }
  }

  function savePlayed(played) {
    try {
      localStorage.setItem(PLAYED_KEY, JSON.stringify([...played]));
    } catch (e) {}
  }

  /* ---------- Text that scales to fill its box ---------- */

  // A .fit box holds one child. Pick the largest font size (up to data-max px)
  // at which the child fits without overflowing, so text is as big as the
  // screen allows on both a phone and a projector.
  function fitText(box) {
    const inner = box.firstElementChild;
    if (!inner || box.clientHeight === 0) return;
    const style = getComputedStyle(box);
    const availHeight = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const fits = () => inner.offsetHeight <= availHeight + 1 && inner.scrollWidth <= inner.clientWidth + 1;
    let lo = Number(box.dataset.min) || 10;
    let hi = Number(box.dataset.max) || 200;

    box.style.overflowY = 'hidden';
    box.style.fontSize = hi + 'px';
    if (!fits()) {
      for (let i = 0; i < 14 && hi - lo > 0.5; i++) {
        const mid = (lo + hi) / 2;
        box.style.fontSize = mid + 'px';
        if (fits()) lo = mid;
        else hi = mid;
      }
      box.style.fontSize = lo + 'px';
    }
    // Still too long at the minimum size: let it scroll rather than clip.
    box.style.overflowY = fits() ? 'hidden' : 'auto';
  }

  function refitAll(root) {
    const boxes = [...(root || document).querySelectorAll('.fit')];
    boxes.forEach(fitText);
    // Boxes in the same group (like the category headers) share the smallest size.
    const groups = {};
    boxes.forEach((box) => {
      if (box.dataset.group) (groups[box.dataset.group] = groups[box.dataset.group] || []).push(box);
    });
    Object.values(groups).forEach((group) => {
      const size = Math.min(...group.map((box) => parseFloat(box.style.fontSize) || Infinity));
      if (isFinite(size)) group.forEach((box) => { box.style.fontSize = size + 'px'; });
    });
  }

  function fitBox(cls, max, child) {
    return el('div', { class: `fit ${cls}`, 'data-max': max }, child);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => refitAll(), 80);
  });
  document.addEventListener('game:unlocked', () => refitAll());
  if (document.fonts) document.fonts.ready.then(() => refitAll());

  /* ---------- Confirm dialog ---------- */

  // Resolves true only when the OK button is pressed. Cancel is focused and highlighted.
  function confirmDialog(message, okLabel) {
    return new Promise((resolve) => {
      const cancel = el('button', { class: 'btn primary', value: 'cancel' }, 'Cancel');
      const ok = el('button', { class: 'btn danger', value: 'ok' }, okLabel);
      const dialog = el('dialog', { class: 'confirm' },
        el('p', null, message),
        el('form', { method: 'dialog' }, cancel, ok));
      dialog.addEventListener('close', () => {
        dialog.remove();
        resolve(dialog.returnValue === 'ok');
      });
      document.body.append(dialog);
      dialog.showModal();
      cancel.focus();
    });
  }

  /* ---------- Open tile view ---------- */

  // Each builder fills in the body and action buttons for one category type.
  const builders = {
    word(ctx) {
      ctx.body.append(fitBox('clue-box', 140, el('p', { class: 'clue-text' }, ctx.tile.clue)));
      addBuzzTimer(ctx);
      addReveal(ctx, ctx.tile.answer);
    },

    movie(ctx) {
      // The tile stays open for a fixed time, then the answer reveals itself.
      const total = (ctx.cfg.movieSeconds || 180) * 1000;
      const countLabel = el('span', { class: 'countdown-label' }, 'Answer in');
      const countNum = el('span', { class: 'countdown-num' }, formatClock(total / 1000));
      const barFill = el('span', { style: 'width: 100%' });
      const status = el('div', { class: 'movie-status' },
        el('span', { class: 'clue-count' },
          Number.isInteger(total / 60000) ? `${total / 60000}-minute timer` : `${formatClock(total / 1000)} timer`),
        el('span', { class: 'countdown' }, countLabel, countNum),
        el('div', { class: 'timer-bar' }, barFill));
      ctx.body.append(status, fitBox('plot-box', 76, el('p', { class: 'plot-text' }, ctx.tile.plot)));
      addBuzzTimer(ctx);

      let endsAt = 0;
      let timer = null;
      const reveal = addReveal(ctx, ctx.tile.answer, null, () => finish('Answer revealed'));

      function tick() {
        const left = endsAt - Date.now();
        if (left <= 0) {
          finish("Time's up");
          beep();
          reveal();
          return;
        }
        countNum.textContent = formatClock(left / 1000);
        barFill.style.width = `${(left / total) * 100}%`;
        status.classList.toggle('urgent', left <= 10000);
      }

      function finish(label) {
        if (timer === 'done') return;
        clearInterval(timer);
        timer = 'done';
        status.classList.remove('urgent');
        status.classList.add('stopped');
        countLabel.textContent = label;
        countNum.textContent = '';
        barFill.style.width = '0%';
      }

      ctx.onShown.push(() => {
        if (timer === 'done') return;
        endsAt = Date.now() + total;
        timer = setInterval(tick, 200);
      });
      ctx.cleanups.push(() => { if (timer !== 'done') clearInterval(timer); });
    },

    fetch(ctx) {
      const src = assetUrl(ctx.tile.image);
      const img = el('img', { src, alt: ctx.tile.caption || 'Object to fetch' });
      img.addEventListener('error', () => {
        img.replaceWith(el('div', { class: 'missing' }, `Image not found: ${src}`));
      });
      if (ctx.category.prompt) ctx.body.append(el('p', { class: 'tile-prompt' }, ctx.category.prompt));
      ctx.body.append(el('figure', { class: 'fetch-fig' }, img));
      if (ctx.tile.caption) ctx.body.append(el('p', { class: 'fetch-caption' }, ctx.tile.caption));
    },

    hook(ctx) {
      const src = assetUrl(ctx.tile.audio);
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = src;

      // The song loops between start and end until Stop. With no end set,
      // the whole song loops.
      const start = parseTime(ctx.tile.start) || 0;
      const end = parseTime(ctx.tile.end) || Infinity;
      audio.loop = end === Infinity;
      const loopWatch = setInterval(() => {
        if (!audio.paused && audio.currentTime >= end) audio.currentTime = start;
      }, 30);
      const toStart = () => {
        if (audio.currentTime < start || audio.currentTime >= end) audio.currentTime = start;
      };

      const noteIcon = el('div', { class: 'hook-icon', 'aria-hidden': 'true' });
      noteIcon.innerHTML = '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M23 12.5 55 4v37.5a8.5 8.5 0 1 1-5-7.75V16.6l-22 5.85V49.5a8.5 8.5 0 1 1-5-7.75z"/></svg>';
      const eq = el('div', { class: 'eq', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5].map(() => el('span')));
      const status = el('p', { class: 'hook-status', 'aria-live': 'polite' }, 'Press play to start the song');

      const play = button('Play', 'primary big', () => {
        toStart();
        audio.play().catch(() => { status.textContent = `Could not play ${src}`; });
      }, 'play');
      const pause = button('Pause', 'big', () => audio.pause(), 'pause');
      const restart = button('Restart', 'big', () => {
        audio.currentTime = start;
        audio.play().catch(() => {});
      }, 'restart');
      const stop = button('Stop', 'big', () => {
        setState('stopped');
        audio.pause();
        audio.currentTime = start;
      }, 'stop');

      // Shown before the host presses Play, e.g. asking each team to send up a new player.
      const prompt = ctx.category.prompt && el('p', { class: 'tile-prompt' }, ctx.category.prompt);
      const stage = el('div', { class: 'hook-stage' }, prompt, noteIcon, eq, status,
        el('div', { class: 'hook-controls' }, play, pause, restart, stop));
      ctx.body.append(stage);

      let state;
      function setState(next) {
        state = next;
        stage.classList.toggle('playing', state === 'playing');
        play.disabled = state === 'playing' || state === 'error';
        pause.disabled = state !== 'playing';
        restart.disabled = state === 'error';
        stop.disabled = state === 'stopped' || state === 'error';
        if (state === 'playing') status.textContent = 'Playing';
        if (state === 'paused') status.textContent = 'Paused';
        if (state === 'stopped') status.textContent = 'Stopped';
      }
      setState('stopped');
      status.textContent = 'Press play to start the song';

      audio.addEventListener('playing', () => setState('playing'));
      audio.addEventListener('pause', () => { if (state === 'playing') setState('paused'); });
      audio.addEventListener('error', () => {
        setState('error');
        status.textContent = `Audio file not found: ${src}`;
      });

      // Audio stops automatically when going back to the board.
      ctx.cleanups.push(() => {
        clearInterval(loopWatch);
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      });

      if (ctx.tile.answer) addReveal(ctx, ctx.tile.answer);
      ctx.focusOnShow = play;
    },

    character(ctx) {
      const { tile, cfg } = ctx;
      const clues = tile.clues || [];
      const points = cfg.characterPoints || [50, 40, 30, 20, 10];
      // How long each clue stays before the next one: a single number, or a
      // list per clue (the last entry repeats). The final entry is also the
      // wait before the answer reveals itself.
      const seconds = cfg.characterSecondsPerClue || 15;
      const durationOf = (i) => (Array.isArray(seconds) ? seconds[Math.min(i, seconds.length - 1)] : seconds) * 1000;
      const last = clues.length - 1;

      const clueCount = el('span', { class: 'clue-count' });
      const worth = el('span', { class: 'worth' });
      const countLabel = el('span', { class: 'countdown-label' });
      const countNum = el('span', { class: 'countdown-num' });
      const barFill = el('span');
      const status = el('div', { class: 'char-status' },
        clueCount, worth, el('span', { class: 'countdown' }, countLabel, countNum),
        el('div', { class: 'timer-bar' }, barFill));

      // Every clue is laid out from the start (hidden until shown) so the text
      // size stays the same as clues are added.
      const items = clues.map((text, i) => el('li', { class: i === 0 ? 'latest' : 'pending' }, text));
      ctx.body.append(status, fitBox('clues-box', 84, el('ol', { class: 'clue-list' }, items)));

      const pauseBtn = button('Pause', '', togglePause, 'pause');
      const stopBtn = button('Stop', '', stopClues, 'stop');
      ctx.actions.append(pauseBtn, stopBtn);
      addBuzzTimer(ctx);
      const reveal = addReveal(ctx, tile.answer, tile.image, () => {
        if (phase === 'running' || phase === 'paused') finish('revealed');
      });

      let idx = 0;
      let phase = 'ready'; // ready | running | paused | stopped | revealed
      let endsAt = 0;
      let remaining = durationOf(0);
      let timer = null;

      function render() {
        clueCount.textContent = `Clue ${idx + 1} of ${clues.length}`;
        status.classList.toggle('paused', phase === 'paused');
        status.classList.toggle('stopped', phase === 'stopped' || phase === 'revealed');
        if (phase === 'stopped' || phase === 'revealed') {
          countLabel.textContent = phase === 'stopped' ? 'Clues stopped' : 'Answer revealed';
          countNum.textContent = '';
          barFill.style.width = '0%';
          return;
        }
        worth.textContent = `Worth ${points[idx]} pts`;
        countLabel.textContent = phase === 'paused' ? 'Paused' : idx < last ? 'Next clue in' : 'Answer in';
        countNum.textContent = Math.max(0, Math.ceil(remaining / 1000));
        barFill.style.width = `${Math.max(0, Math.min(1, remaining / durationOf(idx))) * 100}%`;
      }

      function tick() {
        if (phase !== 'running') return;
        remaining = endsAt - Date.now();
        if (remaining <= 0) {
          if (idx < last) {
            items[idx].className = '';
            idx += 1;
            items[idx].className = 'latest';
            endsAt += durationOf(idx);
            remaining = endsAt - Date.now();
          } else {
            // Nobody got it: show the answer once the last clue's time runs out.
            finish('revealed');
            worth.textContent = 'Not guessed · 0 pts';
            worth.classList.add('zero');
            reveal();
            return;
          }
        }
        render();
      }

      function togglePause() {
        if (phase === 'running') {
          remaining = endsAt - Date.now();
          phase = 'paused';
          setLabel(pauseBtn, 'Resume');
          pauseBtn.replaceChild(icon('play'), pauseBtn.querySelector('.icon'));
          pauseBtn.classList.add('primary');
        } else if (phase === 'paused') {
          endsAt = Date.now() + remaining;
          phase = 'running';
          setLabel(pauseBtn, 'Pause');
          pauseBtn.replaceChild(icon('pause'), pauseBtn.querySelector('.icon'));
          pauseBtn.classList.remove('primary');
        }
        render();
      }

      function stopClues() {
        if (phase === 'running' || phase === 'paused') finish('stopped');
      }

      function finish(endPhase) {
        phase = endPhase;
        clearInterval(timer);
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        setLabel(pauseBtn, 'Pause');
        pauseBtn.classList.remove('primary');
        render();
      }

      render();
      ctx.onShown.push(() => {
        phase = 'running';
        endsAt = Date.now() + durationOf(0);
        timer = setInterval(tick, 100);
        render();
      });
      ctx.cleanups.push(() => clearInterval(timer));
      ctx.focusOnShow = pauseBtn;
    },
  };

  // A "Buzzed" button for the host's assistant: starts a short countdown for the
  // team that buzzed. It never touches the tile itself. Pressing it again
  // (another team buzzes) starts the countdown over.
  function addBuzzTimer(ctx) {
    const total = (ctx.cfg.answerSeconds || 15) * 1000;
    const btn = button(`Buzzed · ${total / 1000}s`, 'buzz-btn', start, 'timer');
    ctx.actions.append(btn);
    let endsAt = 0;
    let timer = null;
    let resetTimer = null;

    function start() {
      clearInterval(timer);
      clearTimeout(resetTimer);
      endsAt = Date.now() + total;
      btn.classList.remove('done');
      btn.classList.add('running');
      timer = setInterval(tick, 100);
      tick();
    }

    function tick() {
      const left = endsAt - Date.now();
      if (left <= 0) {
        clearInterval(timer);
        btn.classList.remove('running', 'urgent');
        btn.classList.add('done');
        setLabel(btn, "Time's up!");
        beep();
        resetTimer = setTimeout(reset, 3000);
        return;
      }
      btn.classList.toggle('urgent', left <= 5000);
      setLabel(btn, `Answer · ${Math.ceil(left / 1000)}`);
    }

    function reset() {
      btn.classList.remove('running', 'urgent', 'done');
      setLabel(btn, `Buzzed · ${total / 1000}s`);
    }

    ctx.buzz = start;
    ctx.cleanups.push(() => {
      clearInterval(timer);
      clearTimeout(resetTimer);
    });
  }

  // Adds the answer area and a Reveal Answer button. Returns a function that reveals it.
  function addReveal(ctx, answer, image, onReveal) {
    const area = el('div', { class: 'answer', hidden: true, 'aria-live': 'polite' });
    ctx.body.append(area);
    const btn = button('Reveal Answer', 'primary', () => reveal());
    ctx.actions.append(btn);

    function reveal() {
      if (!area.hidden) return;
      if (onReveal) onReveal();
      area.append(el('span', { class: 'answer-label' }, 'Answer'));
      if (image) {
        const img = el('img', { src: assetUrl(image), alt: '' });
        img.addEventListener('error', () => img.remove());
        area.append(img);
      }
      area.append(el('span', { class: 'answer-text' }, answer || '—'));
      area.hidden = false;
      btn.disabled = true;
      refitAll(ctx.back);
    }
    return reveal;
  }

  function animateIn(card, source, done) {
    const flip = card.classList.contains('mode-flip');
    const show = () => {
      card.classList.add(flip ? 'flipped' : 'revealed');
      setTimeout(done, reduceMotion ? 0 : flip ? 800 : 300);
    };
    if (reduceMotion || !source) {
      card.classList.add('no-anim');
      show();
      return;
    }
    // Grow the card out of the tile that was clicked.
    const from = source.getBoundingClientRect();
    const to = card.getBoundingClientRect();
    card.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
    card.getBoundingClientRect();
    card.classList.add('zoom');
    card.style.transform = '';
    setTimeout(show, 450);
  }

  // Opens a tile full screen.
  // opts: { category, tile, row, cfg, demo, source, onClose }
  function openTile(opts) {
    const { category, tile, row, cfg, demo } = opts;
    const type = category.type;
    const flip = type === 'fetch' || type === 'hook';
    const label = tileLabel(category, row, cfg);
    const valueText = type === 'character' ? `Character ${label}` : `${label} points`;

    const back = el('div', { class: 'face back' });
    const card = el('div', { class: `card ${flip ? 'mode-flip' : 'mode-fade'}` },
      el('div', { class: 'card-inner' },
        el('div', { class: 'face front', 'aria-hidden': 'true' }, el('span', null, label)),
        back));
    const overlay = el('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': category.name }, card);

    const body = el('div', { class: `card-body body-${type}` });
    const actions = el('footer', { class: 'card-actions' });
    back.append(
      el('header', { class: 'card-head' },
        el('span', null, category.name),
        el('span', { class: demo ? 'badge demo' : 'badge' }, demo ? `Demo · ${valueText}` : valueText)),
      body,
      actions);

    const ctx = { category, tile, cfg, body, actions, back, cleanups: [], onShown: [], focusOnShow: null };
    const backBtn = button(demo ? 'Close Demo' : 'Back to Board', '', close);
    actions.append(backBtn);
    builders[type](ctx);

    // Keep keyboard focus and screen readers inside the open tile.
    const hiddenSiblings = [...document.body.children].filter((n) => n.tagName !== 'SCRIPT');
    hiddenSiblings.forEach((n) => { n.inert = true; });
    document.body.append(overlay);
    document.body.classList.add('has-overlay');
    refitAll(back);

    const onKey = (e) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) close();
      // B starts the 15-second answer timer, so an assistant can react fast.
      if ((e.key === 'b' || e.key === 'B') && !e.repeat && ctx.buzz) ctx.buzz();
    };
    document.addEventListener('keydown', onKey);

    animateIn(card, opts.source, () => {
      if (!overlay.isConnected) return;
      ctx.onShown.forEach((fn) => fn());
      (ctx.focusOnShow || backBtn).focus();
    });

    function close() {
      ctx.cleanups.forEach((fn) => fn());
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      hiddenSiblings.forEach((n) => { n.inert = false; });
      document.body.classList.remove('has-overlay');
      if (opts.onClose) opts.onClose();
      if (opts.source && opts.source.isConnected) opts.source.focus();
    }
  }

  /* ---------- Board page ---------- */

  function initBoard() {
    const board = document.getElementById('board');
    const played = loadPlayed();
    let content;

    function render() {
      board.replaceChildren(el('div', { class: 'corner', 'aria-hidden': 'true' }));
      content.categories.forEach((cat) => {
        board.append(el('div', { class: 'fit cat-head', 'data-max': 54, 'data-min': 7, 'data-group': 'heads' }, el('span', null, cat.name)));
      });
      for (let row = 0; row < 5; row++) {
        board.append(el('div', { class: 'row-label' }, el('span', null, (content.rowLabels || [])[row] || row + 1)));
        content.categories.forEach((cat, col) => {
          const tile = cat.tiles[row];
          const id = `${col}-${row}`;
          const label = tileLabel(cat, row, content);
          board.append(el('button', {
            type: 'button',
            class: played.has(id) ? 'tile played' : 'tile',
            'data-col': col,
            'data-row': row,
            disabled: !tile,
            'aria-label': `${cat.name}, ${cat.type === 'character' ? 'number ' + label : label + ' points'}${played.has(id) ? ', played' : ''}`,
          }, el('span', null, label)));
        });
      }
      refitAll(board);
    }

    board.addEventListener('click', async (e) => {
      const btn = e.target.closest('.tile');
      if (!btn) return;
      const col = Number(btn.dataset.col);
      const row = Number(btn.dataset.row);
      const id = `${col}-${row}`;
      const category = content.categories[col];
      if (played.has(id)) {
        const again = await confirmDialog('This tile has already been played. Open it again?', 'Open Again');
        if (!again) return;
      }
      // Saved straight away so a refresh mid-tile still counts it as played.
      played.add(id);
      savePlayed(played);
      openTile({
        category,
        tile: category.tiles[row],
        row,
        cfg: content,
        source: btn,
        onClose: () => {
          btn.classList.add('played');
          btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace(/(, played)?$/, ', played'));
        },
      });
    });

    document.getElementById('reset').addEventListener('click', async () => {
      const yes = await confirmDialog('Are you sure you want to reset the board? All played tiles will be cleared.', 'Yes, Reset');
      if (!yes) return;
      played.clear();
      savePlayed(played);
      render();
    });

    const fsBtn = document.getElementById('fullscreen');
    if (fsBtn && document.documentElement.requestFullscreen) {
      fsBtn.hidden = false;
      fsBtn.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
      });
      document.addEventListener('fullscreenchange', () => {
        fsBtn.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
      });
    }

    loadJSON('content.json')
      .then((data) => {
        content = data;
        setTitle(content.title);
        render();
        // Preload object images so the flip shows them straight away.
        content.categories.forEach((cat) => {
          if (cat.type === 'fetch') cat.tiles.forEach((t) => { if (t && t.image) new Image().src = assetUrl(t.image); });
        });
      })
      .catch((err) => {
        board.replaceChildren(el('div', { class: 'board-error' }, err.message));
      });
  }

  /* ---------- How to Play page ---------- */

  function initIntro() {
    Promise.all([loadJSON('content.json'), loadJSON('demo.json')])
      .then(([content, demo]) => {
        setTitle(content.title);
        renderMiniGrid(content);
        content.categories.forEach((cat) => {
          document.querySelectorAll(`[data-cat-name="${cat.type}"]`).forEach((n) => { n.textContent = cat.name; });
        });

        // Demos use the same tile view but never touch the saved board state.
        const demoCfg = Object.assign({}, content, {
          characterSecondsPerClue: demo.characterSecondsPerClue || content.characterSecondsPerClue,
        });
        document.querySelectorAll('[data-demo]').forEach((btn) => {
          // A category can have several demo tiles; each click shows the next one.
          const entry = demo.tiles[btn.dataset.demo];
          const tiles = Array.isArray(entry) ? entry : [entry];
          let turn = 0;
          if (tiles.length > 1) btn.textContent = `Try Demo 1 of ${tiles.length}`;
          btn.addEventListener('click', () => {
            const type = btn.dataset.demo;
            const category = content.categories.find((c) => c.type === type) || { type, name: btn.dataset.name };
            const tile = tiles[turn % tiles.length];
            turn += 1;
            if (tiles.length > 1) btn.textContent = `Try Demo ${(turn % tiles.length) + 1} of ${tiles.length}`;
            openTile({
              category: Object.assign({ type }, category),
              tile,
              row: tile.row != null ? tile.row : 2,
              cfg: demoCfg,
              demo: true,
              source: btn,
            });
          });
        });
      })
      .catch((err) => {
        document.querySelectorAll('[data-demo]').forEach((btn) => { btn.disabled = true; });
        const note = document.getElementById('load-error');
        if (note) {
          note.textContent = err.message;
          note.hidden = false;
        }
      });
  }

  function renderMiniGrid(content) {
    const grid = document.getElementById('mini-grid');
    if (!grid) return;
    const playedExample = new Set(['0-0', '2-1', '1-3', '4-0', '3-2']);
    content.categories.forEach((cat) => grid.append(el('div', { class: 'mini-head' }, cat.short || cat.name)));
    for (let row = 0; row < 5; row++) {
      content.categories.forEach((cat, col) => {
        const isPlayed = playedExample.has(`${col}-${row}`);
        grid.append(el('div', { class: isPlayed ? 'mini-tile played' : 'mini-tile' }, el('span', null, tileLabel(cat, row, content))));
      });
    }
  }

  if (document.body.dataset.page === 'board') initBoard();
  if (document.body.dataset.page === 'intro') initIntro();
})();
