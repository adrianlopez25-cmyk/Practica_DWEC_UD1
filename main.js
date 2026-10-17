// main.js - Controlador Principal del DOM

document.addEventListener("DOMContentLoaded", () => {
  // 1. Aplicar preferencias guardadas si existen en Cookies
  aplicarPreferenciasGuardadas();

  // 2. Renderizado inicial de tarjetas y estadísticas
  renderizarTodo();

  // 3. Registro de Eventos con comprobación de existencia
  const formAlta = document.getElementById("formAlta");
  if (formAlta) {
    formAlta.addEventListener("submit", manejarAlta);
  }

  const busqueda = document.getElementById("buscarNombre");
  if (busqueda) {
    busqueda.addEventListener("input", renderizarTarjetas);
  }

  const filtroMod = document.getElementById("filtroModalidad");
  if (filtroMod) {
    filtroMod.addEventListener("change", renderizarTarjetas);
  }

  const btnExportar = document.getElementById("btnExportarJSON");
  if (btnExportar) btnExportar.addEventListener("click", exportarJSON);

  const btnImportar = document.getElementById("btnImportarJSON");
  if (btnImportar) btnImportar.addEventListener("click", importarJSON);

  const btnGuardarPref = document.getElementById("btnGuardarPref");
  if (btnGuardarPref) btnGuardarPref.addEventListener("click", guardarPreferenciasUI);

  const btnRestablecerPref = document.getElementById("btnRestablecerPref");
  if (btnRestablecerPref) btnRestablecerPref.addEventListener("click", restablecerPreferenciasUI);

  const btnAyuda = document.getElementById("btnAbrirAyuda");
  if (btnAyuda) btnAyuda.addEventListener("click", abrirVentanaAyuda);

  window.addEventListener("message", recibirMensajeIframe);
});

// Manejador del envío del formulario
function manejarAlta(e) {
  e.preventDefault(); // <-- OBLIGATORIO: Cancela la recarga de página

  const erroresDiv = document.getElementById("erroresForm");
  erroresDiv.innerHTML = "";

  const datosForm = {
    nombre: document.getElementById("nombre").value,
    edad: document.getElementById("edad").value,
    tipo: document.getElementById("tipo").value,
    modalidad: document.getElementById("modalidad").value,
    experiencia: document.getElementById("experiencia").value
  };

  // Validar usando logica.js
  const validacion = validarParticipante(datosForm);

  if (!validacion.valido) {
    // Mostrar errores en pantalla
    const ul = document.createElement("ul");
    ul.style.color = "red";
    for (const err of validacion.errores) {
      const li = document.createElement("li");
      li.textContent = err;
      ul.appendChild(li);
    }
    erroresDiv.appendChild(ul);
    return;
  }

  // Si es válido, crear el objeto participante y añadirlo al array de logica.js
  const nuevoParticipante = {
    id: generarId(participantes),
    nombre: datosForm.nombre.trim(),
    edad: Number(datosForm.edad),
    tipo: datosForm.tipo,
    modalidad: datosForm.modalidad,
    experiencia: Number(datosForm.experiencia),
    fechaInscripcion: new Date().toISOString()
  };

  participantes.push(nuevoParticipante);
  document.getElementById("formAlta").reset();
  renderizarTodo();
}

// Renderizado de la interfaz
function renderizarTodo() {
  renderizarTarjetas();
  renderizarEstadisticas();
  notificarIframe();
}

function renderizarTarjetas() {
  const contenedor = document.getElementById("contenedorTarjetas");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  const busqueda = (document.getElementById("buscarNombre")?.value || "").toLowerCase().trim();
  const modFiltro = document.getElementById("filtroModalidad")?.value || "todas";

  const filtrados = participantes.filter(p => {
    const coincideNombre = p.nombre.toLowerCase().includes(busqueda);
    const coincideModalidad = modFiltro === "todas" || p.modalidad === modFiltro;
    return coincideNombre && coincideModalidad;
  });

  const msgFiltro = document.getElementById("mensajeFiltro");
  if (msgFiltro) {
    msgFiltro.textContent = `Mostrando ${filtrados.length} de ${participantes.length} participantes.`;
  }

  filtrados.forEach(p => {
    const card = document.createElement("div");
    card.className = "tarjeta-participante";
    
    const h4 = document.createElement("h4");
    h4.textContent = `${p.nombre} (ID: ${p.id})`;

    const pDetalles = document.createElement("p");
    pDetalles.textContent = `Edad: ${p.edad} | Perfil: ${p.tipo} | Modalidad: ${p.modalidad} | Exp: ${p.experiencia}`;

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", () => eliminarParticipante(p.id));

    card.append(h4, pDetalles, btnEliminar);
    contenedor.appendChild(card);
  });
}

