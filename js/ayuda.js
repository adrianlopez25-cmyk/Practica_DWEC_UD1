// ayuda.js - Obtiene información descriptiva de las APIs del navegador
document.addEventListener("DOMContentLoaded", () => {
  const infoContenedor = document.getElementById("infoNavegador");

  // Verificar que el elemento existe en el DOM de la página actual
  if (infoContenedor) {
    // Lectura de objetos del navegador: navigator, location y screen
    const idioma = navigator.language || "Desconocido";
    const origen = location.origin || "Local";
    const resolucion = `${screen.width}x${screen.height} px`;

    infoContenedor.innerHTML = `
      Idioma preferido: <strong>${idioma}</strong><br>
      Origen de la sesión: <strong>${origen}</strong><br>
      Resolución de pantalla: <strong>${resolucion}</strong>
    `;
  }
});