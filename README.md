# Documentación Técnica: Participant Event Manager

## 1. Descripción General e Instrucciones de Ejecución

Esta aplicación web permite gestionar la inscripción de asistentes a un evento tecnológico. Toda la lógica se ejecuta exclusivamente en el navegador utilizando HTML5, CSS3 y JavaScript, sin librerías ni frameworks externos.

### Guía de Ejecución mediante Servidor HTTP Local (Requisito Obligatorio)

El proyecto requiere ejecutarse en un entorno servidor HTTP para permitir el correcto intercambio de mensajes seguros por `postMessage` entre orígenes e `iframe`, así como el uso adecuado de cookies sin bloqueos por protocolo `file://`.

* **Vía VS Code (Live Server):**
  1. Abrir la carpeta raíz del proyecto en VS Code.
  2. Hacer clic derecho sobre `index.html` y seleccionar **"Open with Live Server"**.
  3. La aplicación se abrirá automáticamente en `http://127.0.0.1:5500` o `http://localhost:5500`.

* **Vía Node.js (`http-server` o `npx`):**
  1. Abrir la terminal en la raíz del proyecto.
  2. Ejecutar la instrucción: `npx http-server -p 8080`
  3. Acceder en el navegador a: `http://localhost:8080`.

---

## 2. Estructura del Proyecto

* `index.html`: Página principal que contiene el formulario, listado, estadísticas, módulo JSON y el panel `iframe`.
* `ayuda.html`: Ventana auxiliar de ayuda con información del navegador.
* `panel.html`: Panel del evento incrustado mediante `iframe`.
* `css/estilos.css`: Hoja de estilos global con temas claro/oscuro, tamaños y layout responsive.
* `js/logica.js`: Lógica pura del negocio (validaciones, estadísticas, generación de ID y persistencia).
* `js/main.js`: Gestión de la interfaz principal (DOM, eventos, cookies, `postMessage` y ventana de ayuda).
* `js/panel.js`: Lógica del `iframe` receptor de mensajes.
* `js/ayuda.js`: Lógica de la ventana secundaria de ayuda.
* `README.md`: Documentación técnica completa y casos de prueba.

---

## 3. Explicación Módulo a Módulo: Funcionalidades, Archivos y Funciones

El proyecto sigue una separación estricta de responsabilidades: `logica.js` no interactúa con el DOM, mientras que `main.js` gestiona la interacción del usuario y la manipulación del DOM.

### 3.1. Gestión de Datos y Persistencia Local

* **Archivos:** `js/logica.js`, `js/main.js`
* **Descripción:** Se inicializa la colección de datos. Para cumplir el requisito de persistencia del estado en el cliente tras recargar (`F5`), se consulta primero `localStorage`. Si existen datos guardados se parsean con `JSON.parse()`; de lo contrario, se carga la lista por defecto con 3 participantes iniciales.
* **Funciones:**
  * `generarId(participantes)` (`logica.js`): Genera un ID único de 6 dígitos (100000 - 999999) utilizando `Math.random()`. Emplea un bucle `do...while` con un límite defensivo de intentos para evitar bloqueos del hilo principal.

### 3.2. Alta y Validación de Participantes

* **Archivos:** `js/logica.js`, `js/main.js`
* **Descripción:** Comprueba que todos los datos procedentes del formulario cumplan con las restricciones de tipo, rango y formato. Trata todas las entradas como no fiables, sin confiar solo en HTML5.
* **Funciones:**
  * `validarParticipante(datos)` (`logica.js`): Valida los campos:
    * Nombre: `trim().length` entre 2 y 60 caracteres.
    * Edad: Numérico, entero finito entre 0 y 120.
    * Tipo: Exclusivamente estudiante, profesional o invitado.
    * Modalidad: Exclusivamente presencial u online.
    * Experiencia: Numérico finito entre 0 y 10 (permite decimales).
  * `clasificarEdad(edad)` y `clasificarExperiencia(exp)` (`logica.js`): Asignan etiquetas (menor/mayor de edad; experiencia inicial, intermedia o avanzada).

### 3.3. Renderizado del Listado y Bajas

* **Archivos:** `js/main.js`
* **Descripción:** Crea e inyecta las tarjetas dinámicas de los participantes en el DOM.
* **Funciones:**
  * `crearTarjeta(participante)` (`main.js`): Utiliza únicamente `document.createElement`, `textContent`, `classList` y `append` para estructurar el nodo de forma segura sin `innerHTML`. Añade la fecha formateada en español (`Intl.DateTimeFormat` o `toLocaleDateString`). Incluye el botón "Eliminar" con confirmación mediante `confirm()`.

