// panel.js - Escucha mensajes postMessage enviados desde main.js
document.addEventListener("DOMContentLoaded", () => {
  // 1. Notifica a la ventana padre (main.js) que el iframe está listo para recibir datos
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ tipo: "listo" }, location.origin);
  }

  // 2. Registra el escuchador de mensajes
  window.addEventListener("message", (e) => {
    // Verificación estricta de seguridad del origen
    if (e.origin !== location.origin) return;

    const d = e.data;
    if (d && d.tipo === "actualizacion") {
      document.getElementById("totalInscritos").textContent = `Total de participantes: ${d.total}`;
      document.getElementById("desgloseModalidad").textContent = `Presenciales: ${d.presenciales} | Online: ${d.online}`;
      document.getElementById("ultimoInscrito").textContent = `Último registro: ${d.masReciente} (${d.fechaReciente || "N/A"})`;
    }
  });
});