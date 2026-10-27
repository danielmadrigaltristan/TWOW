---
title: Actualización de cartas y flujo del automa
description: Plan de implementación autorizado a partir de las especificaciones Word
---

## Objetivo y fuentes

19 de octubre de 2026. Aplicar las especificaciones de «Numeración y explicación de cartas del automa.docx» al asistente Angular. La petición incluye ejecutar este plan. No hay contrato AHE instalado: este documento es un plan portable, sin inicializar harness ni generar YAML de lifecycle.

El Word es la fuente de datos de las 27 cartas y prevalece sobre las transcripciones anteriores. Sus IDs repetidos se resuelven por sección: 2.2 es la carta 8 y e.3.3 es la 27. Las habilidades de escuela y los iconos de mordisco/embestida se conservan: el Word no los redefine. No se implementan mutágenos; se conserva su metadata.

## Estado comprobado

Angular 22.1, componentes standalone, Signals, OnPush y formularios existentes. `cards.ts` contiene 27 cartas; `engine.ts` construye mazos y resuelve acciones y combate; `game.store.ts` clona transacciones y persiste; `save.ts` valida importaciones. `app.component.html` muestra juntos ambos turnos del combate y permite configurar trofeos solo durante el encuentro. `styles.css` proporciona papel, tinta, oro y tipografías compartidas. Baseline: 29 pruebas pasan antes de editar.

## Secuencia de implementación

1. REQ-01: sustituir las transcripciones por registros explícitos de las 27 cartas: movimiento, acciones ordenadas, encuentro, mercado, daño, escudo, efectos y dados. Diferenciar `generic`, `specific` y `trophy` como metadata del Word; para formar mazos las trofeo se distribuyen como específicas III.
2. REQ-02: por aclaración explícita del usuario, conservar la composición del reglamento inicial y apartar tres cartas genéricas de nivel III. Distribuir las 25–27 entre acción/desafío como específicas III. Acción/desafío/reserva: fácil 13/11/3; intermedia 12/12/3; difícil 9/12/3. La reserva se baraja y se incorpora una carta por trofeo, salvo el cuarto que termina la partida.
3. REQ-03: seleccionar en preparación cuáles de los cuatro trofeos de habilidad están disponibles. Persistir selección; consumir disponibilidad al meditar. Solo proponer meditación cuando la carta la contempla y existe una habilidad a 5 con trofeo disponible; pedir confirmación antes de resolverla. Si no hay encuentro legal, permitir continuar sin inventar un combate.
4. REQ-04: pedir terreno final solo en cartas con rastro. Confirmar movimiento aplica mejoras una vez. Encolar avisos de pociones/bombas; confirmar cada aviso concede el recurso hasta 4, con bombas sujetas al módulo. Bloquear avance mientras haya avisos pendientes.
5. REQ-05: formar combate con desafío y descarte. Retirar el rastro usado contra el monstruo tras determinar iniciativa. Permitir seleccionar iniciativa cuando no la determina el rastro. Separar turno automa y rival; impedir ataques repetidos fuera de turno y resolver combos adicionales antes del rival. Mostrar daño total real del turno, carta y efectos aplicados; rival muestra entrada de daño y sus efectos.
6. REQ-06: avisar por cada carta descartada por ataque con efecto, mostrando carta y descripción. Descartes voluntarios no disparan estos efectos. Aplicar el efecto una sola vez y exigir reconocimiento del aviso antes de continuar. No reproducir efectos al cerrar avisos ni recargar.
7. REQ-07: abrir duelo desde Combate en cualquier fase, con vida/nombre y jugador inicial. Conservar la fase interrumpida; cerrar el duelo no resuelve un encuentro pendiente. Los encuentros normales sí quedan resueltos al finalizar.
8. REQ-08: mostrar las cinco caras de dados de la carta de póker y su combinación. Mantener reglas existentes de robo/reciclado de desafío.
9. REQ-09: versionar guardados porque cambian los datos y efectos de cartas y el estado del combate. Conservar exportación de guardados antiguos para recuperación; no reinterpretarlos silenciosamente con reglas nuevas. Validar campos nuevos y propiedad única de cartas.

## Diseño y estados

