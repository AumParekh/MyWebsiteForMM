// Simple key gate, not real security: the key is visible in this file.
// Loaded in <head> on every page so nothing shows before the key is entered.
(function () {
  var KEY = 'game2025';
  var STORAGE = 'game-unlocked';
  var root = document.documentElement;

  try {
    if (localStorage.getItem(STORAGE) === '1') return;
  } catch (e) {}

  root.classList.add('locked');

  document.addEventListener('DOMContentLoaded', function () {
    var gate = document.createElement('div');
    gate.id = 'gate';
    gate.innerHTML =
      '<form autocomplete="off">' +
      '<h1>Enter key</h1>' +
      '<input type="password" aria-label="Key" placeholder="Key" autofocus />' +
      '<button class="btn primary big" type="submit">Enter</button>' +
      '<p class="err" role="alert"></p>' +
      '</form>';
    document.body.appendChild(gate);

    var input = gate.querySelector('input');
    input.focus();
    gate.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value !== KEY) {
        gate.querySelector('.err').textContent = 'Wrong key';
        input.select();
        return;
      }
      try { localStorage.setItem(STORAGE, '1'); } catch (err) {}
      gate.remove();
      root.classList.remove('locked');
      document.dispatchEvent(new Event('game:unlocked'));
    });
  });
})();
