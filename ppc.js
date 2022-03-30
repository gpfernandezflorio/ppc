const data = {};
const templates = {
  ventanaSinRepeticion: 'X>X>XvXvX<X<X^X^',
  ventanaConRepeticion: '(X>)2(Xv)2(X<)2(X^)2',
  ventanaDoble: '[Dibujar ventana doble]\n\n"Dibujar ventana doble"\n [Dibujar ventana]\n (>)4\n [Dibujar ventana]\n\n"Dibujar ventana"\n (X>)2\n (Xv)2\n (X<)2\n (X^)2',
  veleroSinProcedimientos: '(X<)7(X>^)7(Xv)7\n>>(X^)6>(X>vv)3(X<)4\nvv(X>)5(Xv<)2\n(X<)11(X^<)2(X>)10',
  veleroConProcedimientos: '[Dibujar velero]\n\n"Dibujar velero"\n [Dibujar vela izquierda]\n >>\n [Dibujar vela derecha]\n vv\n [Dibujar casco]\n\n"Dibujar vela derecha"\n (X^)6>(X>vv)3(X<)4\n\n"Dibujar vela izquierda"\n (X<)7(X>^)7(Xv)7\n\n"Dibujar casco"\n (X>)5(Xv<)2(X<)11(X^<)2(X>)10'
};

window.addEventListener('load', function() {
  let selector = document.getElementById('templates');
  let opciones = '';
  for (let t in templates) {
    opciones += `<option value="${t}">${t}</option>`;
  }
  selector.innerHTML = opciones;
  cargarTemplate();
});

function cargarTemplate() {
  let selector = document.getElementById('templates');
  document.getElementById('codigoFuente').value = templates[selector.value];
}

function ejecutar() {
  data.cabezal = {x:0, y:0};
  data.limites = {x:0, y:0, w:1, h:1};
  data.codigo = {};
  data.dibujo = [];
  let fuente = document.getElementById('codigoFuente').value.split('\n');
  let i=0;
  let definiciones = {};
  while (i < fuente.length) {
    let linea = fuente[i];
    if (linea.length > 0) {
      if (linea[0] == '"') {
        i = nuevaDefinicion(fuente, i, definiciones);
        if (i < 0) { return; }
      } else {
        data.codigo[i] = fuente[i];
      }
    }
    i++;
  }
  for (let i in data.codigo) {
    let error = procesarLinea(data.codigo[i], i, definiciones);
    if (error) { return; }
  }
  dibujar();
}

function dibujar() {
  const CASILLA = 10;
  let canvas = document.getElementById("canvas");
  let ancho = data.limites.w - data.limites.x;
  let alto = data.limites.h - data.limites.y;
  canvas.width = (Math.max(10, ancho) + 2) * CASILLA;
  canvas.height = (Math.max(10, alto) + 2) * CASILLA;
  let ctx = canvas.getContext("2d");
  for (let d of data.dibujo) {
    ctx.beginPath();
    ctx.rect((d.x - data.limites.x)*CASILLA, (d.y - data.limites.y)*CASILLA, CASILLA-1, CASILLA-1);
    ctx.fill();
  }
}

function nuevaDefinicion(fuente, i, definiciones) {
  let linea = fuente[i];
  let fin = linea.indexOf('"',1);
  if (fin < 0) { alert("Error: falta cerrar comillas en la línea " + (i+1)); return -1; }
  if (linea.length > fin+1) { alert("Error: caracteres inesperados tras las comillas en la línea " + (i+1)); return -1; }
  let nombre = linea.substring(1, fin);
  definiciones[nombre] = {};
  while (i < fuente.length - 1 && comienzaConEspacio(fuente[i+1])) {
    i++;
    definiciones[nombre][i] = fuente[i];
  }
  return i;
}

function comienzaConEspacio(l) {
  return l.length == 0 || l[0] == ' ';
}

function invocarDefinicion(linea, j, i, definiciones) {
  let fin = linea.indexOf(']', j+1);
  if (fin < 0) { alert("Error: falta cerrar corchete en la línea " + (i+1)); return -1; }
  let nombre = linea.substring(j+1, fin);
  if (nombre in definiciones) {
    for (let linea in definiciones[nombre]) {
      let error = procesarLinea(definiciones[nombre][linea], linea, definiciones);
      if (error) { return -1; }
    }
  } else { alert("Error: " + nombre + " no está definido (se invoca en la línea " + (i+1) + ")"); return -1; }
  return fin;
}

function procesarLinea(linea, i, definiciones) {
  let j=0;
  while (j < linea.length) {
    if (linea[j] == '[') {
      j = invocarDefinicion(linea, j, i, definiciones)
      if (j < 0) { return true; }
    } else if (linea[j] == '(') {
      j = repeticion(linea, j, i, definiciones)
      if (j < 0) { return true; }
    } else {
      let error = procesarPrimitiva(linea[j], i, j);
      if (error) { return true; }
    }
    j++;
  }
}

function repeticion(linea, j, i, definiciones) {
  let fin = encontrarParentesis(linea, j+1);
  if (fin < 0) { alert("Error: falta cerrar el paréntesis que se abre en la línea " + (i+1) + ", columna " + j+1); return -1; }
  if (fin == linea.length -1 || !esUnNumero(linea[fin+1])) { alert("Error: falta la cantidad de repeticiones tras el paréntesis de la línea " + (i+1) + ", columna " + (fin+1)); return -1; }
  let cuerpo = linea.substring(j+1, fin);
  j = fin + 2;
  while(j < linea.length && esUnNumero(linea[j])) {
    j++;
  }
  let n = Number(linea.substring(fin+1, j))
  for (let z=0; z<n; z++) {
    let error = procesarLinea(cuerpo, i, definiciones);
    if (error) { return -1; }
  }
  return j-1;
}

function encontrarParentesis(linea, j) {
  let abiertos = 1;
  while (j < linea.length) {
    if (linea[j] == '(') {
      abiertos ++;
    } else if (linea[j] == ')') {
      abiertos --;
    }
    if (abiertos == 0) {
      return j;
    }
    j++;
  }
  return -1;
}

function esUnNumero(x) {
  return '0123456789'.includes(x);
}

function procesarPrimitiva(p, i, j) {
  if (p=='>') {
    data.cabezal.x++;
    data.limites.w = Math.max(data.limites.w, data.cabezal.x);
  } else if (p=='<') {
    data.cabezal.x--;
    data.limites.x = Math.min(data.limites.x, data.cabezal.x);
  } else if (p=='^') {
    data.cabezal.y--;
    data.limites.y = Math.min(data.limites.y, data.cabezal.y);
  } else if (p=='v') {
    data.cabezal.y++;
    data.limites.h = Math.max(data.limites.h, data.cabezal.y);
  } else if (p=='X') {
    data.dibujo.push({x:data.cabezal.x, y:data.cabezal.y});
  } else if (comienzaConEspacio(p)) {
    // Ignorar
  } else {
    alert("Error en la línea " + (i+1) + ": caracter " + p + " inválido");
    return true;
  }
  return false;
}
