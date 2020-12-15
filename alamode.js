// alamode.js
//
// Visualizations for Mode reports
var version = "0.23";

var alamode = {

  reportError: function(msg) {
    $("<h1 class='mode-error'>").text(msg).prependTo(document.body);
  },

  getColumnsFromQuery: function(queryName) {
    var columns = datasets.filter(function(d) { if (d) { return d.queryName == queryName;}; })[0];
    if (!columns) {
      alamode.reportError("No such query: '" + queryName + "'");
      return [];
    }
    return columns.columns
  },

  getDataFromQuery: function(queryName) {
    var data = datasets.filter(function(d) { if (d) { return d.queryName == queryName;}; })[0];
    if (!data) {
      alamode.reportError("No such query: '" + queryName + "'");
      return [];
    }
    return data.content;
  },

  makeId: function(chars) {
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        text = "";

    for (var i=0; i < chars; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },

  addContainerElement: function(el, clear) {

    clear = clear || false;

    id = alamode.makeId(10);

    if (el == "body") {
      $("<div id='" + id + "'></div>").addClass(id).addClass("mode-graphic-container").appendTo(".mode-content");
    } else if ($(el).length === 0) {
      alamode.reportError("No such element: '" + el + "'");
    } else {

      if (clear) {
        $(el).empty();
      }

      $(el).addClass("mode-graphic-container");
      $(el).addClass(id);
    }

    return "." + id;
  },

  addLinksToTables: function(o) {
    var tableId = "#" + o["table_id"],
        linkColumns = o["link_columns"],
        linkURLs = o["link_urls"],
        queryName = o["query_name"],
        openInNewTab = o["open_in_new_tab"] || false;

    var linkFormat = [];
    var colIndex = {};

    linkColumns.forEach(function(l,i) {
      linkFormat.push( { column: l, link_string: linkURLs[i] });
    })

    var data = alamode.getDataFromQuery(queryName),
        columns = alamode.getColumnsFromQuery(queryName);

    setTimeout(function(){
      drawLinks(linkFormat)
    },1000)

    $(tableId).mousemove(function() {
      drawLinks(linkFormat)
    })

    function drawLinks(linkFormat) {

      var tableDiv = $(tableId + " table"),
          tableHeader = $(tableId + " .js-header-table"),
          headers = !tableHeader ? $(tableHeader).find("th") : $(tableId + " .js-col-header"),
          rows = tableDiv.find("tr"),
          columnIndex = 0;

      headers.each(function() {
        text = $(this).find(".axel-table-header-label").text()
        columnIndex = $(this).attr("data-axel-column")
        colIndex[text] = columnIndex - 1
      })

      rows.each(function(i) {
        if (i > 0 && i <= data.length) {
          var cells = $(this).find("td"),
              rowKey = cells.first().attr("data-axel-rowkey");

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
                  content = data[rowKey][cName];

              url = url.replace(full,content);
            }

            var target = (openInNewTab) ? "_blank" : "_top";
            var link_html = "<a target='" + target + "' href='" + encodeURI(url) + "'>" + cellContent + "</a>";
            cells.eq(columnToShow).html(link_html);
          })
        }
      })
    }
  },

  customChartColors: function(o) {
    var charts = o["charts"],
        colors = o["colors"],
        opacities = o["opacity"],
        lineDashes = o["line_dashes"];

    if (charts == "all") {
      charts = [];

      $("mode-chart").each(function(){ charts.push(this.id); });
    }

    function prepColors(id, colorList) {
      var chart = $("#" + id),
          series = chart.find('.nv-bar').length > 0 ? chart.find('.nv-group') : chart.find('.nv-line').length > 0 || chart.find('.nv-areaWrap').length > 0 ? chart.find('.nv-noninteractive') : chart.find('.nv-pie .nv-slice'),
          seriesCount = series.length,
          legend = chart.find(".nv-series .nv-legend-symbol");

      var colors = {};

      var m = {};
      var r = {};
      var counter = 0;

      if (legend.length == 0 && seriesCount <= 1) {
        m[0] = counter;
        r[counter] = 0;
        colors[0] = colorList[0];

      } else if (legend.length == 0 && seriesCount > 1) {
        for (i = 0; i < seriesCount; i++) {
          m[i] = i;
          colors = colorList;
        }

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

      return {chart: chart, legend: legend, colors: colors, m: m, r: r, seriesCount: seriesCount};
    }

    function drawColors(id, colorList) {
      var data = prepColors(id, colorList),
          chart = data.chart,
          colors = data.colors,
          m = data.m;

      for (var i in colors) {
        chart.find(".nv-linesWrap .nv-groups .nv-series-" + m[i]).css( {"fill":colors[i],"stroke":colors[i] });
        chart.find(".nv-barsWrap .nv-groups .nv-series-" + m[i] + " rect").css( {"fill":colors[i],"stroke":colors[i] });

        chart.find(".nv-linePlusBar .nv-barsWrap .nv-bars rect").each(function(index){
              $(this).css({"fill": colors[0],"stroke": colors[0]});
        });
        chart.find(".nv-linePlusBar .nv-linesWrap .nv-groups .nv-series-0").css({"fill": colors[1],"stroke": colors[1]});


        chart.find(".nv-scatterWrap .nv-groups .nv-series-" + m[i]).css( {"fill":colors[i],"stroke":colors[i] });
        chart.find(".nv-areaWrap .nv-area-" + m[i]).css( {"fill":colors[i],"stroke":colors[i] });
        chart.find(".nv-pie .nv-slice").each(function(i) { $(this).css( {"fill":colors[i],"stroke":colors[i]}); });
      }

      for (var i in opacities) {
        chart.find(".nv-linesWrap .nv-groups .nv-series-" + m[i]).css( {"opacity":opacities[i]} );
        chart.find(".nv-barsWrap .nv-groups .nv-series-" + m[i] + " rect").css( {"opacity":opacities[i]} );
        if (i == 0){
         chart.find(".nv-linePlusBar .nv-barsWrap .nv-bars rect").each(function(index){
          $(this).css({
          "opacity": opacities[i]
          });
         });
         chart.find(".nv-linePlusBar .nv-linesWrap .nv-groups .nv-series-0").css({"opacity": opacities[1]});
       }
        chart.find(".nv-scatterWrap .nv-groups .nv-series-" + m[i]).css( {"opacity":opacities[i]} );
        chart.find(".nv-areaWrap .nv-area-" + m[i]).css( {"opacity":opacities[i]} );
        chart.find(".nv-pie .nv-slice").each(function(i) { $(this).css( {"opacity":opacities[i]} ); });
      }

      for (var i in lineDashes) {
        chart.find(".nv-linesWrap .nv-groups .nv-series-" + m[i]).css( {"stroke-dasharray":lineDashes[i]} );
      }

      chart.find(".nv-legendWrap .nv-series .nv-legend-symbol").each(function(i) {
        $(this).css({"fill":colors[i],"stroke":colors[i]});
      })
    }

    function onMouseMove(id, colorList) {
      var chart = $("#" + id);
      $(chart).mousemove(function() {
        var data = prepColors(id, colorList),
            legend = data.legend,
            colors = data.colors,
            r = data.r,
            m = data.m,
            seriesCount = data.seriesCount,
            isAreaLength = isArea = chart.find(".nv-area").length,
            isBarLength = chart.find(".nv-bar").length,
            isLineLength = chart.find(".nv-line").length;

        $("html").find(".nvtooltip table .legend-color-guide").each(function(i) {
          if (legend.length == 0 && isBarLength == 0) {
            $(this).find("div").css({"background-color":colors[m[i]]});
          } else if (isLineLength > 0 && isBarLength > 0) {
            var lineColor = chart.find(".nv-linePlusBar .nv-linesWrap .nv-groups .nv-series-0").css("fill"),
                barColor = chart.find(".nv-linePlusBar .nv-barsWrap .nv-bars rect").css("fill");
            if ($(this).closest(".nvtooltip").find(".key")[0].innerText == "") {
              $(this).find("div").css("background-color", barColor)
            } else {
              $(this).find("div").css("background-color", lineColor);
            }
           } else if (isBarLength > 0) {
             if (seriesCount == 1) {
              $(this).find("div").css({"background-color": colors[r[seriesCount - i - 1]]});
             }
           } else if (isAreaLength > 0) {
            $(this).find("div").css({"background-color": colors[isAreaLength - i - 1]});
           } else {
            $(this).find("div").css({"background-color":colors[i]});
           }
        })

        var sliceColor = chart.find(".nv-pie .nv-slice.hover").css("fill");
        $("html").find(".nvtooltip table .legend-color-guide div").css("background-color",sliceColor)
      })

      $(chart).mouseleave(function() {
       $("html").find(".nvtooltip table .legend-color-guide").remove();
      })

    }

    setInterval(function () {
      charts.forEach(function(c) {
        drawColors(c,colors)
      })
    }, 500)

    charts.forEach(function(c) {
      onMouseMove(c, colors);
    })
  },

  addTotalsRow: function(o) {
    var queryName = o["query_name"],
        selectedTable = o["table_id"] || "",
        tableId = "#" + selectedTable,
        resultColumns = alamode.getColumnsFromQuery(queryName),
        data = alamode.getDataFromQuery(queryName),
        selectedColumns = o["columns_with_totals"],
        userProvidedFmt = o["fmt"];

    var fmt = userProvidedFmt || d3.format(",");

    var columnsWithSums = getColumns(selectedColumns),
        totals = makeSums(columnsWithSums);

    function getColumns(selectedColumns) {

      numberColumns = _.map(_.filter(resultColumns,function(c) {
        return ["number","integer","float"].indexOf(c.type) != -1;
      }),"name")

      if (selectedColumns == "all") {
        return numberColumns;
      } else {
        return _.intersection(selectedColumns, numberColumns);
      }
    }

    function makeSums(columnsWithSums) {
      var sumObject = [];

      resultColumns.forEach(function(c,i) {
        if (columnsWithSums.indexOf(c.name) == -1) {
          var obj = {idx: i, name: "", total: ""};

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
      if (tableId == "#") {
        table = $(".main-table")
        container = $(".js-table-content-container")
      } else {
        table = $(tableId + " .main-table")
        container = $(tableId + " .js-table-content-container")
      }

      var lastRow = table.find("tr:last")
      var totalRow = makeRow(totals)
      var tableHeight = container.css("height")
      var tableHeightInt = +tableHeight.match(/\d+/)[0]

      lastRow.after(totalRow)

      container.css("height",tableHeightInt + 26)
    },1000);
  },

  addImagesToTables: function(o) {

    var tableId = "#" + o["table"],
        imageColumn = o["column"],
        imgHeight = o["image_height"] || 100;

    setTimeout(function() {
      drawImages();
    },1000)

    $(tableId).keyup(function() {
      setTimeout(function() {
        drawImages();
      },500)
    });

    $(tableId).mousemove(function() {
      drawImages();
    })

    function drawImages() {
      var tableDiv = $(tableId + " table"),
          tableHeader = $(tableId + " .js-header-table"),
          headers = !tableHeader ? $(tableHeader).find("th") : $(tableId + " .js-col-header"),
          rows = tableDiv.find("tr"),
          columnIndex = 0;

      headers.each(function() {
        text = $(this).find(".axel-table-header-label").text()
        if (text == imageColumn) {
          columnIndex = +$(this).attr("data-axel-column")
        }
      })

      rows.each(function() {
        var cells = $(this).find("td");

        cells.each(function(i) {
          if (i == (columnIndex - 1)) {
            var content = $(this).text();

            if ($(this).find("img").length == 0) {
              $(this).css("text-align","center")
              $(this).html("<img style='height: " + imgHeight + "px;' src='" + content + "'>")
            }
          }
        })
      })
    }
  },

  resizeChartHeight: function(o) {
    var chart = o["chart"],
        height = o["height"];

    if (chart.slice(0,6) == "python") {
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
        colors = o["color_gradient"] || ["#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850"],
        gradientBy = o["gradient_by"] || "all", // "all" | "cohort_column" | "pivot_column"
        gradientColumn = o["gradient_column"] || valueColumn,
        totalColumn = o["total_column"],
        htmlElement = o["html_element"] || "body",
        title = o["title"] || queryName,
        pivotLabel = o["pivot_label"] || "",
        isPercent = o["value_is_percent"],
        precision = o["precision"] || 0;

    var data = alamode.getDataFromQuery(queryName),
        columns = alamode.getColumnsFromQuery(queryName),
        cohorts = _.uniq( _.map(data, cohortColumn) ),
        pivots = _.sortBy(_.uniq( _.map(data, pivotColumn) ) );

    var uniqContainerClass = alamode.addContainerElement(htmlElement);
    
    if (gradientBy === "cohort_column") {
      var colorsByCohort = {};
      cohorts.forEach(function (cohort) {
        var dataByCohort = data.filter(function (row) {
          return row[cohortColumn] === cohort;
        });
        colorsByCohort[cohort] = d3.scale.quantize()
          .domain(d3.extent(dataByCohort, function(d) { return d[gradientColumn]; }))
          .range(colors)
      })
    } else if (gradientBy === "pivot_column") {
      var colorsByPivot = {};
      pivots.forEach(function (pivot) {
        var dataByPivot = data.filter(function (row) {
          return row[pivotColumn] === pivot;
        });
        colorsByPivot[pivot] = d3.scale.quantize()
          .domain(d3.extent(dataByPivot, function(d) { return d[gradientColumn]; }))
          .range(colors)
      })
    } else {  // table or as a default fallback
      var color = d3.scale.quantize()
        .domain(d3.extent(data, function(d) { return d[gradientColumn]; }))
        .range(colors)
    }

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
        .style("background",function(d) { if (checkShade(d)) { return pickColor(d); } })
        .attr("class",function(d) { return cellClass(d); })
        .text(function(d) { return fmt(d,o); })

    function pickColor (entry) {
      if (gradientBy === "cohort_column") {
        return colorsByCohort[entry.cohort](entry.gradientValue);
      } else if (gradientBy === "pivot_column") {
        return colorsByPivot[entry.pivot](entry.gradientValue);
      }
      return color(entry.gradientValue)
    }

    function checkShade(entry) {
      return entry.column == valueColumn && entry.value !== "";
    }

    function cellClass(entry) {
      var type = getDataType(entry.column);

      if (type == "float" || type == "integer" || type == "number") {
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
        var entryValue = '';
        var gradientValue = '';
        var matches = _.filter(data, function(d) {
          return d[cohortColumn] == cohort && d[pivotColumn] == p
        });

        if (matches.length > 0) {
          entryValue = d3.mean( _.map(matches,valueColumn) );
          gradientValue = d3.mean( _.map(matches,gradientColumn) );
        } 
        
        row = row.concat( {column: valueColumn, value: entryValue, cohort: cohort, pivot: p, gradientValue: gradientValue } )
      })
      return row;
    }

    function fmt(entry) {

      var type = getDataType(entry.column);

      var c = d3.format(","),
          p = d3.format("." + precision + "%"),
          t = d3.time.format("%b %d, %Y");

      if (entry.value == "") {
        return entry.value;
      } else if (type == "datetime" || type == "timestamp" || type == "date") {
        if (typeof moment == "function") {
          return moment(entry.value).utc().format("ll")
        } else {
          return t(new Date(entry.value));
        }
      } else if (entry.column == totalColumn) {
        return c(entry.value);
      } else if (entry.column == valueColumn && isPercent) {
        return p(entry.value);
      } else if (entry.column == valueColumn) {
        return c(entry.value);
      } else {
        return entry.value;
      }
    }
  },


  // A simple heatmap to use for any 2-labeled data
  // Parameters:

  // - query_name: the name of the query that has the source data
  // - x_column: the column to show across the top
  // - y_column: the column to show down the left side
  // - value_column: the column to show in the heatmap boxes
  // - max_value: if present, all values greater than this value will be set to the maximum color
  // - min_value: if present, all values less than this value will be set to the minimum color
  // - color_gradient: if present, overrides the green/red gradient. Should be an array of strings, where each value is a hex color string
  // - html_element: The element to add the heatmap to
  // - title: The title of the heatmap
  // - x_label: The title to show above the x_column values
  // - y_label: The title to show above the left column of the heatmap with y_column values
  // - value_is_percent: a bool (default false). If it's true, the values will be formatted using d3.format as a percent
  // - precision: if value_is_percent is true, this is used as the precision in the d3.format call
  simpleHeatmap: function(o) {

    var queryName = o["query_name"],

        xColumn = o["x_column"],
        yColumn = o["y_column"],
        valueColumn = o["value_column"],
        maxValue = o["max_value"] || Number.MAX_VALUE,
        minValue = (o["min_value"]===0) ? 0 : (o["min_value"] || Number.MIN_VALUE ),

        // Optional
        colors = o["color_gradient"] || ["#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850"],
        
        htmlElement = o["html_element"] || "body",
        title = o["title"] || queryName,
        xLabel = o["x_label"] || "",
        yLabel = o["y_label"] || "",

        isPercent = o["value_is_percent"],
        precision = o["precision"] || 0;

    var data = alamode.getDataFromQuery(queryName),
        columns = alamode.getColumnsFromQuery(queryName),
        xVals = _.uniq( _.map(data, xColumn) ),
        yVals = _.uniq( _.map(data, yColumn) );

    var uniqContainerClass = alamode.addContainerElement(htmlElement);

    var color = d3.scale.quantize()
      .domain(d3.extent(data, function(d) { 
        return Math.max(minValue, Math.min(maxValue, d[valueColumn]));
      }))
      .range(colors)

    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-graphic-title")
      .text(title)

    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-simple-heatmap-label")
      .text(yLabel)

      headers = [xColumn].concat(yVals)

    var table = d3.select(uniqContainerClass).append("table")
        .attr("class","mode-simple-heatmap-table");

    table.selectAll(".mode-simple-heatmap-table-header")
        .data([0])
      .enter().append("tr")
        .attr("class","mode-simple-heatmap-table-header")
      .selectAll("mode-simple-heatmap-table-header-cell")
        .data(headers)
      .enter().append("td")
        .attr("class",function(d) {
          if (isNaN(d)) { return "mode-simple-heatmap-table-header-cell heatmap-string"; }
          else { return "mode-simple-heatmap-table-header-cell heatmap-number"; }
        })
      .text(function(d) { return d; })

    table.selectAll(".mode-simple-heatmap-table-row")
        .data(xVals)
      .enter().append("tr")
        .attr("class","mode-simple-heatmap-table-row")
      .selectAll(".mode-simple-heatmap-table-cell")
        .data(function(d) { return makeRow(data,d); })
      .enter().append("td")
        .style("background",function(d) { if (checkShade(d)) { return color(Math.max(minValue, Math.min(maxValue, d.value))); } })
        .attr("class",function(d) { return cellClass(d); })
        .text(function(d) { return fmt(d,o); })

    function checkShade(entry) {
      if (entry.value === "") {
        return false;
      } else if (entry.column == xColumn) {
        return false;
      } else if (entry.column == valueColumn) {
        return true;
      } else {
        return false;
      }
    }

    function cellClass(entry) {
      var type = getDataType(entry.column);

      if (type == "float" || type == "integer" || type == "number") {
        return "heatmap-number";
      } else {
        return "heatmap-string";
      }
    }

    function getDataType(column) {
      return columns.filter(function(d) { return d.name == column })[0].type;
    }

    function makeRow(data,xVal) {
      
      var row = [ {column: xColumn, value: xVal } ];
      yVals.forEach(function(p) {

        var matches = _.filter(data, function(d) {
          return d[xColumn] == xVal && d[yColumn] == p
        });

        if (matches.length > 0) {
          entry = d3.mean( _.map(matches,valueColumn) );
        } else {
          entry = minValue;
        }
        row = row.concat( {column: valueColumn, value: entry} )
      })
      return row;
    }

    function fmt(entry) {

      var type = getDataType(entry.column);

      var c = d3.format(","),
          p = d3.format("." + precision + "%"),
          t = d3.time.format("%b %d, %Y");

      if (entry.value == "") {
        return entry.value;
      } else if (type == "datetime" || type == "timestamp" || type == "date") {
        if (typeof moment == "function") {
          return moment(entry.value).utc().format("ll")
        } else {
          return t(new Date(entry.value));
        }
      } else if (entry.column == valueColumn && isPercent) {
        return p(entry.value);
      } else if (entry.column == valueColumn) {
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
        mapType = o["map_type"] || "terrain",
        mapHeight = o["height"] || 600;

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
      .style("height",mapHeight + "px")

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
        height = o["height"] || 400,
        htmlElement= o["html_element"] || "body",
        centerLat = o["center_lat"] || 39.5,
        centerLng = o["center_lng"] || -98.35,
        zoom = o["starting_zoom"] || 4,
        dotRadius = o["dot_size"] || .4,
        dotOpacity = o["dot_opacity"] || .8,
        applyFilter = o["apply_filter"] || false;

    var data = alamode.getDataFromQuery(queryName),
        validData = [];

    data.forEach(function(d) {
      if (typeof d[latColumn] === "number" && typeof d[lngColumn] === "number") {
        validData.push(d)
      }
    })

    var uniqContainerClass = alamode.addContainerElement(htmlElement, applyFilter);

    d3.select(uniqContainerClass)
      .style("height",height + "px")
      .append("div")
      .attr("class","mode-graphic-title")
      .text(title)

    var mapHeight = height - $(uniqContainerClass + ".mode-graphic-title").height(),
        mapWidth = $(uniqContainerClass).width();

    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-leaflet-map")
      .attr("id",id)
      .style("height",mapHeight + "px")
      .style("width",mapWidth + "px")

    var baseLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    });

    var d = {
      max: 8,
      data: validData
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
        groupBy = o["group_by"],
        comments = o["comments"];

    var data = alamode.getDataFromQuery(queryName);
    var pointNumbers = [];
    var dataGroups = {};

    if (groupBy) {
      dataGroups = _.groupBy(data, function(d) { return d[groupBy]; });
    }

    comments.forEach(function(c,i) {
      var match = _.filter(data, function(d){ return d[xAxis] == values[i]; });
      if (match.length != 0) {
        if (groupBy) {
          pointNumber = dataGroups[match[0][groupBy]].indexOf(match[0])
        } else {
          pointNumber = data.indexOf(match[0]);
        }
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
              .attr("y",yTrans - 5)
              .attr("width",1)
              .attr("class","flag")
              .attr("height",yPoint + 5)
              .attr("fill","#ff8f53");

          svg.append("circle")
              .data([c])
              .attr("cx",xPoint + xTrans)
              .attr("cy",yTrans - 5)
              .attr("class","flag")
              .attr("r",5)
              .attr("fill","#ff8f53")
              .on('mouseover', tip.show)
              .on('mouseout', tip.hide);

        } else if (orientation == "h" || orientation == "h-left" || orientation == "h-right") {

          if (orientation == "h") {
            y = "";
          } else if ("h-left") {
            y = "1";
          } else {
            y = "2";
          }

          var ticks = $(chart).find("g.nv-y" + y + ".nv-axis").find(".tick");

          ticks.each(function(t) {

            if (orientation == "h-right") {
              lineLength = +$(chart).find("g.nv-y1.nv-axis").find(".tick").first().find("line").attr("x2");
            } else {
              lineLength = +$(this).find("line").attr("x2");
            }

            tickTrans = $(this).attr("transform");
            tickClosePos = tickTrans.indexOf(")"),
            tickCommaPos = tickTrans.indexOf(",");

            if (t == 0) {

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

          var lineLocation = intercept + (value * scalar);

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
        leftpad = o["left_pad"] || 150,
        color = o["color"];

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
        "markerLabels": [markerLabel],
        "color": color
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
        colorRange = o["color_range"] || ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"],
        htmlElement = o["html_element"] || "body";

    var data = alamode.getDataFromQuery(queryName);

    var height = 600,
        width = 850,
        radius = Math.min(width, height) / 2,
        breadcrumbWidth = (width - 30)/eventColumns.length,
        b = { w: breadcrumbWidth, h: 20, s: 3, t: 10 };

    var fullEventList = [];

    eventColumns.forEach(function(e) {
      fullEventList = fullEventList.concat(_.uniq(_.map(data,e)));
    })

    var events = _.uniq(fullEventList)

    var colors = {}

    events.forEach(function(e,i) {
      if (e != null) { colors[e] = colorRange[i % (colorRange.length)]; }
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

      // Compatibility for d3 v3 and v4
      if (d3.version.split(".")[0] == 4) {
        d3.selectAll("path")
            .transition()
            .duration(300)
            .style("opacity", 1)
            .on("end", function() {
              d3.select(this).on("mouseover", mouseover);
            })
      } else {
        d3.selectAll("path")
            .transition()
            .duration(300)
            .style("opacity", 1)
            .each("end", function() {
              d3.select(this).on("mouseover", mouseover);
            })
      }

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
          .attr("height", 60)
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
        if (i > 5 && i < 10){
          i = i - 5;
          return "translate(" + i * (b.w + b.s) + ", 20)";
        }else if (i > 10){
          i = i - 11;
          return "translate(" + i * (b.w + b.s) + ", 40)";
        }else{
          return "translate(" + i * (b.w + b.s) + ", 0)";
        }
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
  zipcodeChoropleth: function(o) {
    var id = alamode.makeId(10);

    var queryName = o["query_name"],
        zipcodeColumn = o["zipcode_column"],
        valueColumn = o["value_column"],
        // Optional
        width = o["width"] || 950,
        height = o["height"] || width/1.9,
        title = o["title"] || queryName,
        valueRange = o["color_range"],
        colors = o["color_gradient"] || ["#FFF8CC","#FFF5B2","#FFF299","#E5D87F","#CCBF66","#B2A54C","#998C33","#7F7219","#665900"],
        htmlElement = o["html_element"] || "body";

    var data = alamode.getDataFromQuery(queryName);

    var rateById = d3.map();

    var projection = d3.geoAlbersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    var uniqContainerClass = alamode.addContainerElement(htmlElement);

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)

    svg = d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-zipcode-chorolpleth")
      .append("svg")
        .attr("id","mode-zipcode-chorolpleth-" + id)
        .attr("width",width)
        .attr("height",height);

    data.forEach( function(d) {
      rateById.set(d[zipcodeColumn],+d[valueColumn]);
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
        .defer(d3.json, "https://s3-us-west-2.amazonaws.com/mode-alamode/zips_us_topo.json")
        .await(ready);

    function ready(error, us) {

      d3.select("#mode-zipcode-chorolpleth-" + id)
          .append("g")
          .attr("class", "zipcodes")
        .selectAll(".mode-zipcode-chorolpleth-zipcodes" + id)
          .data(topojson.feature(us, us.objects.zip_codes_for_the_usa).features)
        .enter().append("path")
          .attr("class","mode-zipcode-chorolpleth-zipcodes-" + id)
          .attr("fill", function(d) { return quantize(rateById.get(d.properties.zip)); })
          .attr("d", path);

      // d3.select("#mode-county-chorolpleth-" + id)
      //     .append("path")
      //     .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      //     .attr("class", "mode-county-chorolpleth-states")
      //     .attr("d", path);
    }
  },

  // Modified from Mike Bostock's "Choropleth"
  // https://bl.ocks.org/mbostock/4060606
  countyChoropleth: function(o) {
    var id = alamode.makeId(10);

    var queryName = o["query_name"],
        countyColumn = o["county_id_column"],
        valueColumn = o["value_column"],
        // Optional
        width = o["width"] || 950,
        height = o["height"] || width/1.9,
        title = o["title"] || queryName,
        valueRange = o["color_range"],
        colors = o["color_gradient"] || ["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#08519c","#08306b"],
        htmlElement = o["html_element"] || "body";

    var data = alamode.getDataFromQuery(queryName);

    var rateById = d3.map();

    var projection = d3.geoAlbersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    var uniqContainerClass = alamode.addContainerElement(htmlElement);

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)

    svg = d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-county-chorolpleth")
      .append("svg")
        .attr("id","mode-county-chorolpleth-" + id)
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
        .defer(d3.json, "https://s3-us-west-2.amazonaws.com/mode-alamode/counties.json")
        .await(ready);

    function ready(error, us) {

      d3.select("#mode-county-chorolpleth-" + id)
          .append("g")
          .attr("class", "mode-county-chorolpleth-counties")
        .selectAll(".mode-county-chorolpleth-counties" + id)
          .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
          .attr("class","mode-county-chorolpleth-counties-" + id)
          .attr("fill", function(d) { return quantize(rateById.get(d.id)); })
          .attr("d", path);

      d3.select("#mode-county-chorolpleth-" + id)
          .append("path")
          .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
          .attr("class", "mode-county-chorolpleth-states")
          .attr("d", path);
    }
  },

  // Modified from Mike Bostock's "Choropleth"
  // https://bl.ocks.org/mbostock/4060606
  stateChoropleth: function(o) {
    var id = alamode.makeId(10);

    var queryName = o["query_name"],
        stateColumn = o["state_column"],
        valueColumn = o["value_column"],
        code = o["state_code_type"], // Options: name, iso_code_numeric, iso_code_alpha_2, iso_code_alpha_3
        // Optional
        width = o["width"] || 950,
        height = o["height"] || width/1.9,
        title = o["title"] || queryName,
        valueRange = o["color_range"],
        colors = o["color_gradient"] || ["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#08519c","#08306b"],
        htmlElement = o["html_element"] || "body";

    var data = alamode.getDataFromQuery(queryName);

    var rateById = d3.map();

    var projection = d3.geoAlbersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    var uniqContainerClass = alamode.addContainerElement(htmlElement);

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)

    svg = d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-state-chorolpleth")
      .append("svg")
        .attr("id","mode-state-chorolpleth-" + id)
        .attr("width",width)
        .attr("height",height);

    data.forEach( function(d) {
      rateById.set(d[stateColumn],+d[valueColumn]);
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
        .defer(d3.json, "https://s3-us-west-2.amazonaws.com/mode-alamode/states.json")
        .await(ready);

    function ready(error, us) {

      d3.select("#mode-state-chorolpleth-" + id)
          .append("g")
          .attr("class","mode-state-chorolpleth-states")
        .selectAll(".mode-state-chorolpleth-states-" + id)
          .data(us.features)
        .enter().append("path")
          .attr("class","mode-state-chorolpleth-states-" + id)
          .attr("fill", function(d) { return quantize(rateById.get(d.properties[code]))})
          .attr("d", path);
    }
  },

  // Modified from Vida World Map
  // https://vida.io/gists/TWNbJrHvRcR3DeAZq
  worldChoropleth: function(o) {
    var id = alamode.makeId(10);

    var queryName = o["query_name"],
        countryColumn = o["country_column"],
        valueColumn = o["value_column"],
        code = o["country_code_type"], // Options: name, iso_code_numeric, iso_code_alpha_2, iso_code_alpha_3
        // Optional
        width = o["width"] || 950,
        height = o["height"] || width*.8,
        title = o["title"] || queryName,
        valueRange = o["color_range"],
        colors = o["color_gradient"] || ["#9ecae1","#6baed6","#4292c6","#2171b5","#08519c","#08306b"],
        htmlElement = o["html_element"] || "body";

    var data = alamode.getDataFromQuery(queryName);

    var rateById = d3.map();

    var projection = d3.geo.mercator()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, (height / 2) + (height * .1) ])
        .precision(.1);

    var path = d3.geoPath()
        .projection(projection);

    var uniqContainerClass = alamode.addContainerElement(htmlElement);

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-world-chorolpleth-legend")
        .attr("id","mode-world-chorolpleth-legend-" + id)
        .text("Hover over a country to see details")

    svg = d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-world-chorolpleth")
      .append("svg")
        .attr("id","mode-world-chorolpleth-" + id)
        .attr("width",width)
        .attr("height",height);

    data.forEach( function(d) {
      rateById.set(d[countryColumn],+d[valueColumn]);
    })

    if (!valueRange) {
      colorDomain = d3.extent(data, function(d) { return d[valueColumn]; });

      if(data.length <= 1){
        colorDomain.unshift(0)
      }
    } else {
      colorDomain = valueRange;
    }

    var quantize = d3.scale.quantize()
        .domain(colorDomain)
        .range(colors);

    queue()
        .defer(d3.json, "https://s3-us-west-2.amazonaws.com/mode-alamode/world.json")
        .await(ready);

    function ready(error, world) {

      d3.select("#mode-world-chorolpleth-" + id)
          .append("g")
          .attr("class", "mode-world-chorolpleth-countries-base")
        .selectAll(".mode-world-chorolpleth-countries")
          .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
          .attr("class","mode-world-chorolpleth-countries")
          .attr("fill", function(d) { return quantize(rateById.get(d.properties[code])); })
          .attr("d", path)
          .on("mouseover",function(d) {
            var country = d.properties.name;

            if (rateById.get(d.properties[code])) {
              value = rateById.get(d.properties[code]);
            } else {
              value = "--"
            }

            d3.select("#mode-world-chorolpleth-legend-" + id).text(country + ": " + value)
          })
          .on("mouseout",function(d) {
            d3.select("#mode-world-chorolpleth-legend-" + id).text("Hover over a country to see details")
          })

      d3.select("#mode-world-chorolpleth-" + id)
          .append("path")
          .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
          .attr("class", "mode-world-chorolpleth-boundaries")
          .attr("d", path);
    }
  },

  // Modified from Nicolas Kruchten's PivotTable.js
  // http://nicolas.kruchten.com/pivottable/
  pivotTable: function(o) {
    var id = alamode.makeId(10);

    var queryName = o["query_name"],
        defaultColumns = o["default_columns"],
        defaultRows = o["default_rows"],
        defaultValues = o["default_values"],
        editable = o["editable"],
        // Optional
        aggregator = o["aggregate_function"] || "Count",
        selectedRenderer = o["pivot_table_type"] || "Table",
        title = o["default_column_value"] || queryName,
        htmlElement = o["html_element"] || "body",
        defaultExclusions = o["default_exclusions"] || [],
        defaultInclusions = o["default_inclusions"] || [];

    if (!Array.isArray(defaultValues)) {
      defaultValues = [defaultValues]
    }

    var data = alamode.getDataFromQuery(queryName),
        columns = alamode.getColumnsFromQuery(queryName),
        columnNames = _.map(columns,"name");

    var uniqContainerClass = alamode.addContainerElement(htmlElement);

    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-graphic-title")
      .text(title)

    d3.select(uniqContainerClass)
      .append("div")
      .attr("class","mode-pivot-table")
      .attr("id",id)

    var transformedData = [];

    transformedData.push(columnNames);

    data.forEach(function(d) {
      var row = []
      columnNames.forEach(function(c) { row.push(d[c]); })
      transformedData.push(row)
    })

    if (editable) {
      $("#" + id).pivotUI(
        transformedData, {
          cols: defaultColumns,
          rows: defaultRows,
          aggregatorName: aggregator,
          vals: defaultValues,
          rendererName: selectedRenderer,
          exclusions: defaultExclusions,
          inclusions: defaultInclusions
        }
      )
    } else {
      var utils = $.pivotUtilities;
      var render =  utils.renderers[selectedRenderer];
      var agg =  utils.aggregators[aggregator];

      $("#" + id).pivot(
        transformedData, {
          cols: defaultColumns,
          rows: defaultRows,
          aggregator: agg(defaultValues),
          renderer: render,
          exclusions: defaultExclusions,
          inclusions: defaultInclusions
        }
      )
    }
  },

  pieChartLabels: function(o) {
    var showAll = o["show_all_labels"],
        chartId = o["chart_id"],
        chart = $("#" + chartId);

    var lookup = {};

    setInterval(function() {
      draw(chart, showAll)
    },300)

    function draw(chart, showAll) {

      chart.find(".nv-legendWrap .nv-series text").each(function(i) {
        var seriesName = $(this).text()

        chart.find(".nv-pieWrap .nv-pieLabels text").each(function(j) {
          var key = i + "-" + j;
              text = $(this).text();

          if (i == j && text != "" && text != lookup[key]) {
            text = seriesName + " - " + text;
          } else if (i == j && showAll && text != lookup[key]) {
            text = seriesName
          }

          lookup[key] = text
          $(this).text(text)
        })
      })
    }
  },

  bigNumberSparkline: function(o) {
    var chartId = "#" + o["chart_id"],
        x = o["x_axis_column"],
        y = o["value_column"],
        queryName = o["query_name"],
        svgId = alamode.makeId(12);

    var data = alamode.getDataFromQuery(queryName),
        cols = alamode.getColumnsFromQuery(queryName);

    if (x) {
      xMatch = _.filter(cols, { "name": x }),
      xType = xMatch[0].type;
    } else {
      xType = "string";
    }

    var sparkData = []

    data.forEach(function(d) {
      if (xType == "datetime" || xType == "timestamp" || xType == "date") {
        formattedX = d3.time.format.utc('%Y-%m-%d')(new Date(Date.parse(d[x])))
      } else {
        formattedX = d[x]
      }

      var obj = {"x": formattedX, "y": d[y]}
      sparkData.push(obj)
    })

    var box = $(chartId + " .chart-wrapper"),
        bigNumber = $(chartId + " .chart-big-number"),
        boxHeight = box.height(),
        boxWidth = box.width(),
        bigNumberHeight = bigNumber.height(),
        bottomPadding = (boxHeight - bigNumberHeight - 20);

    d3.select(chartId + " .chart-big-number").append("svg")
        .attr("height",bottomPadding)
        .attr("width",boxWidth)
        .attr("id",svgId)
      .append("g")
        .attr("transform", "translate(0," + bigNumberHeight + ")");

    nv.addGraph(function() {
      var chart = nv.models.sparklinePlus()
        .margin({ "left":15, "right":15 })
        .x(function(d,i) { return i; })
        .xTickFormat(function(d) { return sparkData[d].x; })
        .showLastValue(false)

      d3.select("#" + svgId)
        .datum(sparkData)
        .call(chart);

      return chart;
    });

    setTimeout(function() {
      d3.selectAll(chartId + " path")
        .style("stroke-width","2px")
        .style("stroke-linejoin","round")
        .style("stroke","#646C6C")

      d3.selectAll(chartId + " .nv-minValue")
        .style("fill","#EE7437")
        .style("stroke","#EE7437")
        .attr("r",3)

      d3.selectAll(chartId + " .nv-maxValue")
        .style("fill","#37B067")
        .style("stroke","#37B067")
        .attr("r",3)

      d3.selectAll(chartId + " .nv-currentValue")
        .style("fill","#22A3C0")
        .style("stroke","#22A3C0")
        .attr("r",3)
    },1000)
  },

  addLinkToBigNumber: function(o) {
    window["ALAMODE_CHARTS"] = window["ALAMODE_CHARTS"] || {};
    var chartToken = o["chart_id"].split('_')[1];
    window["ALAMODE_CHARTS"][chartToken] = o["url"];
  },

  forceDirectedGraph: function (o) {

    var id = alamode.makeId(10);

    var nodeQuery = o["node_query"],
        edgeQuery = o["edge_query"],
        htmlElement = o["html_element"] || "body",
        title = o["title"] || queryName,
        width = o["chart_width"] || "800",
        height = o["chart_height"] || "800",
        colors = o["group_colors"] || "",
        visibleLinks = o["links_to_show"] || 100;

    var nodes = alamode.getDataFromQuery(nodeQuery),
        initialLinks = alamode.getDataFromQuery(edgeQuery);

    var links = [];

    initialLinks.forEach(function(l) {
      var match1 = links.filter(function(d) { return d.target == l.source; }),
          match2 = match1.filter(function(d) { return d.source == l.target; });

      if (match2.length != 0) {
        match2["edge_size"] += l.edge_size;
      } else {
        links.push(l)
      }
    })

    links = links.sort(function(a, b) {return b.edge_size - a.edge_size} );
    links = links.slice(0,visibleLinks)

    nameMap = {};

    nodes.forEach(function(d,i) {
      d["id"] = i;
      nameMap[d.node] = i;
    })

    links.forEach(function(d) {
      d["source_id"] = nameMap[d.source];
      d["target_id"] = nameMap[d.target];
    })

    var uniqContainerClass = alamode.addContainerElement(htmlElement);

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-force-directed-graph")
        .style("width",width)
        .attr("id",id);

    var tip = d3.tip()
        .attr("class","mode-force-directed-graph-tooltip")
        .offset([-10, 0])
        .html(function(d) { return d.node; })

    var force = d3.layout.force()
        .linkDistance(40)
        .linkStrength(1)
        .size([width, height]);

    var svg = d3.select("#" + id).append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.call(tip);

    var graph = {"nodes": nodes, "links": links};

    var nodeSizeScale = d3.scale.linear()
        .domain( d3.extent(nodes, function(d) { return d.node_size; }) )
        .range([2,20]);

    var edgeSizeScale = d3.scale.linear()
        .domain( d3.extent(links, function(d) { return d.edge_size; }) )
        .range([1,10]);

    var edgeOpacityScale = d3.scale.linear()
        .domain( d3.extent(links, function(d) { return d.edge_size; }) )
        .range([0.1,0.9]);

    var nodes = graph.nodes.slice(),
        links = [],
        bilinks = [];

    graph.links.forEach(function(link) {

      var s = nodes[link.source_id],
          t = nodes[link.target_id],
          i = {};
          i["connections"] = link["edge_size"];

      nodes.push(i);
      links.push({source: s, target: i}, {source: i, target: t});
      bilinks.push([s, i, t]);
    });

    force
        .nodes(nodes)
        .links(links)
        .start();

    var link = svg.selectAll(".mode-force-directed-graph-link ")
        .data(bilinks)
      .enter().append("path")
        .attr("class", "mode-force-directed-graph-link")
        .style("stroke-width",function(d) { return edgeSizeScale(d[1]["connections"]); })
        .style("opacity",function(d) { return edgeOpacityScale(d[1]["connections"]); })

    var node = svg.selectAll(".mode-force-directed-graph-node")
        .data(graph.nodes)
      .enter().append("g")
        .attr("class", "mode-force-directed-graph-node")
        .call(force.drag);

    node.append("circle")
        .attr("r", function(d) { return nodeSizeScale(d.node_size); })
        .style("fill", function(d) {
          if (colors) {
            return colors[d.node_group];
          } else {
            return "#0E819A";
          }
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)

    force.on("tick", function() {
      link.attr("d", function(d) {
        return "M" + d[0].x + "," + d[0].y
                + "S" + d[1].x + "," + d[1].y
                + " " + d[2].x + "," + d[2].y;
        });

      node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    });
  },

  networkMatrix: function(o) {

    var id = alamode.makeId(10);

    var nodeQuery = o["node_query"],
        edgeQuery = o["edge_query"],
        htmlElement = o["html_element"] || "body",
        title = o["title"] || queryName,
        padding = o["padding_for_names"] || "200",
        width = o["chart_width"] || "800",
        height = o["chart_height"] || "800",
        colors = o["group_colors"] || "",
        leftLabel = o["left_label"] || "",
        topLabel = o["top_label"] || "";

    var margin = {top: padding, right: 10, bottom: 10, left: padding};

    var nodes = alamode.getDataFromQuery(nodeQuery),
        links = alamode.getDataFromQuery(edgeQuery);

    nameMap = {};

    nodes.forEach(function(d,i) {
      d["id"] = i;
      nameMap[d.node] = i;
    })

    links.forEach(function(d) {
      d["source_id"] = nameMap[d.source];
      d["target_id"] = nameMap[d.target];
    })

    var x = d3.scale.ordinal().rangeBands([0, width]);

    var z = d3.scale.linear()
        .domain(d3.extent(links, function(d) { return d.edge_size; }))
        .clamp(true);

    var uniqContainerClass = alamode.addContainerElement(htmlElement);

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-network-matrix-order-picker")
        .html('<p>Order: <select id="mode-network-matrix-order-picker-' + id + '">' +
          '<option value="name">Name</option>' +
          '<option value="count">Frequency</option>' +
          '<option value="group">Group</option></select>'
        )

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-network-matrix")
        .style("width",width)
        .attr("id",id);

    var tip = d3.tip()
        .attr("class","mode-network-matrix-tooltip")
        .offset([-10, 0])
        .html(function(d) { return d.z; })

    var svg = d3.select("#" + id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg.call(tip);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    graph = {"nodes":nodes, "links":links}

    var matrix = [],
        nodes = graph.nodes,
        n = nodes.length;

    nodes.forEach(function(node, i) {
      node.index = i;
      node.count = 0;
      matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
    });

    graph.links.forEach(function(link) {
      if (typeof(matrix[link.source_id][link.target_id]) !== "undefined") {
        matrix[link.source_id][link.target_id].z += link.edge_size;
        nodes[link.source_id].count += link.edge_size;
        nodes[link.target_id].count += link.edge_size;
      } else {
        matrix[link.source_id][link.target_id] = {};
        matrix[link.source_id][link.target_id]["z"] = 0;
      }

    });

    var orders = {
      name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].node, nodes[b].node); }),
      count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
      group: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].node_group, nodes[b].node_group); })
    };

    x.domain(orders.name);

    svg.append("text")
        .attr("class","mode-network-matrix-axis-label")
        .attr("x",(width + margin.left + margin.right) / 2)
        .attr("y",25)
        .attr("text-anchor","middle")
        .text(topLabel)

    svg.append("text")
        .attr("class","mode-network-matrix-axis-label")
        .attr("x",(height + margin.top + margin.bottom) / -2)
        .attr("y",25)
        .attr("transform","rotate(-90)")
        .attr("text-anchor","middle")
        .text(leftLabel)

    g.append("rect")
        .attr("class", "mode-network-matrix-background")
        .attr("width", width)
        .attr("height", height);

    var row = g.selectAll(".mode-network-matrix-row")
        .data(matrix)
      .enter().append("g")
        .attr("class", "mode-network-matrix-row")
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
        .each(row);

    row.append("line")
        .attr("class","mode-network-matrix-line")
        .attr("x2", width);

    row.append("text")
        .attr("class","mode-network-matrix-row-text")
        .attr("x", -6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "end")
        .text(function(d, i) { return nodes[i].node; });

    var column = g.selectAll(".mode-network-matrix-column")
        .data(matrix)
      .enter().append("g")
        .attr("class", "mode-network-matrix-column")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

    column.append("line")
        .attr("class","mode-network-matrix-line")
        .attr("x1", -width);

    column.append("text")
        .attr("class","mode-network-matrix-column-text")
        .attr("x", 6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text(function(d, i) { return nodes[i].node; });

    function row(row) {
      var cell = d3.select(this).selectAll(".mode-network-matrix-cell")
          .data(row.filter(function(d) { return d.z; }))
        .enter().append("rect")
          .attr("class", "mode-network-matrix-cell")
          .attr("x", function(d) { return x(d.x); })
          .attr("width", x.rangeBand())
          .attr("height", x.rangeBand())
          .style("fill-opacity", function(d) { return z(d.z); })
          .style("fill", function(d) { return nodes[d.x].node_group == nodes[d.y].node_group ? colors[nodes[d.x].node_group] : "#2B2B2B"; })
          .on("mouseover", function(d) {
            mouseover(d);
            tip.show(d);
          })
          .on("mouseout", function(d) {
            mouseout(d);
            tip.hide(d);
          });
    }

    function mouseover(p) {
      d3.selectAll(".mode-network-matrix-row-text").classed("active", function(d, i) { return i == p.y; });
      d3.selectAll(".mode-network-matrix-column-text").classed("active", function(d, i) { return i == p.x; });
    }

    function mouseout() {
      d3.selectAll("text").classed("active", false);
    }

    d3.select("#mode-network-matrix-order-picker-" + id).on("change", function() {
      order(this.value);
    });

    function order(value) {
      x.domain(orders[value]);

      var t = g.transition().duration(1000);

      t.selectAll(".mode-network-matrix-row")
          .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
        .selectAll(".mode-network-matrix-cell")
          .attr("x", function(d) { return x(d.x); });

      t.selectAll(".mode-network-matrix-column")
          .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
    }
  },

  hive: function(o) {

    d3.hive={},d3.hive.link=function(){function t(t,s){var u,h=a(r,this,t,s),i=a(n,this,t,s);h.a>i.a&&(u=i,i=h,h=u),i.a-h.a>Math.PI&&(h.a+=2*Math.PI);var e=h.a+(i.a-h.a)/3,c=i.a-(i.a-h.a)/3;return h.r0-h.r1||i.r0-i.r1?"M"+Math.cos(h.a)*h.r0+","+Math.sin(h.a)*h.r0+"L"+Math.cos(h.a)*h.r1+","+Math.sin(h.a)*h.r1+"C"+Math.cos(e)*h.r1+","+Math.sin(e)*h.r1+" "+Math.cos(c)*i.r1+","+Math.sin(c)*i.r1+" "+Math.cos(i.a)*i.r1+","+Math.sin(i.a)*i.r1+"L"+Math.cos(i.a)*i.r0+","+Math.sin(i.a)*i.r0+"C"+Math.cos(c)*i.r0+","+Math.sin(c)*i.r0+" "+Math.cos(e)*h.r0+","+Math.sin(e)*h.r0+" "+Math.cos(h.a)*h.r0+","+Math.sin(h.a)*h.r0:"M"+Math.cos(h.a)*h.r0+","+Math.sin(h.a)*h.r0+"C"+Math.cos(e)*h.r1+","+Math.sin(e)*h.r1+" "+Math.cos(c)*i.r1+","+Math.sin(c)*i.r1+" "+Math.cos(i.a)*i.r1+","+Math.sin(i.a)*i.r1}function a(t,a,r,n){var e=t.call(a,r,n),c=+("function"==typeof s?s.call(a,e,n):s)+i,o=+("function"==typeof u?u.call(a,e,n):u),M=u===h?o:+("function"==typeof h?h.call(a,e,n):h);return{r0:o,r1:M,a:c}}var r=function(t){return t.source},n=function(t){return t.target},s=function(t){return t.angle},u=function(t){return t.radius},h=u,i=-Math.PI/2;return t.source=function(a){return arguments.length?(r=a,t):r},t.target=function(a){return arguments.length?(n=a,t):n},t.angle=function(a){return arguments.length?(s=a,t):s},t.radius=function(a){return arguments.length?(u=h=a,t):u},t.startRadius=function(a){return arguments.length?(u=a,t):u},t.endRadius=function(a){return arguments.length?(h=a,t):h},t};

    var id = alamode.makeId(10);

    var nodeQuery = o["node_query"],
        edgeQuery = o["edge_query"],
        isNumeric = o["groups_are_numeric"],
        htmlElement = o["html_element"] || "body",
        title = o["title"] || queryName,
        width = o["chart_width"] || "800",
        height = o["chart_height"] || "800",
        colors = o["group_colors"] || "";

    var outerRadius = Math.min(width,height)/2 - 30,
        innerRadius = outerRadius * .2;

    var nodes = alamode.getDataFromQuery(nodeQuery),
        links = alamode.getDataFromQuery(edgeQuery);

    var groups = _.uniq(_.map(nodes,"node_group"))

    var nameMap = {};

    nodes.forEach(function(d) {
      if (isNumeric) {
        d.x = d.node_group;
      } else {
        d.x = groups.indexOf(d.node_group);
      }

      d.y = d.node_size;
      nameMap[d.node] = d;
    })

    links.forEach(function(l) {
      l.source = nameMap[l.source],
      l.target = nameMap[l.target];
    })

    var uniqContainerClass = alamode.addContainerElement(htmlElement);

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-graphic-title")
        .text(title)

    d3.select(uniqContainerClass)
        .append("div")
        .attr("class","mode-network-matrix")
        .style("width",width)
        .attr("id",id);

    if (isNumeric) {
      angle = d3.scale.linear()
          .domain(d3.extent(nodes, function(d) { return d.node_group; } ))
          .range([0, 2 * Math.PI]);
    } else {
      angle = d3.scale.ordinal()
          .domain(d3.range(groups.length + 1))
          .rangePoints([0, 2 * Math.PI]);
    }

    var radius = d3.scale.linear()
        .domain(d3.extent(nodes, function(d) { return d.node_size; } ))
        .range([innerRadius, outerRadius]);

    var tip = d3.tip()
        .attr("class","mode-hive-tooltip")
        .offset([-10, 0])
        .html(function(d) { return d.node; })

    var svg = d3.select("#" + id).append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    svg.call(tip);

    svg.selectAll(".mode-hive-axis")
        .data(d3.range(groups.length))
      .enter().append("line")
        .attr("class", "mode-hive-axis")
        .attr("transform", function(d) { return "rotate(" + degrees(angle(d)) + ")"; })
        .attr("x1", radius.range()[0])
        .attr("x2", radius.range()[1]);

    svg.selectAll(".mode-hive-link")
        .data(links)
      .enter().append("path")
        .attr("class", "mode-hive-link")
        .attr("d", d3.hive.link()
          .angle(function(d) { return angle(d.x); })
          .radius(function(d) { return radius(d.y); })
        )
        .style("stroke", function(d) { return colors[d.source.node_group]; });

    svg.selectAll(".mode-hive-node")
        .data(nodes)
      .enter().append("circle")
        .attr("class", "mode-hive-node")
        .attr("transform", function(d) { return "rotate(" + degrees(angle(d.x)) + ")"; })
        .attr("cx", function(d) { return radius(d.y); })
        .attr("r", 5)
        .style("fill", function(d) { return colors[d.node_group]; })
        .on("mouseover", function(d) {
          tip.show(d);

          d3.select(this).attr("class","mode-hive-node mode-hive-node-selected")

          d3.selectAll(".mode-hive-link")
              .data(links)
              .attr("class", function(l) {
                  if (l.source.node == d.node) {
                    return "mode-hive-link-selected";
                  } else if (l.target.node == d.node) {
                    return "mode-hive-link-selected";
                  } else {
                    return "mode-hive-link";
                  }
              });
        })
        .on("mouseout", function(d) {
          tip.hide(d);
          d3.select(this).attr("class","mode-hive-node")
          d3.selectAll(".mode-hive-link-selected").attr("class", "mode-hive-link")
        });

    function degrees(radians) {
      return radians / Math.PI * 180 - 90;
    }
  },

  conditionalFormattingByColumn: function(o) {
    var tableId = "#" + o["table_id"],
        queryName = o["query_name"],
        columnRules = o["column_rules"];

    var data = alamode.getDataFromQuery(queryName),
        columns = alamode.getColumnsFromQuery(queryName);

    var colIndex = {};

    setTimeout(function(){
      shade(columnRules)
    },1000)

    $(tableId).mousemove(function() {
      shade(columnRules)
    })

    function shade(columnRules) {

      var tableDiv = $(tableId + " table"),
          tableHeader = $(tableId + " .js-header-table"),
          headers = !tableHeader ? $(tableHeader).find("th") : $(tableId + " .js-col-header"),
          rows = tableDiv.find("tr"),
          columnIndex = 0;

      headers.each(function() {
        text = $(this).find(".axel-table-header-label").text()
        columnIndex = $(this).attr("data-axel-column")
        colIndex[text] = columnIndex;
      })

      columnRules.forEach(function(c) {
        c.rules.forEach(function(r) {

          var colorText = r.shade_text || false;

          if (r.type == "gradient") {
            drawGradient(c.column, r.color, colorText)
          } else if (r.type == "above" || r.type == "below" || r.type == "equal") {
            drawThreshold(c.column, r.type, r.value, r.color, colorText)
          }
        })
      })
    }

    function drawGradient(column, color, colorText) {

      var range = d3.extent(_.map(data, column));

      var scale = d3.scale.linear()
          .domain(range)
          .interpolate(d3.interpolateHsl)
          .range(color);

      var idx = colIndex[column];

      data.forEach(function(d,i) {
        var selector = tableId + " table [data-axel-rowkey='" + i + "'][data-axel-column='" + idx + "']",
            selectedColor = scale(d[column]),
            textColor = getTextColor(selectedColor),
            cell = $(selector);

        if (colorText) { cell.css("color",selectedColor); } else { cell.css( {"background":selectedColor,"color":textColor} ); }
      })
    }

    function drawThreshold(column, type, threshold, color, colorText) {

      var idx = colIndex[column];
      var textColor = getTextColor(color);

      data.forEach(function(d,i) {
        var selector = tableId + " table [data-axel-rowkey='" + i + "'][data-axel-column='" + idx + "']",
            cell = $(selector);

        if (type == "above" && d[column] >= threshold) {
          if (colorText) { cell.css("color",color); } else { cell.css( {"background":color,"color":textColor} ); }
        } else if (type == "below" && d[column] <= threshold) {
          if (colorText) { cell.css("color",color); } else { cell.css( {"background":color,"color":textColor} ); }
        } else if (type == "equal" && d[column] == threshold){
          if (colorText) { cell.css("color",color); } else { cell.css( {"background":color,"color":textColor} ); }
        }
      })
    }

    function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    function getTextColor(hex) {
      var isHex = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex);

      if (isHex) {
        rgb = hexToRgb(hex);
        o = Math.round(((parseInt(rgb.r) * 299) + (parseInt(rgb.g) * 587) + (parseInt(rgb.b) * 114)) /1000);
      } else {
        o = 255;
      }

      if (o > 125) {
        return "#2B2B2B";
      } else {
        return "#FCFCFC";
      }
    }
  },

  customizeTable: function (o) {
    window.dispatchAction({
      type: 'Embed.AlamodeCustomizeTable',
      payload: o
    });
  },

  conditionalFormattingByTable: function (o) {
    var tableId = "#" + o["table_id"],
        queryName = o["query_name"],
        includedColumns = o["columns"]
        rules = o["rules"];

    var data = alamode.getDataFromQuery(queryName),
        columns = alamode.getColumnsFromQuery(queryName);

    var colIndex = {};

    var combinedRange = [];

    includedColumns.forEach(function(c) {
      var range = d3.extent(_.map(data, c));
      combinedRange = combinedRange.concat(range);
    })

    var fullRange = d3.extent(combinedRange);

    setTimeout(function(){
      shade(rules)
    },1000)

    $(tableId).mousemove(function() {
      shade(rules)
    })

    function shade(rules) {

      var tableDiv = $(tableId + " table"),
          tableHeader = $(tableId + " .js-header-table"),
          headers = !tableHeader ? $(tableHeader).find("th") : $(tableId + " .js-col-header"),
          rows = tableDiv.find("tr"),
          columnIndex = 0;

      headers.each(function() {
        text = $(this).find(".axel-table-header-label").text()
        columnIndex = $(this).attr("data-axel-column")
        colIndex[text] = columnIndex;
      })

      rules.forEach(function(r) {

        var colorText = r.shade_text || false;

        if (r.type == "gradient" ) {
          drawGradient(r.color, colorText)
        } else if (r.type == "above" || r.type == "below" || r.type == "equal") {
          drawThreshold(r.type, r.value, r.color, colorText)
        }
      })
    }

    function drawGradient(color, colorText) {

      var scale = d3.scale.linear()
          .domain(fullRange)
          .interpolate(d3.interpolateHsl)
          .range(color);

      data.forEach(function(d,i) {
        includedColumns.forEach(function(c) {

          var idx = colIndex[c];

          var selector = tableId + " table [data-axel-rowkey='" + i + "'][data-axel-column='" + idx + "']",
              selectedColor = scale(d[c]),
              textColor = getTextColor(selectedColor),
              cell = $(selector);

          if (colorText) { cell.css("color",selectedColor); } else { cell.css( {"background":selectedColor,"color":textColor} ); }
        })
      })
    }

    function drawThreshold(type, threshold, color, colorText) {

      var textColor = getTextColor(color);

      data.forEach(function(d,i) {
        includedColumns.forEach(function(c) {

          var idx = colIndex[c];

          var selector = tableId + " table [data-axel-rowkey='" + i + "'][data-axel-column='" + idx + "']",
              cell = $(selector);

          if (type == "above" && d[c] >= threshold) {
            if (colorText) { cell.css("color",color); } else { cell.css( {"background":color,"color":textColor} ); }
          } else if (type == "below" && d[c] <= threshold) {
            if (colorText) { cell.css("color",color); } else { cell.css( {"background":color,"color":textColor} ); }
          } else if (type == "equal" && d[c] == threshold) {
            if (colorText) { cell.css("color",color); } else { cell.css( {"background":color,"color":textColor} ); }
          }

        })
      })
    }

    function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    function getTextColor(hex) {
      var isHex = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex);

      if (isHex) {
        rgb = hexToRgb(hex);
        o = Math.round(((parseInt(rgb.r) * 299) + (parseInt(rgb.g) * 587) + (parseInt(rgb.b) * 114)) /1000);
      } else {
        o = 255;
      }

      if (o > 125) {
        return "#2B2B2B";
      } else {
        return "#FCFCFC";
      }
    }
  },

  addTableOfContents: function(o){

    if (typeof(o) === 'undefined'){
      o = 'default';
    }

    var textColor = o["text_color"],
        backgroundColor = o["background_color"],
        hoverColor = o["hover_color"];

    $(".mode-header").addClass('has-nav');
    var nav = $("<nav class='fixed-nav-bar'></nav>")
    $(".row").each(function() {
      var cols = $(this).children();
      cols.each(function() {
        var title;
        var chartId = $(this).find('mode-chart').attr('id') || $(this).find('mode-table').attr('id') || $(this).find('mode-python').attr('id');
        if (!chartId) {
          return true;
        }
        if (chartId.includes("chart") || chartId.includes("table")) {
          var element = document.getElementById(chartId);
          if ($(element).find("mode-pivot-table").length > 0) {
            title = document.getElementById(chartId).getElementsByClassName("in-place-edit-text")[0].innerText;
          } else {
            title = document.getElementById(chartId).getElementsByClassName("chart-title")[0].innerText;
          }
        } else if (chartId.includes("python")) {
          title = document.getElementById(chartId).getElementsByClassName("in-place-edit-text")[0].innerText;
        }
        var newlink = $("<a class='scroll-link' href=" + '#' + chartId + ">" + (title.includes("Click to add title") ? "Untitled" : title) + "</a>")
        nav.append(newlink);
      });
    });
    var newdiv = $("<div class='mode-grid container''></div>");
    $(".mode-content").prepend(newdiv);
    var newrow = $("<div class='row'></div>");
    newdiv.prepend(newrow);
    var newcol = $("<div class='col-md-12'></div>")
    newrow.prepend(newcol);
    newcol.prepend(nav);
    if (!!textColor) {
      $(".fixed-nav-bar a").css("color", textColor);
    }
    if (!!backgroundColor) {
      $(".fixed-nav-bar").css("background-color", backgroundColor);
    }
    if (!!hoverColor) {
      $(".fixed-nav-bar a").hover(
        function() {
          $(this).css("color", hoverColor);
        },
        function() {
          if (!!textColor) {
            $(this).css("color", textColor);
          } else {
            $(this).css("color", "");
          }
        }
      );
    }
    setTimeout(function() {
      $('.scroll-link').on('click', function(event) {
        event.preventDefault();
        var sectionID = $(this).attr("href");
        scrollToID(sectionID, 750);
      });

      function scrollToID(id, speed) {
        var offSet = 50;
        var targetOffset = $(id).offset().top - offSet;
        $('html,body').animate({
          scrollTop: targetOffset
        }, speed);
        }
     }, 100);
  },

  xAnnotations: function(o){
    var chartId      = o["chart_id"],
        xValues      = o["comment_values"],
        comments     = o["comments"],
        commentColor = o["color"] || [],
        isDate       = o["is_date"] || false;

    setTimeout(function() {

      var highchartContainer = $("#" + chartId).find("div.highcharts-container")[0],
          highchartId = highchartContainer.id;

      var charts = Highcharts.charts;
          chart = charts.filter(function(c) { if (c) { return c.container.id == highchartId;}; })[0];
          data = chart.series[0].data;

      if (isDate) {
        for (i = 0; i < xValues.length; i++) {
          xValues[i] = new Date (xValues[i]).getTime();
        }
      }

      var points = data.filter(function(d) { if (d) { return xValues.indexOf(d.category) >= 0;}; });

      function addAnnotation(chart) {
        for (i = 0; i < points.length; i++) {
          var point = points[i];
          var color = commentColor[i] || point.color || "#FCFCFC";

          var text = chart.renderer.label(
              comments[i],
              point.plotX + chart.plotLeft,
              10,
              "callout",
              point.plotX + chart.plotLeft,
              point.plotY + chart.plotTop
            ).attr({
              "fill": '#FCFCFC',
              "stroke": color,
              "stroke-width": 1,
              "radius": 10,
              "zIndex": 4
            }).add();
        }
      }

      chart.update({
        chart: {
          events: {
            load: addAnnotation(chart)
           }
        }
      });
    }, 250);
  },

  barChartFunnel: function(o){
    var chartId      = o["chart_id"];

    setTimeout(function() {

      var highchartContainer = $("#" + chartId).find("div.highcharts-container")[0],
          highchartId = highchartContainer.id;

      var charts = Highcharts.charts;
          chart = charts.filter(function(c) { if (c) { return c.container.id == highchartId;}; })[0];
          data = chart.series[0].data;

          var pct = d3.format(".1%")
    var s2Color = chart.series[1].color


    chart.update({
      series: [{
        color: s2Color,
        opacity: 0.6
      }, {
        dataLabels: {
          enabled: true,
          useHTML: true,
          borderRadius: 5,
          padding: 20,
          formatter: function() {
            var idx = this.point.index;
            // var data = this.series.data;

            if (idx == 0) {
              return null
            } else {
              return pct(this.percentage / 100);
            }

            // if (idx < data.length - 1) {
            //   return pct(data[idx + 1].percentage / 100);
            // } else {
            //   return null;
            // }
          },
          border: "black",
          shape: "square",
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          style: {
            fontSize: "11px",
            color: "black",
            fontWeight: 100,
            color: '#FFFFFF',
            textOutline: 'none'
          }
        }
      }],

      plotOptions: {
        series: {
          dataLabels: {
            x: -210,
            y: 150
          }
        }
      }

    });

    let overallRate = pct(chart.yAxis[0].dataMin / chart.yAxis[0].dataMax)


    chart.renderer.text('Overall Rate'+'<br/><br/>'+overallRate, chart.plotSizeX - 20, chart.plotTop + 20)
      .attr({
        zIndex: 5
      })
      .css({
        fontSize: '14px',
        color: '#FFFFFF'
      })
      .add();


    chart.renderer.rect(chart.plotSizeX - 30, chart.plotTop, 124, 50, 2)
      .attr({
        'stroke-width': 2,
        stroke: 'black',
        fill: 'black',
        zIndex: 4
      })
      .add();


     
    }, 250);
  },

  highChartsSeriesColor:function(o){
    
    var seriesColors = o["series_Colors"]; 
       
 
    function consistentColors (series,seriesColors) {

      let seriesArray = new Array(series.length)


      for (var i = 0; i < seriesArray.length; i++) {


        let seriesColor = seriesColors.filter(function(s) {
          return s.seriesName === series[i].name
        });
        
        if(seriesColor[0] == null){
          console.log("Jon Color")
          seriesColor[0] = ''
        }
        
        console.log(seriesColor[0].color)

        seriesArray[i] = {
          color: seriesColor[0].color
        }

      }



      return seriesArray


    }
 
 
 var loadCallbacks = [];
 
   function appendOnLoadEvent(callback) {
     loadCallbacks.push(callback)
   }
   
   
 
   appendOnLoadEvent(function() {
 
 
   })
 
 
   H = Highcharts;
   H.Chart.prototype.callbacks.push(function(chart) {
     for (var i = 0; i < loadCallbacks.length; ++i) loadCallbacks[i].call(this, event);
 
     chart.update({
       series: consistentColors(this.series,seriesColors)
     })
 
       
     
 
 
   });
     
   }
   

}
