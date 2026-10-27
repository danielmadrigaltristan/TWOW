# Revisión previa a publicación

Fecha: 27 de octubre de 2026.

## Resultado

No se han encontrado credenciales, claves privadas, tokens de acceso, referencias a sistemas profesionales ni rutas personales en los 133 archivos preparados para la primera subida. La revisión combina lectura de la configuración, código de arranque, persistencia, plantillas y scripts, búsqueda de patrones de secretos, inspección de URLs del lockfile y revisión de los PDFs públicos y metadatos de imágenes. No constituye una garantía de ausencia absoluta de vulnerabilidades.

## Comprobaciones

- `GameStore.restore` y `GameStore.persist` solo leen y escriben el estado del juego en `localStorage`. No hay autenticación ni backend.
- No se han encontrado clientes HTTP, WebSockets, telemetría, scripts externos, ejecución dinámica de código ni inserción de HTML sin sanitización en las fuentes de la SPA.
- Las dependencias se obtienen del registro público npm; no hay registros privados ni credenciales de instalación en los archivos publicados.
- Los dos PDFs de `public/rules` no contienen candidatos de credenciales, referencias profesionales, archivos adjuntos ni valores de formulario. Los metadatos de imágenes revisados son de formato o software, sin localización GPS ni credenciales.
- Se ha retirado del README una ruta absoluta del equipo. `.gitignore` excluye configuración local, secretos comunes, certificados, cachés, backups, evidencias y originales PDF de la raíz. Ninguna exclusión sustituye la revisión antes de cada commit.
- Se han actualizado Angular y sus herramientas y fijado Vite 8.3.5 mediante `overrides`, porque el compilador fija una versión anterior con avisos. La resolución final de npm devuelve 0 vulnerabilidades conocidas. La cifra depende de los avisos disponibles en la fecha de revisión.
- Verificación posterior: 126 pruebas superadas, comprobación de tipos y compilación de producción correctas.

## Publicación

GitHub Pages recibe únicamente `dist/automa/browser`. El workflow valida pruebas, tipos y auditoría npm antes de publicar y utiliza los permisos temporales necesarios de GitHub Actions. No requiere tokens personales ni credenciales externas. El código y los recursos de `public`, incluidos los manuales, se harán públicos. Las partidas permanecen en el almacenamiento del navegador.

La revisión se limita al proyecto y al artefacto publicado; no audita las cuentas ni otros archivos del equipo. Las ilustraciones, manuales y tipografía mantienen sus respectivos titulares, según los créditos del README.
