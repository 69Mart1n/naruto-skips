# Anime Skips

Extensión Manifest V3 para Chrome y Brave, con Netflix como plataforma principal y Crunchyroll experimental.

**Beta local 0.4.0: siete animes, guías de relleno y stickers por serie. Se recuperó el diseño original de Naruto Skips. La reproducción continua con una cuenta real sigue pendiente de verificación.**

**Cambiar anime** abre una colección aparte con Naruto, Naruto Shippuden, One Piece, Bleach, Dragon Ball, Dragon Ball Z y Black Clover. Las tarjetas muestran stickers y nombres completos, sin una cuadrícula en la pantalla principal. Cada elección cambia los recursos decorativos, colores, título y lema; la selección se guarda. **Seguir reproductor** vuelve al diseño automático. Naruto y Shippuden recuperan el encabezado original con Kurama y los detalles ninja de la versión 0.3.3. Se conserva el ícono N. [STICKERS.md](STICKERS.md) registra las imágenes, las fuentes y los prompts de preparación. El panel usa archivos locales.

Los intervalos completos, el diseño de cada anime y sus límites están en [CATALOGO_ANIME.md](CATALOGO_ANIME.md). Las guías cubren 2880 capítulos y clasifican 627 como relleno completo, según las fuentes consultadas el 9 de octubre de 2026.

- Identifica los 720 capítulos de Naruto/Shippuden de Netflix por su URL, incluidos los números que se reinician por temporada. Incluye las correspondencias leídas del catálogo, sin contar clics ni asumir un tamaño de temporada.
- Salta directamente un bloque de capítulos omitidos hasta el próximo que conservás. Por ejemplo, Shippuden 305 → 321.
- Pulsa los botones oficiales de intro, resumen y siguiente al final. El botón siguiente persistente de Crunchyroll sólo se usa al terminar el video o al aparecer créditos.
- **Tu lista** está activa por defecto y sigue tus guías para Naruto, Shippuden y One Piece. One Piece omite los 100 capítulos indicados y los arcos completos de relleno, como G-8 196–206 → 207; conserva el 1084. También puede omitir mixtos y canon del anime. Naruto 135 se conserva para resolver la contradicción de la fuente. **Solo relleno completo** conserva todos los mixtos y el canon del anime.
- En Bleach, Dragon Ball, Dragon Ball Z y Black Clover, **Tu lista** aplica **Solo relleno completo**. Se reconoce el título exacto y se confirma el capítulo absoluto por temporada cuando no hay una correspondencia verificada. En Netflix, One Piece requiere confirmación por capítulo desconocido para no confundir el anime con el live action; su salto continuo sin confirmaciones todavía necesita un catálogo verificado. Todavía no se han verificado los catálogos de reproducción de estas cinco series.
- Una instalación nueva habilita el salto de capítulos; los ajustes guardados anteriormente se respetan. Sin identificación fiable, no salta capítulos.
- Velocidad habitual, tecla V para 2× temporal y marcas locales para acelerar tramos al volver a verlos. Las marcas comprueban capítulo, plataforma, URL y duración. No trae recortes de escenas ni tiempos inventados.
- Excepciones, pausa y corrección manual para identificadores desconocidos. Todo se guarda localmente; sin telemetría, backend, IA ni lectura de credenciales.

## Instalar

