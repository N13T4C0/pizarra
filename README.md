# Pizarra

Una pizarra interactiva para organizar objetivos por **día, semana, mes y año**, con el aspecto y el tacto de una pizarra física.

## Funciones

- Cuatro pizarras (Hoy · Semana · Mes · Año), y en cada una puedes ir a periodos anteriores y siguientes.
- Notas escritas a rotulador o en post-it: doble clic para escribir y arrastrar para moverlas.
- Al completar una nota, se tacha con una animación a mano.
- Borrador: suelta una nota encima para borrarla.
- **Pasar lo pendiente**: lo que quedó sin hacer en días, semanas o meses anteriores aparece en un aviso para pasarlo al periodo actual o descartarlo. Las notas aplazadas llevan un contador (↻).
- **Objetivos conectados**: cada nota se puede vincular a un objetivo del nivel superior (día → semana → mes → año) con el botón ↑, y el objetivo grande muestra el progreso de sus pasos. Con + se divide un objetivo en un paso del nivel inferior.
- **Hábitos**: una cuadrícula semanal para marcar lo que haces cada día, con racha actual y mejor racha. En la pizarra de Hoy hay una tira para marcarlos sin cambiar de pestaña.
- **Resumen**: objetivos cumplidos de la semana y del mes, racha más larga, aplazados, mapa de actividad de las últimas 18 semanas, tu mejor día de la semana, porcentaje de objetivos diarios por semana y constancia de cada hábito.
- Tres estilos de pizarra: **blanca**, **tiza** y **corcho**.
- Todo se guarda en el navegador (localStorage).
- Se puede usar con teclado: Enter edita, Espacio tacha, las flechas mueven y Supr borra.

## Desarrollo

```bash
npm install
npm run dev
```

Stack: React 18 + TypeScript + Vite, sin librerías de UI.
