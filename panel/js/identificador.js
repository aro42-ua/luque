window.Identificador = (function () {
  /* El id viaja en la URL (#/bruma), así que se genera una vez y se congela:
     renombrar un proyecto no puede romper un enlace que la fotógrafa ya mandó
     a un cliente. De ahí que esto sea una función pura y sin sorpresas. */
  function desde(titulo) {
    return String(titulo || '')
      .normalize('NFD')                    // separa la letra de su tilde
      /* ATENCIÓN: el rango va escapado a propósito. Escrito con los caracteres
         combinantes literales se corrompe al copiarlo entre editores y el
         regex deja de casar en silencio — los acentos sobrevivirían al id. */
      .replace(/[\u0300-\u036f]/g, '')     // y descarta la tilde suelta
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')         // todo lo demás, separador
      .replace(/^-+|-+$/g, '');            // sin guiones colgando
  }

  function problema(id, idsExistentes, categorias) {
    if (!id) return 'El título no deja ningún identificador utilizable.';
    if (idsExistentes.indexOf(id) !== -1) {
      return 'Ya hay un proyecto con el identificador «' + id + '».';
    }
    /* El enrutador resuelve antes la categoría que el proyecto, así que uno
       llamado como una categoría no se podría abrir nunca por su URL. */
    if (categorias.indexOf(id) !== -1) {
      return '«' + id + '» es el nombre de una categoría y no puede serlo de un proyecto.';
    }
    return null;
  }

  return { desde: desde, problema: problema };
})();