Reutilizar controles, tokens y diálogo nativo existentes, sin dependencias nuevas. Preparación añade cuatro checkboxes. Fase I muestra terreno solo si hay rastro. Fase II prioriza confirmación de meditación o formulario de oponente; sin opciones legales permite continuar. Combate muestra cabecera y vida; debajo, solo carta/efectos/daño del automa o formulario del rival. Un botón explícito cambia de turno. Los avisos bloqueantes usan `dialog`, título, descripción, carta cuando procede y botón de confirmación; Escape confirma el aviso para evitar pérdida de recursos pendientes. Vista móvil conserva una columna y daño grande. No es necesario un mockup separado: el cambio reutiliza la pantalla y sus controles; la comprobación visual se realiza sobre la implementación autorizada.

## Archivos y contratos

| Archivo | Cambio |
| --- | --- |
| `src/app/cards.ts` | Datos Word y efectos tipados; sin funciones serializadas |
| `src/app/models.ts` | Tipo trofeo, avisos persistentes, turno y resumen de combate |
| `src/app/engine.ts` | Distribución, confirmaciones, turnos, rastro y efectos |
| `src/app/save.ts`, `game.store.ts` | Versión nueva y validación; exportación de legacy |
| `src/app/app.component.ts`, `.html` | Preparación, avisos y vistas por turno |
| `src/styles.css` | Jerarquía del daño y controles adaptables |
| `tests/engine.test.ts` | Reglas nuevas y regresiones |
| `README.md` | Composición, guardados y uso actualizado |

Sin backend, endpoints, permisos remotos ni secretos. Alcance estimado: estos nueve archivos de producto/pruebas/documentación más el plan y evidencia de verificación. No refactor general ni publicación. Rollback: copia local de fuentes antes del cambio; los guardados previos se conservan bajo su clave original.

## Aceptación y trazabilidad

| Requisito | Criterio de aceptación | Verificación |
| --- | --- | --- |
| REQ-01 | AC-01: las 27 cartas coinciden con los datos Word, incluidos 11/12 con poción, 21 con descarte y 24 con efecto al daño | Tabla de expectativas independiente en tests |
| REQ-02 | AC-02: tres genéricas III de reserva, sin duplicados y distribución inicial reglamentaria; acción ordenada por nivel | Tests para las tres dificultades y trofeos |
| REQ-03 | AC-03: ninguna meditación con habilidad <5 o trofeo no seleccionado; cancelar no modifica estado | Tests y comprobación UI |
| REQ-04 | AC-04: terreno solo con rastro; recursos se suman al confirmar una vez, hasta 4 | Tests de cola, módulo y UI |
| REQ-05 | AC-05: iniciativa consume rastro; no alternar con combo pendiente; daño incluye efectos y combos | Tests de turnos, daño e iniciativa |
| REQ-06 | AC-06: cada efecto de daño tiene carta/aviso; ningún descarte voluntario lo dispara | Tests multi descarte y persistencia |
| REQ-07 | AC-07: duelo en fases 0–3 conserva fase/encuentro; cierre normal resuelve encuentro | Tests y UI |
| REQ-08 | AC-08: cinco dados y combinación coinciden con carta robada | Tests de catálogo y póker |
| REQ-09 | AC-09: nuevo estado exporta/importa; inválidos rechazados y legacy conservado | Tests de validación y recarga |

## Verificación y límites

Ejecutar con Node compatible: `npm test`, `npm run typecheck`, `npm run build`. Comprobar servidor HTTP y recorrido de preparación, avisos, meditación, duelo, alternancia, daño/descartes, póker y recarga en navegador disponible. No declarar probado un dispositivo físico. Los PDFs/artes originales se mantienen: sus valores impresos pueden diferir del Word; los resúmenes de la app usan el Word y deben indicarlo en pantalla. No se modelan rutas, ataques de monstruo ni disponibilidad física automáticamente.

## Estado final

Implementado y verificado. Se conserva la distribución original con tres genéricas III de reserva, según aclaración del usuario. Resultado: 46 pruebas correctas, typecheck y build correctos; recorridos y límites registrados en [VALIDACION-WORD.md](../../../output/VALIDACION-WORD.md).
