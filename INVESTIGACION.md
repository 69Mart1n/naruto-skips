# Investigación: Naruto sin relleno

Consultada el 6 de octubre de 2026. Navegadores solicitados: Chrome y Brave.

## Relleno de Shippuden

La lista de [AnimeFillerList](https://www.animefillerlist.com/shows/naruto-shippuden) clasifica 203 de 500 episodios como relleno completo:

57–71, 91–112, 144–151, 170–171, 176–196, 223–242, 257–260, 271, 279–281, 284–295, 303–320, 347–361, 376–377, 388–390, 394–413, 416–417, 422–423, 427–450, 464–468 y 480–483.

Para tu tramo de la serie, estos son los saltos desde los bloques de relleno del episodio 257 en adelante. El destino es el primer episodio posterior que no está clasificado como relleno completo; puede ser mixto.

| Bloque que se omite | Retomar en |
| --- | --- |
| 257–260 | 261 |
| 271 | 272 |
| 279–281 | 282 |
| 284–295 | 296 |
| 303–320 | 321 |
| 347–361 | 362 |
| 376–377 | 378 |
| 388–390 | 391 |
| 394–413 | 414 |
| 416–417 | 418 |
| 422–423 | 424 |
| 427–450 | 451 |
| 464–468 | 469 |
| 480–483 | 484 |

En el modo «Solo relleno completo» se conservan episodios mixtos y canon del anime. La beta 0.2.0 agrega la lista proporcionada por el usuario de [PcComponentes](https://www.pccomponentes.com/blog/como-ver-anime-naruto-completo-sin-relleno) como guía seleccionable separada. Esa opción también omite algunos mixtos. Ver GUIA_PERSONALIZADA.md. No se cortan minutos internos: eso requiere tiempos comprobados para cada edición.

Hay diferencias entre guías: [AnimeFillerList.tv](https://www.animefillerlist.tv/guide/naruto-shippuden/) también considera relleno el episodio 28, mientras que la fuente elegida lo marca como canon del anime. La base conserva el 28 y registra esta diferencia. Son clasificaciones editoriales de guías de aficionados, no una lista oficial del estudio.

Como ampliación, [Naruto original](https://www.animefillerlist.com/shows/naruto) tiene estos rangos de relleno completo: 26, 97, 101–106, 136–140 y 143–219. El 220 se conserva por ser mixto.

## Cómo funcionan las extensiones existentes

Revisé [NetflixSkip](https://github.com/jdmerinor/NetflixSkip) y el código de [Netflix Auto Skip](https://github.com/sajjad-ahmed/netflix-auto-skip/blob/main/chrome-extension/content.js). No se ha identificado cuál tenés instalada.

Ambas detectan cambios en los elementos de la página con `MutationObserver` y ejecutan `click()` al encontrar botones concretos. El segundo proyecto comprueba visibilidad, evita repetir clics sobre un mismo elemento y agrega una comprobación periódica. Sus selectores incluyen `player-skip-intro` y `next-episode-seamless-button`.

Esto resuelve intro y siguiente episodio, pero no determina qué episodios son relleno. Nuestra extensión necesita además una base local y un adaptador para la plataforma donde mirás Naruto. Las referencias de Netflix demuestran el mecanismo; no establecen todavía compatibilidad con tu sitio.

La [documentación oficial de Chrome](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) permite leer y modificar estos elementos con scripts de contenido. Se propone Manifest V3 y JavaScript local, sin servicio de IA ni servidor para decidir los saltos.

## Distribución

Brave admite extensiones de Chrome según su [documentación oficial](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave). La primera entrega será un ZIP: se descomprime y se carga la carpeta desde `chrome://extensions` o `brave://extensions`, activando modo desarrollador y «Cargar descomprimida». El [procedimiento de Chrome](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world) usa la carpeta de la extensión.

Para instalación desde la tienda se necesita cuenta de desarrollador, ficha, información de privacidad, ZIP y revisión de Google: [publicación oficial](https://developer.chrome.com/docs/webstore/publish). Descargar un ZIP no equivale a tener una extensión publicada en la tienda.

## Estado

Plataformas confirmadas: Netflix y Crunchyroll. Se preparó una beta instalable y pruebas sobre HTML simulado. Se inspeccionó la página pública [E303 de Crunchyroll](https://www.crunchyroll.com/es/watch/GRZXQ4VDY/ghosts-from-the-past): `.erc-current-media-info h1.title`, `[data-t="show-title-link"]` y el enlace del contenedor `[data-t="next-episode"]` permiten leer identidad y navegación. No se reprodujo video con cuenta.

Actualización del 7 de octubre de 2026: se inspeccionaron los listados de [Naruto](https://www.netflix.com/browse?jbv=70205012) y [Shippuden](https://www.netflix.com/browse?jbv=80000603) con sesión disponible en Netflix. Se leyeron los 720 identificadores `video_id` de las tarjetas de episodios y sus números. Naruto tiene temporadas de 26, 26, 28, 26, 29, 25, 26, 26 y 8 episodios, con numeración local. Shippuden tiene 21 temporadas y muestra numeración absoluta. `data/netflix-catalog.json` guarda sólo datos del catálogo; no incluye información de cuenta o progreso. La beta 0.3.0 usa esos identificadores para detectar sin calibración y saltar un bloque directamente.

El intento de reproducción desde el navegador disponible recibió el límite de pantallas simultáneas; no se interrumpió otra sesión. Chrome no estaba conectado a las herramientas. Pendiente: cargar y probar la extensión en Chrome/Brave y confirmar los botones del reproductor de Crunchyroll. La [serie original en Crunchyroll](https://www.crunchyroll.com/es/series/GY9PJ5KWR/naruto) confirmó su identificador `GY9PJ5KWR`.

Para escenas lentas se implementaron `playbackRate`, una tecla V temporal y tramos locales acelerados a 2×. La [propiedad HTML de velocidad](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate) cambia la velocidad del video. Los tramos se vinculan al capítulo, URL, plataforma y duración. No se usa silencio o imagen estática como prueba de contenido prescindible y no se incluyeron tiempos de escenas sin verificar.
