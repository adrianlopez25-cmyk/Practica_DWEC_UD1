// main.js - Controlador Principal de la Interfaz (DOM)

// 1. Estado en memoria de la colección de participantes
let participantes = [...participantesIniciales];

// Variable global para controlar la referencia de la ventana emergente de ayuda
let ventanaAyuda = null;

// Esperamos a que el DOM esté completamente cargado antes de ejecutar eventos
document.addEventListener("DOMContentLoaded", () => {
  aplicarPreferenciasGuardadas(); // Recupera cookies de tema y tamaño
  renderizarTodo();               // Pinta tarjetas, estadísticas y envía datos al iframe

  // Escuchadores de eventos de la interfaz
  document.getElementById("formAlta").addEventListener("submit", manejarAlta);
  document.getElementById("buscarNombre").addEventListener("input", renderizarTarjetas);
  document.getElementById("filtroModalidad").addEventListener("change", renderizarTarjetas);
  document.getElementById("btnExportarJSON").addEventListener("click", exportarJSON);
  document.getElementById("btnImportarJSON").addEventListener("click", importarJSON);
  document.getElementById("btnGuardarPref").addEventListener("click", guardarPreferenciasUI);
  document.getElementById("btnRestablecerPref").addEventListener("click", restablecerPreferenciasUI);
  document.getElementById("btnAbrirAyuda").addEventListener("click", abrirVentanaAyuda);

  // Escuchador del protocolo de seguridad postMessage con el iframe
  window.addEventListener("message", recibirMensajeIframe);
});

/**
 * Función orquestadora que actualiza todas las zonas de la pantalla
 */
function renderizarTodo() {
  renderizarTarjetas();
  renderizarEstadisticas();
  enviarMensajeIframe();
}

/**
 * Construcción de Tarjetas con createElement, textContent y append
 * IMPORTANTE PARA LA DEFENSA: Se prohíbe innerHTML al generar tarjetas para evitar XSS (inyección de código).
 */
function crearTarjeta(p) {
  const tarjeta = document.createElement("article");
  tarjeta.classList.add("tarjeta");

  // Clasificación por edad y experiencia
  const esMenor = p.edad < 18;
  tarjeta.classList.add(esMenor ? "menor" : "mayor");
  tarjeta.setAttribute("data-id", p.id);

  let expClase = "inicial";
  if (p.experiencia >= 7) expClase = "avanzada";
  else if (p.experiencia >= 4) expClase = "intermedia";

  // Creación de elementos internos
  const titulo = document.createElement("h3");
  titulo.textContent = p.nombre;

  const det1 = document.createElement("p");
  det1.textContent = `ID: ${p.id} | Edad: ${p.edad} (${esMenor ? "Menor de edad" : "Mayor de edad"})`;

  const det2 = document.createElement("p");
  det2.textContent = `Perfil: ${p.tipo} | Modalidad: ${p.modalidad}`;

  const det3 = document.createElement("p");
  det3.textContent = `Experiencia: ${p.experiencia} (${expClase})`;

  // Formateo de fecha ISO a formato en español
  const fechaObj = new Date(p.fechaInscripcion);
  const detFecha = document.createElement("p");
  detFecha.textContent = `Fecha de registro: ${fechaObj.toLocaleString("es-ES")}`;

  // Botón de eliminación individual con confirmación
  const btnBorrar = document.createElement("button");
  btnBorrar.textContent = "Eliminar Registro";
  btnBorrar.addEventListener("click", () => {
    if (confirm(`¿Está seguro de que desea dar de baja a ${p.nombre}?`)) {
      // Filtramos la colección para eliminar el elemento
      participantes = participantes.filter(item => item.id !== p.id);
      renderizarTodo(); // Actualizamos interfaz y estadísticas
    }
  });

  // Ensamblado seguro del nodo sin usar innerHTML
  tarjeta.append(titulo, det1, det2, det3, detFecha, btnBorrar);
  return tarjeta;
}

/**
 * Renderiza el listado aplicando los filtros de búsqueda por nombre y modalidad
 */