function eliminarParticipante(id) {
  if (confirm("¿Está seguro de eliminar a este participante?")) {
    const idx = participantes.findIndex(p => p.id === id);
    if (idx !== -1) {
      participantes.splice(idx, 1);
      renderizarTodo();
    }
  }
}

function renderizarEstadisticas() {
  const panel = document.getElementById("panelEstadisticas");
  if (!panel) return;

  const stats = calcularEstadisticas(participantes);
  panel.innerHTML = `
    <p><strong>Total:</strong> ${stats.total}</p>
    <p><strong>Edad media:</strong> ${stats.edadMedia}</p>
    <p><strong>Presenciales:</strong> ${stats.presenciales} | <strong>Online:</strong> ${stats.online}</p>
    <p><strong>Primer menor:</strong> ${stats.primerMenor}</p>
  `;
}

// Ventana de ayuda
let ventanaAyudaRef = null;
function abrirVentanaAyuda() {
  if (!ventanaAyudaRef || ventanaAyudaRef.closed) {
    ventanaAyudaRef = window.open("ayuda.html", "CentroAyuda", "width=500,height=500");
  } else {
    ventanaAyudaRef.focus();
  }
}

// Iframe / postMessage
function notificarIframe() {
  const iframe = document.getElementById("visorPanel");
  if (iframe && iframe.contentWindow) {
    const stats = calcularEstadisticas(participantes);
    const masReciente = participantes.length > 0 ? participantes[participantes.length - 1].nombre : "Ninguno";
    
    iframe.contentWindow.postMessage({
      tipo: "actualizacion",
      total: stats.total,
      presenciales: stats.presenciales,
      online: stats.online,
      masReciente
    }, location.origin);
  }
}

function recibirMensajeIframe(e) {
  if (e.origin !== location.origin) return;
  if (e.data && e.data.tipo === "listo") {
    notificarIframe();
  }
}

// JSON Import / Export
function exportarJSON() {
  document.getElementById("jsonArea").value = JSON.stringify(participantes, null, 2);
  document.getElementById("mensajeJson").textContent = "Datos exportados correctamente.";
}

function importarJSON() {
  const area = document.getElementById("jsonArea").value;
  const msg = document.getElementById("mensajeJson");
  try {
    const datos = JSON.parse(area);
    if (Array.isArray(datos)) {
      participantes.length = 0;
      datos.forEach(p => participantes.push(p));
      renderizarTodo();
      msg.style.color = "green";
      msg.textContent = "Datos importados con éxito.";
    } else {
      throw new Error("El JSON debe ser una lista/array de objetos.");
    }
  } catch (err) {
    msg.style.color = "red";
    msg.textContent = `Error al importar: ${err.message}`;
  }
}

// Cookies
function guardarPreferenciasUI() {
  const tema = document.getElementById("selTema").value;
  const tamano = document.getElementById("selTamano").value;
  document.cookie = `pref_tema=${tema}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `pref_tamano=${tamano}; path=/; max-age=31536000; SameSite=Lax`;
  aplicarPreferenciasGuardadas();
}

function restablecerPreferenciasUI() {
  document.cookie = "pref_tema=; path=/; max-age=0";
  document.cookie = "pref_tamano=; path=/; max-age=0";
  document.body.className = "modo-claro fuente-estandar";
}

function aplicarPreferenciasGuardadas() {
  const cookies = document.cookie.split("; ");
  let tema = "claro", tamano = "estandar";

  for (const c of cookies) {
    if (c.startsWith("pref_tema=")) tema = c.split("=")[1];
    if (c.startsWith("pref_tamano=")) tamano = c.split("=")[1];
  }

  document.body.className = `modo-${tema} fuente-${tamano}`;
}