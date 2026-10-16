# Publicación principal

- Cuenta: **69Mart1n**.
- Repositorio público con código completo: https://github.com/69Mart1n/naruto-skips.
- Rama principal: `main`.
- Código actualizado: beta 0.4.0, con manifiesto raíz y datos JavaScript incluidos. Descargar `main.zip`, descomprimir y cargar **`naruto-skips-main`** directamente; no necesita npm para instalar.
- Validación: `npm run package` ejecuta 48 pruebas y produce el ZIP completo. GitHub Actions comprueba los generados y empaqueta cada actualización de la rama.
- Release: `v0.3.3`, publicada como beta.
- ZIP: https://github.com/69Mart1n/naruto-skips/releases/download/v0.3.3/naruto-skips-0.3.3.zip.
- SHA256 del ZIP: `c50ffef11a3e49e5a9a53d9b57efe0510bb2ff5893982967fe599478cbe21fa5`.

Se verificaron el 7 de octubre de 2026 respuestas HTTP 200 sin autenticación del repositorio y la release. El ZIP se descargó sin autenticación y su suma de control coincidió con el paquete local.

El checkout de publicación se encuentra en `dist/publish-69mart1n`, con su propio Git y remoto `origin` apuntando a 69Mart1n/naruto-skips. Es una copia completa de la fuente 0.3.3 con historial nuevo; la carpeta `dist/extension` sigue siendo la ubicación preparada para la extensión instalada. El Git de la raíz conserva el historial de desarrollo anterior en 69Bony. Para nuevas publicaciones, sincronizar los cambios del proyecto con el checkout público y subir desde allí; no usar el remoto antiguo como publicación principal.

El repositorio de distribución anterior de 69Bony no es el enlace principal y no se inició ninguna consulta a soporte. Chrome Web Store sigue pendiente.
