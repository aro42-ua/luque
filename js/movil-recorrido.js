window.MovilRecorrido = (function () {

  /* Las paradas del eje vertical de un proyecto, de arriba abajo.

     Un proyecto de fotos se recorre por sus piezas y termina en la ficha. Uno
     de vídeo no tiene ninguna: su única parada antes de la ficha es el propio
     vídeo, que se representa con `null` —el mismo valor que usa el router
     cuando la ruta no trae segundo tramo—. Por eso «abajo» llega a los
     créditos en un solo gesto y el eje nunca se queda sin respuesta, que es
     justo lo que hace que el gesto no se sienta roto en la mitad del
     portafolio: seis de los doce proyectos son de vídeo. */
  function paradas(cuantasPiezas) {
    if (!(cuantasPiezas >= 1)) return [null, 'ficha'];
    var p = [];
    for (var i = 1; i <= cuantasPiezas; i++) p.push(i);
    p.push('ficha');
    return p;
  }

  /* La forma de `orden`: un array de `{id, piezas}`, en el orden en que se ven
     en la rejilla. Aquí `piezas` es un NÚMERO —cuántas piezas tiene el
     proyecto—, el recuento que pide `paradas()`. NO es el array de piezas que
     ese mismo nombre designa en `contenido.json`, en `Datos.PROYECTOS` y en lo
     que consume `Router.piezasPorId` (`js/router.js:96`, `p.piezas.length`).
     Quien construya `orden` a partir de esas fuentes tiene que convertir
     —`piezas.length`, no `piezas`— porque este módulo no lo hace ni lo puede
     comprobar: con un array en vez de un número, `array >= 1` da `NaN >= 1`,
     `false`, y todo proyecto de fotos se trataría como vídeo sin que nada
     avise. */
  function indiceDeProyecto(orden, id) {
    for (var i = 0; i < orden.length; i++) {
      if (orden[i].id === id) return i;
    }
    return -1;
  }

  function paradasDe(orden, id) {
    var i = indiceDeProyecto(orden, id);
    return i === -1 ? null : paradas(orden[i].piezas);
  }

  /* Recorta en vez de dar la vuelta, con el mismo propósito que
     `visor-estado.js:26-30`: al llegar al final la serie se detiene, para que
     no se confunda dónde termina. El mismo propósito, no el mismo código:
     `visor-estado.js:28` hace `Math.max(0, total - 1)` para el límite
     superior, y aquí es `largo - 1` a secas. Difieren sólo cuando `largo` es
     0 —ahí `visor-estado` da 0 y esto daría -1—, y hoy es inofensivo porque
     `recortar` nunca se llama aquí con un `largo` de 0: el eje vertical usa
     `ps.length`, y `paradas()` nunca devuelve menos de 2 elementos; el eje
     horizontal usa `orden.length`, y sólo se llega a esa rama cuando el
     proyecto actual ya se encontró en `orden`, así que `orden.length` es como
     mínimo 1. */
  function recortar(i, largo) {
    if (i < 0) return 0;
    if (i > largo - 1) return largo - 1;
    return i;
  }

  function en(proyecto, pieza) { return { proyecto: proyecto, pieza: pieza }; }

  function inicial(orden) {
    if (!orden || !orden.length) return en(null, null);
    return en(orden[0].id, paradas(orden[0].piezas)[0]);
  }

  /* De la ruta del router al estado del recorrido. `pieza` vale null, un
     número desde 1, o 'ficha'; cualquier otra cosa —una pieza que no existe,
     un proyecto que no está— cae al proyecto por su primera parada y no a la
     portada general, porque conserva lo que el enlace sí traía bien. */
  function desdeRuta(ruta, orden) {
    if (!ruta || ruta.tipo !== 'proyecto') return inicial(orden);
    var ps = paradasDe(orden, ruta.valor);
    if (!ps) return inicial(orden);
    /* `null` no necesita rama propia, y se comprobó: cae por el mismo camino
       que una pieza que no existe. En un proyecto de fotos `indexOf(null)` da
       -1 y sale la primera pieza; en uno de vídeo da 0 y sale `null`, que es
       la parada del vídeo. Que sean las dos cosas correctas no es suerte: es
       que `paradas()` ya puso `null` en el eje justo donde es una parada. */
    return en(ruta.valor, ps.indexOf(ruta.pieza) === -1 ? ps[0] : ruta.pieza);
  }

  function aRuta(estado) {
    if (!estado || estado.proyecto === null) {
      return { tipo: 'todos', valor: null, pieza: null };
    }
    return { tipo: 'proyecto', valor: estado.proyecto, pieza: estado.pieza };
  }

  /* Los nombres son los del DEDO, no los del contenido: 'izquierda' es «he
     deslizado a la izquierda» y trae el proyecto SIGUIENTE, igual que pasar
     una página; 'arriba' baja una parada, igual que desplazar.

     La inversión vive aquí y en ningún otro sitio. Si viviera en quien pinta,
     cada pantalla nueva podría equivocarse de signo por su cuenta, y ese es
     justo el error que no da error: se ve como que los gestos van al revés. */
  function mover(estado, gesto, orden) {
    var ps = paradasDe(orden, estado.proyecto);
    if (!ps) return estado;

    if (gesto === 'izquierda' || gesto === 'derecha') {
      var i = indiceDeProyecto(orden, estado.proyecto);
      var j = recortar(gesto === 'izquierda' ? i + 1 : i - 1, orden.length);
      if (j === i) return estado;
      return en(orden[j].id, paradas(orden[j].piezas)[0]);
    }

    if (gesto === 'arriba' || gesto === 'abajo') {
      var k = ps.indexOf(estado.pieza);
      if (k === -1) return estado;
      return en(estado.proyecto, ps[recortar(gesto === 'arriba' ? k + 1 : k - 1, ps.length)]);
    }

    return estado;
  }

  /* Qué gestos llevan a alguna parte desde donde estás. Se pregunta a `mover`
     en vez de repetir aquí las reglas de los dos ejes: los bordes —la primera
     pieza, la ficha, el primer y el último proyecto— ya están escritos una vez
     en `recortar`, y una segunda copia se desincronizaría en cuanto el eje
     cambiara.

     Se comparan los dos campos y no las referencias: `mover` devuelve el mismo
     objeto cuando no hay eje que recorrer, pero en el tope del eje vertical
     devuelve uno NUEVO con los mismos valores (`en(proyecto, ps[recortar(...)])`).
     Con `!==` a secas, el último gesto de cada eje se anunciaría como posible.

     Contesta por los cuatro gestos aunque hoy sólo se pinten dos flechas, las
     del eje horizontal: la pregunta que este módulo sabe contestar es «qué
     lleva a alguna parte», y media respuesta por un eje sería una función con
     forma de su único consumidor. Cuesta lo mismo.

     Las claves son gestos del DEDO, igual que en `mover`. Quien pinte una
     flecha tiene que invertirlas: eso lo hace `MovilFlechas`, y en un solo
     sitio. */
  var GESTOS = ['arriba', 'abajo', 'izquierda', 'derecha'];

  function salidas(estado, orden) {
    var s = {};
    GESTOS.forEach(function (g) {
      var d = mover(estado, g, orden);
      s[g] = d.proyecto !== estado.proyecto || d.pieza !== estado.pieza;
    });
    return s;
  }

  /* El atajo del botón de ficha. La ficha es la ÚLTIMA parada del eje, así que
     llegar a ella deslizando cuesta tantos gestos como piezas tenga el
     proyecto: diez en `la-boquerona`. Esto la pone a un toque, en los dos
     sentidos.

     `recordada` llega de fuera porque este módulo es puro y no guarda nada
     entre llamadas; quien la recuerda es `MovilVisor`.

     La guarda contra `recordada === 'ficha'` no es paranoia: `indexOf('ficha')`
     NO es -1, porque 'ficha' es una parada del eje como cualquier otra. Sin
     ella, volver de la ficha devolvería la ficha y el botón quedaría muerto
     justo en el sitio donde más hace falta. */
  function alternarFicha(estado, orden, recordada) {
    var ps = paradasDe(orden, estado.proyecto);
    if (!ps) return estado;
    if (estado.pieza !== 'ficha') return en(estado.proyecto, 'ficha');
    var valida = recordada !== 'ficha' && ps.indexOf(recordada) !== -1;
    return en(estado.proyecto, valida ? recordada : ps[0]);
  }

  return {
    paradas: paradas,
    inicial: inicial,
    desdeRuta: desdeRuta,
    aRuta: aRuta,
    mover: mover,
    salidas: salidas,
    alternarFicha: alternarFicha
  };
})();
