# The Witcher · La senda del Automa

SPA Angular para asistir una partida física de **The Witcher: El Viejo Mundo**, usando el automa comunitario 1.4 incluido en esta carpeta. Primera versión: **un automa y juego base**.

## Arranque local

Requiere **Node 24.19 o una versión compatible con Angular 22** y npm. El proyecto incluye `.nvmrc` si utilizas nvm. Node 20 no es compatible con esta versión de Angular.

```bash
nvm use
npm ci
npm start
```

Abre [http://localhost:4200](http://localhost:4200). Si no utilizas nvm, instala o selecciona Node 24 antes de ejecutar los dos comandos de npm.

## Qué permite hacer

- Seleccionar el **oponente automa**: Lobo, Gato, Oso, Víbora, Grifo o Mantícora. El carrusel empieza en Lobo y permite navegar con flechas, teclado o deslizando. Los retratos e iconos son los aportados; el retrato muestra los especiales al pulsarlo. Para continuar hay que marcar el check superior derecho; cambiar de candidato requiere confirmar de nuevo la selección. Ciri deja de estar disponible en nuevas partidas; se conserva su perfil para leer partidas anteriores.
- Preparar automáticamente acción, desafío y tres cartas III de reserva, con dificultad fácil, intermedia o difícil.
- Resolver las tres fases con confirmaciones: movimiento/acciones, encuentro y descarte del mercado.
- Consultar el tablero del automa desde «Mostrar tablero», siempre accesible abajo. Se abre y cierra sin desplazar la página ni reaccionar al scroll; la chincheta permite mantenerlo fijo y desanclarla lo recoge. Los cambios de atributos y recursos lo despliegan automáticamente. El panel central reserva espacio inferior al abrirlo y mantiene título y navegación visibles bajo la cabecera compacta. El escudo está a la izquierda y los atributos en cuatro columnas; las casillas ajustan sus marcadores. En móvil, el botón de recursos abre pociones, bombas y trofeos.
- Resolver combos, escudo, pociones, habilidades de escuela, recuperación, combos adicionales y efectos de cartas descartadas por daño.
- Activar bombas y mutágenos de Monster Trail de forma independiente durante la preparación. El nivel del automa es el menor de sus cuatro atributos: al alcanzar los niveles 2, 3, 4 y 5 recibe un mutágeno aleatorio (verde, rojo o azul), permitiendo colores repetidos. Cada ficha coincidente con una carta de combo aplica el efecto de su escuela y queda agotada hasta el siguiente combate; el tablero muestra el nivel, las fichas y su estado.
- Ampliar las cartas originales y consultar la habilidad del brujo, la leyenda de iconos y la secuencia de turno.
- Robar desafío para póker y consultar su icono de mordisco/embestida.
- Guardar automáticamente en el navegador y deshacer hasta 20 cambios de la sesión. El historial para deshacer se reinicia al recargar.

El selector inicial elige al **brujo rival**, no al personaje humano. No se usan las cartas de Skellige, Legendary Hunt ni los dorsos alternativos para dos automas.

## Cómo jugar

1. Prepara el tablero físico como una partida para dos siguiendo el manual. Los terrenos de monstruos son aleatorios; el automa empieza, sin oro, con los cuatro atributos y el escudo a 1.
2. Elige adversario en el carrusel, continúa a la dificultad (tres iconos seleccionables) y activa opcionalmente el módulo de bombas en el último paso con la imagen de Monster Trail. Los cuatro trofeos de meditación empiezan disponibles. Durante la partida, modifícalos desde «Trofeos» del tablero o «Trofeos de meditación» del menú cuando cualquier brujo consiga uno. Confirma «Comenzar la partida» para preparar los mazos: no necesitas mantener sus duplicados físicos.
3. Revela acción. Mueve la miniatura por el camino más corto siguiendo el destino, puntos y flecha indicados. Solo se solicita el terreno final cuando la carta concede un rastro. Confirmar movimiento aplica las mejoras; confirma cada aviso de robo para añadir pociones o bombas, hasta cuatro.
4. Selecciona antes de empezar qué trofeos de habilidad están disponibles. En el encuentro, indica los oponentes; se comprueba la prioridad de la carta y los límites de trofeos. Meditar exige una habilidad a 5 y su trofeo disponible; confirma para obtenerlo y añadir una carta III de la reserva. Si no hay opciones legales, continúa al mercado.
5. En combate, selecciona iniciativa según la mesa. El rastro del monstruo concede iniciativa al automa y se consume. En el turno del automa, revela combos hasta resolver los adicionales: el daño total y los efectos aparecen destacados. Pulsa «Pasar al turno» para introducir el daño rival (también puede ser cero). Las cartas descartadas por ese daño se revelan una a una; si alguna tiene efecto, se aplica una vez y muestra su aviso antes de continuar. La pantalla muestra el mazo y las cartas del automa; la vida del rival se lleva en la mesa y su derrota se confirma con el botón de victoria. Desde Combate puedes abrir un duelo en cualquier fase; al cerrarlo se conserva la fase interrumpida. Si el jugador humano reta al automa y este gana como defensor, no obtiene trofeo ni carta de reserva. La recompensa por victoria depende de quién inicia el combate, no de quién tiene la iniciativa.
6. Para habilidades especiales del monstruo, consulta la tabla del manual desde la leyenda. Hay controles para revelar la carta superior, descartarla sin resolver y ajustar la vida del oponente. Las cartas descartadas por **daño** se procesan con el botón de daño para activar sus efectos correspondientes.
7. Al cerrar combate se reconstruye desafío y se restaura el escudo. Si gana, obtiene trofeo y añade una carta III. Aplica en la mesa las demás recompensas y consecuencias.
8. Retira las posiciones del mercado señaladas y repón todas juntas; termina el turno. Juega tu turno humano y vuelve a revelar acción.

La aplicación guarda su estado en `localStorage`, clave `witcher-old-world-automa-v2`. El guardado está asociado al navegador y al origen: `localhost` y `127.0.0.1` tienen guardados distintos. No existe servidor de partidas ni envío de datos. Los guardados anteriores v1 se conservan bajo su clave original pero requieren empezar una partida nueva para usar las reglas Word. No se reinterpretan automáticamente.

## Reglas que automatiza

| Dificultad | Acción por nivel I / II / III | Desafío por nivel I / II / III | Reserva III |
| ---------- | ----------------------------- | ------------------------------ | ----------- |
| Fácil      | 5 / 5 / 3                     | 4 / 4 / 3                      | 3           |
| Intermedia | 4 / 4 / 4                     | 5 / 5 / 2                      | 3           |
| Difícil    | 3 / 3 / 3                     | 5 / 5 / 2                      | 3           |

La distribución del reglamento inicial se conserva por indicación del usuario: se apartan tres genéricas III y se reparten las específicas 25–27 entre los mazos iniciales. Acción mantiene los niveles ordenados, barajados dentro de cada nivel. Al agotarse solo se recupera nivel III de su descarte. Desafío solo mezcla su descarte al agotarse o al entrar en combate. Ganar un trofeo incorpora una carta III de reserva sin mezclar descartes; no hace falta una cuarta carta de reserva, porque cuatro trofeos terminan la partida.

Atributos máximos bloqueados en 5, desempates en el orden ataque → defensa → alquimia → especial, escudo limitado por defensa y por un máximo absoluto de 4, máximo cuatro pociones y cuatro bombas, un rastro por terreno, una recompensa de trofeo por encuentro y victoria por el cuarto trofeo también al meditar.

Los datos de las 27 cartas (acciones, límites, daño, escudo, efectos y póker) siguen «Numeración y explicación de cartas del automa.docx». Los IDs repetidos en las secciones 2.2 y e.3.3 corresponden a las cartas 8 y 27. Las imágenes originales se conservan como referencia y pueden mostrar otros valores; los resúmenes de la aplicación usan el Word. Las habilidades de escuela y mordisco/embestida conservan los datos anteriores porque el Word no los redefine. Los símbolos de combate: **mano = combo adicional**, **carta doblada sin flecha = descartar sin resolver**, **carta con flecha hacia abajo = recuperar del descarte**. Las habilidades especiales I, II y III dependen del símbolo de la carta específica, no del nivel del atributo Especial.

## Límites de esta versión

- **No es un tablero digital completo.** La ruta exacta, posición de miniaturas, monstruos presentes, disponibilidad de trofeos y mercado se confirman sobre el juego físico. No se ha inventado un grafo de localizaciones que no aparece en los PDFs aportados.
- Las cartas de ataque, pasivas y excepciones de cada monstruo se resuelven en la mesa. La app recibe el daño neto que inflige el oponente; sus ataques y escudos propios se ajustan allí antes de introducirlo. La vida de los rivales y las correcciones a sus marcadores se gestionan en la mesa.
- La guía de aclaraciones y el manual difieren en el descarte por color: la guía propone buscar hasta encontrar una coincidencia; el manual 1.4 (p. 11) indica revelar la carta superior y resolver la coincidencia o la alternativa. Prevalece el manual y esa excepción queda manual.
- El motor conoce las 27 cartas base y las habilidades impresas; no incorpora mutágenos, eventos ni módulos de expansión excluidos.
- La interfaz usa la fuente local The Witcher (`public/fonts/the-witcher.ttf`). Los caracteres que el archivo no incluye, como tildes y ñ, utilizan Georgia como respaldo. Los mazos, reglas y partida se procesan localmente. Esta versión no instala un service worker para uso sin conexión.

## Arquitectura

Angular 22, componentes standalone, Signals, detección de cambios `OnPush` y TypeScript estricto. Sin backend.

| Archivo / carpeta                                | Responsabilidad                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `src/app/models.ts`                              | Contratos de carta, acciones, efectos, escuelas y partida                       |
| `src/app/cards.ts`                               | Catálogo inmutable, descripciones y datos transcritos; índice compartido por ID |
| `src/app/engine.ts`                              | Reglas puras, independientes del DOM y Angular                                  |
| `src/app/game.store.ts`                          | Estado reactivo, transacciones, deshacer y persistencia                         |
| `src/app/save.ts`                                | Validación del guardado local, contadores y propiedad única de cartas      |
| `src/app/board.component.ts`                     | Tablero siempre disponible y ajustes de recursos                                |
| `src/app/app.component.*`                        | Preparación, turnos, combate, archivo y diálogos accesibles                     |
| `src/app/game-icon.component.ts`                 | Iconos SVG de interfaz                                                          |
| `public/cards`, `public/schools`, `public/icons` | Recortes originales WebP e iconografía del material aportado                    |
| `public/rules`                                   | Copias del manual y la guía para consulta durante la partida                    |
| `tests/engine.test.ts`                           | Pruebas de reglas, mazos, transcripción y validación                            |

El estado conserva **IDs de cartas**, sin duplicar sus descripciones ni efectos en cada mazo o guardado. Cada operación produce un nuevo estado antes de publicarlo y guardar; el catálogo se comparte y no se modifica. Las imágenes son independientes de la lógica.

## Verificación y build

```bash
npm test
npm run typecheck
npm run build
```

Las pruebas usan `node:test` con esbuild para ejecutar el motor TypeScript. La build utiliza rutas relativas; se genera en `dist/automa/browser` y se puede servir desde cualquier hosting estático.

## Publicación en GitHub Pages

El workflow `.github/workflows/pages.yml` valida las pruebas y los tipos, compila la SPA y publica únicamente `dist/automa/browser`. Se ejecuta al actualizar `main` o manualmente desde Actions. En Settings → Pages, selecciona GitHub Actions como origen.

El despliegue utiliza el token temporal de GitHub Actions, sin claves personales ni credenciales de servicios profesionales. Los archivos `.env`, configuración local, cachés, logs, capturas, copias de seguridad y PDFs originales de la raíz están excluidos del repositorio. Los recursos de `public`, incluidos los manuales que consulta la app, sí son públicos. Las partidas se guardan en el navegador y no se suben al repositorio; el origen de GitHub Pages tendrá su propio guardado.

La verificación de los cambios Word se registra en `output/VALIDACION-WORD.md` y la simplificación del combate en `output/VALIDACION-COMBATE.md`, con pruebas del motor, compilación y recorridos de navegador. La interacción táctil en un dispositivo físico no se ha verificado. El plan y la trazabilidad están en `docs/tasks/automa-cartas/PLAN.md`.

La caché persistente de Angular está desactivada en `angular.json`: el módulo nativo LMDB abortaba con el Node 24 de este equipo. Desactivar esa caché permite compilar y servir; no afecta al guardado de las partidas. La instalación puede mostrar una advertencia de prebundling desactivado por este motivo.

## Regenerar imágenes

Los assets listos para usar ya están en `public`; no se requieren Python ni Poppler para ejecutar la SPA. Para regenerarlos desde los PDFs originales necesitas Poppler y Pillow:

```bash
mkdir -p tmp/pdfs
pdftoppm -scale-to 1500 -png Cartas_Automa_Witcher_1.4_Esp.pdf tmp/pdfs/cards
pdftoppm -f 9 -l 9 -scale-to 1500 -png Automa_Witcher_1.4.pdf tmp/pdfs/rules
python3 scripts/extract-assets.py
```

Los IDs 1–18 proceden de las páginas 2 y 4; los IDs 19–27, de la página 6; los siete perfiles, de la página 8. El script conserva solo las caras base y el dorso estándar. Los PDFs originales de la raíz se mantienen intactos.

## Créditos

Automa comunitario no oficial: dukefanblue2005. Diseño de cartas: GeckoTH. Manual: Omnitastic. Traducción y revisión: Manuel Horacio y Adrián Cidoncha, según los créditos del material aportado. Las ilustraciones y la iconografía pertenecen a sus respectivos autores y titulares. Asistente de uso personal sin afiliación oficial.

El header incluye «Nueva partida» a la derecha y un menú hamburguesa a la izquierda con «Leyenda y reglas» y «Archivo de la partida». La aplicación conserva el guardado automático local; no incluye importación ni exportación de partidas.

Las pociones se añaden y consumen automáticamente, hasta un máximo de cuatro, sin aviso de confirmación. Al cambiar atributos, escudo, recursos, rastros o trofeos, el tablero se despliega; en móvil también muestra los recursos cuando cambian.

La fase I se confirma en dos pasos persistidos: movimiento (sin mejorar atributos todavía) y acciones (aplicación única), seguido de «Ir a fase II». Al revelar la carta se anima su salida del mazo, respetando movimiento reducido. En encuentros solo se ofrece monstruo si la carta lo incluye y cumple el límite de trofeos; el brujo rival aparece cuando la carta lo permite.

En un encuentro con monstruo se elige únicamente su terreno de rastro mediante botones. Si el automa tiene ese rastro, lo consume y ataca primero; en caso contrario empieza el monstruo. «Resolver combate» abre el módulo con todas las cartas de desafío y su descarte barajadas, sin reiniciar la composición inicial ni perder las cartas ganadas.
