// Cargar datos de localStorage si existen, o usar la lista inicial por defecto
const datosGuardados = localStorage.getItem("participantes");

const participantes = datosGuardados ? JSON.parse(datosGuardados) : [
  {
    id: 483721,
    nombre: "Ana García",
    edad: 17,
    tipo: "estudiante",
    modalidad: "presencial",
    experiencia: 4,
    fechaInscripcion: "2026-10-17T15:00:00.000Z"
  },
  {
    id: 138009,
    nombre: "Pedro Lopez",
    edad: 29,
    tipo: "profesional",
    modalidad: "online",
    experiencia: 8,
    fechaInscripcion: "2026-10-17T15:05:00.000Z"
  },
  {
    id: 853000,
    nombre: "Carlos perez",
    edad: 90,
    tipo: "invitado",
    modalidad: "presencial",
    experiencia: 9.999,
    fechaInscripcion: "2026-10-17T15:10:00.000Z"
  }
];

// Genera un número aleatorio de 6 dígitos (100000 a 999999) sin duplicados
function generarId(participantes) {
  let nuevoId;
  let intentos = 0;
  let existe = true;

  while (existe && intentos < 100) {
    nuevoId = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    
    // Comprobamos si el ID generado ya lo tiene algún participante
    existe = false;
    for (const p of participantes) {
      if (p.id === nuevoId) {
        existe = true;
        break; // Si ya existe, salimos del bucle para probar otro número
      }
    }
    intentos++;
  }

  return nuevoId;
}

function validarParticipante(datos) {
  const errores = [];

  // Quito los espacios al inicio y final del nombre con .trim() y obligo a que tenga la longitud correcta (2 a 60)
  const nombreLimpio = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
  if (nombreLimpio.length < 2 || nombreLimpio.length > 60) {
    errores.push("El nombre debe tener entre 2 y 60 caracteres.");
  }

  // Number("") devuelve 0. Por eso primero comprobaremos que la cadena no esté vacía.
  const edadTexto = String(datos.edad).trim();
  const edadNum = Number(edadTexto);
  if (
    edadTexto === "" || 
    !Number.isFinite(edadNum) || 
    !Number.isInteger(edadNum) || 
    edadNum < 0 || 
    edadNum > 120
  ) {
    errores.push("La edad debe ser un número entero entre 0 y 120.");
  }

  // Tipo: Únicamente estudiante, profesional o invitado
  const tiposValidos = ["estudiante", "profesional", "invitado"];
  if (!tiposValidos.includes(datos.tipo)) {
    errores.push("El tipo de participante no es válido.");
  }

  // Modalidad: Únicamente presencial u online
  const modalidadesValidas = ["presencial", "online"];
  if (!modalidadesValidas.includes(datos.modalidad)) {
    errores.push("La modalidad no es válida.");
  }

  // Experiencia: Número decimal o entero de 0 a 10
  const expTexto = String(datos.experiencia).trim();
  const expNum = Number(expTexto);
  if (expTexto === "" || !Number.isFinite(expNum) || expNum < 0 || expNum > 10) {
    errores.push("La experiencia debe ser un valor numérico entre 0 y 10.");
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

function calcularEstadisticas(participantes) {
  const total = participantes.length;

  // Si la lista está vacía, mostramos "Sin datos"
  if (total === 0) {
    return {
      total: 0,
      menores: 0,
      mayores: 0,
      edadMedia: "Sin datos",
      edadMin: "Sin datos",
      edadMax: "Sin datos",
      presenciales: 0,
      online: 0,
      estudiantes: 0,
      profesionales: 0,
      invitados: 0,
      expMediaPresencial: "Sin datos",
      primerMenor: "No hay ninguno"
    };
  }

  let menores = 0, mayores = 0;
  let sumaEdad = 0;
  let edadMin = participantes[0].edad;
  let edadMax = participantes[0].edad;

  let presenciales = 0, online = 0;
  let estudiantes = 0, profesionales = 0, invitados = 0;

  let sumaExpPresencial = 0;
  let primerMenor = null;

  for (const p of participantes) {
    // Clasificación por edad (Menor de 18 años)
    if (p.edad < 18) {
      menores++;
      if (primerMenor === null) primerMenor = p.nombre; // Guarda el primer menor encontrado
    } else {
      mayores++;
    }

    // Acumuladores de edad para media, mínima y máxima
    sumaEdad += p.edad;
    if (p.edad < edadMin) edadMin = p.edad;
    if (p.edad > edadMax) edadMax = p.edad;

    // Contadores por modalidad
    if (p.modalidad === "presencial") presenciales++;
    else if (p.modalidad === "online") online++;

    // Contadores por tipo usando switch
    switch (p.tipo) {
      case "estudiante": estudiantes++; break;
      case "profesional": profesionales++; break;
      case "invitado": invitados++; break;
    }

    // Promedio de experiencia presencial omitiendo online mediante continue
    if (p.modalidad === "online") {
      continue; // Salta esta iteración si es online
    }
    sumaExpPresencial += p.experiencia;
  }

  return {
    total,
    menores,
    mayores,
    edadMedia: (sumaEdad / total).toFixed(2),
    edadMin,
    edadMax,
    presenciales,
    online,
    estudiantes,
    profesionales,
    invitados,
    expMediaPresencial: presenciales > 0 ? (sumaExpPresencial / presenciales).toFixed(2) : "Sin datos",
    primerMenor: primerMenor ? primerMenor : "No hay ninguno"
  };
}