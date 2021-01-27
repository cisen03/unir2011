// Clon de Gapminder
//
//

graf = d3.select('#graf')
ancho_total = graf.style('width').slice(0, -2)
alto_total  = ancho_total * 0.5625
margins = {
  top: 30,
  left: 50,
  right: 15,
  bottom: 120
}
ancho = ancho_total - margins.left - margins.right
alto  = alto_total - margins.top - margins.bottom

// Area total de visualización
svg = graf.append('svg')
          .style('width', `${ ancho_total }px`)
          .style('height', `${ alto_total }px`)

// Contenedor "interno" donde van a estar los gráficos
g = svg.append('g')
        .attr('transform', `translate(${ margins.left }, ${ margins.top })`)
        .attr('width', ancho + 'px')
        .attr('height', alto + 'px')

fontsize = alto * 0.65
yearDisplay = g.append('text')
                .attr('x', ancho / 2)
                .attr('y', alto / 2 + fontsize/2)
                .attr('text-anchor', 'middle')
                .attr('font-family', 'Roboto')
                .attr('font-size', `${fontsize}px`)
                .attr('fill', '#cccccc')
                .text('1800')

g.append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('width', ancho)
  .attr('height', alto)
  .attr('stroke', 'black')
  .attr('fill', 'none')

// Escaladores
x = d3.scaleLog().range([0, ancho])
y = d3.scaleLinear().range([alto, 0])
r = d3.scaleLinear().range([10, 100])

color = d3.scaleOrdinal().range(d3.schemeAccent)

// Variables Globales
datos = []
years = []
iyear = 0
maxy  = 0
miny  = 50000
continente = 'todos'
corriendo  = true

var interval

contSelect = d3.select('#continente')
botonPausa = d3.select('#pausa')

d3.csv('gapminder.csv').then((data) => {
  data.forEach((d) => {
    d.income     = +d.income
    d.life_exp   = +d.life_exp
    d.population = +d.population
    d.year       = +d.year

    // if (d.year > maxy) maxy = d.year
    // if (d.year < miny) miny = d.year
  })

  console.log(`miny=${miny} maxy=${maxy}`)

  years = Array.from(new Set(d3.map(data, d => d.year)))

  data = data.filter((d) => {
    return (d.income > 0) && (d.life_exp > 0)
  })
  // data = data.filter((d) => (d.income > 0) && (d.life_exp > 0))

  datos = data

  // El dominio para el escalador ordinal
  color.domain(d3.map(data, d => d.continent))

  x.domain([d3.min(data, d => d.income),
            d3.max(data, d => d.income)])
  y.domain([d3.min(data, d => d.life_exp),
            d3.max(data, d => d.life_exp)])
  r.domain([d3.min(data, d => d.population),
            d3.max(data, d => d.population)])

  // Ejes
  xAxis = d3.axisBottom(x)
            .ticks(10)
            .tickFormat(d => d3.format(',d')(d))
  xAxisG = d3.axisBottom(x)
            .ticks(10)
            .tickFormat('')
            .tickSize(-alto)

  yAxis = d3.axisLeft(y)
            .ticks(10)
  yAxisG = d3.axisLeft(y)
            .ticks(10)
            .tickFormat('')
            .tickSize(-ancho)

  g.append('g')
    .call(xAxis)
    .attr('transform', `translate(0,${alto})`)
  g.append('g')
    .call(yAxis)

  g.append('g')
    .attr('class', 'ejes')
    .call(xAxisG)
    .attr('transform', `translate(0,${alto})`)
  g.append('g')
    .attr('class', 'ejes')
    .call(yAxisG)

  contSelect.append('option')
              .attr('value', 'todos')
              .text('Todos')
  color.domain().forEach(d => {
    contSelect.append('option')
                .attr('value', d)
                .text(d)
  })

  frame()
  interval = d3.interval(() => delta(1), 300)
})

function frame() {
  year = years[iyear]
  data = d3.filter(datos, d => d.year == year)
  data = d3.filter(data, d => {
    if (continente == 'todos')
      return true
    else
      return d.continent == continente
  })

  render(data)
}

function render(data) {
  yearDisplay.text(years[iyear])

  p = g.selectAll('circle')
        .data(data, d => d.country)

  p.enter()
    .append('circle')
      .attr('r', 0)
      .attr('cx', d => x(d.income))
      .attr('cy', d => y(d.life_exp))
      .attr('fill', '#005500')
    .merge(p)
      .transition().duration(300)
      .attr('cx', d => x(d.income))
      .attr('cy', d => y(d.life_exp))
      .attr('r', d => r(d.population))
      .attr('fill', d => color(d.continent))

  p.exit()
    .transition().duration(300)
    .attr('r', 0)
    .attr('fill', '#ff0000')
    .remove()
}

// function atras() {
//   iyear--
//   if (iyear < 0) iyear = 0
//   frame()
// }

// function adelante() {
//   iyear++
//   if (iyear == years.lenght) iyear = years.lenght
//   frame()
// }

// Refactoring de las funciones de arriba
// DRY Don't Repeat Yourself

function delta(d) {
  iyear += d
  if (iyear < 0) iyear = 0
  if (iyear > years.length-1) iyear = years.length-1
  frame()
}

contSelect.on('change', () => {
  continente = contSelect.node().value
  frame()
})

botonPausa.on('click', () => {
  corriendo = !corriendo
  if (corriendo) {
    botonPausa
      .classed('btn-danger', true)
      .classed('btn-success', false)
      .html('<i class="fas fa-pause-circle"></i>')
      interval = d3.interval(() => delta(1), 300)
  } else {
    botonPausa
      .classed('btn-danger', false)
      .classed('btn-success', true)
      .html('<i class="fas fa-play-circle"></i>')
    interval.stop()
  }
})
