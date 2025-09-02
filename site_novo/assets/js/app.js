// Simula avanço progressivo do loader inicial
(function () {
  const bar = document.querySelector('.progress__bar');
  let w = 0;
  const id = setInterval(() => {
    w += Math.random() * 18 + 5;
    if (w >= 100) {
      w = 100;
      clearInterval(id);
    }
    if (bar) bar.style.width = `${w}%`;
  }, 400);
})();
