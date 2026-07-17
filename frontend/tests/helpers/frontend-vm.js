const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class AlmacenamientoSimulado {
  constructor(datosIniciales = {}) {
    this.datos = new Map(
      Object.entries(datosIniciales).map(([clave, valor]) => [
        clave,
        String(valor),
      ])
    );
  }

  getItem(clave) {
    return this.datos.has(clave) ? this.datos.get(clave) : null;
  }

  setItem(clave, valor) {
    this.datos.set(clave, String(valor));
  }

  removeItem(clave) {
    this.datos.delete(clave);
  }

  clear() {
    this.datos.clear();
  }
}

function crearListaClases() {
  const clases = new Set();

  return {
    add: (...nombres) => nombres.forEach((nombre) => clases.add(nombre)),
    remove: (...nombres) => nombres.forEach((nombre) => clases.delete(nombre)),
    contains: (nombre) => clases.has(nombre),
  };
}

function crearElemento(propiedades = {}) {
  const eventos = new Map();
  const atributos = new Map();
  const hijos = [];

  return {
    value: '',
    type: '',
    textContent: '',
    innerHTML: '',
    disabled: false,
    children: hijos,
    classList: crearListaClases(),
    addEventListener(tipo, manejador) {
      eventos.set(tipo, manejador);
    },
    setAttribute(nombre, valor) {
      atributos.set(nombre, String(valor));
    },
    getAttribute(nombre) {
      return atributos.get(nombre) || null;
    },
    append(...elementos) {
      hijos.push(...elementos);
    },
    replaceChildren(...elementos) {
      hijos.splice(0, hijos.length, ...elementos);
    },
    obtenerManejador(tipo) {
      return eventos.get(tipo);
    },
    ...propiedades,
  };
}

function crearContextoFrontend(opciones = {}) {
  const sessionStorage =
    opciones.sessionStorage || new AlmacenamientoSimulado();
  const localStorage = opciones.localStorage || new AlmacenamientoSimulado();
  const reemplazos = [];
  const eventosWindow = new Map();
  const location = {
    hostname: '127.0.0.1',
    protocol: 'http:',
    pathname: '/pages/editor.html',
    href: '',
    replace(destino) {
      reemplazos.push(destino);
      this.href = destino;
    },
    ...opciones.location,
  };
  const window = {
    ARTIFY_API_URL: opciones.apiUrl || '',
    location,
    addEventListener(tipo, manejador) {
      eventosWindow.set(tipo, manejador);
    },
  };
  const contexto = vm.createContext({
    window,
    document: opciones.document || {},
    sessionStorage,
    localStorage,
    fetch: opciones.fetch || (() => Promise.reject(new Error('fetch no simulado'))),
    console: opciones.console || {
      log() {},
      warn() {},
      error() {},
    },
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (callback) => callback(),
    URL,
    JSON,
    Number,
    String,
    Promise,
  });

  return {
    contexto,
    eventosWindow,
    localStorage,
    reemplazos,
    sessionStorage,
    window,
  };
}

function ejecutarScript(contexto, nombreArchivo) {
  const ruta = path.resolve(__dirname, '..', '..', 'assets', 'js', nombreArchivo);
  const contenido = fs.readFileSync(ruta, 'utf8');
  return vm.runInContext(contenido, contexto, { filename: ruta });
}

function evaluar(contexto, expresion) {
  return vm.runInContext(expresion, contexto);
}

async function esperarPromesas() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

module.exports = {
  AlmacenamientoSimulado,
  crearContextoFrontend,
  crearElemento,
  ejecutarScript,
  esperarPromesas,
  evaluar,
};
