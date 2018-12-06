var polygonStyle = {
   "color": "#33cc33",
   "weight": 3,
   "opacity": 0.6,
   "cursor": "-webkit-grab",
   "cursor": "grab",
   "fillColor": "#33cc33",
};

var pointHoverStyle = {
    radius: 6,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

var pointStyle = {
    radius: 6,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

var chosenPointStyle = {
    radius: 6,
    fillColor: "#ed1c1c",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

var ul = document.getElementById("list");
var sortCategory = document.getElementById("dynamicSortCategory");
var square_metres = " m" + "2".sup();
var pathsColors = ['#42d9f4', '#f9c43e', '#a449e5', '#ea7ee1', '#76827d'];
var leafletmap = L.map('mapid').setView([48.7, 19.7], 8);
var peaksLayer = L.layerGroup([]);
var chosenPolygon = null;
var chosenPoint = null;
var pathPoints = [];
var hoverPolygon = null;
var hoverTime = 0;
var naturalParks = [];
var peaks = [];
var paths = [];

function showNaturalParks() {
    $.get('http://localhost:8081/national_parks', function(data) {
        leafletmap.eachLayer(function (layer) {
            leafletmap.removeLayer(layer);
        });
        clearPaths();

        peaks = [];
        paths = [];
        naturalParks = [];
        pathPoints = [];
        chosenPolygon = null;
        chosenPoint = null;

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox.streets',
            accessToken: 'pk.eyJ1IjoicGlyYXRlbiIsImEiOiJjam15cnc2MWwxNjN0M3BwbHl5azh0b2IxIn0.QshYKyAt2rk7JhPuvO9Mbw'
        }).addTo(leafletmap);

        for (var i = 0; i < data.length; i++) {
           var polygon = L.geoJSON(JSON.parse(data[i].geojson), polygonStyle).addTo(leafletmap);
           polygon.osm_id = data[i].osm_id;
           polygon.name = data[i].name;
           polygon.area = data[i].area;

           polygon.on('click', onPolyClick);
           polygon.on('mouseover', onPolygonMouseEnter);
           polygon.on('mouseout', onPolygonMouseExit);

           naturalParks.push(polygon);
        }

        sortNaturalParksAlphabetically();
    });

    sortCategory.innerHTML = '<input type="radio" name="optradio" value="area" >Rozlohy (v m<sup>2</sup>)';
    sortCategory.onclick = sortNaturalParksByArea;
    leafletmap.setView([48.7, 19.7], 8);
}

function populatePeaksInTable() {
    clearNavigationList();

    var li = document.createElement("li");
    var a = document.createElement("a");
    a.appendChild(document.createTextNode('Späť'));
    a.onclick = showNaturalParks;
    li.appendChild(a);
    ul.appendChild(li);

    for (var i = 0; i < peaks.length; i++) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.appendChild(document.createTextNode(peaks[i].name + " (" + peaks[i].ele + ")"));
        a.id = peaks[i].osm_id;
        a.onclick = function() { choosePeak(this.id) };
        a.onmouseenter = function() { onPeakNavigationHoverEnter(this.id) };
        a.onmouseleave = function() { onPeakNavigationHoverExit(this.id) };
        li.appendChild(a);
        ul.appendChild(li);
    }
}

function onPeakNavigationHoverEnter(osm_id) {
    leafletmap.eachLayer(function (layer) {
        if (layer.osm_id == osm_id) {
            layer.setStyle({'fillColor': '#42d9f4'});
        }
    });
}

function onPeakNavigationHoverExit(osm_id) {
    leafletmap.eachLayer(function (layer) {
        if (layer.osm_id == osm_id) {
            layer.setStyle(pointStyle);
        }
    });
}

function onParkNavigationHoverExit(osm_id) {
    leafletmap.eachLayer(function (layer) {
        if (layer.osm_id == osm_id) {
            layer.setStyle(polygonStyle);
        }
    });
}

function onParkNavigationHoverEnter(osm_id) {
    leafletmap.eachLayer(function (layer) {
        if (layer.osm_id == osm_id) {
            layer.setStyle({'fillColor': '#ed1c1c', 'color': '#ed1c1c'});
        }
    });
}

function populateNaturalParksInTable() {
    clearNavigationList();

    for (var i = 0; i < naturalParks.length; i++) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.appendChild(document.createTextNode(naturalParks[i].name + " (" + naturalParks[i].area + ")"));
        a.id = naturalParks[i].osm_id;
        a.onclick = function() { choosePark(this.id) };
        a.onmouseenter = function() { onParkNavigationHoverEnter(this.id) };
        a.onmouseleave = function() { onParkNavigationHoverExit(this.id) };
        li.appendChild(a);
        ul.appendChild(li);
    }
}

function clearNavigationList() {
    while(ul.firstChild) {
      ul.removeChild(ul.firstChild);
    }
}

