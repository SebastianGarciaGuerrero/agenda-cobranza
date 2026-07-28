/**
 * Toast.js — Aviso flotante temporal con acción opcional (ej: Deshacer).
 * Solo se muestra un toast a la vez.
 */

let activeTimer = null;

/**
 * @param {string} message      texto a mostrar
 * @param {object} [opts]
 * @param {string} [opts.actionLabel]  texto del botón de acción (ej: "Deshacer")
 * @param {Function} [opts.onAction]   callback al pulsar la acción
 * @param {number} [opts.duration]     ms antes de auto-cerrar (default 7000)
 * @returns {Function} dismiss — cierra el toast manualmente
 */
export function showToast(message, { actionLabel, onAction, duration = 7000 } = {}) {
  document.querySelector('.toast')?.remove();
  if (activeTimer) { clearTimeout(activeTimer); activeTimer = null; }

  const toast = document.createElement('div');
  toast.className = 'toast';

  const msg = document.createElement('span');
  msg.className = 'toast-msg';
  msg.textContent = message; // textContent → seguro ante IDs con caracteres raros
  toast.appendChild(msg);

  const dismiss = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 200);
    if (activeTimer) { clearTimeout(activeTimer); activeTimer = null; }
  };

  if (actionLabel) {
    const action = document.createElement('button');
    action.className = 'toast-action';
    action.textContent = actionLabel;
    action.addEventListener('click', () => { onAction?.(); dismiss(); });
    toast.appendChild(action);
  }

  const close = document.createElement('button');
  close.className = 'toast-close';
  close.title = 'Cerrar';
  close.textContent = '×';
  close.addEventListener('click', dismiss);
  toast.appendChild(close);

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  activeTimer = setTimeout(dismiss, duration);
  return dismiss;
}