### 3.4. Cálculo de Estadísticas Generales

* **Archivos:** `js/logica.js`
* **Descripción:** Calcula métricas sobre la colección global utilizando bucles, contadores y acumuladores tradicionales (sin usar `reduce`).
* **Funciones:**
  * `calcularEstadisticas(participantes)` (`logica.js`): Utiliza bucles `for` y `for...of`. Calcula la experiencia media de asistentes presenciales usando `continue` para ignorar los registros online. Localiza al primer menor de edad mediante un bucle con `break`. Devuelve "Sin datos" en caso de listas vacías o divisiones por cero, garantizando que nunca se devuelva `NaN` o `Infinity`.

### 3.5. Intercambio de Datos JSON (Importar/Exportar)

* **Archivos:** `js/logica.js`, `js/main.js`
* **Descripción:** Permite serializar y deserializar la lista de participantes.
* **Manejo:** La importación se procesa en un bloque `try/catch`. Si el JSON no es un Array, si algún campo es inválido o si contiene IDs duplicados, se rechaza la importación por completo y se conserva íntegramente la lista anterior.

### 3.6. Panel de Eventos en Iframe (postMessage)

* **Archivos:** `index.html`, `panel.html`, `js/main.js`, `js/panel.js`
* **Descripción:** Sincronización bidireccional en tiempo real entre la ventana principal y el `iframe` sin manipular el DOM de forma directa entre ventanas.
* **Mecanismo:**
  1. `panel.js` se inicializa, registra su listener `message` y emite un mensaje de "listo" (`ready`) hacia `window.parent`.
  2. `main.js` recibe la señal y envía el resumen de datos usando un `targetOrigin` explícito (ej. `http://127.0.0.1:5500`).
  3. En ambos lados se valida rigurosamente `event.origin`, `event.source` y la estructura de `event.data`.

### 3.7. Preferencias de Usuario con Cookies

* **Archivos:** `js/main.js`
* **Descripción:** Permite seleccionar Tema (Claro/Oscuro) y Tamaño de Letra (Normal/Grande). Las opciones se aplican inmediatamente en el DOM agregando/quitando clases al `body` y se almacenan durante 30 días.
* **Funciones:**
  * `guardarCookie(nombre, valor, dias)` (`main.js`): Guarda usando atributos `Path=/`, `SameSite=Lax`, `Max-Age` (en segundos) y la directiva `Secure` cuando se detecta HTTPS.
  * `leerCookie(nombre)` (`main.js`): Obtiene y decodifica el valor.
  * `borrarCookie(nombre)` (`main.js`): Asigna `Max-Age=0`.

### 3.8. Ventana Auxiliar de Ayuda

* **Archivos:** `ayuda.html`, `js/main.js`, `js/ayuda.js`
* **Descripción:** Abre una ventana independiente mediante `window.open`. Guarda la referencia para evitar duplicados comprobando `.closed`. Muestra información del entorno extraída de `navigator.language`, `location.origin`, `screen.width` y `screen.height`.

---

## 4. Casos de Prueba Reproducibles en el Navegador

### Prueba 1: Alta de Participante con Datos Válidos

* **Pasos:** Rellenar el formulario con Nombre="Lucía Torres", Edad=22, Tipo="profesional", Modalidad="presencial", Experiencia=6.5 y pulsar "Registrar Participante".
```text
const form1 = document.querySelector('form');
document.querySelector('#nombre, [name="nombre"]').value = "Lucía Torres";
document.querySelector('#edad, [name="edad"]').value = 22;
document.querySelector('#tipo, [name="tipo"]').value = "profesional";
document.querySelector('#modalidad, [name="modalidad"]').value = "presencial";
document.querySelector('#experiencia, [name="experiencia"]').value = 6.5;
form1.requestSubmit();
```

* **Resultado Esperado:** Se limpia el formulario, se añade una nueva tarjeta con la fecha de inscripción actual en español y las clasificaciones (Mayor de edad, Experiencia Intermedia). Se actualizan el contador global y la media de estadísticas.

### Prueba 2: Alta de Participante con Entradas Inválidas

