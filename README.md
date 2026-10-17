## 1. Descripción General e Instrucciones de Ejecución

Esta aplicación web permite gestionar la inscripción de asistentes a un evento tecnológico. Toda la lógica se ejecuta exclusivamente en el navegador utilizando HTML5, CSS3 y JavaScript ES6+ vanil-la, sin librerías ni frameworks externos.

\### Guía de ejecución mediante Servidor HTTP Local (Requisito Obligatorio) El proyecto requiere ejecutarse en un entorno servidor HTTP para permitir el correcto intercambio de mensajes seguros por `postMessage` entre orígenes e `iframe`, así como el uso adecuado de cookies sin bloqueos por protocolo `file://`.

- 1. **Vía VS Code (Live Server):** - Abrir la carpeta raíz del proyecto en VS Code. - Hacer clic derecho sobre `index.html` y seleccionar **"Open with Live Server"**. - La aplicación se abrirá automáticamente en `http://127.0.0.1:5500` o

`http://localhost:5500`.

- 2. **Vía Node.js (`http-server` o `npx`):**

- \- Abrir la terminal en la raíz del proyecto.

- \- Ejecutar: `npx http-server -p 8080`

- \- Acceder en el navegador a: `http://localhost:8080`.

\---

## 2. Estructura del Proyecto

