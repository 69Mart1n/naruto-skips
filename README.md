# Naruto Skips

Extensión para Chrome y Brave que automatiza intros, resúmenes y cambios de capítulo de Naruto y Naruto Shippuden. Netflix es la plataforma principal; Crunchyroll es experimental.

La beta **0.3.3** incluye el ícono N y un panel Naruto con naranja, rojo, nubes Akatsuki y stickers de Kurama, Hokage, Uchiha y Uzumaki.

## Descargar e instalar

Descargá el ZIP desde [Releases](https://github.com/69Mart1n/naruto-skips/releases). También está disponible la [descarga directa de la versión 0.3.3](https://github.com/69Mart1n/naruto-skips/releases/download/v0.3.3/naruto-skips-0.3.3.zip).

1. Descomprimí el ZIP en una carpeta permanente.
2. Abrí `chrome://extensions` en Chrome o `brave://extensions` en Brave.
3. Activá **Modo desarrollador**, elegí **Cargar descomprimida** y seleccioná la carpeta que contiene `manifest.json`.
4. Recargá Netflix o Crunchyroll.

Para actualizar, reemplazá los archivos de esa misma carpeta, recargá la extensión y el reproductor. No borres la carpeta después de instalar. Todavía no está publicada en Chrome Web Store.

## Funciones

- Naruto y Naruto Shippuden: guía de visionado seleccionable y excepciones por capítulo.
- Netflix: correspondencias verificadas de los 720 capítulos, considerando la división por temporadas. Los bloques omitidos se saltan con una sola navegación.
- Intro, resumen y siguiente al final automáticos cuando aparecen los controles oficiales.
- Velocidad habitual configurable, mantener **V** para acelerar a 2× y soltar para volver.
- Marcas de escenas por capítulo para acelerar tramos al volver a verlos, comprobando URL y duración.
- Crunchyroll experimental, con detección de las series oficiales y navegación mediante el enlace siguiente.

La guía inicial, **Tu lista**, sigue la guía proporcionada por el usuario de [PcComponentes](https://www.pccomponentes.com/blog/como-ver-anime-naruto-completo-sin-relleno) y también omite algunos capítulos mixtos. Naruto 135 se conserva para resolver la contradicción de esa guía. **Solo relleno completo** conserva todos los mixtos. Ver [GUIA_PERSONALIZADA.md](GUIA_PERSONALIZADA.md).

## Desarrollo

Requiere una versión de Node.js compatible con jsdom 30: Node 22.22.2+, 24.15+ o 26+.

```sh
npm ci
npm test
npm run build
```

La carpeta `dist/extension` generada se puede cargar como extensión descomprimida. `extension/` contiene el código y las imágenes; `data/` contiene la clasificación y las correspondencias de Netflix; `tests/` verifica la lógica y el comportamiento del reproductor con DOM simulado. Este repositorio contiene el código completo de la versión 0.3.3.

## Estado y privacidad

Es una beta: pasan 32 pruebas automatizadas y el diseño del panel fue revisado en navegador con las API de Chrome simuladas. El catálogo de Netflix se verificó el 7 de octubre de 2026. La reproducción continua con la extensión necesita validación real. Los controles de Crunchyroll son experimentales. No incluye una base de tiempos para recortar escenas automáticamente.

La extensión procesa los datos en el navegador y guarda ajustes, excepciones y marcas en almacenamiento local. No usa servidores propios, telemetría, IA durante la reproducción ni lectura de credenciales. No descarga videos. Las imágenes se incluyen localmente; [ORIGEN.md](extension/assets/ORIGEN.md) describe su preparación.

Proyecto independiente, sin afiliación con Netflix, Crunchyroll o los titulares de Naruto.