* **Pasos:** Rellenar Nombre=" A ", Edad="18abc", Tipo="estudiante", Modalidad="presencial", Experiencia=15 y enviar el formulario.
```text
const form2 = document.querySelector('form');
document.querySelector('#nombre, [name="nombre"]').value = " A ";
document.querySelector('#edad, [name="edad"]').value = "18abc";
document.querySelector('#tipo, [name="tipo"]').value = "estudiante";
document.querySelector('#modalidad, [name="modalidad"]').value = "presencial";
document.querySelector('#experiencia, [name="experiencia"]').value = 15;

form2.requestSubmit();
console.log("Se debieron mostrar errores y rechazar el alta.");
```
* **Resultado Esperado:** Se muestra un mensaje de error claro especificando los campos erróneos. No se añade nada al listado, los valores erróneos permanecen en el formulario y las estadísticas no cambian.

### Prueba 3: Búsqueda y Filtrado Combinado

* **Pasos:** Seleccionar modalidad "online" en el desplegable de filtro y escribir "Pedro" en la caja de búsqueda.
```text
const inputBusqueda = document.querySelector('input[type="search"], #buscar, [placeholder*="nombre"]');
const selectFiltro = document.querySelector('select:not([name="tipo"])');

if (selectFiltro) {
  selectFiltro.value = "online";
  selectFiltro.dispatchEvent(new Event('change', { bubbles: true }));
}

if (inputBusqueda) {
  inputBusqueda.value = "Pedro";
  inputBusqueda.dispatchEvent(new Event('input', { bubbles: true }));
}

console.log("Filtro 'online' y búsqueda 'Pedro' aplicados."); 
```
* **Resultado Esperado:** Se muestra únicamente la tarjeta de Pedro López. El indicador informa "Mostrando 1 de 3 participantes". Las estadísticas globales se mantienen intactas.

### Prueba 4: Eliminación con Confirmación y Cancelación

* **Pasos:** En la tarjeta de Ana García, hacer clic en "Eliminar". En el diálogo emergente, presionar "Cancelar". Posteriormente, repetir el proceso y presionar "Aceptar".
```text

window.confirm = () => false;
let btnEliminar = Array.from(document.querySelectorAll('button')).find(btn => 
  btn.textContent.toLowerCase().includes('eliminar')
);

if (btnEliminar) {
  btnEliminar.click();
  console.log("Eliminación cancelada.");

  // Confirmar eliminación tras 1 segundo
  setTimeout(() => {
    window.confirm = () => true;
    btnEliminar = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.toLowerCase().includes('eliminar')
    );
    if (btnEliminar) btnEliminar.click();
    console.log(" Eliminación confirmada.");
  }, 1000);
}
```
* **Resultado Esperado:** Al cancelar, la tarjeta y los datos permanecen. Al aceptar, se elimina la tarjeta, disminuye el número de inscritos y se sincroniza el `iframe`.

### Prueba 5: Importación de JSON Inválido o Mal Formado

* **Pasos:** En el área de texto JSON, pegar `{"nombre": "Invalido"}` (no es un array) y pulsar "Importar".
```text
const areaJson = document.querySelector('textarea');
const btnImportar = Array.from(document.querySelectorAll('button')).find(btn => 
  btn.textContent.toLowerCase().includes('importar')
);

if (areaJson && btnImportar) {
  areaJson.value = '{ "nombre": "Invalido" }';
  areaJson.dispatchEvent(new Event('input', { bubbles: true }));
  btnImportar.click();
  console.log("Intento de importación de JSON mal formado.");
}
```
* **Resultado Esperado:** Un mensaje de error alerta que el formato o los datos no son válidos. La lista actual se conserva intacta sin sufrir modificaciones parciales.

### Prueba 6: Lista Vacía (Manejo de Valores Límite)

* **Pasos:** Eliminar uno a uno todos los participantes hasta dejar la lista a 0.
```text
window.confirm = () => true; // Auto-confirmar bajas

const vaciarLista = () => {
  const botonesEliminar = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.trim().toLowerCase().includes('eliminar')
  );
  
  if (botonesEliminar.length > 0) {
    botonesEliminar.forEach(btn => btn.click());
    console.log("Todos los participantes eliminados.");
  } else {
    console.log("La lista ya está vacía.");
  }
};

vaciarLista();
```
* **Resultado Esperado:** El listado muestra un mensaje de "No hay participantes". Las estadísticas muestran "Sin datos" en medias/extremos y "0" en contadores. El `iframe` muestra el mensaje "Sin inscripciones".

### Prueba 7: Guardado, Lectura y Restablecimiento de Cookies

