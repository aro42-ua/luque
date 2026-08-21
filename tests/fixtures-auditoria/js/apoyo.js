// El falso positivo que dejo al auditor en rojo al terminar el bloque 3a: el
// patron de las url de CSS casaba DENTRO del identificador base64url, asi que
// lo que iba entre parentesis se reportaba como una ruta que no existe. No es
// una ruta, es una llamada a una funcion, y el auditor no puede confundirlas.
var trozo = base64url('esto-no-es-una-ruta');

// La misma trampa escrita de las otras formas que se le ocurren a cualquiera.
var otro = miurl('tampoco-es-una-ruta');
var guion = data_url('ni-esto');