function sortNaturalParksAlphabetically() {
    naturalParks.sort(compareAlphabetically);
    populateNaturalParksInTable();
}

function sortNaturalParksByArea() {
    naturalParks.sort(compareNaturalParksByArea);
    populateNaturalParksInTable();
}

function sortPeaksAlphabetically() {
    peaks.sort(compareAlphabetically);
    populatePeaksInTable();
}

function sortPeaksByElevation() {
    peaks.sort(comparePeaksByEle);
    populatePeaksInTable();
}

function comparePeaksByEle(a, b) {
    return b.ele - a.ele;
}

function compareAlphabetically(a, b) {
    return a.name.localeCompare(b.name);
}

function compareNaturalParksByArea(a, b) {
    return b.area - a.area;
}

function choosePark(osm_id) {
    peaksLayer.clearLayers();
    clearPaths();
    peaks = [];

    var latlng;

    leafletmap.eachLayer(function (layer) {
        if (layer.osm_id == osm_id) {
            latlng = layer.getBounds().getCenter();
            chosenPolygon = layer;

            layer.setStyle({
                   weight: 2,
                   color: '#666',
                   fillColor: 'white',
                   cursor: 'crosshair'
            });
        }
    });

    var parameters = { id: osm_id };
    $.get('http://localhost:8081/peaks', parameters, function(data) {
        for (var i = 0; i < data.length; i++) {
            var point = L.geoJSON(JSON.parse(data[i].geojson), {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, pointStyle);
                }
            });

            point.osm_id = data[i].osm_id;
            point.name = data[i].name;
            point.ele = data[i].ele;

            point.on('click', onPointClick);
            point.on('mouseover', onPointMouseEnter);
            point.on('mouseout', onPointMouseExit);
            peaks.push(point);

            peaksLayer.addLayer(point);
        }

        peaksLayer.addTo(leafletmap);
        sortPeaksAlphabetically();
        sortCategory.innerHTML = '<input type="radio" name="optradio" value="area" >Nadmorskej výšky';
        sortCategory.onclick = sortPeaksByElevation;
        leafletmap.setView(latlng, 12);
    });
}

function clearPaths() {
    for (var i = 0; i < paths.length; i++) {
        leafletmap.eachLayer(function (layer) {
            if (layer.osm_id == paths[i].osm_id) {
                leafletmap.removeLayer(layer);
            }
        });
    }
    paths = [];
    pathPoints = [];
    chosenPoint = null;
}

function choosePeak(osm_id) {
    var parameters = { osm_id: osm_id };

    clearPaths();

    $.get('http://localhost:8081/paths', parameters, function(data) {
        if (data.length == 0) {
            alert('K tomuto vrchu nebola nájdená žiadna cesta');
            return;
        }

        for (var i = 0; i < data.length; i++) {
            var path = L.geoJSON(JSON.parse(data[i].geojson)).addTo(leafletmap);

            path.osm_id = data[i].osm_id;
            path.name = data[i].name;
            path.setStyle({'color': pathsColors[i % 5]});
            paths.push(path);
        }
    });
}

var onPolyClick = function(event) {
    var osm_id = event.target.osm_id;

    if (chosenPolygon) {
        chosenPolygon.setStyle(polygonStyle);
    }

    choosePark(osm_id);
};

var onPolygonMouseEnter = function(event) {
    if (chosenPolygon == event.target) {
        return;
    }
    if (chosenPolygon == null) {
        document.getElementById(event.target.osm_id).style.color = 'red';
    }
    event.target.setStyle({'fillColor': '#ed1c1c', 'color': '#ed1c1c'});
};

var onPolygonMouseExit = function(event) {
    if (chosenPolygon == event.target) {
        return;
    }
    if (chosenPolygon == null) {
        document.getElementById(event.target.osm_id).style.color = '';
    }
    event.target.setStyle(polygonStyle);
};

var onPointMouseEnter = function(event) {
    if (chosenPoint == null) {
        document.getElementById(event.target.osm_id).style.color = 'red';
    }

    if (chosenPoint == event.target || isPointInPathPoints(event.target)) {
        return;
    }
    event.target.setStyle({'fillColor': '#42d9f4'});
};

var onPointMouseExit = function(event) {
    if (chosenPoint == null) {
        document.getElementById(event.target.osm_id).style.color = '';
    }

    if (chosenPoint == event.target || isPointInPathPoints(event.target)) {
        return;
    }
    event.target.setStyle(pointStyle);
};

function isPointInPathPoints(point) {
    for (var i = 0; i < pathPoints.length; i++) {
        if (pathPoints[i] == point) {
            return 1;
        }
    }
    return 0;
}

var onPointClick = function(event) {
    choosePeak(event.target.osm_id);
};

$(document).ready(function() {
  $('input').click(function() {
      if (peaks.length == 0) {
          sortNaturalParksAlphabetically();
      } else {
          sortPeaksAlphabetically();
      }
  });
});

showNaturalParks();