* **Pasos:** Cambiar el tema a "Oscuro", el tamaño a "Grande" y pulsar "Guardar Preferencias". Abrir DevTools -> Application -> Cookies.
```text
const selectTema = document.getElementById("selTema");
const selectTamano = document.getElementById("selTamano");

if (selectTema) selectTema.value = "oscuro";
if (selectTamano) selectTamano.value = "grande";

const btnGuardarCookies = Array.from(document.querySelectorAll('button')).find(btn => 
  btn.textContent.toLowerCase().includes('guardar')
);

if (btnGuardarCookies) {
  btnGuardarCookies.click();
  console.log("Preferencias aplicadas permanentemente.");
  console.log("Cookies guardadas:", document.cookie);
  console.log("Clases aplicadas al body:", document.body.className);
}
```
* **Resultado Esperado:** Aparecen las cookies `pref_tema=oscuro` y `pref_tamano=grande`. Al pulsar "Restablecer", las cookies desaparecen (`Max-Age=0`) y la interfaz vuelve a tema claro y tamaño normal.

### Prueba 8: Seguridad postMessage (Mensajes Rechazados)

* **Pasos:** Abrir la consola e intentar enviar un mensaje manualmente hacia el `iframe` con origen manipulado.
```text
const iframe = document.querySelector('iframe');

if (iframe && iframe.contentWindow) {
  iframe.contentWindow.postMessage({ total: 999, hack: true }, '*');
  console.log("Mensaje no válido enviado al iframe.");
}
```
* **Resultado Esperado:** El `iframe` ignora el mensaje por no cumplir la estructura completa requerida o por origen no autorizado. El panel no altera su DOM.

---

## 5. Relación de Contenidos Aplicados por Sesión

* **Sesión 1 (Arquitectura Cliente-Servidor):** Carga del DOM y ejecución asíncrona. Los scripts corren en el motor V8 del cliente mientras Live Server sirve los recursos estáticos.
* **Sesión 2 (Ámbitos y Variables):** Uso de `const` para referencias estables y `let` para acumuladores. Se evita `var` para prevenir alzado de variables.
* **Sesión 3 (Estructuras de Control e Identidad):** Evaluaciones con comparaciones estrictas (`===`), operador ternario, Nullish Coalescing (`??`) para admitir el valor 0, y `switch`.
* **Sesión 4 (Bucles e Iteraciones):** `do...while` en `generarId()`, `continue` para omitir registros online en promedios, y `break` para detener búsquedas.
* **Sesión 5 (Objetos Nativos):** Uso de `trim()`, `toLowerCase()`, `Number.parseInt()`, `Math.random()`, `toISOString()` y `JSON.parse`/`stringify`.
* **Sesión 6 (Manipulación del DOM y Eventos):** Uso de `document.createElement`, `textContent` (prevención de XSS) y listeners de eventos.
* **Sesión 7 (Almacenamiento y Seguridad):** Persistencia con `localStorage`, preferencias con cookies, apertura de ventana auxiliar comprobando `.closed` y `postMessage` seguro.

---

## 6. Integración de Inteligencia Artificial y Análisis de Decisiones

De acuerdo con las directrices de la práctica, la Inteligencia Artificial se utilizó exclusivamente como un asistente de consulta, optimización y depuración conceptual.

* **Enlace al Chat de IA:** https://gemini.google.com/share/d/1178IIErd4D8fEKl4yo7h7r7MZkptuuIi?usp=sharing

### 6.1. Registro de Decisión: Gestión de Formulario y Eventos en la Interfaz (`main.js`)

#### Consulta Realizada a la IA

Cuando terminé de montar la estructura de `index.html`, los estilos CSS y las funciones de `logica.js`, me quedé atascado antes de empezar con `main.js`. No tenía claro cómo gestionar bien el formulario desde JavaScript: el envío, cómo leer lo que escribe el usuario, limpiar los campos y cuándo usar `addEventListener` con eventos como `submit`, `input` o `change`. Le pedí a la IA que me explicara la teoría de cómo funciona todo esto con ejemplos conceptuales abstractos, pidiéndole explícitamente que no me diera código de mi propia práctica para no copiarlo y poder hacerlo yo mismo.

#### Conceptos Teóricos Aprendidos

La IA me detalló cuatro puntos clave sobre cómo gestionar formularios e interactuar con el DOM desde la interfaz:

