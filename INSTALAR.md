# Instalar De Naruto Skips — Beta 0.3.2

Esta versión incorpora el ícono N y el panel con stickers Naruto. Si ya cargaste `dist/extension`, abrí la página de extensiones, tocá **Recargar** en De Naruto Skips y volvé a abrir el panel. No necesitás reinstalar ni perder tus preferencias.

## En esta computadora: sin descargar ni descomprimir

1. Abrí `chrome://extensions` en Chrome.
2. Activá **Modo desarrollador** y elegí **Cargar descomprimida**.
3. Seleccioná la carpeta `dist/extension` del proyecto, donde está `manifest.json`.
4. Recargá la pestaña donde estás viendo Naruto.

La carpeta está preparada. No la borres después de instalar. En Brave, el mismo procedimiento se hace en `brave://extensions`.

## En otra computadora

Descargá `de-naruto-skips-0.3.2.zip`, descomprimilo en una carpeta permanente y cargá la carpeta que contiene `manifest.json` siguiendo los pasos anteriores. La descarga actual de 0.3.2 incluye el ícono N y todos los stickers. No está publicada en Chrome Web Store.

## Uso automático

En una instalación nueva, intro, resumen, siguiente al final y salto según **Tu lista** vienen activados. Si actualizás, se respetan los interruptores que ya hayas guardado.

Netflix reconoce por identificador los 220 capítulos de Naruto y 500 de Shippuden del catálogo verificado. No depende de que el número mostrado sea absoluto o se reinicie por temporada. Al encontrar un capítulo omitido, abre directamente el primero que conservás; por ejemplo, Shippuden 305 → 321 o Naruto 136 → 220. No hace falta calibrar cada temporada para estos identificadores.

Si Netflix usa otro identificador o muestra información contradictoria, la extensión conserva el capítulo y permite corregir la detección desde el panel. La corrección manual es una alternativa para capítulos desconocidos; no reemplaza los identificadores verificados. Si se bloquea un salto sin confirmar, **Reintentar** lo habilita otra vez.

**Tu lista** sigue la guía que proporcionaste y omite también algunos capítulos mixtos. Conserva Naruto 135 y omite 136–219. **Solo relleno completo** conserva todos los mixtos. **Ver este capítulo** agrega una excepción; para usarlo antes de un salto automático, pausá primero la automatización.

## Escenas lentas

- Mantené **V** durante la reproducción para usar 2×; al soltar o cambiar de ventana vuelve a la velocidad anterior. No actúa mientras escribís en un campo.
- Podés elegir una velocidad habitual de 1×, 1,25×, 1,5× o 2×.
- En el panel, **Marcar inicio** y luego **Marcar final** guarda un tramo para acelerarlo a 2× al volver a verlo. Las marcas se conservan aunque cierres el panel.
- Las marcas pertenecen al capítulo, plataforma, URL y duración. No se aplican a otra edición con duración diferente. Podés borrarlas por capítulo.

No se recortan silencios, planos largos ni recuerdos por una suposición automática. Esta versión acelera tramos que hayas marcado; todavía no trae tiempos revisados de escenas para los 720 capítulos.

## Alcance de la beta

Se verificó el catálogo real de Netflix y hay 32 pruebas automatizadas de lógica, DOM simulado, velocidad, marcas y comunicación entre frames. La carga de la extensión y la reproducción continua con una cuenta real siguen pendientes de verificación.

Crunchyroll reconoce las series oficiales Naruto/Shippuden y sus números absolutos sin etiqueta de temporada. La navegación usa el enlace siguiente comprobado; avanza uno por uno dentro de un bloque. Sus controles de reproducción y velocidad dentro de frames son experimentales y necesitan prueba con cuenta.

Si otra extensión también pulsa intro/siguiente, desactivala durante la prueba. Para actualizar esta beta, reemplazá los archivos de la misma carpeta, tocá **Recargar** en la página de extensiones y recargá el reproductor.
