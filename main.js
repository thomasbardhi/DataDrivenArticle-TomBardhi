let fullData = [];

document.addEventListener("DOMContentLoaded", function () {
  d3.csv("treedata.csv").then(function (data) {
    fullData = data;
    createDiameterChart(data);
    createScatterPlot(data);
    createStreetwiseChart(fullData, 10);
    var slider = document.getElementById("streetRange");
    var rangeValueDisplay = document.getElementById("rangeValue");

    slider.addEventListener("input", function () {
      createStreetwiseChart(fullData, +this.value);
      rangeValueDisplay.textContent = this.value;
    });
  });
});


function highlightBar(diameter, svg) {
  svg.selectAll('.bar')
    .filter(function(d) { return d.diameter == diameter; })
    .classed('highlighted', true); 
}

function unhighlightBars(svg) {
  svg.selectAll('.bar').classed('highlighted', false);
}

function createDiameterChart(data) {
  var diameters = data
    .map(function (d) {
      return +d.Diameter_a;
    })
    .filter(function (diameter) {
      return !isNaN(diameter) && diameter !== undefined;
    });

  var diameterCounts = {};
  diameters.forEach(function (diameter) {
    diameterCounts[diameter] = (diameterCounts[diameter] || 0) + 1;
  });

  var diameterEntries = Object.entries(diameterCounts).map(function (entry) {
    return {
      diameter: +entry[0],
      count: entry[1],
    };
  });

  diameterEntries.sort(function (a, b) {
    return d3.ascending(a.diameter, b.diameter);
  });

  var tooltip = d3.select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  }

  var margin = { top: 50, right: 30, bottom: 40, left: 50 },
    width = 500 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  var svg = d3
    .select("#bar")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3
    .scaleBand()
    .range([0, width])
    .domain(
      diameterEntries.map(function (d) {
        return d.diameter;
      })
    )
    .padding(0.1);

  var y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(diameterEntries, function (d) {
        return d.count;
      }),
    ])
    .range([height, 0]);

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

  const color = d3
    .scaleSequential(function (t) {
      if (t < 0.33) {
        return d3.interpolateGreens(t / 0.33);
      } else if (t < 0.67) {
        return d3.interpolateRgb(
          d3.interpolateGreens(1),
          "lightgreen"
        )((t - 0.33) / 0.34);
      } else {
        return d3.interpolateRgb(
          "lightgreen",
          d3.interpolateBlues(1)
        )((t - 0.67) / 0.33);
      }
    })
    .domain([0, diameterEntries.length]);

  svg
    .selectAll(".bar")
    .data(diameterEntries)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", function (d) {
      return x(d.diameter);
    })
    .attr("width", x.bandwidth())
    .attr("y", function (d) {
      return y(d.count);
    })
    .attr("height", function (d) {
      return height - y(d.count);
    })
    .attr("fill", function (d, i) {
      return color(i);
    })
    .attr("stroke", "black")
    .attr("stroke-width", "1px")
    .on("mouseover", function (event, d) {
      tooltip
        .html("Count: " + d.count)
        .style("opacity", 0.9)
        .style("left", event.pageX + 2.5 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function (d) {
      tooltip.style("opacity", 0);
    });

    d3.selectAll('.diameter-text')
  .on('mouseover', function(event, d) {
    var diameter = d3.select(this).attr('data-diameter');
    highlightBar(diameter,svg);
  })
  .on('mouseout', function() {
    unhighlightBars(svg);
  });

}

function createStreetwiseChart(data, topN) {
  d3.select("#streetwise-bar svg").remove();

  let filteredData = data.filter(
    (d) => d.nearest_st && d.nearest_st.trim() !== ""
  );

  let hasStreetNames = filteredData.length > 0;
  console.log("Has street names:", hasStreetNames);
  y;
  if (!hasStreetNames) {
    console.error("No valid street names found in the data.");
    return;
  }

  let streetCounts = d3.rollup(
    filteredData,
    (v) => v.length,
    (d) => d.nearest_st.trim()
  );

  let streetEntries = Array.from(streetCounts, ([key, value]) => ({
    street: key,
    count: value,
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  var margin = { top: 20, right: 30, bottom: 40, left: 150 },
    width = 750 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var svg = d3
    .select("#streetwise-bar")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



  const colorScale = d3
    .scaleSequential(function (t) {
      return d3.interpolateRgb(
        d3.interpolateGreens(0),
        d3.interpolateBlues(1)
      )(t);
    })
    .domain([0, d3.max(streetEntries, (d) => d.count)]);

  var x = d3
    .scaleLinear()
    .domain([0, d3.max(streetEntries, (d) => d.count)])
    .range([0, width]);

  var y = d3
    .scaleBand()
    .domain(streetEntries.map((d) => d.street))
    .range([0, height])
    .padding(0.1);

  svg
    .selectAll(".bar")
    .data(streetEntries)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("width", (d) => x(d.count))
    .attr("y", (d) => y(d.street))
    .attr("height", y.bandwidth())
    .attr("fill", (d) => colorScale(d.count))
    .attr("stroke", "black")
    .attr("stroke-width", "1px");

  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g").call(d3.axisLeft(y));

  var tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  svg
    .selectAll(".bar")
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html("Street: " + d.street + "<br/>Count: " + d.count)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function (d) {
      tooltip.transition().duration(500).style("opacity", 0);
    });
  svg.exit().remove();
}

function createScatterPlot(data) {
  var validData = data.filter(function (d) {
    return !isNaN(d.Latitude) && !isNaN(d.Longitude) && !isNaN(d.Diameter_a);
  });

  var margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  var svg = d3
    .select("#scatter-plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xScale = d3
    .scaleLinear()
    .domain(
      d3.extent(validData, function (d) {
        return d.Longitude;
      })
    )
    .range([0, width]);

  var yScale = d3
    .scaleLinear()
    .domain(
      d3.extent(validData, function (d) {
        return d.Latitude;
      })
    )
    .range([height, 0]);

  var colorScale = d3.scaleDiverging(d3.interpolateRdBu).domain([1, 2.5, 4]);
  var xAxis = d3.axisBottom(xScale).tickSize(-height);
  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick:not(:first-of-type) line")
        .attr("stroke-opacity", 0.7)
        .attr("stroke-dasharray", "2,2")
    );

  var yAxis = d3.axisLeft(yScale).tickSize(-width);
  svg
    .append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick:not(:first-of-type) line")
        .attr("stroke-opacity", 0.7)
        .attr("stroke-dasharray", "2,2")
    );

    svg.append("text")
    .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom - 5) + ")")
    .style("text-anchor", "middle")
    .text("Longitude");

 svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Latitude");

  svg
    .selectAll("circle")
    .data(validData)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("cx", function (d) {
      return xScale(d.Longitude);
    })
    .attr("cy", function (d) {
      return yScale(d.Latitude);
    })
    .style("fill", function (d) {
      return colorScale(d.Diameter_a);
    });

    var legendValues = [2, 2.5, 3, 3.5, 4];
var legendSquareSize = 20;
var legendSpacing = 5;

var legend = svg
  .append("g")
  .attr("class", "legend")
  .attr("transform", "translate(" + (width - 100) + "," + 20 + ")");

legend.selectAll("rect")
  .data(legendValues)
  .enter()
  .append("rect")
  .attr("x", 0)
  .attr("y", function(d, i) { return i * (legendSquareSize + legendSpacing); })
  .attr("width", legendSquareSize)
  .attr("height", legendSquareSize)
  .style("fill", function(d) { return colorScale(d); });

legend.selectAll("text")
  .data(legendValues)
  .enter()
  .append("text")
  .attr("x", legendSquareSize + legendSpacing)
  .attr("y", function(d, i) { return i * (legendSquareSize + legendSpacing) + legendSquareSize / 2; })
  .attr("dy", ".35em")
  .text(function(d) { return d.toFixed(1) + " ft"; });

  const annotations = [
    { x: xScale(-71.1525), y: yScale(42.7), text: "Healthy area with good canopy coverage. Avg. diameter: ~3ft", textOffset: [0, -10] },
    { x: xScale(-71.170), y: yScale(42.7125), text: "Another healthy area", textOffset: [0, 10] },
    { x: xScale(-71.1475), y: yScale(42.7075), text: "Smaller canopy coverage, may indicate poor health. Avg. diameter: ~2ft", textOffset: [20, 20] }
  ];
  
 
  const getTextLength = (text, fontSize = '1em') => {
   
    const tempSvg = svg.append('text').text(text).style('font-size', fontSize).style('opacity', 0);
    const length = tempSvg.node().getComputedTextLength();
    tempSvg.remove();
    return length;
  };
  

  annotations.forEach(function(d) {
    svg.append("circle")
      .attr("cx", d.x)
      .attr("cy", d.y)
      .attr("r", 50)
      .style("fill", "none")
      .style("stroke", "red");
  });
  

  annotations.forEach(function(d) {
    svg.append("line")
      .attr("x1", d.x)
      .attr("y1", d.y)
      .attr("x2", d.x + d.textOffset[0]) 
      .attr("y2", d.y + d.textOffset[1]) 
      .style("stroke", "black")
      .style("stroke-dasharray", ("3, 3"));
  });
  
  annotations.forEach(function(d) {
    const textLength = getTextLength(d.text);
    const textHeight = 20;
 
    svg.append("rect")
      .attr("x", d.x + d.textOffset[0] - 5) 
      .attr("y", d.y + d.textOffset[1] - textHeight / 2)
      .attr("width", textLength + 10) 
      .attr("height", textHeight)
      .style("fill", "white")
      .style("opacity", 0.7);
  
  
    svg.append("text")
      .attr("x", d.x + d.textOffset[0])
      .attr("y", d.y + d.textOffset[1])
      .attr("alignment-baseline", "middle")
      .text(d.text);
  });
}  
