# Imágenes del panel

El usuario proporcionó la N naranja, la nube Akatsuki, el sombrero Hokage, el símbolo Uzumaki, el abanico Uchiha y Kurama el 7 de octubre de 2026.

La nube se usa directamente con su transparencia original. La N, Uzumaki, Hokage y Uchiha se prepararon con la herramienta integrada imagegen, tomando cada imagen como referencia de edición. Se pidió preservar el dibujo y quitar únicamente el fondo; Hokage y Uchiha llevan un borde blanco fino de sticker. La N conserva el gradiente y sus contornos blanco, negro y azul. El recorte de Kurama no se pudo generar: se conserva la imagen original, reducida y presentada con borde de sticker mediante CSS.

Prompts utilizados: extraer la N eliminando el fondo gris; extraer la espiral roja eliminando el damero, también dentro de sus curvas; extraer Kurama eliminando el fondo beige y la sombra del suelo; extraer el sombrero y el abanico eliminando el fondo negro. Mantener poses, colores, símbolos y siluetas; sin texto ni objetos nuevos. En Kurama, Hokage y Uchiha, agregar borde blanco fino sobre fondo transparente.

Los PNG transparentes se recortan al área ocupada y se reducen para el panel. La N se distribuye en 16, 32, 48 y 128 píxeles para Chrome y Brave. Todos los recursos se empaquetan localmente; el panel no descarga imágenes de terceros.

## Pósters de los siete animes — 9 de octubre de 2026

Los archivos de `series/` son los pósters publicados en las páginas de Anime Filler List para Naruto, Naruto Shippuden, One Piece, Bleach, Dragon Ball, Dragon Ball Z y Black Clover. Se guardaron los bytes originales, sin edición de los dibujos. La presentación y el encuadre se hacen con CSS.

La página de origen, la URL de cada archivo y la fecha de descarga están registradas en `data/artwork.json`. Las imágenes mantienen la titularidad de sus autores y no son arte original de la extensión. No se ha obtenido una licencia de redistribución comercial.

Estos pósters se conservan como recursos anteriores; ya no se muestran en el panel ni en el selector. El ícono de la extensión sigue siendo la N aportada anteriormente por el usuario.

## Stickers por anime — 9 de octubre de 2026

El panel y la colección usan los recursos de `stickers/`: sombrero de paja, fruta, máscara de Ichigo, insignia, nube voladora, esfera, scouter, Ozaru, Asta y trébol. Se reutilizan los PNG de Naruto aportados anteriormente. El registro de descargas está en `data/stickers.json`; los prompts, las versiones editadas y las fuentes están en [STICKERS.md](../../STICKERS.md).

La esfera, Ozaru y scouter se extrajeron con image_gen integrado para eliminar los dameros dibujados de las descargas; la fruta se generó como un sticker nuevo. Se conserva transparencia real. Las otras imágenes mantienen sus bytes originales; su presentación se hace con CSS. Las imágenes descartadas y originales se conservan separadas de las versiones usadas.
