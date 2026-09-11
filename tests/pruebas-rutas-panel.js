/* Se llama pruebas-rutas-panel.js y no pruebas-rutas.js para que no se
   confunda con el enrutador de la web pública (js/router.js), que resuelve
   otro problema —categorías y proyectos del lienzo— y ya tiene dos archivos
   de pruebas. */
describe('Rutas.leer', function () {
  prueba('el fragmento vacío es la lista', function () {
    igual(Rutas.leer(''), { pantalla: 'lista', id: null });
    igual(Rutas.leer('#'), { pantalla: 'lista', id: null });
    igual(Rutas.leer('#/'), { pantalla: 'lista', id: null });
  });

  prueba('un proyecto trae su id', function () {
    igual(Rutas.leer('#/proyecto/bruma'), { pantalla: 'proyecto', id: 'bruma' });
  });

  prueba('publicar no trae id', function () {
    igual(Rutas.leer('#/publicar'), { pantalla: 'publicar', id: null });
  });

  /* La barra final la añaden los navegadores y algunos gestores de enlaces al
     copiar. Que «#/publicar/» dejara la pantalla en blanco sería un fallo que
     sólo aparece al compartir una dirección. */
  prueba('la barra final sobra y no cambia nada', function () {
    igual(Rutas.leer('#/publicar/'), { pantalla: 'publicar', id: null });
    igual(Rutas.leer('#/proyecto/bruma/'), { pantalla: 'proyecto', id: 'bruma' });
  });

  /* Un id vacío no es un proyecto: no hay ninguno que buscar, y enseñar la
     pantalla de proyecto sin proyecto sería una pantalla rota. */
  prueba('un proyecto sin id se cae a la lista', function () {
    igual(Rutas.leer('#/proyecto'), { pantalla: 'lista', id: null });
    igual(Rutas.leer('#/proyecto/'), { pantalla: 'lista', id: null });
  });

  prueba('lo que no se reconoce se cae a la lista', function () {
    igual(Rutas.leer('#/inventado'), { pantalla: 'lista', id: null });
    igual(Rutas.leer('#/proyecto/a/b'), { pantalla: 'lista', id: null });
    igual(Rutas.leer(null), { pantalla: 'lista', id: null });
  });

  /* El id llega codificado si alguien copia la dirección desde el navegador.
     Sin descodificar, un id con caracteres escapados no casaría con ninguno
     del borrador y la pantalla diría «no existe» de un proyecto que sí está.
     Los ids que genera Identificador.desde son a-z0-9- y nunca se escapan,
     así que esto cubre lo que llega de fuera, no lo que produce el panel. */
  prueba('el id llega descodificado', function () {
    igual(Rutas.leer('#/proyecto/bru%2Dma'), { pantalla: 'proyecto', id: 'bru-ma' });
  });

  /* Un porcentaje suelto hace lanzar a decodeURIComponent. Que el panel
     entero reviente por una dirección mal pegada sería desproporcionado. */
  prueba('un escape mal formado no revienta', function () {
    igual(Rutas.leer('#/proyecto/%'), { pantalla: 'lista', id: null });
  });
});

describe('Rutas.hacia', function () {
  prueba('compone los tres destinos', function () {
    igual(Rutas.hacia('lista'), '#/');
    igual(Rutas.hacia('proyecto', 'bruma'), '#/proyecto/bruma');
    igual(Rutas.hacia('publicar'), '#/publicar');
  });

  /* Ida y vuelta: lo que compone `hacia` lo tiene que entender `leer`. Es la
     comprobación que impide que las dos se separen con el tiempo. */
  prueba('lo que compone hacia lo entiende leer', function () {
    igual(Rutas.leer(Rutas.hacia('proyecto', 'bruma')),
          { pantalla: 'proyecto', id: 'bruma' });
    igual(Rutas.leer(Rutas.hacia('publicar')),
          { pantalla: 'publicar', id: null });
  });
});
