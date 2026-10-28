# Pizarra

Una pizarra interactiva para organizar objetivos por **día, semana, mes y año**, con el aspecto y el tacto de una pizarra física.

## Funciones

- Cuatro pizarras (Hoy · Semana · Mes · Año), y en cada una puedes ir a periodos anteriores y siguientes.
- Notas escritas a rotulador o en post-it: doble clic para escribir y arrastrar para moverlas.
- Al completar una nota, se tacha con una animación a mano.
- Borrador: suelta una nota encima para borrarla.
- **Pasar lo pendiente**: lo que quedó sin hacer en días, semanas o meses anteriores aparece en un aviso para pasarlo al periodo actual o descartarlo. Las notas aplazadas llevan un contador (↻).
- **Objetivos conectados**: cada nota se puede vincular a un objetivo del nivel superior (día → semana → mes → año) con el botón ↑, y el objetivo grande muestra el progreso de sus pasos. Con + se divide un objetivo en un paso del nivel inferior.
- Tres estilos de pizarra: **blanca**, **tiza** y **corcho**.
- Todo se guarda en el navegador (localStorage).
- Se puede usar con teclado: Enter edita, Espacio tacha, las flechas mueven y Supr borra.

## Desarrollo

```bash
npm install
npm run dev
```

Stack: React 18 + TypeScript + Vite, sin librerías de UI.