function renderizarTarjetas() {
  const contenedor = document.getElementById("contenedorTarjetas");
  contenedor.innerHTML = ""; // Limpiar el contenedor principal sí está permitido

  const busqueda = document.getElementById("buscarNombre").value.toLowerCase().trim();
  const modFiltro = document.getElementById("filtroModalidad").value;

  // Filtrado combinado
  const filtrados = participantes.filter(p => {
    const coincideNombre = p.nombre.toLowerCase().includes(busqueda);
    const coincideMod = modFiltro === "todas" || p.modalidad === modFiltro;
    return coincideNombre && coincideMod;
  });

  const msgFiltro = document.getElementById("mensajeFiltro");
  if (filtrados.length === 0) {
    msgFiltro.textContent = "No se encontraron coincidencias para la búsqueda.";
  } else {
    msgFiltro.textContent = "";
    for (const p of filtrados) {
      contenedor.append(crearTarjeta(p));
    }
  }
}

/**
 * Pinta las estadísticas usando la función pura calcularEstadisticas() de logica.js
 */
function renderizarEstadisticas() {
  const st = calcularEstadisticas(participantes);
  const div = document.getElementById("panelEstadisticas");
  div.innerHTML = `
    <p><strong>Total Inscritos:</strong> ${st.total} (Menores: ${st.menores}, Mayores: ${st.mayores})</p>
    <p><strong>Rango de Edad:</strong> Media: ${st.edadMedia} | Mínima: ${st.edadMin} | Máxima: ${st.edadMax}</p>
    <p><strong>Desglose por Modalidad:</strong> Presencial: ${st.presenciales} | Online: ${st.online}</p>
    <p><strong>Desglose por Perfil:</strong> Estudiantes: ${st.estudiantes} | Profesionales: ${st.profesionales} | Invitados: ${st.invitados}</p>
    <p><strong>Exp. Media Presencial:</strong> ${st.expMediaPresencial}</p>
    <p><strong>Primer Menor Registrado:</strong> ${st.primerMenor}</p>
  `;
}

/**
 * Procesa el envío del formulario de alta
 */
function manejarAlta(e) {
  e.preventDefault(); // Evita que la página se recargue

  const datos = {
    nombre: document.getElementById("nombre").value,
    edad: document.getElementById("edad").value,
    tipo: document.getElementById("tipo").value,
    modalidad: document.getElementById("modalidad").value,
    experiencia: document.getElementById("experiencia").value
  };

  // Validamos con logica.js
  const resVal = validarParticipante(datos);
  const divErr = document.getElementById("erroresForm");
  divErr.innerHTML = "";

  if (!resVal.valido) {
    for (const err of resVal.errores) {
      const p = document.createElement("p");
      p.textContent = err;
      divErr.append(p);
    }
    return; // Si no es válido, se conservan los valores introducidos sin modificar la lista
  }

  // Si es válido, creamos el participante con ID y Fecha ISO
  const nuevo = {
    id: generarId(participantes),
    nombre: datos.nombre.trim(),
    edad: Number(datos.edad),
    tipo: datos.tipo,
    modalidad: datos.modalidad,
    experiencia: Number(datos.experiencia),
    fechaInscripcion: new Date().toISOString()
  };

  participantes.push(nuevo);
  document.getElementById("formAlta").reset(); // Limpia campos tras el alta
  renderizarTodo();
}

/* ==========================================================================
   2. INTERCAMBIO JSON (Importación / Exportación)
   ========================================================================== */
function exportarJSON() {
  document.getElementById("jsonArea").value = JSON.stringify(participantes, null, 2);
}

function importarJSON() {
  const texto = document.getElementById("jsonArea").value;
  const msg = document.getElementById("mensajeJson");
  msg.textContent = "";

  try {
    const datos = JSON.parse(texto);
    if (!Array.isArray(datos)) throw new Error("El JSON debe ser una lista de elementos ([...]).");

    const idsProcesados = new Set();
    const listaNueva = [];

    for (const p of datos) {
      if (typeof p !== "object" || p === null) throw new Error("Elemento no válido.");
      
      const val = validarParticipante(p);
      if (!val.valido) throw new Error("Error en un participante: " + val.errores.join(", "));

      if (!p.id || !Number.isInteger(p.id) || idsProcesados.has(p.id)) {
        throw new Error("ID no válido o repetido: " + p.id);
      }
      if (isNaN(Date.parse(p.fechaInscripcion))) {
        throw new Error("Fecha ISO inválida para " + p.nombre);
      }

      idsProcesados.add(p.id);
      listaNueva.push({
        id: p.id,
        nombre: p.nombre.trim(),
        edad: Number(p.edad),
        tipo: p.tipo,
        modalidad: p.modalidad,
        experiencia: Number(p.experiencia),
        fechaInscripcion: p.fechaInscripcion
      });
    }

    participantes = listaNueva; // Solo se reemplaza si TODO es válido
    renderizarTodo();
    msg.style.color = "green";
    msg.textContent = "Importación realizada con éxito.";
  } catch (err) {
    msg.style.color = "red";
    msg.textContent = "Error en la importación: " + err.message; // Conserva la lista anterior si hay fallo
  }
}

