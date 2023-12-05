d3.csv('treedata.csv').then(function(data) {
    const topStreets = [
      "Storrow Park", "Salem Street Corridor", "Lawrence St.",
      "Hampshire St", "O'Connell / So Common", "Daisy St",
      "Marion Ave", "Brook Street", "Chestnut Street",
      "Loring Ave Sidewalk Project", "Cronin Park", "Portland Street",
      "Market St", "65 Lawrence St", "Immigrant Park",
      "Reservoir St", "O'Neill Park Rain garden", "Plainsman Park",
      "217 Marion Ave", "151 Bailey St","Daisy Street", "Newbury Street",
      "White Street", "Bailey Street", "Spicket River Greenway"
    ];
    let transformedData = data.filter(d => 
      topStreets.includes(d.nearest_st) && 
      !isNaN(+d.Diameter_a) && 
      d.Diameter_a >= 0 && 
      d.Diameter_a <= 5
    );

    let aggregatedData = d3.rollups(transformedData, 
      v => v.length, 
      d => d.nearest_st, 
      d => +d.Diameter_a
    ).map(([street, diameters]) => 
      diameters.map(([diameter, count]) => ({street, diameter, count}))
    ).flat();

    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": {
          "text": "Tree Diameter Distribution Across Top 10 Most Populated Streets",
          "font": "Times New Roman",
          "fontSize": 24,
          "color": "gray",
          "anchor": "start"
        },
        "description": "A heatmap showing the count of tree diameters on the top streets.",
        "width": 600, 
        "height": 250, 
        "data": { "values": aggregatedData },
        "mark": "rect",
        "encoding": {
          "y": {"field": "diameter", "type": "ordinal", "axis": {"title": "Diameter (ft)", "labelFont": "Times New Roman"}},
          "x": {"field": "street", "type": "nominal", "axis": {"title": "Street Name", "labelFont": "Times New Roman"}},
          "color": {
            "field": "count",
            "type": "quantitative",
            "scale": {"scheme": "lighttealblue"},
            "legend": {"title": "Number of Trees"}
          }
        },
        "config": {
          "axis": {
            "titleFont": "Times New Roman",
            "labelFont": "Times New Roman",
            "titleFontSize": 16,
            "labelFontSize": 12
          },
          "legend": {
            "titleFont": "Times New Roman",
            "labelFont": "Times New Roman",
            "titleFontSize": 14,
            "labelFontSize": 12
          }
        }
      }
      vegaEmbed('#vis', spec).catch(console.error);
  });