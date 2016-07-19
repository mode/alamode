// alamode.js
// 
// Visualizations for Mode reports

var alamode = {
  
  getColumnsFromQuery: function(queryName) {
    return datasets.filter(function(d) { return d.queryName == queryName; })[0].columns;
  },
  
  getDataFromQuery: function(queryName) {
    return datasets.filter(function(d) { return d.queryName == queryName; })[0].content;
  },
  
  makeId: function(chars) {
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        text = "";
    
    for (var i=0; i < chars; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },
  
  addContainerElement: function(el) {
    
    id = alamode.makeId(10);
    
    if (el == "body") {
      $("<div id='" + id + "'></div>").addClass(id).addClass("mode-graphic-container").appendTo(".mode-content");
    } else {
      $(el).addClass("mode-graphic-container");
      $(el).addClass(id)
    }
    
    return "." + id;
  },

  addLinksToTables: function(o) {
    var tableId = "#" + o["table_id"],
        linkColumns = o["link_columns"],
        linkURLs = o["link_urls"],
        queryName = o["query_name"];

    var linkFormat = [];

    linkColumns.forEach(function(l,i) {
      linkFormat.push( { column: l, link_string: linkURLs[i] });
    })

    var data = alamode.getDataFromQuery(queryName),
        columns = alamode.getColumnsFromQuery(queryName);

    var colIndex = {};

    columns.forEach(function(c,i) {
      colIndex[c.name] = i;

      if (c.name.slice(-6) == "__link") {
        linkFormat.push( { column: c.name, link_string: "{{" + c.name + "}}" } );
      }
    })

    setTimeout(function(){
      drawLinks(linkFormat)
    },1000)

    $(tableId).mousemove(function() {
      drawLinks(linkFormat)
    })

    function drawLinks(linkFormat) {

      var tableDiv = $(tableId + " table"),
          rows = tableDiv.find("tr");

      rows.each(function() {
        var cells = $(this).find("td");

        linkFormat.forEach(function(l) {
          var columnToShow = colIndex[l.column],
              cellContent = cells.eq(columnToShow).text();
              url = l.link_string;

          while (url.indexOf("{{") != - 1) {
            var chars = url.length,
                start = url.indexOf("{{"),
                end = url.substring(start+2,chars).indexOf("}}"),
                cName = url.substring(start+2,start+end+2),
                full = url.substring(start,start+end+4),
                col = colIndex[cName],
                content = cells.eq(col).text();

            url = url.replace(full,content);
          }

          cells.eq(columnToShow).html("<a target='_blank' href='" + encodeURI(url) + "'>" + cellContent + "</a>")
        })
      })
    }
  },
  
  customChartColors: function(o) {
    var charts = o["charts"],
        colors = o["colors"];
    
    if (charts == "all") {
      charts = [];
      
      $("mode-chart").each(function(){ charts.push(this.id); });      
    }
    
    function drawColors(id,colorList) {
      var chart = $("#" + id),
          series = chart.find(".nvtooltip table .legend-color-guide"),
          isArea = chart.find(".nv-areaWrap"),
          isBar = chart.find(".nv-barsWrap"),
          legend = chart.find(".nv-series .nv-legend-symbol"),
          seriesLength = series.length - 1,
          isAreaLength = isArea.length,
          isBarLength = isBar.length;
      
      var colors = {};
      
      var m = {};
      var r = {};
      var counter = 0;
      
      if (legend.length == 0) {
      
        m[0] = counter;
        r[counter] = 0;
        colors[0] = colorList[0];
      
      } else {
        
        for (i = 0; i < legend.length; i++) { 
          colors[i] = colorList[i % Object.keys(colorList).length];
        }
      }
    
      legend.each(function(i) {
        if ($(this).css("fill-opacity") == 1) {
          m[i] = counter;
          r[counter] = i;
          counter += 1;
        } else {
        m[i] = -1;
        }
      })
  
      for (var i in colors) {
        chart.find(".nv-linesWrap .nv-groups .nv-series-" + m[i]).css({"fill":colors[i],"stroke":colors[i]});
        chart.find(".nv-barsWrap .nv-groups .nv-series-" + m[i] + " rect").css({"fill":colors[i],"stroke":colors[i]});
        chart.find(".nv-scatterWrap .nv-groups .nv-series-" + m[i]).css({"fill":colors[i],"stroke":colors[i]}); 
        chart.find(".nv-areaWrap .nv-area-" + m[i]).css({"fill":colors[i],"stroke":colors[i]}); 
        chart.find(".nv-pie .nv-slice").each(function(i) { $(this).css({"fill":colors[i],"stroke":colors[i]}); });
      }
    
      chart.find(".chart-svg").mousemove(function() {
        chart.find(".nvtooltip table .legend-color-guide").each(function(i) {
          if ( isAreaLength > 0 || isBarLength > 0) {
            $(this).find("div").css({"background-color":colors[r[seriesLength - i - 1]]})
          } else {
            $(this).find("div").css({"background-color":colors[r[i]]})
          }
        })
      
        sliceColor = chart.find(".nv-pie .nv-slice.hover").css("fill");
        chart.find(".nvtooltip table .legend-color-guide div").css("background-color",sliceColor)
      })
    
      chart.find(".nv-legendWrap .nv-series .nv-legend-symbol").each(function(i) { 
        $(this).css({"fill":colors[i],"stroke":colors[i]});
      })
    }
    
    setInterval(function () {
      charts.forEach(function(c) {
        drawColors(c,colors)    
      })
    }, 500)
  },
  
  addTotalsRow: function(o) {

    var queryName = o["query_name"],
        resultColumns = alamode.getColumnsFromQuery(queryName),
        data = alamode.getDataFromQuery(queryName),
        selectedColumns = o["columns_with_totals"];

    var fmt = d3.format(",");
  
    var columnsWithSums = getColumns(selectedColumns),
        totals = makeSums(columnsWithSums);
        

  
    function getColumns(selectedColumns) {
      
      numberColumns = _.map(_.filter(resultColumns,function(c) {
        return ["number","integer"].indexOf(c.type) != -1;
      }),"name")
    
      if (selectedColumns == "all") {
        return numberColumns;
      } else {
        return _.intersection(selectedColumns, numberColumns);
      }
    }
    
    function makeSums(columnsWithSums) {
      var sumObject = [],
          emptyObj = {idx: i, name: "", total: ""};
      
      resultColumns.forEach(function(c,i) {
        if (columnsWithSums.indexOf(c.name) == -1) {
          var obj = emptyObj;
          
        } else {
          var values = _.map(data, c.name),
              total = d3.sum(values);
              
          var obj = {idx: i, name: c.name, total: total}  
        }
      
        sumObject.push(obj)
      })
    
      return sumObject;
    }
  
    function makeRow(totals) {
      var rowString = "<tr><td>TTL</td>";
    
      totals.forEach(function(t) {
        if (t.total != "") {
          rowString = rowString + "<td class='cell-type-number'>" + fmt(t.total) + "</td>"  
        } else {
          rowString = rowString + "<td></td>"  
        }
      })
    
      return rowString + "</tr>"
    }
    
    setTimeout(function(){ 
    
      var table = $(".main-table"),
          lastRow = table.find("tr:last")
        
      var totalRow = makeRow(totals)
        
      lastRow.after(totalRow)
    },1000);
  },
  
  addImagesToTables: function(o) {
    var tableId = o["table"],
        imageColumn = o["column"],
        imgHeight = o["image_height"] || 100;
  
    setTimeout(function(){ 
    
      var table = $("#" + tableId), 
          headers = table.find("th"),
          rows = table.find("tr"),
          columnIndex = 0;
      
      headers.each(function() { 
        if ($(this).text() == imageColumn) {
          columnIndex = $(this).attr("data-axel-column")
        }
      })
      
      rows.each(function() { 
        var cells = $(this).find("td");
        
        cells.each(function(i) {
          if (i == columnIndex) {
            var content = $(this).text();
            
            $(this).css("text-align","center")
            $(this).html("<img style='height: " + imgHeight + "px;' src='" + content + "'>") 
          }
        })
      }) 
      
    },1000); 
  },
  
  resizeChartHeight: function(o) {
    var chart = o["chart"],
        height = o["height"];
    
    if (chart.slice(0,6) == "python") {
      $("#" + chart + " .chart-content").css("height",height)
      $("#" + chart + " .mode-python").css("height",height)
      $("#" + chart + " .mode-python").css("max-height",height)
      $("#" + chart + " img").css("max-height",height)
    } else {
      $("#" + chart + " .chart").css("height",height)
      $("#" + chart + " .chart-svg").css("height",height)
    }
    
    window.dispatchEvent(new Event('resize'));
  },
  
  retentionHeatmap: function(o) {

    var queryName = o["query_name"],
        cohortColumn = o["cohort_column"],
        pivotColumn = o["pivot_column"],
        valueColumn = o["value_column"],
        // Optional
        totalColumn = o["total_column"],
        htmlElement = o["html_element"] || "body",
        title = o["title"] || queryName,
        pivotLabel = o["pivot_label"] || "",
        isPercent = o["value_is_percent"];
    
    var data = alamode.getDataFromQuery(queryName),
        columns = alamode.getColumnsFromQuery(queryName),
        cohorts = _.uniq( _.map(data, cohortColumn) ),
        pivots = _.uniq( _.map(data, pivotColumn) );
    
    var uniqContainerClass = alamode.addContainerElement(htmlElement);
      
    var color = d3.scale.quantize()
      .domain(d3.extent(data, function(d) { return d[valueColumn]; }))
      .range(["#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850"])
  
    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-graphic-title")
      .text(title)
      
    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-retention-heatmap-label")
      .text(pivotLabel)
    
    if (totalColumn) {
      headers = [cohortColumn, totalColumn].concat(pivots)  
    } else {
      headers = [cohortColumn].concat(pivots)
    }
  
    var table = d3.select(uniqContainerClass).append("table")
        .attr("class","mode-retention-heatmap-table");
    
    table.selectAll(".mode-retention-heatmap-table-header")
        .data([0])
      .enter().append("tr")
        .attr("class","mode-retention-heatmap-table-header")
      .selectAll("mode-retention-heatmap-table-header-cell")
        .data(headers)
      .enter().append("td")
        .attr("class",function(d) { 
          if (isNaN(d)) { return "mode-retention-heatmap-table-header-cell heatmap-string"; }
          else { return "mode-retention-heatmap-table-header-cell heatmap-number"; }
        })
      .text(function(d) { return d; })
  
    table.selectAll(".mode-retention-heatmap-table-row")
        .data(cohorts)
      .enter().append("tr")
        .attr("class","mode-retention-heatmap-table-row")
      .selectAll(".mode-retention-heatmap-table-cell")
        .data(function(d) { return makeRow(data,d); })
      .enter().append("td")
        .style("background",function(d) { if (checkShade(d)) { return color(d.value); } })
        .attr("class",function(d) { return cellClass(d); })
        .text(function(d) { return fmt(d,o); })
    
    function checkShade(entry) {
      if (entry.value == "") {
        return false;
      } else if (entry.column == pivotColumn || entry.column == totalColumn) {
        return false;
      } else if (entry.column == valueColumn) {
        return true;
      } else {
        return false;
      }
    }
  
    function cellClass(entry) {
      var type = getDataType(entry.column);
    
      if (type == "float" || type == "integer") {
        return "heatmap-number";
      } else {
        return "heatmap-string";
      }
    }
  
    function getDataType(column) {
      return columns.filter(function(d) { return d.name == column })[0].type;
    }
  
    function makeRow(data,cohort) {
      var row = [ {column: cohortColumn, value: cohort } ];
    
      if (totalColumn) { 
        var total = _.filter(data, function(d) { return d[cohortColumn] == cohort; })[0],
            totalObject = { column: totalColumn, value: total[totalColumn] };
        row = row.concat(totalObject); 
      }
    
      pivots.forEach(function(p) {
      
        var matches = _.filter(data, function(d) { 
          return d[cohortColumn] == cohort && d[pivotColumn] == p 
        }); 
      
        if (matches.length > 0) {
          entry = d3.mean( _.map(matches,valueColumn) );
        } else {
          entry = "";
        }
        row = row.concat( {column: valueColumn, value: entry} )
      })
      return row;
    }
    
    function fmt(entry) {
    
      var type = getDataType(entry.column);
      
      var c = d3.format(","),
          p = d3.format(".2p"),
          t = d3.time.format("%b %d, %Y");
    
      if (entry.value == "") { 
        return entry.value;
      } else if (type == "datetime" || type == "timestamp" || type == "date") {
        return t(new Date(entry.value))
      } else if (entry.column == totalColumn) {
        return c(entry.value);
      } else if (entry.column == valueColumn && isPercent) {
        return p(entry.value);
      } else if (entry.column == valueColumn && isPercent) {
        return c(entry.value);
      } else {
        return entry.value;
      } 
    }
  },
  
  // Built with Google Maps Javascript API
  // https://developers.google.com/maps/documentation/javascript/
  googleMap: function(o) {
    var id = alamode.makeId(10);
    
    var latColumn = o["lat_column"],
        lngColumn = o["lng_column"],
        queryName = o["query_name"],
        apiKey = o["google_maps_api_key"],
        // Optional
        title = o["title"] || queryName,
        labelColumn = o["label_column"],
        htmlElement= o["html_element"] || "body",
        centerLat = o["center_lat"] || 39.5,
        centerLng = o["center_lng"] || -98.35,
        zoom = o["starting_zoom"] || 4,
        mapType = o["map_type"] || "terrain";
    
    var data = alamode.getDataFromQuery(queryName);
    
    var uniqContainerClass = alamode.addContainerElement(htmlElement);
      
    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-graphic-title")
      .text(title)
    
    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-google-map")
      .attr("id",id)
        
    jQuery.getScript("https://maps.googleapis.com/maps/api/js?key=" + apiKey, function() {
  
      initMap()
  
      function initMap() {
      
        var myOptions = {
          zoom: zoom,
          center: new google.maps.LatLng(centerLat, centerLng),
          mapTypeId: mapType
        };
        
        var map = new google.maps.Map(document.getElementById(id), myOptions );
    
        data.forEach(function(d) {
          
          var lat = d[latColumn],
              lng = d[lngColumn];
      
          if (labelColumn) {
            label = d[labelColumn];
          } else {
            label = "";
          }
          
          var marker = new google.maps.Marker({
            position: {lat:lat, lng:lng},
            map: map,
            title: label
          })
          
          var infowindow = new google.maps.InfoWindow({
            content: label
          });
          
          marker.addListener('click', function() {
            infowindow.open(map, marker);
          });
      
        });
    
      }
    })
  },
  
  // Built with Leaflet
  // http://leaflet.github.io/Leaflet.heat/demo/
  leafletMap: function(o) {
    var id = alamode.makeId(10);
    
    var latColumn = o["lat_column"],
        lngColumn = o["lng_column"],
        queryName = o["query_name"],
        // Optional
        title = o["title"] || queryName,
        htmlElement= o["html_element"] || "body",
        centerLat = o["center_lat"] || 39.5,
        centerLng = o["center_lng"] || -98.35,
        zoom = o["starting_zoom"] || 4,
        dotRadius = o["dot_size"] || .4,
        dotOpacity = o["dot_opacity"] || .8;
    
    var data = alamode.getDataFromQuery(queryName);
    
    var uniqContainerClass = alamode.addContainerElement(htmlElement);
      
    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-graphic-title")
      .text(title)
    
    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-leaflet-map")
      .attr("id",id)

    var baseLayer = L.tileLayer(
      'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    });

    var d = {
      max: 8,
      data: data
    };

    var cfg = {
      "radius": dotRadius,
      "maxOpacity": dotOpacity,
      "scaleRadius": true, 
      "useLocalExtrema": true,
      "latField": latColumn,
      "lngField": lngColumn
    };

    var C = {
      "lat": centerLat,
      "lng": centerLng,
      "zoom": zoom
    };

    var heatmapLayer = new HeatmapOverlay(cfg);
    
    var map = new L.Map(id, {
      center: new L.LatLng(C.lat, C.lng),
      zoom: Math.floor(C.zoom),
      layers: [baseLayer, heatmapLayer]
    });

    heatmapLayer.setData(d);
  },
  
  // Built with Jason Davies' d3-cloud
  // https://www.jasondavies.com/wordcloud/
  wordCloud: function(o) {
    var queryName = o["query_name"],
        words = o["word_column"],
        wordCount = o["word_count_column"],
        // Optional
        htmlElement = o["html_element"] || "body",
        title = o["title"] || queryName,
        height = o["height"] || "400",
        width = o["width"] || "800",
        colors = o["colors"] || ["black"];
    
    var data = alamode.getDataFromQuery(queryName);
    
    var uniqContainerClass = alamode.addContainerElement(htmlElement);
      
    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-graphic-title")
      .text(title)
  
    var textScale = d3.scale.linear()
        .domain(d3.extent(data,function(d) { return d[wordCount]; } ))
        .range([12,60]);
  
    var layout = d3.layout.cloud()
        .size([width, height])
        .words(data.map(function(d) {
          return {text: d[words], size: textScale(d[wordCount]) };
        }))
        .padding(2)
        .rotate(function() { return (~~(Math.random() * 6) - 3) * 360; })
        .font("Impact")
        .fontSize(function(d) { return d.size; })
        .on("end", draw);
  
    layout.start();
    
    function draw(words) {
      d3.select(uniqContainerClass).append("div")
          .attr("class","mode-wordcloud")
        .append("svg")
          .attr("width", layout.size()[0])
          .attr("height", layout.size()[1])
        .append("g")
          .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
        .selectAll("text")
          .data(words)
        .enter().append("text")
          .style("font-size", function(d) { return d.size + "px"; })
          .style("font-family", "Impact")
          .style("fill", function(d, i) { return colors[i % colors.length]; })
          .attr("text-anchor", "middle")
          .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
          })
          .text(function(d) { return d.text; });
    }
  },
  
  // Built with Jake Zatecky's d3-funnel
  // http://jakezatecky.github.io/d3-funnel/
  funnel: function(o) {
    var id = alamode.makeId(10)
    
    var queryName = o["query_name"],
        stageColumn = o["stage_column"],
        valueColumn = o["value_column"],
        // Optional
        htmlElement = o["html_element"] || "body",
        title = o["title"] || queryName,
        height = o["height"] || "300",
        width = o["width"] || "500";
    
    var data = alamode.getDataFromQuery(queryName);
    
    var uniqContainerClass = alamode.addContainerElement(htmlElement);
      
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)
      
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-funnel")
        .attr("id",id)
        .style("width",width + "px")
        .style("height",(height - 20) + "px");
  
    var funnelData = [];

    data.forEach(function(d) {
      funnelData.push( [ d[stageColumn], d[valueColumn] ])
    })
    
    var options = {
      label: { format: '{l}: {f}', },
      block: { dynamicHeight: true },
      chart: { bottomPinch: 1 },
      animation: 100
    };  
    
    var chart = new D3Funnel("#" + id);
    
    chart.draw(funnelData, options);
    
    d3.select("#" + id).style("height",height + "px");
  },
  
  // Buitl with NVD3 multibar horizontal bar chart
  // http://nvd3-community.github.io/nvd3/ 
  horizontalBarChart: function(o) {
    
    var queryName = o["query_name"],
        barColumn = o["bar_column"],
        seriesColumns = o["series_columns"],
        // Optional
        colors = o["colors"] || ['#EE8D24', '#43A5DA', '#6AB328', '#BB60F8', '#E14459', '#EAD022', '#06D0AD', '#DB38B7'];
        stacked = o["stacked"] || false,
        leftpad = o["left_pad"] || 175,
        htmlElement = o["html_element"] || "body",
        title = o["title"] || queryName,
        height = o["chart_height"] || 395,
        width = o["width"] || "500";
    
    var data = alamode.getDataFromQuery(queryName);
    
    var uniqContainerClass = alamode.addContainerElement(htmlElement);
      
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)
      
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-horizontal-bar-chart")
        .style("height",(height - 50) + "px")
      .append("svg");
    
    var nvData = [];
    
    seriesColumns.forEach(function(s,i) {
      var seriesObj = {
        "key":s,
        "color": colors[ i % colors.length ]
      }
    
    var seriesData = [];
    
    data.forEach(function(d) {
      seriesData.push(  { "label": d[o["bar_column"]], "value": d[s] } )
    })
    
    seriesObj["values"] = seriesData;
      nvData.push(seriesObj);
    })
  
    nv.addGraph(function() {
      var chart = nv.models.multiBarHorizontalChart()
          .x(function(d) { return d.label })
          .y(function(d) { return d.value })
          .margin({top: 30, right: 20, bottom: 50, left: leftpad})
          .showValues(true) 
          .showControls(false)
          .stacked(stacked);

      chart.yAxis
          .tickFormat(d3.format(',.2f'));

      d3.select(uniqContainerClass + " svg")
          .datum(nvData)
          .call(chart);

      nv.utils.windowResize(chart.update);

      return chart;
    });
  },
  
  chartAnnotations: function(o) {
    var chart = "#" + o["chart_id"],
        xAxis = o["x_axis_column"],
        queryName = o["query_name"],
        orientations = o["orientations"],
        values = o["comment_values"],
        comments = o["comments"];
    
    var data = alamode.getDataFromQuery(queryName);
    var pointNumbers = [];
    
    comments.forEach(function(c,i) {
      var match = _.filter(data, function(d){ return d[xAxis] == values[i]; });
      if (match.length != 0) {
        pointNumber = data.indexOf(match[0]);
      } else {
        pointNumber = -1
      }
      
      pointNumbers.push(pointNumber)
    })
    
    function drawComments() {
      
      comments.forEach(function(c,i) {
        
        var pointNumber = pointNumbers[i],
            orientation = orientations[i],
            value = values[i];
  
        var tip = d3.tip()
            .attr("class","d3-tip")
            .style("z-index",100)
            .offset([-10, 0])
            .html(function(d) { return d; });
      
        var translate = $(chart).find("g.nvd3.nv-wrap").attr("transform"),
            openPos = translate.indexOf("("),
            closePos = translate.indexOf(")"),
            commaPos = translate.indexOf(",");
        
        var xTrans = +translate.slice(openPos+1,commaPos),
            yTrans = +translate.slice(commaPos+1,closePos);
      
        if (pointNumber != -1 && orientation == "v") {
        
          var pointTranlate = $(chart).find(".nv-point.nv-point-" + pointNumber).attr("transform"),
              pointOpenPos = pointTranlate.indexOf("("),
              pointClosePos = pointTranlate.indexOf(")"),
              pointCommaPos = pointTranlate.indexOf(",");
          
          var xPoint = +pointTranlate.slice(pointOpenPos+1,pointCommaPos),
              yPoint = +pointTranlate.slice(pointCommaPos+1,pointClosePos);
            
          var height = $(chart).find("g.nvd3.nv-wrap").first().find("rect").first().attr("height"),
              width = $(chart).find("g.nvd3.nv-wrap").first().find("rect").first().attr("width");
        
          var svg = d3.select(chart + " .nvd3svg");
        
          svg.call(tip);
        
          svg.append("rect")
              .attr("x",xPoint + xTrans)
              .attr("y",yTrans - 10)
              .attr("width",1)
              .attr("class","flag")
              .attr("height",yPoint + 10)
              .attr("fill","#ff8f53");
        
          svg.append("circle")
              .data([c])
              .attr("cx",xPoint + xTrans)
              .attr("cy",yTrans - 10)
              .attr("class","flag")
              .attr("r",5)
              .attr("fill","#ff8f53")
              .on('mouseover', tip.show)
              .on('mouseout', tip.hide);
      
        } else if (orientation == "h") {
          if (commentAxis == "left") { y = "1"; }
          else if (commentAxis == "right") { y = "2"; }
          else { y = ""; }
        
          var ticks = $(chart).find("g.nv-y" + y + ".nv-axis").find(".tick");
        
          ticks.each(function(t) {
          
            tickTrans = $(this).attr("transform");
            tickClosePos = tickTrans.indexOf(")"),
            tickCommaPos = tickTrans.indexOf(",");
          
            if (t == 0) {
  
              // Get line length and y of first tick          
              if (commentAxis == "right") {
                lineLength = +$(chart).find("g.nv-y1.nv-axis").find(".tick").first().find("line").attr("x2");
              } else {
                lineLength = +$(this).find("line").attr("x2");  
              }
            
              yTrans1 = +tickTrans.slice(tickCommaPos+1,tickClosePos);
              yVal1 = +$(this).find("text").text().replace(",","");
            
            } else if (t == 1) {
            
              // Get y of second tick;
              yTrans2 = +tickTrans.slice(tickCommaPos+1,tickClosePos);
              yVal2 = +$(this).find("text").text().replace(",","");
            }
          })
                  
          var scalar = (yTrans2 - yTrans1)/(yVal2 - yVal1),
              intercept = yTrans2 - (yVal2 * scalar);
            
          var lineLocation = intercept + (c.value * scalar);
          
          var svg = d3.select(chart + " .nvd3svg");
        
          svg.call(tip);
        
          svg.append("rect")
              .attr("x",xTrans)
              .attr("y",lineLocation + yTrans)
              .attr("width",lineLength + 10)
              .attr("height",1)
              .attr("class","flag")
              .attr("fill","#ff8f53");
        
          svg.append("circle")
              .data([c])
              .attr("cx",lineLength + xTrans + 10)
              .attr("cy",lineLocation + yTrans)
              .attr("class","flag")
              .attr("r",5)
              .attr("fill","#ff8f53")
              .on('mouseover', tip.show)
              .on('mouseout', tip.hide);
  
        }
      })
    }

    setTimeout(function(){
      d3.select(chart).selectAll(".flag").remove();
      drawComments()
    },1000);
  
    $(window).resize(function () {
      d3.select(chart).selectAll(".flag").remove();
      
      waitForFinalEvent(function(){
        drawComments()
      }, 500, "");
    });
  
    var waitForFinalEvent = (function () {
      var timers = {};
      
      return function (callback, ms, uniqueId) {
        if (!uniqueId) {
          uniqueId = "Don't call this twice without a uniqueId";
        }
        if (timers[uniqueId]) {
          clearTimeout (timers[uniqueId]);
        }
        timers[uniqueId] = setTimeout(callback, ms);
      };
    })();
  },
  
  // Modified NVD3 bullet chart
  // http://nvd3-community.github.io/nvd3/ 
  bulletChart: function(o) {
    
    var id = alamode.makeId(10);
        
    var queryName = o["query_name"],
        // Optional
        htmlElement = o["html_element"] || "body",
        title = o["title"] || queryName,
        width = o["chart_width"] || "800",
        barLabel = o["bar_column"] || "",
        markerLabel = o["marker_column"] || "",
        leftpad = o["left_pad"] || 150;
        
    var data = alamode.getDataFromQuery(queryName);
    
    var uniqContainerClass = alamode.addContainerElement(htmlElement);
      
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)
      
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-bullet-chart")
        .style("width",width)
        .attr("id",id);
    
    data.forEach(function(d) {
      var title = d[o["title_column"]] || "",
          subtitle = d[o["subtitle_column"]] || "",
          marker = d[o["marker_column"]] || "",
          bar = d[o["bar_column"]] || "";
      
      if (o["scale_columns"]) {
        scale = [d[o["scale_columns"][0]],d[o["scale_columns"][1]],d[o["scale_columns"][2]]];
      } else {
        scale = o["scale_columns"];
      }
      
      var bulletData = {
        "title": title,
        "subtitle": subtitle,
        "ranges": scale,
        "measures": [bar],
        "measureLabels": [barLabel],
        "markers": [marker],
        "markerLabels": [markerLabel]
      }
      
      nv.addGraph(function() {  
        var chart = nv.models.bulletChart()
            .height(50)
            .width(width)
            .margin({"left":leftpad,"right":15,"top":10,"bottom":10});
        
        var svg = d3.select("#" + id)
            .append("svg")
            .style("width",width + "px")
            .style("height",70 + "px")
            .style("display","inline")
            .datum(bulletData)
            .transition().duration(500)
            .call(chart);

        return chart;
      })  
    })
  },
  
  // Modified from Kerry Rodden's "sequence sunburst"
  // https://bl.ocks.org/kerryrodden/7090426
  sunburstChart: function(o) {
    var id = alamode.makeId(10);
    
    var queryName = o["query_name"],
        eventColumns = o["event_columns"],
        valueColumn = o["event_counts"],
        // Optional
        title = o["title"] || queryName,
        htmlElement = o["html_element"] || "body";
    
    var data = alamode.getDataFromQuery(queryName);
    
    var height = 600,
        width = 650,
        radius = Math.min(width, height) / 2,
        breadcrumbWidth = (width - 50)/eventColumns.length,
        b = { w: breadcrumbWidth, h: 30, s: 3, t: 10 };
    
    var fullEventList = [];
    
    eventColumns.forEach(function(e) {
      fullEventList = fullEventList.concat(_.uniq(_.map(data,e)));
    })
    
    var events = _.uniq(fullEventList)

    var colorRange = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"];

    var colors = {}

    events.forEach(function(e,i) {
      if (e != null) { colors[e] = colorRange[i % 18]; }
    })

    colors["end"] = "#666"
    
    var totalSize = 0; 

    var uniqContainerClass = alamode.addContainerElement(htmlElement);
      
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)
    
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-sunburst-sequence")
        .attr("id","sequence-" + id)
      
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-sunburst")
        .attr("id",id)
    
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-sunburst-legend-container")
        .attr("id","legend-container-" + id)
        
    vis = d3.select("#" + id).append("svg:svg")
        .attr("width", width)
        .attr("height", height)
      .append("svg:g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    
    vis.append("text")
        .attr("x",0)
        .attr("y",-30)
        .attr("text-anchor","middle")
        .attr("class","mode-sunburst-explanation mode-sunburst-percentage")
        .attr("id","percentage-" + id)
        .style("visibility","hidden")
        .text("");
    
    vis.append("text")
        .attr("x",0)
        .attr("y",-10)
        .attr("text-anchor","middle")
        .attr("class","mode-sunburst-explanation")
        .style("visibility","hidden")
        .text("of total sequences.")
    
    vis.append("text")
        .attr("x",0)
        .attr("y",20)
        .attr("text-anchor","middle")
        .attr("class","mode-sunburst-explanation mode-sunburst-cond-percentage")
        .attr("id","cond-percentage-" + id)
        .style("visibility","hidden")
        .text("")
    
    vis.append("text")
        .attr("x",0)
        .attr("y",40)
        .attr("text-anchor","middle")
        .attr("class","mode-sunburst-explanation")
        .style("visibility","hidden")
        .text("from previous location.")
    
    var partition = d3.layout.partition()
        .size([2 * Math.PI, radius * radius])
        .value(function(d) { return d.size; });

    var arc = d3.svg.arc()
        .startAngle(function(d) { return d.x; })
        .endAngle(function(d) { return d.x + d.dx; })
        .innerRadius(function(d) { return Math.sqrt(d.y); })
        .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

    var formattedData = [];

    data.forEach(function(d) {
      var sequence = "";
      
      for (i=0; i<eventColumns.length; i++) {
        
        if (i != 0) { prefix = "-~-"; } else { prefix = ""; }
        
        if (d[eventColumns[i]] == null) {
          sequence = sequence + prefix + "end";
          break;
        } else {
          sequence = sequence + prefix + d[eventColumns[i]];
        }
      }
  
      var ent = {0:sequence, 1:d[valueColumn]}
  
      formattedData.push(ent)
    })

    var json = buildHierarchy(formattedData);

    createVisualization(json);

    function createVisualization(json) {
 
      initializeBreadcrumbTrail();
      drawLegend();

      vis.append("svg:circle")
          .attr("r", radius)
          .style("opacity", 0);

      var nodes = partition.nodes(json)
        .filter(function(d) {
            return (d.dx > 0.005);
        });

      var path = vis.data([json]).selectAll("path")
          .data(nodes)
        .enter().append("svg:path")
          .attr("display", function(d) { return d.depth ? null : "none"; })
          .attr("d", arc)
          .attr("fill-rule", "evenodd")
          .style("fill", function(d) { return colors[d.name]; })
          .style("opacity", 1)
          .on("mouseover", mouseover);

      vis.on("mouseleave", mouseleave);

      totalSize = path.node().__data__.value;
    };

    function mouseover(d) {
    
      var percentage = (100 * d.value / totalSize).toPrecision(3);
      var percentageString = percentage + "%";
      if (percentage < 0.1) {
        percentageString = "< 0.1%";
      }
      
      //Calculate conditional percentage
      var sequenceArray = getAncestors(d);
      var parent_conditional_value = d.parent.value;
      var cond_percentage = (100*d.value/parent_conditional_value).toPrecision(3);
      var cond_percentageString = cond_percentage + "%";
        if (cond_percentage < 1.0) {
        percentageString = "< 1%";
      }
      
      d3.select("#cond-percentage-" + id)
          .text(cond_percentageString);
      
      d3.select("#percentage-" + id)
          .text(percentageString);
    
      d3.selectAll(".mode-sunburst-explanation")
          .style("visibility", "");
    
      var sequenceArray = getAncestors(d);
      updateBreadcrumbs(sequenceArray, percentageString);
    
      d3.selectAll("path")
          .style("opacity", 0.3);
    
      vis.selectAll("path")
          .filter(function(node) {
                    return (sequenceArray.indexOf(node) >= 0);
                  })
          .style("opacity", 1);
    }

    function mouseleave(d) {
    
      d3.select("#trail-" + id)
          .style("visibility", "hidden");
    
      d3.selectAll("path").on("mouseover", null);
    
      d3.selectAll("path")
          .transition()
          .duration(1000)
          .style("opacity", 1)
          .each("end", function() {
            d3.select(this).on("mouseover", mouseover);
          });
    
      d3.selectAll(".mode-sunburst-explanation")
          .style("visibility", "hidden");
    }

    function getAncestors(node) {
      var path = [];
      var current = node;
      while (current.parent) {
        path.unshift(current);
        current = current.parent;
      }
      return path;
    }

    function initializeBreadcrumbTrail() {
      var trail = d3.select("#sequence-" + id).append("svg:svg")
          .attr("width", width)
          .attr("height", 50)
          .attr("id", "trail-" + id);
          
      trail.append("svg:text")
        .attr("id", "endlabel")
        .style("fill", "#000");
    }

    function breadcrumbPoints(d, i) {
      var points = [];
      points.push("0,0");
      points.push(b.w + ",0");
      points.push(b.w + b.t + "," + (b.h / 2));
      points.push(b.w + "," + b.h);
      points.push("0," + b.h);
      if (i > 0) { 
        points.push(b.t + "," + (b.h / 2));
      }
      return points.join(" ");
    }

    function updateBreadcrumbs(nodeArray, percentageString) {
    
      var g = d3.select("#trail-" + id)
          .selectAll("g")
          .data(nodeArray, function(d) { return d.name + d.depth; });
    
      var entering = g.enter().append("svg:g");
    
      entering.append("svg:polygon")
          .attr("points", breadcrumbPoints)
          .style("fill", function(d) { return colors[d.name]; });
    
      entering.append("svg:text")
          .attr("x", (b.w + b.t) / 2)
          .attr("y", b.h / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(function(d) { return d.name; });
    
      g.attr("transform", function(d, i) {
        return "translate(" + i * (b.w + b.s) + ", 0)";
      });
    
      g.exit().remove();
    
      d3.select("#trail-" + id)
          .style("visibility", "");
    }
    
    function drawLegend() {
    
      var li = {
        w: 195, h: 30, s: 3, r: 3
      };
      
      d3.entries(colors).forEach(function(c) {
        
        divContainer = d3.select("#legend-container-" + id)
            .append("div")
            .attr("class","mode-sunburst-legend")
            .attr("id","legend-" + id)
        
        svg = divContainer.append("svg:svg")
            .attr("width", li.w)
            .attr("height", li.h);
    
        svg.append("svg:rect")
            .attr("rx", li.r)
            .attr("ry", li.r)
            .attr("width", li.w)
            .attr("height", li.h)
            .style("fill", function() { return c.value; });
    
        svg.append("svg:text")
            .attr("x", li.w / 2)
            .attr("y", li.h / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(function() { return c.key; });
      })
        
    }
    
    
    function buildHierarchy(csv) {
      var root = {"name": "root", "children": []};
      for (var i = 0; i < csv.length; i++) {
        var sequence = csv[i][0];
        var size = +csv[i][1];
        if (isNaN(size)) {
          continue;
        }
        var parts = sequence.split("-~-");
        var currentNode = root;
        for (var j = 0; j < parts.length; j++) {
          var children = currentNode["children"];
          var nodeName = parts[j];
          var childNode;
          if (j + 1 < parts.length) {
      
      var foundChild = false;
      for (var k = 0; k < children.length; k++) {
        if (children[k]["name"] == nodeName) {
          childNode = children[k];
          foundChild = true;
          break;
        }
      }
      
      if (!foundChild) {
        childNode = {"name": nodeName, "children": []};
        children.push(childNode);
      }
      currentNode = childNode;
          } else {
      
      childNode = {"name": nodeName, "size": size};
      children.push(childNode);
          }
        }
      }
      return root;
    };
  },
  
  // Modified from Mike Bostock's "Choropleth"
  // https://bl.ocks.org/mbostock/4060606
  countyChoropleth: function(o) {
    var id = alamode.makeId(10);
    
    var queryName = o["query_name"],
        countyColumn = o["county_id_column"],
        valueColumn = o["value_column"],
        // Optional
        title = o["title"] || queryName,
        valueRange = o["color_range"],
        colors = o["colors"] || ["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#08519c","#08306b"],
        htmlElement = o["html_element"] || "body";
    
    var data = alamode.getDataFromQuery(queryName);
    
    var width = 950,
        height = 500;

    var rateById = d3.map();

    var path = d3.geo.path();
    
    var uniqContainerClass = alamode.addContainerElement(htmlElement);
    
    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)
    
    svg = d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-county-chorolpleth")
      .append("svg")
        .attr("width",width)
        .attr("height",height);

    data.forEach( function(d) {
      rateById.set(d[countyColumn],+d[valueColumn]);
    })
    
    if (!valueRange) {
      colorDomain = d3.extent(data, function(d) { return d[valueColumn]; });
    } else {
      colorDomain = valueRange;
    }

    var quantize = d3.scale.quantize()
        .domain(colorDomain)
        .range(colors);

    queue()
        .defer(d3.json, "https://dl.dropboxusercontent.com/s/sh04tjwairb7vgk/counties.json")
        .await(ready);

    function ready(error, us) {
      svg.append("g")
          .attr("class", "mode-county-chorolpleth-counties")
        .selectAll("path")
          .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
          .attr("fill", function(d) { return quantize(rateById.get(d.id)); })
          .attr("d", path);

      svg.append("path")
          .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
          .attr("class", "mode-county-chorolpleth-states")
          .attr("d", path);
    }
  }

}