1. **Evitar la recarga de la página:** Al pulsar el botón de enviar, el navegador intenta recargar la página por defecto. Para evitarlo hay que escuchar el evento `submit` sobre el formulario y ejecutar `evento.preventDefault()`.
2. **Leer y transformar los datos de entrada:** Todo lo que entra por un campo de texto en HTML llega como una cadena de texto (`String`). Para que los datos sean fiables, hay que aplicar `.trim()` para eliminar espacios en blanco innecesarios al principio y al final, y convertir los valores explícitamente con `Number()`.
3. **Limpiar el formulario:** Se pueden resetear los campos asignándoles una cadena vacía (`.value = ''`) o mediante la instrucción `formulario.reset()`.
4. **Eventos en tiempo real:** Para reaccionar inmediatamente a las acciones del usuario sin esperar al envío, el evento `change` sirve para reaccionar al cambiar de opción en desplegables (`select`), mientras que el evento `input` se dispara de forma instantánea al escribir o borrar en campos de texto.

#### Decisiones Tomadas y Aplicación en el Proyecto

* **Uso de `preventDefault()`:** Decidí aplicarlo dentro del listener del formulario de inscripción. De esta forma, el alta del participante se procesa en segundo plano sin refrescar la ventana, lo que permite actualizar dinámicamente las tarjetas en el DOM, recalcular las estadísticas y notificar los datos al `iframe` sin perder el estado de la aplicación.
* **Saneamiento previo a la validación:** Entendí que la función pura de `logica.js` debe recibir los datos bien formateados. Por eso, en `main.js` aplico `.trim()` a los campos de texto y convierto la edad y la experiencia mediante `Number()` justo antes de pasárselos a la función `validarParticipante()`.
* **Filtros en tiempo real:** Decidí usar el evento `input` para el buscador de participantes por nombre y el evento `change` para el selector de modalidad. Así, la vista de tarjetas se actualiza al instante mientras el usuario escribe o selecciona, combinando la búsqueda y el filtro de forma fluida.

---

## 7. Evidencias de Depuración y Red

### 7.1. Evidencia de Depuración en DevTools (Breakpoint)

* **Ubicación del Punto de Interrupción:** Archivo `js/logica.js`, línea 71, dentro de la función `validarParticipante(datos)`, justo al comprobar las condiciones numéricas de la edad.
* **Procedimiento de Depuración Realizado:**
  1. Se abrieron las herramientas de desarrollo de Chrome/Edge (`F12`) y se accedió a la pestaña **Sources**.
  2. Se colocó un punto de interrupción (*breakpoint*) en la línea 71 de `logica.js`.
  3. Se completó el formulario de alta con datos de prueba y se pulsó "Registrar Participante".
  4. La ejecución se pausó automáticamente en el *breakpoint*, permitiendo inspeccionar las variables del objeto `datos` (`edadTexto`, `edadNum`) en el panel **Scope** y avanzar paso a paso con `F10` (*Step Over*) para verificar la evaluación condicional de errores.
<img width="1913" height="946" alt="image" src="https://github.com/user-attachments/assets/19eab6ec-8e37-4f34-9753-0a0858d0fa43" />


---

### 7.2. Evidencia de Peticiones en la Pestaña Network

* **Explicación del Flujo de Peticiones y Origen Seguro:**
  Al cargar la aplicación en el navegador a través del servidor local HTTP (`http://127.0.0.1:5500`), la pestaña **Network** (Red) registra las peticiones de los recursos estáticos con códigos de estado HTTP `200 OK` (o `304 Not Modified` si están en caché):
  1. `GET /index.html`: Documento HTML5 principal de la aplicación.
  2. `GET /css/estilos.css`: Hoja de estilos global.
  3. `GET /js/logica.js`, `main.js`, `panel.js`, `ayuda.js`: Archivos de código JavaScript ejecutados en el cliente.
  4. `GET /panel.html`: Documento del panel incrustado mediante el elemento `iframe`.


* **Análisis de Seguridad y Same-Origin Policy (SOP):**
  Todas las peticiones comparten exactamente el mismo protocolo (`http`), host (`127.0.0.1`) y puerto (`5500`). Esto garantiza un origen único y seguro, permitiendo que la comunicación bidireccional por `postMessage` entre la ventana principal y el `iframe` se valide de forma estricta contra `event.origin` sin bloqueos de seguridad del navegador.

<img width="566" height="586" alt="image" src="https://github.com/user-attachments/assets/05b6bd16-f68c-4a5d-a84c-20195656c3ce" />
