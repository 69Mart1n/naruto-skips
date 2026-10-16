# Stickers y nuevo panel

Actualizado el 9 de octubre de 2026. A pedido del usuario, se recuperó la hoja de estilos original de Naruto Skips 0.3.3 del commit c4e9252 y su encabezado con Kurama, nube Akatsuki, «Modo ninja», sombrero Hokage, abanico Uchiha y espiral Uzumaki. Naruto y Shippuden conservan ese diseño original. El popup fija 390 × 600 píxeles para que Chrome no estreche el panel. «Cambiar anime» abre una colección independiente con dos columnas y nombres completos; elegir una tarjeta vuelve al panel. «Volver» y Escape permiten regresar sin cambiar el diseño. El modo automático y la selección guardada siguen disponibles. «A tu ritmo» conserva la sección desplegada del diseño original.

Los recursos usados están en `extension/assets/stickers/`, salvo los recortes originales de Naruto en `extension/assets/`. Los pósters anteriores ya no se muestran en el panel ni en el selector. El detalle de procedencia, archivo original y fecha de descarga está en [data/stickers.json](data/stickers.json).

| Anime | Decoración |
| --- | --- |
| Naruto | Kurama, espiral Uzumaki, nube Akatsuki, sombrero Hokage y abanico Uchiha aportados anteriormente |
| Naruto Shippuden | Mismo diseño original de Naruto Skips, con los cinco recursos anteriores |
| One Piece | Sombrero de paja y fruta de Luffy |
| Bleach | Máscara Hollow de Ichigo e insignia del shinigami sustituto |
| Dragon Ball | Nube voladora y esfera de cuatro estrellas |
| Dragon Ball Z | Ozaru, scouter y esfera de cuatro estrellas |
| Black Clover | Asta con espada y grimorio; trébol de cinco hojas |

Se encontraron imágenes en [Imgflip](https://imgflip.com/memetemplate/420027909/Straw-Hat), [ClipartMax](https://www.clipartmax.com/max/m2i8A0m2N4d3K9d3/), [PNGkey](https://www.pngkey.com/maxpic/u2w7a9y3e6i1e6i1/), [NicePNG](https://www.nicepng.com/maxp/u2y3q8q8e6e6o0o0/), [CityPNG](https://www.citypng.com/photo/27984/hd-dragon-ball-z-dbz-seven-crystal-balls-png), [PNGaaa](https://www.pngaaa.com/detail/5584919), [RealClipart](https://www.realclipart.com/middle/m2i8Z5Z5m2d3Z5d3_share-this-image-great-ape-dragon-ball-z/), [StickPNG](https://www.stickpng.com/img/games/black-clover-quartet-knights/black-five-leaved-clover) y el [portal oficial de Black Clover de Shueisha](https://sp.shonenjump.com/j/sp_bclover/story/index.html). Los bytes de los PNG transparentes se conservan y el encuadre se hace con CSS. El borde y sombra de sticker se aplican con CSS.

Las descargas de esfera, Ozaru y scouter tenían un damero dibujado. Sus versiones `dragon-ball-sticker.png`, `great-ape-sticker.png` y `scouter-sticker.png` se prepararon mediante el **image_gen integrado**, usando la descarga como objetivo de edición. El archivo original se conserva separado. La fruta descargada también tenía fondo; no se utiliza en el panel. `gum-fruit-sticker.png` es una ilustración nueva generada con el **image_gen integrado**. No se utilizó la API ni el modo CLI. La máscara de personaje de `hollow-mask.webp` se descartó en favor de la máscara aislada de Ichigo.

Los archivos conservan los derechos de sus autores. Las fuentes comunitarias describen principalmente uso personal; el registro de fuentes no constituye permiso comercial. Ningún recurso se descarga al abrir la extensión.

## Prompts finales utilizados

### Esfera — edición de background-extraction

Use case: background-extraction. Edit target: the supplied four-star Dragon Ball image. Remove the entire baked checkerboard background. Preserve precisely the orange sphere, four red stars, cream highlight, drawing, colors, and silhouette. Add a thin white sticker contour. One isolated sphere centered on genuinely transparent background, closely framed with small transparent margin. No checkerboard pixels, text, watermark, extra objects or cast floor shadow.

### Scouter — edición de background-extraction

Use case: background-extraction. Edit target: supplied Dragon Ball scouter. Remove the entire baked checkerboard and floor shadow. Preserve the green translucent visor, white ear unit, red small accent, angle, proportions and device design. Make a clean die-cut sticker with thin white contour, closely framed with small transparent margin. Background genuinely transparent including outside device and openings. No text, watermark or new objects.

### Ozaru — edición de background-extraction

Use case: background-extraction. Edit target: supplied Dragon Ball Ozaru Great Ape in blue and white Saiyan armor. Remove checkerboard background completely. Preserve precisely the character pose, brown fur, red eyes, blue outfit, white armor and gold shoulder plates. Thin white sticker contour. Closely frame entire silhouette centered on truly transparent background. No checkerboard, text, watermark or extra characters.

### Fruta — generación

A single die-cut anime sticker of Luffy's Gomu Gomu no Mi from One Piece: round purple devil fruit with distinctive darker purple spiral swirls across its whole surface, small curving pale green stem that curls at its top, small leaf. Faithful recognizable anime object, clean hand-drawn cel-shaded style, crisp dark outline and thin white sticker contour. Centered, close framing, modest transparent margin, actual transparent background. No face, text, watermark, other objects, checkerboard, ground shadow or scenery.