Descargá el [ZIP del código actualizado](https://github.com/69Mart1n/naruto-skips/archive/refs/heads/main.zip) y descomprimilo. En **Cargar descomprimida**, seleccioná **`naruto-skips-main`**, que contiene `manifest.json` directamente en su raíz. El código fuente queda listo para cargar, sin ejecutar npm. También podés usar `naruto-skips-0.4.0-instalable.zip`, generado por el proceso de empaquetado. Seguí [INSTALAR.md](INSTALAR.md) para instalar y actualizar conservando la misma carpeta. La copia histórica `dist/extension` sigue preparándose para instalaciones existentes. La [release anterior 0.3.3](https://github.com/69Mart1n/naruto-skips/releases/tag/v0.3.3) conserva su paquete original. No está en Chrome Web Store.

## Datos y desarrollo

[GUIA_PERSONALIZADA.md](GUIA_PERSONALIZADA.md) describe los intervalos elegidos. [INVESTIGACION.md](INVESTIGACION.md) contiene las fuentes y [PLAN.md](PLAN.md) el estado del trabajo.

`data/episodes.json` separa clasificación y decisión de visionado. `data/netflix-catalog.json` contiene las correspondencias verificadas el 7 de octubre de 2026 en el listado de Netflix de Uruguay. `idRuns` comprime secuencias contiguas de identificadores observados; cada capítulo se leyó del listado. Las pruebas comparan los 720 identificadores con sumas de control calculadas independientemente sobre la extracción original. No se distribuyen perfiles, progreso de reproducción ni información de cuenta.

```sh
npm ci
npm run prepare
npm test
npm run package
```

La extensión instalada no necesita paquetes npm. Node.js 24 o posterior y las dependencias de desarrollo sólo se necesitan para modificar, probar o empaquetar. `jsdom` se usa en pruebas y `fflate` crea y comprueba el ZIP.

`extension/manifest.json` es el manifiesto fuente. `npm run prepare` genera el manifiesto raíz con rutas bajo `extension/` y `extension/data/episodes.js` y `extension/data/netflix-catalog.js` desde los JSON originales. También se ejecuta automáticamente al instalar dependencias. **Los tres archivos generados deben guardarse en Git** para que Descargar ZIP del repositorio funcione sin preparación. No los edites a mano.

`npm run check` falla si faltan datos, están desactualizados, hay rutas rotas o JavaScript inválido. `npm test` ejecuta esa comprobación antes de las pruebas. `npm run build` regenera y valida la raíz y renueva completamente `dist/extension`, eliminando residuos de builds anteriores. `npm run package` prepara, prueba y genera `dist/naruto-skips-0.4.0-instalable.zip` y su SHA256. Incluye la extensión, los JSON originales, scripts, pruebas y documentación; excluye dependencias, Git, capturas y builds anteriores. Descomprime y valida el ZIP antes de entregarlo.

El workflow `.github/workflows/package.yml` comprueba los archivos guardados **antes** de instalar dependencias y produce el ZIP como artefacto si pasan las pruebas. Así no oculta un archivo generado ausente en el código descargado.

## Verificación y limitaciones

48 pruebas automatizadas cubren las siete guías, los 720 identificadores Netflix verificados, los 100 saltos personalizados de One Piece, navegación automática de G-8 hasta 207 en un reproductor simulado, selección y persistencia de temas, fallback de la guía personalizada, temporadas, identificadores desconocidos, aislamiento de One Piece live action, excepciones, navegación, velocidad, marcas y comunicación entre frames. Las pruebas de instalación reproducen archivos faltantes y datos desactualizados, comprueban el manifiesto raíz, eliminan residuos de builds y cargan los scripts reales del panel desde el ZIP extraído con una API de Chrome simulada.

Para comparar los diseños en una vista local con API de Chrome y reproductor simulados, ejecutar `npm run preview` después del build y abrir `http://127.0.0.1:4173/designs`. El mock no se incluye en la extensión.

Se inspeccionó el catálogo de ambas series en Netflix. Chrome no estaba disponible para control y el intento de reproducción desde el navegador disponible recibió el límite de pantallas simultáneas. No se interrumpió ninguna sesión. La carga de la extensión, los selectores de reproducción actuales y el flujo continuo en Chrome/Brave siguen pendientes de prueba real.

Crunchyroll usa los identificadores de serie oficiales `GY9PJ5KWR` y `GYQ4MW246`. Se inspeccionó la página pública E303 de Shippuden y se verificó el identificador de Naruto en su página oficial. Sus controles y la reproducción con cuenta son experimentales. Los capítulos con número de temporada explícito necesitan una correspondencia confirmada; no se asume un offset.

## Referencias técnicas

- [Scripts de contenido de Chrome](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).
- [Netflix Auto Skip](https://github.com/sajjad-ahmed/netflix-auto-skip/blob/main/chrome-extension/content.js).
- [Skippy para Crunchyroll](https://github.com/synle/skippy-ff/blob/main/src/content/skippy-crunchyroll.js).
- [Catálogo de Naruto en Netflix](https://www.netflix.com/browse?jbv=70205012) y [Shippuden](https://www.netflix.com/browse?jbv=80000603).
- [Naruto en Crunchyroll](https://www.crunchyroll.com/es/series/GY9PJ5KWR/naruto) y [episodio E303 de Shippuden](https://www.crunchyroll.com/es/watch/GRZXQ4VDY/ghosts-from-the-past).
- [Velocidad de reproducción HTML](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate).

Implementación propia; las referencias se usaron para investigar los controles.
