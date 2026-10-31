/*
 * Importadora El Rey — Alternativa B (vitrina + solicitud de cotización)
 * Sin carrito, sin pagos, sin pedidos: arma una solicitud y la envía por WhatsApp.
 * La solicitud se guarda solo durante la sesión (sessionStorage, con respaldo en memoria).
 */
(function () {
  "use strict";
  var D = window.EL_REY_B;
  var L = D.limites;
  var CLAVE = "elrey-cotizador-v2";

  /* ---------- Utilidades ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function limpio(t, max) { return String(t || "").replace(/\s+/g, " ").trim().slice(0, max); }
  function limpioLargo(t, max) { return String(t || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max); }
  function wa(msg) { return "https://wa.me/" + D.negocio.whatsappNumero + "?text=" + encodeURIComponent(msg); }
  function porId(lista) { var m = {}; lista.forEach(function (x) { m[x.id] = x; }); return m; }
  var OC = porId(D.ocasiones), CAT = porId(D.categorias), IDEA = porId(D.inspiracion);

  // Cantidad opcional: "" es válido; si hay valor, entero entre 1 y el máximo
  function cantidadValida(v) {
    v = String(v == null ? "" : v).trim();
    if (v === "") return true;
    if (!/^\d+$/.test(v)) return false;
    var n = parseInt(v, 10);
    return n >= 1 && n <= L.cantidadMax;
  }
  function hoyISO() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function fechaLegible(iso) { var p = String(iso).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso; }

  /* ---------- Estado de la solicitud ---------- */
  function vacia() {
    return { paso: 1, maxPaso: 1, ocasion: "", ocasionOtra: "", categorias: [], ideas: [], articulos: [],
      det: { descripcion: "", colores: "", cantidades: "", fecha: "", observaciones: "", nombre: "" } };
  }
  var S = vacia();
  (function cargar() {
    try {
      var g = JSON.parse(window.sessionStorage.getItem(CLAVE) || "null");
      if (!g || typeof g !== "object") return;
      S.paso = [1, 2, 3, 4].indexOf(g.paso) > -1 ? g.paso : 1;
      S.maxPaso = [1, 2, 3, 4].indexOf(g.maxPaso) > -1 ? Math.max(g.maxPaso, S.paso) : S.paso;
      S.ocasion = (OC[g.ocasion] || g.ocasion === "otra") ? g.ocasion : "";
      S.ocasionOtra = limpio(g.ocasionOtra, L.textoCorto);
      S.categorias = (g.categorias || []).filter(function (c) { return CAT[c]; });
      S.ideas = (g.ideas || []).filter(function (i) { return i && IDEA[i.id]; }).map(function (i) { return { id: i.id, cantidad: cantidadValida(i.cantidad) ? String(i.cantidad || "") : "" }; });
      S.articulos = (g.articulos || []).filter(function (a) { return a && limpio(a.texto, L.textoCorto); }).slice(0, L.articulos)
        .map(function (a) { return { texto: limpio(a.texto, L.textoCorto), cantidad: cantidadValida(a.cantidad) ? String(a.cantidad || "") : "" }; });
      var d = g.det || {};
      Object.keys(S.det).forEach(function (k) { S.det[k] = typeof d[k] === "string" ? d[k].slice(0, L.textoLargo) : ""; });
    } catch (e) { /* sesión no disponible: se usa memoria */ }
  })();
  function guardar() { try { window.sessionStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) { /* memoria */ } contador(); }

  function totalArticulos() { return S.ideas.length + S.articulos.length; }
  function contador() {
    var n = totalArticulos(), c = $("#contador-solicitud");
    c.hidden = n === 0; c.textContent = n ? String(n) : "";
    var enlace = c.closest("a");
    if (enlace) enlace.setAttribute("aria-label", "Solicitar cotización" + (n ? ", " + n + (n === 1 ? " artículo" : " artículos") + " en tu solicitud" : ""));
  }

  /* ---------- Mensaje de WhatsApp ---------- */
  function nombreOcasion() {
    if (S.ocasion === "otra") return S.ocasionOtra ? "Otra: " + S.ocasionOtra : "Otra ocasión";
    return OC[S.ocasion] ? OC[S.ocasion].nombre : "";
  }
  function lineaArticulo(nombre, cantidad) { return "- " + nombre + (cantidad ? " (aprox. " + cantidad + ")" : ""); }
  function mensaje() {
    var l = [D.mensajes.cotizacion, ""];
    function campo(et, v) { if (v) l.push(et + ": " + v); }
    campo("Ocasión", nombreOcasion());
    campo("Categorías", S.categorias.map(function (c) { return CAT[c].nombre; }).join(", "));
    var arts = S.ideas.map(function (i) { return lineaArticulo(IDEA[i.id].nombre, i.cantidad); })
      .concat(S.articulos.map(function (a) { return lineaArticulo(a.texto, a.cantidad); }));
    if (arts.length) { l.push("Artículos o ideas de interés:"); l.push.apply(l, arts); }
    campo("Cantidades aproximadas", limpio(S.det.cantidades, L.textoCorto));
    campo("Colores o temática", limpio(S.det.colores, L.textoCorto));
    campo("Fecha del evento", S.det.fecha ? fechaLegible(S.det.fecha) : "");
    campo("Detalles adicionales", limpioLargo(S.det.descripcion, L.textoLargo));
    campo("Observaciones", limpioLargo(S.det.observaciones, L.textoLargo));
    campo("Nombre", limpio(S.det.nombre, 60));
    return l.join("\n");
  }

  /* ---------- Vitrina ---------- */
  function foto(src, alt) { return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">'; }

  $("#lista-ocasiones").innerHTML = D.ocasiones.map(function (o) {
    return '<li><a class="ocasion tono--' + o.tono + '" href="#cotizar" data-ocasion="' + o.id + '">' +
      '<span class="ocasion__img">' + foto(o.imagen, "") + '</span>' +
      '<span class="ocasion__nombre">' + esc(o.nombre) + '</span>' +
      '<span class="ocasion__texto">' + esc(o.texto) + '</span>' +
      '<span class="ocasion__cta">Cotizar para esta ocasión</span></a></li>';
  }).join("");

  $("#lista-categorias").innerHTML = D.categorias.map(function (c) {
    return '<li class="categoria tono--' + c.tono + '">' +
      '<span class="categoria__img">' + foto(c.imagen, "") + '</span>' +
      '<span class="categoria__cuerpo"><span class="categoria__nombre">' + esc(c.nombre) + '</span>' +
      '<span class="categoria__texto">' + esc(c.texto) + '</span></span></li>';
  }).join("");

  function ideaElegida(id) { return S.ideas.some(function (i) { return i.id === id; }); }
  function pintarInspiracion() {
    $("#lista-inspiracion").innerHTML = D.inspiracion.map(function (it) {
      var dentro = ideaElegida(it.id);
      return '<li class="idea">' +
        '<div class="idea__img">' + foto(it.imagen, it.alt) +
          '<span class="idea__cat">' + esc(CAT[it.categoria] ? CAT[it.categoria].nombre : "") + '</span></div>' +
        (it.referencial ? '<span class="idea__ref">Imagen referencial</span>' : '<span class="idea__ref"></span>') +
        '<h3 class="idea__nombre">' + esc(it.nombre) + '</h3>' +
        '<button type="button" class="boton-agregar' + (dentro ? ' boton-agregar--dentro' : '') + '" data-idea="' + it.id + '" aria-pressed="' + dentro + '">' +
          '<span class="boton-agregar__largo">' + (dentro ? 'En tu solicitud' : 'Agregar a mi solicitud') + '</span>' +
          '<span class="boton-agregar__corto" aria-hidden="true">' + (dentro ? 'Agregado' : 'Agregar') + '</span>' +
          '<span class="solo-lectores">: ' + esc(it.nombre) + '</span></button>' +
      '</li>';
    }).join("");
  }

  function alternarIdea(id) {
    var i = S.ideas.findIndex(function (x) { return x.id === id; });
    if (i > -1) S.ideas.splice(i, 1); else S.ideas.push({ id: id, cantidad: "" });
    guardar(); pintarInspiracion();
    if (S.paso === 2 || S.paso === 4) pintarPaso(false);
    return i === -1;
  }

  /* ---------- Carrusel de ocasiones: puntos y desvanecido ---------- */
  var carrusel = $("#carrusel-ocasiones"), listaOc = $("#lista-ocasiones"), puntos = $("#puntos-ocasiones");
  puntos.innerHTML = D.ocasiones.map(function () { return "<span></span>"; }).join("");
  function actualizarCarrusel() {
    var max = listaOc.scrollWidth - listaOc.clientWidth;
    carrusel.classList.toggle("carrusel--final", listaOc.scrollLeft >= max - 4);
    carrusel.classList.toggle("carrusel--inicio", listaOc.scrollLeft <= 4);
    var tarjeta = listaOc.querySelector("li"); if (!tarjeta) return;
    var paso = tarjeta.getBoundingClientRect().width + 14;
    var idx = Math.min(D.ocasiones.length - 1, Math.round(listaOc.scrollLeft / paso));
    if (listaOc.scrollLeft >= max - 4) idx = D.ocasiones.length - 1;
    $$("span", puntos).forEach(function (p, i) { p.classList.toggle("activo", i === idx); });
  }
  listaOc.addEventListener("scroll", actualizarCarrusel, { passive: true });
  window.addEventListener("resize", actualizarCarrusel);

  /* ---------- Cotizador ---------- */
  var NOMBRES_PASOS = ["Ocasión", "Qué buscas", "Detalles", "Revisar y enviar"];
  var tarjeta = $("#tarjeta-paso");
  var confirmarReinicio = false;

  function pintarPasos() {
    $("#pasos").innerHTML = NOMBRES_PASOS.map(function (n, i) {
      var num = i + 1, actual = num === S.paso, accesible = num <= S.maxPaso;
      var hecho = num < S.paso || (num <= S.maxPaso && !actual);
      var contenido = '<span class="paso__num">' + num + '</span><span class="paso__nombre">' + n + '</span>';
      return '<li class="paso' + (actual ? ' paso--activo' : '') + (hecho ? ' paso--hecho' : '') + '"' + (actual ? ' aria-current="step"' : '') + '>' +
        (accesible && !actual ? '<button type="button" class="paso__boton" data-ir="' + num + '">' + contenido + '<span class="solo-lectores"> (editar)</span></button>' : '<span class="paso__boton">' + contenido + '</span>') +
        '</li>';
    }).join("");
  }

  function chip(attr, valor, texto, marcado, rol, tono, extra) {
    return '<button type="button" class="opcion' + (tono ? ' tono--' + tono : '') + (marcado ? ' opcion--sel' : '') + '" ' + attr + '="' + valor + '" ' +
      (rol === "radio" ? 'role="radio" aria-checked="' + marcado + '"' : 'aria-pressed="' + marcado + '"') + '>' + (extra || "") + esc(texto) + '</button>';
  }
  function campoCantidad(id, valor, etiqueta, datos) {
    return '<label class="cantidad"><span class="cantidad__et">' + etiqueta + '</span>' +
      '<input id="' + id + '" type="number" inputmode="numeric" min="1" max="' + L.cantidadMax + '" step="1" placeholder="—" value="' + esc(valor) + '" ' + datos +
      (cantidadValida(valor) ? '' : ' aria-invalid="true"') + '></label>';
  }
  function pie(atras, siguiente) {
    return '<div class="tarjeta-paso__pie">' +
      (atras ? '<button type="button" class="boton boton--suave" data-atras>Atrás</button>' : '<span></span>') +
      siguiente + '</div>';
  }
  function error(id) { return '<p class="error" id="' + id + '" role="alert" hidden></p>'; }

  function vistaPaso1() {
    return '<h3 id="titulo-paso" tabindex="-1">¿Qué vas a celebrar?</h3>' +
      '<div class="opciones" role="radiogroup" aria-labelledby="titulo-paso">' +
        D.ocasiones.map(function (o) { return chip("data-elegir", o.id, o.nombre, S.ocasion === o.id, "radio", o.tono); }).join("") +
        chip("data-elegir", "otra", "Otra ocasión", S.ocasion === "otra", "radio") +
      '</div>' +
      (S.ocasion === "otra" ? '<label class="campo campo--corto"><span class="campo__et">¿Cuál? <span class="opcional">opcional</span></span><input id="ocasion-otra" type="text" maxlength="' + L.textoCorto + '" value="' + esc(S.ocasionOtra) + '" data-campo="ocasionOtra" placeholder="Ej.: graduación, baby shower"></label>' : '') +
      error("error-paso") +
      pie(false, '<button type="button" class="boton boton--marino" data-siguiente>Siguiente</button>');
  }

  function vistaPaso2() {
    var ideasSel = S.ideas.map(function (i, n) {
      var it = IDEA[i.id];
      return '<li class="item"><img class="item__img" src="' + esc(it.imagen) + '" alt="" aria-hidden="true">' +
        '<span class="item__nombre">' + esc(it.nombre) + '</span>' +
        campoCantidad("cant-idea-" + n, i.cantidad, "Cant.", 'data-cant-idea="' + i.id + '" aria-label="Cantidad aproximada de ' + esc(it.nombre) + '"') +
        '<button type="button" class="quitar" data-quitar-idea="' + i.id + '">Quitar<span class="solo-lectores"> ' + esc(it.nombre) + '</span></button></li>';
    });
    var arts = S.articulos.map(function (a, n) {
      return '<li class="item item--texto"><span class="item__icono" aria-hidden="true">✎</span><span class="item__nombre">' + esc(a.texto) + '</span>' +
        campoCantidad("cant-art-" + n, a.cantidad, "Cant.", 'data-cant-art="' + n + '" aria-label="Cantidad aproximada de ' + esc(a.texto) + '"') +
        '<button type="button" class="quitar" data-quitar-art="' + n + '">Quitar<span class="solo-lectores"> ' + esc(a.texto) + '</span></button></li>';
    });
    var lista = ideasSel.concat(arts);
    return '<h3 id="titulo-paso" tabindex="-1">¿Qué buscas?</h3>' +
      '<p class="paso__ayuda">Elige categorías, suma ideas o escribe lo que necesitas. Con una sola opción es suficiente.</p>' +
      '<fieldset class="grupo"><legend>Categorías</legend><div class="opciones">' +
        D.categorias.map(function (c) { return chip("data-categoria", c.id, c.nombre, S.categorias.indexOf(c.id) > -1, "", c.tono); }).join("") +
      '</div></fieldset>' +
      '<fieldset class="grupo"><legend>Ideas de la vitrina</legend><div class="opciones opciones--ideas">' +
        D.inspiracion.map(function (it) {
          return chip("data-idea", it.id, it.nombre, ideaElegida(it.id), "", "", '<img src="' + esc(it.imagen) + '" alt="" aria-hidden="true">');
        }).join("") +
      '</div></fieldset>' +
      '<div class="grupo"><label class="campo__et" for="nuevo-articulo">¿Buscas algo específico?</label>' +
        '<div class="agregar-articulo">' +
          '<input id="nuevo-articulo" type="text" maxlength="' + L.textoCorto + '" placeholder="Ej.: piñata de unicornio, globos dorados" autocomplete="off" aria-describedby="error-articulo">' +
          campoCantidad("nueva-cantidad", "", "Cant.", 'aria-label="Cantidad aproximada del artículo"') +
          '<button type="button" class="boton boton--marino boton--chico" data-agregar-articulo>Añadir</button>' +
        '</div>' + error("error-articulo") +
      '</div>' +
      '<div class="grupo"><p class="campo__et" id="titulo-lista">Tu selección</p>' +
        (lista.length ? '<ul class="items" role="list" aria-labelledby="titulo-lista">' + lista.join("") + '</ul>'
          : '<p class="vacio">Aún no agregas ideas ni artículos. Puedes continuar solo con categorías.</p>') +
      '</div>' +
      error("error-paso") +
      pie(true, '<button type="button" class="boton boton--marino" data-siguiente>Siguiente</button>');
  }

  function campo(id, etiqueta, valor, tipo, ayuda, extra) {
    var largo = tipo === "textarea";
    return '<label class="campo' + (largo ? '' : ' campo--corto') + '"><span class="campo__et">' + etiqueta + ' <span class="opcional">opcional</span></span>' +
      (largo ? '<textarea id="' + id + '" rows="3" maxlength="' + L.textoLargo + '" data-det="' + id.replace("det-", "") + '" placeholder="' + esc(ayuda) + '">' + esc(valor) + '</textarea>'
        : '<input id="' + id + '" type="' + tipo + '" data-det="' + id.replace("det-", "") + '" value="' + esc(valor) + '" placeholder="' + esc(ayuda) + '" ' + (extra || "") + '>') +
      '</label>';
  }

  function vistaPaso3() {
    var d = S.det;
    return '<h3 id="titulo-paso" tabindex="-1">Detalles</h3>' +
      '<p class="paso__ayuda">Todo es opcional. Mientras más nos cuentes, más precisa será la cotización.</p>' +
      '<div class="campos">' +
        campo("det-descripcion", "Describe lo que necesitas", d.descripcion, "textarea", "Ej.: decoración para un cumpleaños infantil de 25 niños") +
        campo("det-colores", "Colores o temática", d.colores, "text", "Ej.: azul y dorado, superhéroes", 'maxlength="' + L.textoCorto + '"') +
        campo("det-cantidades", "Cantidades aproximadas", d.cantidades, "text", "Ej.: para 30 invitados", 'maxlength="' + L.textoCorto + '"') +
        campo("det-fecha", "Fecha del evento", d.fecha, "date", "", 'min="' + hoyISO() + '" aria-describedby="error-fecha"') +
        error("error-fecha") +
        campo("det-observaciones", "Observaciones", d.observaciones, "textarea", "Algo más que debamos saber") +
        campo("det-nombre", "Tu nombre", d.nombre, "text", "Para saludarte por tu nombre", 'maxlength="60" autocomplete="given-name"') +
      '</div>' +
      error("error-paso") +
      pie(true, '<button type="button" class="boton boton--marino" data-siguiente>Revisar solicitud</button>');
  }

  function filaResumen(et, valor, paso) {
    return '<div class="resumen__fila"><dt>' + et + '</dt><dd>' + (valor || '<span class="resumen__vacio">Sin indicar</span>') +
      '</dd><dd class="resumen__editar"><button type="button" class="enlace" data-ir="' + paso + '">Editar<span class="solo-lectores"> ' + et.toLowerCase() + '</span></button></dd></div>';
  }
  function vistaPaso4() {
    var d = S.det;
    var arts = S.ideas.map(function (i) { return esc(IDEA[i.id].nombre) + (i.cantidad ? ' <span class="aprox">aprox. ' + esc(i.cantidad) + '</span>' : ''); })
      .concat(S.articulos.map(function (a) { return esc(a.texto) + (a.cantidad ? ' <span class="aprox">aprox. ' + esc(a.cantidad) + '</span>' : ''); }));
    var msg = mensaje();
    return '<h3 id="titulo-paso" tabindex="-1">Revisa tu solicitud</h3>' +
      '<dl class="resumen">' +
        filaResumen("Ocasión", esc(nombreOcasion()), 1) +
        filaResumen("Categorías", esc(S.categorias.map(function (c) { return CAT[c].nombre; }).join(", ")), 2) +
        filaResumen("Artículos o ideas", arts.length ? '<ul class="resumen__lista">' + arts.map(function (a) { return "<li>" + a + "</li>"; }).join("") + "</ul>" : "", 2) +
        filaResumen("Cantidades aproximadas", esc(limpio(d.cantidades, L.textoCorto)), 3) +
        filaResumen("Colores o temática", esc(limpio(d.colores, L.textoCorto)), 3) +
        filaResumen("Fecha del evento", d.fecha ? esc(fechaLegible(d.fecha)) : "", 3) +
        filaResumen("Detalles adicionales", esc(limpioLargo(d.descripcion, L.textoLargo)), 3) +
        filaResumen("Observaciones", esc(limpioLargo(d.observaciones, L.textoLargo)), 3) +
        filaResumen("Nombre", esc(limpio(d.nombre, 60)), 3) +
      '</dl>' +
      '<details class="mensaje"><summary>Ver el mensaje que se enviará</summary><pre id="mensaje-whatsapp">' + esc(msg) + '</pre></details>' +
      '<p class="nota-envio">Al enviar se abrirá WhatsApp con tu solicitud lista. La disponibilidad y el precio se confirman por ese medio.</p>' +
      '<div class="tarjeta-paso__pie tarjeta-paso__pie--final">' +
        '<button type="button" class="boton boton--suave" data-atras>Atrás</button>' +
        '<a class="boton boton--wa" id="enviar-whatsapp" href="' + wa(msg) + '" target="_blank" rel="noopener">' +
          '<svg aria-hidden="true" viewBox="0 0 32 32" width="20" height="20"><path fill="currentColor" d="M16 3.2A12.7 12.7 0 0 0 5.1 22.4L3.3 28.8l6.6-1.7A12.7 12.7 0 1 0 16 3.2Zm0 23.2c-2 0-3.9-.5-5.5-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.5 10.5 0 1 1 16 26.4Z"/></svg>' +
          'Enviar solicitud por WhatsApp</a>' +
      '</div>' +
      '<div class="reinicio" id="reinicio">' +
        (confirmarReinicio
          ? '<span>¿Borrar toda la solicitud?</span><button type="button" class="enlace enlace--peligro" data-reiniciar-si>Sí, comenzar de nuevo</button><button type="button" class="enlace" data-reiniciar-no>Cancelar</button>'
          : '<button type="button" class="enlace" data-reiniciar>Comenzar de nuevo</button>') +
      '</div>';
  }

  var VISTAS = { 1: vistaPaso1, 2: vistaPaso2, 3: vistaPaso3, 4: vistaPaso4 };
  function pintarPaso(enfocar) {
    pintarPasos();
    tarjeta.innerHTML = VISTAS[S.paso]();
    tarjeta.setAttribute("aria-labelledby", "titulo-paso");
    if (enfocar) {
      var t = $("#titulo-paso"); if (t) t.focus({ preventScroll: true });
      var zona = $("#cotizar"); var r = zona.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.5) $(".cotizador__panel").scrollIntoView({ block: "start" });
    }
  }

  function mostrarError(id, texto) { var e = $("#" + id); if (!e) return; e.textContent = texto; e.hidden = !texto; }

  function validarPaso() {
    if (S.paso === 1 && !S.ocasion) { mostrarError("error-paso", "Elige una ocasión para continuar."); return false; }
    if (S.paso === 2) {
      if (!S.categorias.length && !S.ideas.length && !S.articulos.length) { mostrarError("error-paso", "Elige al menos una categoría, una idea o escribe un artículo."); return false; }
      var mal = $$("[data-cant-idea], [data-cant-art]", tarjeta).filter(function (i) { return !cantidadValida(i.value); });
      if (mal.length) { mostrarError("error-paso", "Revisa las cantidades: usa números enteros del 1 al " + L.cantidadMax + ", o déjalas vacías."); mal[0].focus(); return false; }
    }
    if (S.paso === 3 && S.det.fecha && S.det.fecha < hoyISO()) { mostrarError("error-fecha", "Elige una fecha a partir de hoy, o deja el campo vacío."); $("#det-fecha").focus(); return false; }
    return true;
  }

  function irA(n) {
    S.paso = n; S.maxPaso = Math.max(S.maxPaso, n); confirmarReinicio = false;
    guardar(); pintarPaso(true);
  }

  function agregarArticulo() {
    var input = $("#nuevo-articulo"), cant = $("#nueva-cantidad");
    var texto = limpio(input.value, L.textoCorto);
    if (texto.length < 2) { mostrarError("error-articulo", "Escribe el artículo que buscas."); input.focus(); return; }
    if (!cantidadValida(cant.value)) { mostrarError("error-articulo", "La cantidad debe ser un número entero del 1 al " + L.cantidadMax + ", o quedar vacía."); cant.focus(); return; }
    if (S.articulos.length >= L.articulos) { mostrarError("error-articulo", "Puedes añadir hasta " + L.articulos + " artículos. Detalla el resto en observaciones."); return; }
    S.articulos.push({ texto: texto, cantidad: String(cant.value).trim() });
    guardar(); pintarPaso(false);
    $("#nuevo-articulo").focus();
    avisar("Añadido a tu solicitud");
  }

  /* ---------- Eventos ---------- */
  var aviso = $("#aviso"), temp;
  function avisar(txt) { aviso.textContent = txt; aviso.classList.add("visible"); clearTimeout(temp); temp = setTimeout(function () { aviso.classList.remove("visible"); }, 2800); }

  document.addEventListener("click", function (e) {
    var el;
    if ((el = e.target.closest("[data-idea]"))) {
      var id = el.getAttribute("data-idea"), enCotizador = !!el.closest("#tarjeta-paso");
      var agregado = alternarIdea(id);
      var mismo = $((enCotizador ? "#tarjeta-paso " : "#lista-inspiracion ") + '[data-idea="' + id + '"]'); if (mismo) mismo.focus();
      avisar(agregado ? "Agregado a tu solicitud" : "Quitado de tu solicitud");
      return;
    }
    if ((el = e.target.closest("[data-ocasion]"))) {
      S.ocasion = el.getAttribute("data-ocasion"); guardar();
      if (S.paso === 1 || S.paso === 4) pintarPaso(false);
      return;
    }
    if ((el = e.target.closest("[data-elegir]"))) {
      S.ocasion = el.getAttribute("data-elegir"); guardar(); pintarPaso(false);
      var o = $('[data-elegir="' + S.ocasion + '"]'); if (o) o.focus();
      return;
    }
    if ((el = e.target.closest("[data-categoria]"))) {
      var c = el.getAttribute("data-categoria"), k = S.categorias.indexOf(c);
      if (k > -1) S.categorias.splice(k, 1); else S.categorias.push(c);
      guardar(); pintarPaso(false);
      var b = $('#tarjeta-paso [data-categoria="' + c + '"]'); if (b) b.focus();
      return;
    }
    if ((el = e.target.closest("[data-quitar-idea]"))) {
      alternarIdea(el.getAttribute("data-quitar-idea")); avisar("Quitado de tu solicitud");
      var sig = $("#tarjeta-paso .quitar") || $("#nuevo-articulo"); if (sig) sig.focus();
      return;
    }
    if ((el = e.target.closest("[data-quitar-art]"))) {
      S.articulos.splice(parseInt(el.getAttribute("data-quitar-art"), 10), 1);
      guardar(); pintarPaso(false); avisar("Quitado de tu solicitud");
      var sig2 = $("#tarjeta-paso .quitar") || $("#nuevo-articulo"); if (sig2) sig2.focus();
      return;
    }
    if (e.target.closest("[data-agregar-articulo]")) { agregarArticulo(); return; }
    if (e.target.closest("[data-siguiente]")) { if (validarPaso()) irA(S.paso + 1); return; }
    if (e.target.closest("[data-atras]")) { irA(Math.max(1, S.paso - 1)); return; }
    if ((el = e.target.closest("[data-ir]"))) { irA(parseInt(el.getAttribute("data-ir"), 10)); return; }
    if (e.target.closest("[data-reiniciar]")) { confirmarReinicio = true; pintarPaso(false); $("[data-reiniciar-no]").focus(); return; }
    if (e.target.closest("[data-reiniciar-no]")) { confirmarReinicio = false; pintarPaso(false); $("[data-reiniciar]").focus(); return; }
    if (e.target.closest("[data-reiniciar-si]")) {
      S = vacia(); confirmarReinicio = false; guardar(); pintarInspiracion(); pintarPaso(true);
      avisar("Solicitud reiniciada");
      return;
    }
  });

  // Campos de texto: actualizan el estado sin volver a dibujar (no se pierde el foco)
  document.addEventListener("input", function (e) {
    var t = e.target, k;
    if ((k = t.getAttribute("data-det"))) { S.det[k] = t.value.slice(0, L.textoLargo); if (k === "fecha") mostrarError("error-fecha", ""); guardar(); return; }
    if (t.getAttribute("data-campo") === "ocasionOtra") { S.ocasionOtra = limpio(t.value, L.textoCorto); guardar(); return; }
    if ((k = t.getAttribute("data-cant-idea"))) {
      var it = S.ideas.find(function (x) { return x.id === k; });
      if (it) it.cantidad = cantidadValida(t.value) ? String(t.value).trim() : it.cantidad;
      t.toggleAttribute("aria-invalid", !cantidadValida(t.value)); guardar(); return;
    }
    if ((k = t.getAttribute("data-cant-art")) !== null && k !== undefined && t.hasAttribute("data-cant-art")) {
      var a = S.articulos[parseInt(k, 10)];
      if (a) a.cantidad = cantidadValida(t.value) ? String(t.value).trim() : a.cantidad;
      t.toggleAttribute("aria-invalid", !cantidadValida(t.value)); guardar(); return;
    }
    if (t.id === "nuevo-articulo" || t.id === "nueva-cantidad") mostrarError("error-articulo", "");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (e.target.id === "nuevo-articulo" || e.target.id === "nueva-cantidad")) { e.preventDefault(); agregarArticulo(); }
    // Flechas en el grupo de ocasiones (radiogroup)
    var r = e.target.closest && e.target.closest('[role="radio"]');
    if (r && /Arrow(Right|Down|Left|Up)/.test(e.key)) {
      var radios = $$('#tarjeta-paso [role="radio"]'), i = radios.indexOf(r);
      var n = radios[(i + (/Right|Down/.test(e.key) ? 1 : -1) + radios.length) % radios.length];
      e.preventDefault(); n.focus();
    }
  });

  $$("[data-wa]").forEach(function (a) { a.href = wa(D.mensajes[a.getAttribute("data-wa")]); a.target = "_blank"; a.rel = "noopener"; });
  pintarInspiracion();
  pintarPaso(false);
  contador();
  actualizarCarrusel();

})();
