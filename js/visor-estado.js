window.VisorEstado = (function () {

  function copiaCon(estado, cambios) {
    var nuevo = {
      abierto: estado.abierto,
      id: estado.id,
      indice: estado.indice,
      total: estado.total,
      lupa: estado.lupa,
      ficha: estado.ficha
    };
    for (var clave in cambios) nuevo[clave] = cambios[clave];
    return nuevo;
  }

  function inicial() {
    return { abierto: false, id: null, indice: 0, total: 0, lupa: false, ficha: false };
  }

  /* No lee el estado que recibe a propósito: reabrir siempre empieza de
     cero, sin arrastrar lupa ni ficha del proyecto anterior. */
  function abrir(estado, id, total) {
    return { abierto: true, id: id, indice: 0, total: total, lupa: false, ficha: false };
  }

  function recortar(indice, total) {
    if (indice < 0) return 0;
    if (indice > total - 1) return Math.max(0, total - 1);
    return indice;
  }

  function irA(estado, indice) {
    if (!estado.abierto) return estado;
    return copiaCon(estado, { indice: recortar(indice, estado.total) });
  }

  /* La serie NO da la vuelta: al llegar a la última pieza el avance se
     detiene, para que no se confunda dónde termina un proyecto. */
  function siguiente(estado) {
    if (!estado.abierto || estado.lupa) return estado;
    return irA(estado, estado.indice + 1);
  }

  function anterior(estado) {
    if (!estado.abierto || estado.lupa) return estado;
    return irA(estado, estado.indice - 1);
  }

  function alternarLupa(estado) {
    if (!estado.abierto) return estado;
    return copiaCon(estado, { lupa: !estado.lupa });
  }

  function alternarFicha(estado) {
    if (!estado.abierto) return estado;
    return copiaCon(estado, { ficha: !estado.ficha });
  }

  /* Pela una capa por llamada y en este orden: primero la lupa, luego la
     ficha, y solo entonces cierra el visor. Nunca salta un escalón. */
  function escapar(estado) {
    if (!estado.abierto) return inicial();
    if (estado.lupa) return copiaCon(estado, { lupa: false });
    if (estado.ficha) return copiaCon(estado, { ficha: false });
    return inicial();
  }

  return {
    inicial: inicial,
    abrir: abrir,
    irA: irA,
    siguiente: siguiente,
    anterior: anterior,
    alternarLupa: alternarLupa,
    alternarFicha: alternarFicha,
    escapar: escapar
  };
})();
