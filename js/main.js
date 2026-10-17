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
  e.preventDefault(); // <-- Cancela la recarga automática de la página

  const erroresDiv = document.getElementById("erroresForm");
  erroresDiv.innerHTML = "";

  const datosForm = {
    nombre: document.getElementById("nombre").value,
    edad: document.getElementById("edad").value,
    tipo: document.getElementById("tipo").value,
    modalidad: document.getElementById("modalidad").value,
    experiencia: document.getElementById("experiencia").value
  };

  // Validar datos de entrada mediante la función lógica
  const validacion = validarParticipante(datosForm);

  if (!validacion.valido) {
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

  // Si la validación es correcta, instanciar nuevo participante
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
  
  // Sincronizar en localStorage
  localStorage.setItem("participantes", JSON.stringify(participantes));

  document.getElementById("formAlta").reset();
  renderizarTodo();
}

// Renderizado global de la interfaz
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
      
      // Actualizar localStorage tras eliminación
      localStorage.setItem("participantes", JSON.stringify(participantes));
      
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

// Ventana de ayuda emergente
let ventanaAyudaRef = null;
function abrirVentanaAyuda() {
  if (!ventanaAyudaRef || ventanaAyudaRef.closed) {
    ventanaAyudaRef = window.open("ayuda.html", "CentroAyuda", "width=500,height=500");
  } else {
    ventanaAyudaRef.focus();
  }
}

// Sincronización con el iframe flotante mediante postMessage
function notificarIframe() {
  const iframe = document.getElementById("visorPanel");
  if (iframe && iframe.contentWindow) {
    const stats = calcularEstadisticas(participantes);
    
    let nombreUltimo = "Ninguno";
    let fechaFormateada = "Sin fecha";

    if (participantes.length > 0) {
      const ultimo = participantes[participantes.length - 1];
      nombreUltimo = ultimo.nombre;

      if (ultimo.fechaInscripcion) {
        const fechaObj = new Date(ultimo.fechaInscripcion);
        fechaFormateada = fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    iframe.contentWindow.postMessage({
      tipo: "actualizacion",
      total: stats.total,
      presenciales: stats.presenciales,
      online: stats.online,
      masReciente: nombreUltimo,
      fechaReciente: fechaFormateada
    }, location.origin);
  }
}

function recibirMensajeIframe(e) {
  if (e.origin !== location.origin) return;
  if (e.data && e.data.tipo === "listo") {
    notificarIframe();
  }
}

// Transferencia de datos JSON (Import / Export)
function exportarJSON() {
  const area = document.getElementById("jsonArea");
  const msg = document.getElementById("mensajeJson");
  
  area.value = JSON.stringify(participantes, null, 2);
  msg.style.color = "green";
  msg.textContent = "Datos exportados correctamente.";
}

function importarJSON() {
  const area = document.getElementById("jsonArea").value.trim();
  const msg = document.getElementById("mensajeJson");

  if (!area) {
    msg.style.color = "red";
    msg.textContent = "El área de texto está vacía.";
    return;
  }

  try {
    const datos = JSON.parse(area);
    if (Array.isArray(datos)) {
      // 1. Vaciar array manteniendo la referencia 'const'
      participantes.length = 0;
      
      // 2. Insertar los nuevos elementos importados
      datos.forEach(p => participantes.push(p));
      
      // 3. Guardar persistencia en localStorage
      localStorage.setItem("participantes", JSON.stringify(participantes));

      // 4. Actualizar toda la interfaz de usuario
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

// Manejo de Preferencias mediante Cookies
function guardarPreferenciasUI() {
  const tema = document.getElementById("selTema").value;
  let tamano = document.getElementById("selTamano").value;
  
  // Convertir 'normal' del select a 'estandar' para que coincida con la clase CSS .fuente-estandar
  if (tamano === "normal") tamano = "estandar";

  document.cookie = `pref_tema=${tema}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `pref_tamano=${tamano}; path=/; max-age=31536000; SameSite=Lax`;
  
  aplicarPreferenciasGuardadas();
}

function restablecerPreferenciasUI() {
  document.cookie = "pref_tema=; path=/; max-age=0; path=/";
  document.cookie = "pref_tamano=; path=/; max-age=0; path=/";
  
  document.getElementById("selTema").value = "claro";
  document.getElementById("selTamano").value = "normal";

  document.body.className = "modo-claro fuente-estandar";
}

function aplicarPreferenciasGuardadas() {
  const cookies = document.cookie.split("; ");
  let tema = "claro", tamano = "estandar";

  for (const c of cookies) {
    if (c.startsWith("pref_tema=")) tema = c.split("=")[1];
    if (c.startsWith("pref_tamano=")) tamano = c.split("=")[1];
  }

  // Sincronizar selectores si existen en el DOM
  const selTema = document.getElementById("selTema");
  const selTamano = document.getElementById("selTamano");

  if (selTema) selTema.value = tema;
  if (selTamano) selTamano.value = (tamano === "estandar") ? "normal" : tamano;

  document.body.className = `modo-${tema} fuente-${tamano}`;
}