```text


Practica_DWEC_UD1/

│

├── index.html

\# Página principal (Formulario, Listado, Estadísticas, JSON, Panel

iframe)

├── ayuda.html

\# Ventana auxiliar de ayuda e información del navegador # Panel del evento incrustado mediante iframe

├── panel.html

│

├── css/

│ └── estilos.css

\# Hoja de estilos global (Temas claro/oscuro, tamaños y layout

responsive)

│

├── js/

│ ├── logica.js

\# Lógica pura del negocio (Validaciones, Estadísticas, Generación

de ID, Persistencia)

│ ├── main.js

\# Gestión de la interfaz principal (DOM, Eventos, Cookies,

postMessage, Ventana Ayuda)

│ ├── panel.js

\# Lógica del iframe receptor de mensajes

│ └── ayuda.js

\# Lógica de la ventana secundaria de ayuda

│

└── README.md

\# Documentación técnica completa y casos de prueba

## 3. Explicación Módulo a Módulo: Funcionalidades, Archivos y Funciones

El proyecto sigue una separación estricta de responsabilidades: logica.js no interactúa con el DOM (es reutilizable y testeable), mientras que main.js gestiona la interacción del usuario y la manipulación del DOM.

## 3.1. Gestión de Datos y Persistencia Local

- Archivos: js/logica.js, js/main.js

- Descripción: Se inicializa la colección de datos. Para cumplir el requisito de persistencia del estado en el cliente tras recargar (F5), se consulta primero localStorage. Si existen datos guardados se parsean con JSON.parse(); de lo contrario, se carga la lista por defecto con 3 participantes iniciales.

- Funciones:

- generarId(participantes) (logica.js): Genera un ID único de 6 dígitos (100000 - 999999) utilizando Math.random(). Emplea un bucle do...while con un límite defensivo de intentos para evitar bloqueos del hilo principal.

## 3.2. Alta y Validación de Participantes

- Archivos: js/logica.js, js/main.js

- Descripción: Comprueba que todos los datos procedentes del formulario cumplan con las restricciones de tipo, rango y formato. Trata todas las entradas como no fiables, sin confiar solo en HTML5.


## Funciones:

- validarParticipante(datos) (logica.js): Valida los campos:

- Nombre: trim().length entre 2 y 60 caracteres.

- Edad: Numérico, entero finito entre 0 y 120.

- Tipo: Exclusivamente estudiante, profesional o invitado.

- Modalidad: Exclusivamente presencial u online.

- Experiencia: Numérico finito entre 0 y 10 (permite decimales).

- clasificarEdad(edad) y clasificarExperiencia(exp) (logica.js): Asignan etiquetas (menor/mayor de edad; experiencia inicial, intermedia o avanzada).

## 3.3. Renderizado del Listado y Bajas

- Archivos: js/main.js

- Descripción: Crea e inyecta las tarjetas dinámicas de los participantes en el DOM.

- Funciones:

- crearTarjeta(participante) (main.js): Utiliza únicamente document.createElement, textContent, classList y append para estructurar el nodo de forma segura sin innerHTML. Añade la fecha formateada en español (Intl.DateTimeFormat o toLocaleDateString('es-ES')). Incluye el botón "Eliminar" con confirmación mediante confirm().

## 3.4. Cálculo de Estadísticas Generales

- Archivos: js/logica.js

- Descripción: Calcula métricas sobre la colección global utilizando bucles, contadores y acumuladores tradicionales (sin usar reduce).

- Funciones:

- calcularEstadisticas(participantes) (logica.js):

- Utiliza bucles for y for...of.

- Calcula la experiencia media de asistentes presenciales usando continue para ignorar los registros online.

- Localiza al primer menor de edad mediante un bucle con break.

- Devuelve "Sin datos" en caso de listas vacías o divisiones por cero, garantizando que nunca se devuelva NaN o Infinity.

## 3.5. Intercambio de Datos JSON (Importar/Exportar)

- Archivos: js/logica.js, js/main.js

- Descripción: Permite serializar y deserializar la lista de participantes.

- Manejo: La importación se procesa en un bloque try/catch. Si el JSON no es un Array, si algún campo es inválido o si contiene IDs duplicados, se rechaza la importación por completo y se conserva íntegramente la lista anterior.

## 3.6. Panel de Eventos en Iframe (postMessage)

- Archivos: index.html, panel.html, js/main.js, js/panel.js


- Descripción: Sincronización bidireccional en tiempo real entre la ventana principal y el iframe sin manipular el DOM de forma directa entre ventanas.

- Mecanismo:

- 1. panel.js se inicializa, registra su listener message y emite un mensaje de "listo" (ready) hacia window.parent.

- 2. main.js recibe la señal y envía el resumen de datos usando un targetOrigin explícito (ej. http://127.0.0.1:5500).

- 3. En ambos lados se valida rigurosamente event.origin, event.source y la estructura de event.data.

## 3.7. Preferencias de Usuario con Cookies

- Archivos: js/main.js

- Descripción: Permite seleccionar Tema (Claro/Oscuro) y Tamaño de Letra (Normal/Grande). Las opciones se aplican inmediatamente en el DOM agregando/quitando clases al <body> y se almacenan durante 30 días.

- Funciones:

- guardarCookie(nombre, valor, dias) (main.js): Guarda usando atributos Path=/, SameSite=Lax, Max-Age (en segundos) y la directiva Secure cuando se detecta HTTPS.

- leerCookie(nombre) (main.js): Obtiene y decodifica el valor.

- borrarCookie(nombre) (main.js): Asigna Max-Age=0.

## 3.8. Ventana Auxiliar de Ayuda

- Archivos: ayuda.html, js/main.js, js/ayuda.js

- Descripción: Abre una ventana independiente mediante window.open. Guarda la referencia para evitar duplicados comprobando .closed. Muestra información informativa del entorno extraída de navigator.language, location.origin, screen.width y screen.height.

## 4. Casos de Prueba Reproducibles en el Navegador

## Prueba 1: Alta de Participante con Datos Válidos

- Pasos: Rellenar el formulario con: Nombre="Lucía Torres", Edad=22, Tipo="profesional", Modalidad="presencial", Experiencia=6.5. Hacer clic en "Registrar Participante".

- Resultado Esperado: Se limpia el formulario, se añade una nueva tarjeta con la fecha de inscripción actual en español y las clasificaciones (Mayor de edad, Experiencia Intermedia). Se actualizan el contador global y la media de estadísticas.

## Prueba 2: Alta de Participante con Entradas Inválidas

- Pasos: Rellenar: Nombre=" A ", Edad="18abc", Tipo="estudiante", Modalidad="presencial", Experiencia=15.


- Resultado Esperado: Se muestra un mensaje de error claro especificando los campos erróneos. No se añade nada al listado, los valores erróneos permanecen en el formulario y las estadísticas no cambian.

## Prueba 3: Búsqueda y Filtrado Combinado

- Pasos: Seleccionar modalidad "online" en el desplegable de filtro y escribir "Pedro" en la caja de búsqueda.

- Resultado Esperado: Se muestra únicamente la tarjeta de Pedro López. El indicador informa "Mostrando 1 de 3 participantes". Las estadísticas globales se mantienen intactas.

## Prueba 4: Eliminación con Confirmación y Cancelación

- Pasos: En la tarjeta de Ana García, hacer clic en "Eliminar". En el diálogo emergente, presionar "Cancelar". Posteriormente, repetir el proceso y presionar "Aceptar".

- Resultado Esperado: Al cancelar, la tarjeta y los datos permanecen. Al aceptar, se elimina la tarjeta, disminuye el número de inscritos y se sincroniza el iframe.

## Prueba 5: Importación de JSON Inválido o Mal Formado

- Pasos: En el área de texto JSON, pegar { "nombre": "Invalido" } (no es un array) y pulsar "Importar".

- Resultado Esperado: Un mensaje de error alerta que el formato o los datos no son válidos. La lista actual se conserva intacta sin sufrir modificaciones parciales.

## Prueba 6: Lista Vacía (Manejo de Valores Limite)

- Pasos: Eliminar uno a uno todos los participantes hasta dejar la lista a 0.

- Resultado Esperado: El listado muestra un mensaje de "No hay participantes". Las estadísticas muestran "Sin datos" en medias/extremos y "0" en contadores. El iframe muestra el mensaje "Sin inscripciones".

## Prueba 7: Guardado, Lectura y Restablecimiento de Cookies

- Pasos: Cambiar el tema a "Oscuro", el tamaño a "Grande" y pulsar "Guardar Preferencias". Abrir DevTools -> Application -> Cookies.

- Resultado Esperado: Aparecen las cookies tema=oscuro y tamano=grande con Max-Age=2592000. Al pulsar "Restablecer", las cookies desaparecen (Max-Age=0) y la interfaz vuelve a tema claro y tamaño normal.

## Prueba 8: Seguridad postMessage (Mensajes Rechazados)

- Pasos: Abrir la consola e intentar enviar un mensaje manualmente hacia el iframe con origen manipulado: iframe.contentWindow.postMessage({ total: 999 }, '*').

- Resultado Esperado: El iframe ignora el mensaje por no cumplir la estructura completa requerida o por origen no autorizado. El panel no altera su DOM.


## 5. Relación de Contenidos Aplicados por Sesión (Sesiones 1 a 7)

## Sesión 1: Arquitectura Cliente-Servidor y Carga de Scripts

- Conceptos: Carga del DOM y ejecución asíncrona/diferida.

- Aplicación: Los scripts se cargan al final del <body> o con el evento DOMContentLoaded. Se explica que JavaScript corre en el motor V8 del cliente (browser), mientras que el servidor de desarrollo (Live Server) únicamente sirve los archivos estáticos HTML/CSS/JS por HTTP.

## Sesión 2: Ámbitos, Hoisting y Variables

- Conceptos: const, let, ámbito de bloque vs. ámbito de función, Hoisting.

- Aplicación: Se evita var para prevenir el alzado de variables e imprevistos en el scope global. Uso estricto de const para referencias que no cambian (elementos DOM, colecciones) y let para contadores o acumuladores.

## Sesión 3: Estructuras de Control e Identidad de Valores

- Conceptos: Evaluaciones Truthy/Falsy, comparaciones estrictas (===), operador ternario, Nullish Coalescing (??) y Disyunción Lógica (||).

- Aplicación:

- Uso de === para evitar conversiones implícitas no deseadas.

- Diferencia aplicada entre || y ??: Se utilizó ?? al evaluar valores numéricos donde 0 es una entrada válida (por ejemplo, edad 0 es truthy para ?? pero falsy para ||).

- Estructura switch en la clasificación de tipos y modalidades.

## Sesión 4: Bucles, Iteraciones y Control de Flux

- Conceptos: for, for...of, while, do...while, break y continue.

- Aplicación:

- Bucle do...while en generarId() para garantizar un intento inicial de generación de código único.

- Uso de continue en el cálculo de la experiencia presencial para omitir elementos online.

- Uso de break al iterar la colección para detener la búsqueda en cuanto se encuentra al primer menor de edad.

## Sesión 5: Objetos Nativos (String, Number, Math, Date, JSON)

- Conceptos: Métodos de cadenas, validación con Number.isFinite(), generación aleatoria, fechas ISO y serialización.

- Aplicación: String.prototype.trim() y toLowerCase(); Number.parseInt() y Number.parseFloat(); Math.random() y Math.floor(); formato ISO mediante new Date().toISOString(); e intercambio dinámico con JSON.stringify() y JSON.parse().


## Sesión 6: Manipulación del DOM y Eventos

- Conceptos: Selección de elementos (getElementById, querySelector), creación segura de nodos (createElement, append), clases y manejo de eventos.

- Aplicación: Construcción dinámica de tarjetas de participantes usando textContent para prevenir vulnerabilidades XSS. Registro de listeners de eventos (click, submit, input, change).

## Sesión 7: Almacenamiento, Comunicación Inter-Ventanas y Restricciones de Origen

- Conceptos: localStorage, Cookies (document.cookie), window.open, postMessage, Same-Origin Policy (SOP).

- Aplicación: Persistencia local de participantes con localStorage, gestión de opciones visuales en cookies independientes, apertura controlada de ayuda.html verificando .closed y comunicación bidireccional segura mediante postMessage comprobando event.origin.

## 6. Integración de Inteligencia Artificial y Análisis de Decisiones

De acuerdo con las directrices de la práctica, la Inteligencia Artificial se utilizó exclusivamente como un asistente de consulta, optimización y depuración conceptual.

- Enlace al Chat de IA: [Insertar aquí el enlace público/compartido a la conversación utilizada]

## Registro de Decisión y Análisis Técnico

- 1. Gestión de la Persistencia (LocalStorage vs. Cookies):

- Consulta Realizada: Se analizó cómo integrar localStorage para garantizar que la lista de usuarios persista al recargar (F5) sin sobrecargar el límite de tamaño de las cookies.

- Propuesta de la IA: Inicializar los participantes consultando localStorage.getItem("participantes") y usar una carga fallback condicional.

- Análisis y Adopción: Aceptado. Se comprobó que el límite de 4 KB de las cookies es insuficiente para arrays de objetos grandes, mientras que localStorage ofrece 5 MB y mantiene la lógica cliente limpia.

- 2. Sincronización Bidireccional Iframe (postMessage):

- Consulta Realizada: ¿Cómo evitar que el iframe intente procesar datos antes de que su receptor de eventos esté registrado?

- Propuesta de la IA: Implementar un protocolo de saludo ("handshake") donde el iframe notifica al padre cuando está ready.

- Análisis y Adopción: Aceptado e implementado. Previene condiciones de carrera (race conditions) durante el arranque de la aplicación.

- 3. Validación de Tipos y Tratamiento de Cadenas Vacías:


- Consulta Realizada: Revisión de expresiones para rechazar entradas como "18abc" o espacios en blanco.

- Propuesta de la IA: Usar Number() combinado con Number.isFinite() y Number.isInteger() tras aplicar .trim().

- Análisis y Adopción: Aceptado. Cumple estrictamente con el requisito de no confiar únicamente en los atributos de los formularios HTML.

## 7. Evidencias de Depuración y Red

## 7.1. Evidencia de Depuración en DevTools (Breakpoint)

- Ubicación del Punto de Interrupción: Archivo js/logica.js, dentro de la función validarParticipante(datos), en la línea donde se evalúa la edad.

- Explicación de la Captura: Se configuró un breakpoint condicional al enviar el formulario. Al pausar la ejecución en el tab Sources, se inspeccionó el panel Scope comprobando que la variable datos.edad llegaba en formato String ("17"). Se verificó el paso a paso mediante las teclas Step Over (F10) observando cómo la condición Number.isInteger() validaba correctamente la conversión numérica antes de insertar el registro en la lista.

## 7.2. Evidencia de Peticiones en la Pestaña Network

- Explicación del Flujo de Red: Al cargar la aplicación desde el servidor local HTTP (http://127.0.0.1:5500), la pestaña Network (red) registra las siguientes peticiones con código de estado 200 OK o 304 Not Modified:

- 1. GET /index.html (Documento principal HTML5).

- 2. GET /css/estilos.css (Estilos globales).

- 3. GET /js/logica.js, main.js, panel.js (Scripts ejecutados en el navegador).

- 4. GET /panel.html (Incrustado por el elemento <iframe>).

Todas las peticiones comparten el mismo esquema, host y puerto, garantizando que el intercambio de información entre el documento principal y el iframe se realice bajo el mismo origen seguro.