/* ==========================================================================
   3. GESTIÓN DE PREFERENCIAS MEDIANTE COOKIES
   ========================================================================== */
function leerCookie(nombre) {
  const prefijo = nombre + "=";
  const partes = document.cookie.split(";");
  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i].trim();
    if (parte.startsWith(prefijo)) {
      try {
        return decodeURIComponent(parte.slice(prefijo.length));
      } catch (e) { return null; }
    }
  }
  return null;
}

function guardarCookie(nombre, valor, dias) {
  const segundos = dias * 24 * 60 * 60; // Max-Age exige el tiempo en segundos
  let atributos = `; Path=/; Max-Age=${segundos}; SameSite=Lax`;
  if (location.protocol === "https:") atributos += "; Secure";
  document.cookie = nombre + "=" + encodeURIComponent(valor) + atributos;
}

function borrarCookie(nombre) {
  let atributos = "; Path=/; Max-Age=0; SameSite=Lax"; // Max-Age=0 elimina la cookie
  if (location.protocol === "https:") atributos += "; Secure";
  document.cookie = nombre + "=" + atributos;
}

function guardarPreferenciasUI() {
  const t = document.getElementById("selTema").value;
  const s = document.getElementById("selTamano").value;
  guardarCookie("pref_tema", t, 30);
  guardarCookie("pref_tamano", s, 30);
  aplicarPreferenciasGuardadas();
}

function restablecerPreferenciasUI() {
  borrarCookie("pref_tema");
  borrarCookie("pref_tamano");
  document.getElementById("selTema").value = "claro";
  document.getElementById("selTamano").value = "normal";
  aplicarPreferenciasGuardadas();
}

function aplicarPreferenciasGuardadas() {
  const t = leerCookie("pref_tema") || "claro";
  const s = leerCookie("pref_tamano") || "normal";
  
  // Modificamos las clases del body para cambiar el aspecto con CSS
  document.body.className = "";
  document.body.classList.add(t === "oscuro" ? "modo-oscuro" : "modo-claro");
  document.body.classList.add(s === "grande" ? "fuente-grande" : "fuente-estandar");
  
  document.getElementById("selTema").value = t;
  document.getElementById("selTamano").value = s;
}

/* ==========================================================================
   4. COMUNICACIÓN CON IFRAME (postMessage)
   ========================================================================== */
function enviarMensajeIframe() {
  const iframe = document.getElementById("visorPanel");
  if (!iframe || !iframe.contentWindow) return;

  // Calculamos el participante con la fecha de inscripción más reciente
  let recNombre = "Sin inscripciones";
  let recFecha = "";
  if (participantes.length > 0) {
    let recObj = participantes[0];
    for (const p of participantes) {
      if (new Date(p.fechaInscripcion) > new Date(recObj.fechaInscripcion)) recObj = p;
    }
    recNombre = recObj.nombre;
    recFecha = new Date(recObj.fechaInscripcion).toLocaleString("es-ES");
  }

  const st = calcularEstadisticas(participantes);
  const datosEnvio = {
    tipo: "actualizacion",
    total: st.total,
    presenciales: st.presenciales,
    online: st.online,
    masReciente: recNombre,
    fechaReciente: recFecha
  };

  iframe.contentWindow.postMessage(datosEnvio, location.origin); // targetOrigin estricto
}

function recibirMensajeIframe(e) {
  if (e.origin !== location.origin) return; // Validación de origen estricta
  if (e.data && e.data.tipo === "listo") {
    enviarMensajeIframe(); // Envía los datos iniciales en cuanto el iframe responde que está preparado
  }
}

/* ==========================================================================
   5. CONTROL DE LA VENTANA EMERGENTE DE AYUDA
   ========================================================================== */
function abrirVentanaAyuda() {
  // Reutiliza la ventana si ya está abierta usando la propiedad .closed
  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.focus();
  } else {
    ventanaAyuda = window.open("ayuda.html", "VentanaAyuda", "width=500,height=400");
    if (!ventanaAyuda) {
      alert("La apertura de la ventana de ayuda fue bloqueada por el navegador.");
    }
  }
}