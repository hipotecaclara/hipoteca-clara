/* Datos de referencia. Actualízalos aquí y se reflejan en todas las calculadoras.
   Última revisión: 21/11/2026.
   ITP y AJD: tipos generales 2026 por comunidad (guiafiscal.es, boletines autonómicos).
   Euríbor: medias mensuales oficiales a 12 meses (Banco de España / BOE). */
window.HC_DATOS = {
  actualizado: "21 de noviembre de 2026",
  euribor: {
    ultimoMes: "octubre 2026",
    ultimo: 3.239,
    serie: [
      ["oct 25", 2.187], ["ene 26", 2.245], ["feb 26", 2.221],
      ["mar 26", 2.565], ["abr 26", 2.747], ["may 26", 2.804], ["jun 26", 2.798],
      ["jul 26", 2.855], ["ago 26", 2.954], ["sep 26", 3.247], ["oct 26", 3.239]
    ]
  },
  // itp: tipo general vivienda usada (%); joven: tipo reducido orientativo (null si no hay);
  // ajd: AJD vivienda nueva (%); tramos: tarifa progresiva [límite, tipo marginal];
  // jovenTramos: tarifa joven por tramos; jovenTramosTotal: tipo único según precio; jovenMax: precio máx. para tipo joven
  // igic: tipo IGIC vivienda nueva (Canarias)
  ccaa: {
    "andalucia":          { n: "Andalucía", itp: 7, joven: 3.5, jovenMax: 150000, ajd: 1.2 },
    "aragon":             { n: "Aragón", itp: 8, joven: 7, jovenMax: 100000, ajd: 1.5, tramos: [[400000, 8], [450000, 8.5], [500000, 9], [750000, 9.5], [Infinity, 10]] },
    "asturias":           { n: "Asturias", itp: 8, joven: 4, jovenTramos: [[150000, 4], [Infinity, 6]], ajd: 1.2, tramos: [[300000, 8], [500000, 9], [Infinity, 10]] },
    "baleares":           { n: "Illes Balears", itp: 8, joven: 2, jovenTramos: [[270151.2, 2], [Infinity, 8]], jovenMax: 331859.7, ajd: 1.5, tramos: [[400000, 8], [600000, 9], [1000000, 10], [2000000, 12], [Infinity, 13]] },
    "canarias":           { n: "Canarias", itp: 6.5, joven: 4, ajd: 0.75, igic: 5 },
    "cantabria":          { n: "Cantabria", itp: 7, joven: 4, ajd: 1.5, prog: true },
    "castilla-leon":      { n: "Castilla y León", itp: 8, joven: 4, ajd: 1.5, prog: true },
    "castilla-la-mancha": { n: "Castilla-La Mancha", itp: 9, joven: 3, ajd: 1.5 },
    "cataluna":           { n: "Cataluña", itp: 10, joven: 5, ajd: 1.5, tramos: [[600000, 10], [900000, 11], [1500000, 12], [Infinity, 13]] },
    "valencia":           { n: "Comunitat Valenciana", itp: 9, joven: 6, jovenTramosTotal: [[180000, 6], [Infinity, 8]], ajd: 1.4, tramos: [[1000000, 9], [Infinity, 11]] },
    "extremadura":        { n: "Extremadura", itp: 8, joven: 4, ajd: 1.5, prog: true },
    "galicia":            { n: "Galicia", itp: 8, joven: 3, ajd: 1.5 },
    "la-rioja":           { n: "La Rioja", itp: 7, joven: 4, ajd: 1, },
    "madrid":             { n: "Comunidad de Madrid", itp: 6, joven: 5.4, ajd: 0.75 },
    "murcia":             { n: "Región de Murcia", itp: 7.75, joven: 3, ajd: 1.5 },
    "navarra":            { n: "Navarra", itp: 6, joven: null, ajd: 0.5 },
    "pais-vasco":         { n: "País Vasco", itp: 4, joven: null, ajd: 0.5, nota: "4 % para vivienda que cumple requisitos; 7 % en el resto" }
  }
};
