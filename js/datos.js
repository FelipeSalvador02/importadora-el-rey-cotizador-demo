/*
 * Importadora El Rey — Alternativa B: vitrina con solicitud de cotización
 * PROJECT_MODE = COMMERCIAL_DEMO
 *
 * Todo el contenido editable de la vitrina vive aquí.
 * Fuentes: 02 Brief Investigado V2, 07 Brief Maestro, 08 Prompt Maestro y decisiones de Felipe (30-oct-2026).
 * Imágenes de img/ref/: referenciales generadas con IA (Microsoft Copilot, "Copy"); sustituir por fotos oficiales antes de producción.
 */
window.EL_REY_B = {
  DEMO_MODE: true,

  negocio: {
    nombre: "Importadora El Rey",
    ciudad: "Quito, Ecuador",
    trayectoria: "Más de 40 años en el mercado",
    locales: "Centro y norte de Quito",
    whatsappVisible: "096 373 6626",
    whatsappNumero: "593963736626",
    creditoDemo: "Propuesta de diseño elaborada por Soluciones Digitales"
  },

  mensajes: {
    general: "Hola, quisiera solicitar una cotización en Importadora El Rey.",
    // Encabezado del mensaje del cotizador (las líneas se agregan en js/app.js)
    cotizacion: "Hola, quisiera solicitar una cotización en Importadora El Rey.",
    locales: "Hola, quisiera saber la ubicación y el horario de sus locales."
  },

  // tono: color pastel de la tarjeta. imagen: ilustración (ref = referencial IA, foto = fotografía real).
  ocasiones: [
    { id: "cumpleanos", nombre: "Cumpleaños y regalos", texto: "Juguetes y detalles para sorprender", tono: "azul", imagen: "img/ref/bloques-carro.webp", referencial: true },
    { id: "disfraces", nombre: "Fiestas y disfraces", texto: "Para animar cualquier celebración", tono: "coral", imagen: "img/ref/unicornio-inflable.webp", referencial: true },
    { id: "halloween", nombre: "Halloween", texto: "Máscaras, luces y dulces", tono: "lavanda", imagen: "img/ref/calabaza-luz.webp", referencial: true },
    { id: "fiestas-quito", nombre: "Fiestas de Quito", texto: "Accesorios para celebrar la ciudad", tono: "crema", imagen: "img/ref/props-quitenos.webp", referencial: true },
    { id: "temporadas", nombre: "Temporadas y celebraciones", texto: "Ideas para cada fecha del año", tono: "menta", imagen: "img/disfraces-interior.webp", referencial: false }
  ],

  categorias: [
    { id: "juguetes", nombre: "Juguetes", texto: "Juegos de mesa, sets para armar y regalos", tono: "azul", imagen: "img/ref/domino-metalico.webp" },
    { id: "fiesta-disfraces", nombre: "Fiestas y disfraces", texto: "Disfraces, diademas, máscaras y props", tono: "coral", imagen: "img/ref/diadema-diablo.webp" },
    { id: "decoracion", nombre: "Decoración", texto: "Detalles para ambientar tu evento", tono: "lavanda", imagen: "img/ref/calabaza-luz.webp" },
    { id: "bazar-hogar", nombre: "Bazar y hogar", texto: "Accesorios y artículos para regalar", tono: "crema", imagen: "img/ref/abanico-tela.webp" },
    { id: "temporada", nombre: "Temporada", texto: "Lo que cada celebración necesita", tono: "menta", imagen: "img/ref/mascara-calabaza.webp" }
  ],

  // Inspiración: tipos de artículo, no inventario exacto. Sin precios.
  // Para usar una foto oficial, cambiar solo la ruta de "imagen" y poner referencial: false.
  inspiracion: [
    { id: "bloques", nombre: "Sets de bloques para armar", categoria: "juguetes", imagen: "img/ref/bloques-carro.webp", alt: "Carro de carrera armado con bloques de construcción de colores", referencial: true },
    { id: "inflables", nombre: "Disfraces inflables", categoria: "fiesta-disfraces", imagen: "img/ref/unicornio-inflable.webp", alt: "Disfraz inflable de unicornio sobre un maniquí", referencial: true },
    { id: "luces-halloween", nombre: "Decoración con luz para Halloween", categoria: "decoracion", imagen: "img/ref/calabaza-luz.webp", alt: "Calabaza decorativa iluminada por dentro", referencial: true },
    { id: "props", nombre: "Props para fotos de fiesta", categoria: "fiesta-disfraces", imagen: "img/ref/props-quitenos.webp", alt: "Habladores de fomix con forma de globo de diálogo en varios colores", referencial: true },
    { id: "juegos-mesa", nombre: "Juegos de mesa clásicos", categoria: "juguetes", imagen: "img/ref/domino-metalico.webp", alt: "Fichas de dominó junto a un estuche metálico azul", referencial: true },
    { id: "diademas", nombre: "Diademas y accesorios con luz", categoria: "fiesta-disfraces", imagen: "img/ref/diadema-diablo.webp", alt: "Diadema roja con cachos luminosos sobre una cabeza de maniquí", referencial: true },
    { id: "mascaras", nombre: "Máscaras para disfraz", categoria: "temporada", imagen: "img/ref/mascara-calabaza.webp", alt: "Máscara de látex con forma de calabaza sobre una cabeza de maniquí", referencial: true },
    { id: "abanicos", nombre: "Abanicos y accesorios de tela", categoria: "bazar-hogar", imagen: "img/ref/abanico-tela.webp", alt: "Abanico plegable de tela roja con detalles dorados", referencial: true }
  ],

  // Límites del cotizador
  limites: { cantidadMax: 999, textoCorto: 80, textoLargo: 500, articulos: 20 }
};
