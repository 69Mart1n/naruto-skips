# Reparación de instalación — 15 de octubre de 2026

## Estado revisado antes de modificar

La ruta solicitada `C:\Users\rossi\OneDrive\Desktop\naruto-skips-main` no existe en esta computadora. Se reparó la copia disponible en `C:\Users\bonyc\Documents\ChatGPT\Extencion de Naruto`, rama `codex/naruto-sin-relleno`. Había cambios de desarrollo previos en datos, panel, recursos, scripts y pruebas; se conservaron. El manifiesto fuente ya indicaba **Anime Skips 0.4.0** y el único permiso declarado era `storage`. Las 43 pruebas existentes pasaron antes de la reparación.

Faltaba `manifest.json` en la raíz. El build sólo generaba los datos JavaScript en `dist/extension/data`, por lo que el código descargado no era autosuficiente para Cargar descomprimida.

## Entrega y prevención

- `manifest.json` en la raíz referencia el worker, panel, iconos y scripts bajo `extension/`.
- `extension/data/episodes.js` y `extension/data/netflix-catalog.js` se generan desde los JSON originales y se incluyen en la entrega. No se cambian funciones, permisos ni versión.
- `npm run prepare` regenera los tres archivos. Deben incluirse en Git junto con las fuentes; no deben ignorarse ni editarse a mano.
- `npm run check` compara los generados con las fuentes y valida rutas y sintaxis. Las pruebas fallan antes de ejecutarse si detecta archivos faltantes o desactualizados.
- `npm run build` prepara y valida la raíz y reemplaza la salida antigua de `dist/extension` por una copia limpia, para conservar instalaciones previas.
- `npm run package` prepara, prueba y crea un ZIP completo, lo extrae y valida antes de entregarlo. Incluye datos originales, código, herramientas, pruebas y documentación; no incluye dependencias de desarrollo instaladas ni otros builds.
- El workflow de GitHub comprueba los generados antes de `npm ci`, prueba y crea el ZIP. Está preparado en esta entrega; sólo se ejecutará en GitHub cuando estos cambios se incorporen al repositorio. Las releases públicas anteriores no se modificaron.

## Comprobado y pendiente

Se verifican el manifiesto de la raíz y el de la salida compatible, rutas de scripts e iconos, recursos HTML/CSS y temas, sintaxis de los JavaScript de la extensión y coincidencia exacta de los datos con los JSON. Las pruebas de regresión provocan archivos ausentes, datos desactualizados y JavaScript inválido y comprueban que se detecten.

La batería tiene **48 pruebas**: las 43 existentes y 5 de preparación, validación, build y ZIP. La prueba del ZIP carga los scripts reales del panel extraído y comprueba las siete tarjetas de anime usando una API de Chrome simulada. Esa prueba no equivale a instalar la extensión en Chrome.

**Carga real en Chrome pendiente.** Se encontró y abrió el Chrome instalado, pero el control de aplicaciones se detuvo porque no pudo determinar con suficiente confianza la URL activa del navegador. No se confirmó una carga con Cargar descomprimida ni reproducción con cuenta real en esta reparación.

## Instalar y actualizar

Descomprimí `dist/naruto-skips-0.4.0-instalable.zip`. En `chrome://extensions`, activá Modo desarrollador, elegí Cargar descomprimida y seleccioná **`naruto-skips-main`**: contiene `manifest.json` directamente en su raíz. No necesitás npm para instalar.

Para actualizar, reemplazá el contenido de la misma carpeta instalada, pulsá Recargar en la extensión y recargá el reproductor. Las instalaciones antiguas desde `dist/extension` deben seguir usando esa ruta para mantener su identidad y ajustes. Ver [INSTALAR.md](INSTALAR.md).
