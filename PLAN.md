# Plan de desarrollo: Naruto sin relleno

## Estado al 7 de octubre de 2026

Beta 0.3.0 implementada con adaptadores separados. Se leyeron los 720 identificadores del catálogo real de Netflix de Uruguay: Naruto reinicia los números por temporada; Shippuden muestra números absolutos dentro de 21 temporadas. La detección por URL resuelve ambas variantes sin pedir calibración para estos identificadores. Netflix puede abrir directamente el primer capítulo conservado de un bloque. Se agregó resumen, velocidad habitual, tecla V temporal y marcas locales para acelerar escenas. Crunchyroll sigue experimental. Las 32 pruebas automatizadas pasan; la instalación y reproducción con la extensión siguen pendientes porque Chrome no estaba conectado y el navegador disponible recibió el límite de pantallas simultáneas.

## Objetivo

En Chrome y Brave, pulsar intro/resumen y siguiente al final e identificar Naruto/Shippuden para omitir capítulos según la guía elegida. La beta incorpora «Tu lista» de PcComponentes y mantiene «Solo relleno completo» como alternativa. Ver GUIA_PERSONALIZADA.md. Para escenas lentas se implementó aceleración; un catálogo de recortes necesitaría tiempos revisados por edición.

## 1. Adaptar el reproductor

Inspeccionar un episodio reproducible de Netflix con cuenta y la lista de episodios de ambas plataformas para ubicar:

- Serie actual y número de episodio.
- Botones de intro y siguiente, incluso dentro de un iframe si corresponde.
- Enlaces o controles que permitan abrir un episodio concreto.
- Numeración absoluta frente a temporada + episodio; idioma y edición.
- Cambios de episodio sin recarga de página.

No interpretar un identificador opaco de la URL como número de capítulo. Si la plataforma reinicia la numeración por temporada, comprobar un mapa para esa plataforma y edición. No utilizar un offset supuesto ni contar clics como prueba del episodio actual.

Entrega de esta etapa: adaptador con lectura fiable de identidad y número, selectores comprobados y método de navegación comprobado. Primera versión limitada a la plataforma que uses; futuros sitios llevan adaptadores independientes.

## 2. Motor de decisión

Usar `data/episodes.json` incluido en la extensión. Mantener la clasificación (relleno completo, mixto, canon del anime o manga) separada de la decisión de saltar según la guía. La selección actual y las excepciones se guardan localmente. «Tu lista» también puede omitir mixtos y conservar episodios de relleno elegidos por el usuario.

Al cargar un capítulo, comprobar serie y numeración; luego calcular el primer episodio que no debe omitirse. Si se puede abrir directamente desde la lista de la plataforma, saltar todo el bloque en una sola navegación. Si sólo existe siguiente, avanzar un episodio por vez y volver a comprobar su identidad después de cada transición.

Si el sitio no ofrece navegación anticipada, será necesario resolver eso en el adaptador; pulsar el botón final no permite por sí solo omitir un capítulo entero al comienzo. No se puede prometer saltos inmediatos antes de inspeccionarlo.

Sin identificación fiable, conservar el capítulo y mostrar el motivo. Nunca omitir episodios basándose únicamente en números que aparezcan en recomendaciones o comentarios.

## 3. Extensión Manifest V3

Estructura actual de la beta:

```text
extension/
  manifest.json
  content.js
  core.js
  adapters.js
  media.js
  background.js
  data/episodes.js
  data/netflix-catalog.js
  popup.html
  popup.css
  popup.js
```

Observar cambios relevantes del reproductor con `MutationObserver`, agrupar comprobaciones y agregar un respaldo periódico moderado. Verificar visibilidad y que el botón esté habilitado. Bloquear doble clic y esperar confirmación de un nuevo episodio antes de volver a navegar. Si no cambia el episodio, detener los reintentos y mostrar el problema.

Al cambiar de serie, limpiar el estado. Limitar acciones a Naruto y Shippuden en la primera versión. Las preferencias se guardarán localmente; permisos restringidos a la plataforma y almacenamiento. Agregar permisos para iframes sólo si la inspección demuestra que hacen falta.

## 4. Controles

Panel en español con controles para saltar intro, pasar al siguiente al final y omitir capítulos según la guía. Selector «Tu lista» / «Solo relleno completo». Mostrar episodio identificado, clasificación y próximo destino sin títulos ni sinopsis que den spoilers. Incluir pausa de automatización, «Ver este capítulo» y explicación de identificación fallida.

Sin backend, telemetría ni lectura de credenciales. Una base versionada permite explicar cada salto y corregir la clasificación.

## 5. Verificación

Automatizar pruebas útiles del cálculo de saltos y de la detección ambigua. Casos clave: 278→282 al terminar; 284→296 al iniciar en relleno; 303→321; 347→362; conservar 296, 362, 451 y 469; conservar 28; fin en 500 sin buscar 501; Naruto 143→220.

Verificar además botones ocultos y repetidos, fallas de navegación, cambio de serie y temporada, preferencias desactivadas y exclusiones de relleno.

Probar en el sitio real con Chrome y Brave: apertura directa de relleno, reproducción continuada hasta otro bloque, salto de intro, siguiente al final y persistencia al reiniciar. Comprobar que no hay dos extensiones haciendo clic simultáneamente durante la prueba. Registrar qué fue verificado y qué sigue pendiente.

## 6. ZIP instalable y publicación

Generar un ZIP versionado con `manifest.json` en la raíz y guía breve en español. Validar archivos, permisos y carga local. Para uso personal puede instalarse descomprimiendo y cargando la carpeta en modo desarrollador.

Para compartir un enlace, subir el ZIP a un repositorio. Se utilizará un repositorio privado para la beta personal, si la cuenta conectada permite crearlo. Para Chrome Web Store, preparar iconos propios, capturas, descripción, política de privacidad, justificación de permisos e instrucciones de prueba; cargar el paquete con una cuenta de desarrollador y enviarlo a revisión. No afirmar publicación hasta recibir una URL verificable.

## Criterio de entrega

Código, ZIP y release privada preparados. Próxima verificación: cargar la extensión en Chrome, comprobar intro/resumen, salto 305→321, velocidad temporal, final de capítulo y cambio de temporada en una sesión de reproducción disponible. Luego validar los controles de Crunchyroll con cuenta. La lectura del catálogo y las pruebas simuladas no reemplazan esa verificación real.

La extensión estará lista cuando funcione en la plataforma confirmada, respete la guía elegida y las excepciones, y se entregue un ZIP que cargue correctamente en Chrome y Brave. «Solo relleno completo» debe preservar todos los mixtos; «Tu lista» debe respetar los intervalos proporcionados. La publicación en tienda será un paso posterior sujeto a cuenta y revisión externa.
