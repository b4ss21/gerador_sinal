// Copiado de site_novo/assets/js/ui.js
(function () {
  document.querySelectorAll('.chip').forEach((el) => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    });
  });
})();
