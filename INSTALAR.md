# Instalar Anime Skips — Beta local 0.4.0

La carpeta que debés seleccionar es **`naruto-skips-main`**, con `manifest.json` directamente dentro. Incluye los datos preparados; para instalar no necesitás Node.js ni ejecutar comandos. En Chrome figura como **Anime Skips**, versión 0.4.0; conserva las funciones de Naruto Skips.

## Instalar desde el ZIP o desde el código descargado

1. Descargá el [ZIP actualizado del repositorio](https://github.com/69Mart1n/naruto-skips/archive/refs/heads/main.zip) o usá `naruto-skips-0.4.0-instalable.zip`. Descomprimilo en una ubicación permanente. Ambos contienen una sola carpeta: **`naruto-skips-main`**.
2. Abrí `chrome://extensions` en Chrome y activá **Modo desarrollador**.
3. Elegí **Cargar descomprimida** y seleccioná **`naruto-skips-main`**, la carpeta que contiene `manifest.json`. No selecciones su subcarpeta `extension` ni el ZIP.
4. Recargá la pestaña de Netflix o Crunchyroll.

Si tu proyecto está en `C:\Users\rossi\OneDrive\Desktop\naruto-skips-main`, esa es la carpeta que seleccionás. En esta computadora la copia reparada está en `C:\Users\bonyc\Documents\ChatGPT\Extencion de Naruto`; su raíz también se puede cargar directamente. No borres ni muevas la carpeta después de instalar. En Brave, el mismo procedimiento se hace en `brave://extensions`.

## Actualizar sin cambiar la carpeta instalada

Copiá el contenido de la nueva `naruto-skips-main` sobre la **misma carpeta** que Chrome ya usa; reemplazá los archivos. Tocá **Recargar** en la tarjeta de la extensión y recargá el reproductor. No elimines la extensión: conservar la misma ruta y entrada permite mantener ajustes, excepciones y marcas. Evitá crear `naruto-skips-main/naruto-skips-main` por accidente.

Si ya usabas la ruta antigua `dist/extension`, mantené esa instalación y ejecutá `npm run build` desde el proyecto para actualizarla; después recargala. Cambiar de esa ruta a la raíz puede crear otra identidad y otros ajustes en Chrome. Para instalaciones nuevas usá únicamente **`naruto-skips-main`**.

No está publicada en Chrome Web Store. El código reparado se distribuye desde la rama `main`; las releases anteriores conservan sus paquetes originales.

## Elegir anime y diseño

Tocá **Cambiar anime** para abrir las siete tarjetas con stickers y nombres completos. Elegí una para cambiar los colores, la decoración y la guía que consultás; vuelve al panel y guarda la elección. **Seguir reproductor** hace que el diseño cambie con la serie detectada. **Volver** o Escape regresan sin cambiar la selección. Naruto y Shippuden conservan el diseño original con Kurama y los detalles ninja. El estado indica el anime que se está reproduciendo: explorar otro diseño no cambia la guía aplicada al video.

Las listas exactas están dentro del panel, en **Tu ruta de capítulos**, y en [CATALOGO_ANIME.md](CATALOGO_ANIME.md).

## Uso automático

En una instalación nueva, intro, resumen, siguiente al final y salto según **Tu lista** vienen activados. Si actualizás, se respetan los interruptores que ya hayas guardado.

Netflix reconoce por identificador los 220 capítulos de Naruto y 500 de Shippuden del catálogo verificado. No depende de que el número mostrado sea absoluto o se reinicie por temporada. Al encontrar un capítulo omitido, abre directamente el primero que conservás; por ejemplo, Shippuden 305 → 321 o Naruto 136 → 220. No hace falta calibrar cada temporada para estos identificadores.

Si Netflix usa otro identificador o muestra información contradictoria, la extensión conserva el capítulo y permite corregir la detección desde el panel. La corrección manual es una alternativa para capítulos desconocidos; no reemplaza los identificadores verificados. Si se bloquea un salto sin confirmar, **Reintentar** lo habilita otra vez.

**Tu lista** sigue la guía que proporcionaste y omite también algunos capítulos mixtos. Conserva Naruto 135 y omite 136–219. **Solo relleno completo** conserva todos los mixtos. **Ver este capítulo** agrega una excepción; para usarlo antes de un salto automático, pausá primero la automatización.

En One Piece, **Tu lista** salta automáticamente los 100 capítulos que proporcionaste, incluidos los arcos completos de relleno, y conserva el 1084. En Bleach, Dragon Ball, Dragon Ball Z y Black Clover se aplica **Solo relleno completo**, incluso si tu preferencia guardada es **Tu lista**. Cuando no se reconoce el capítulo, mostrá los controles y confirmá el número absoluto en el panel. Esa confirmación se guarda por plataforma, serie y temporada. En Netflix, One Piece requiere confirmación por cada URL desconocida: sólo el anime, nunca el live action. El salto continuo de sus arcos sin esas confirmaciones todavía necesita un catálogo de Netflix verificado.

## Escenas lentas

- Mantené **V** durante la reproducción para usar 2×; al soltar o cambiar de ventana vuelve a la velocidad anterior. No actúa mientras escribís en un campo.
- Podés elegir una velocidad habitual de 1×, 1,25×, 1,5× o 2×.
- En el panel, **Marcar inicio** y luego **Marcar final** guarda un tramo para acelerarlo a 2× al volver a verlo. Las marcas se conservan aunque cierres el panel.
- Las marcas pertenecen al capítulo, plataforma, URL y duración. No se aplican a otra edición con duración diferente. Podés borrarlas por capítulo.

No se recortan silencios, planos largos ni recuerdos por una suposición automática. Esta versión acelera tramos que hayas marcado; todavía no trae tiempos revisados de escenas para los 720 capítulos.

## Alcance de la beta

Se verificó el catálogo real de Netflix de Naruto y Shippuden y hay 48 pruebas automatizadas, incluido el salto de G-8 196–206 → 207 en un reproductor simulado y la integridad del paquete instalable. Las guías de los otros cinco animes están cargadas; sus catálogos y la reproducción continua con una cuenta real siguen pendientes de verificación. [REPARACION_INSTALACION.md](REPARACION_INSTALACION.md) distingue las comprobaciones de instalación de la carga real pendiente en Chrome.

Crunchyroll reconoce las series oficiales Naruto/Shippuden y sus números absolutos sin etiqueta de temporada. La navegación usa el enlace siguiente comprobado; avanza uno por uno dentro de un bloque. Sus controles de reproducción y velocidad dentro de frames son experimentales y necesitan prueba con cuenta.

Si otra extensión también pulsa intro/siguiente, desactivala durante la prueba. Para actualizar esta beta, reemplazá los archivos de la misma carpeta, tocá **Recargar** en la página de extensiones y recargá el reproductor.
