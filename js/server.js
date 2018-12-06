//var GeoJSON = require('geojson');
var express = require('express');
var app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var pgp = require('pg-promise')();
var db = pgp('postgres://postgres:1234@localhost:5432/postgres');

var server = app.listen(8081, function () {
   console.log("Server listening")
})

var nationalParksQuery = `SELECT * FROM (
                              SELECT osm_id, name, ST_AsGeoJSON(ST_Transform(way, 4326)) AS geojson, round(ST_Area(way) * 10^(-6)) AS area
                              FROM planet_osm_polygon WHERE boundary = 'national_park') AS a
                            WHERE a.area > 10`;
var peaksQuery = `SELECT point.osm_id, point.name, point.ele, ST_AsGeoJson(ST_Transform(point.way, 4326)) AS geojson FROM planet_osm_point point
                  JOIN planet_osm_polygon AS polygon
                  ON ST_WITHIN(point.way, polygon.way)
                  WHERE point."natural" = 'peak'
                  AND point.ele <> '' AND point.name <> ''
                  AND polygon.osm_id = `;
var getPathsQuery = `SELECT line.osm_id AS line_osm_id, line.name AS line_name, ST_AsGeoJSON(ST_Transform(line.way, 4326)) AS line_geojson,
                        point2.osm_id AS point_osm_id FROM planet_osm_point point
                      JOIN planet_osm_line line
                      ON ST_INTERSECTS(ST_Buffer(point.way, 200), line.way)
                      JOIN planet_osm_point point2
                      ON ST_INTERSECTS(ST_Buffer(point2.way, 200), line.way)
                      WHERE (line.route = 'hiking' OR line.foot = 'yes')
                      AND point2."natural" = 'peak'
                      AND point.osm_id = {1}
                      ORDER BY line.osm_id`;



app.get('/national_parks', function (req, res) {
   console.log("Got a GET request for /national_parks");

   db.any(nationalParksQuery)
     .then(function (data) {
       console.log('success')
       res.send(data);
     })
     .catch(function (error) {
       console.log('ERROR:', error)
       res.send('error');
     })
})

function Path(osm_id, name, geojson) {
  this.osm_id = osm_id;
  this.name = name;
  this.geojson = geojson;
  this.points = [];
}

app.get('/paths', function (req, res) {
   console.log("Got a GET request for /paths");

   db.any(getPathsQuery.replace('{1}', req.query.osm_id))
     .then(function (data) {
       console.log('success')

       var pathsList = [];
       var path = new Path(null, null, null);

       for (var i = 0; i < data.length; i++) {
           var record = data[i];
           if (path.osm_id != record.line_osm_id) {
               path = new Path(record.line_osm_id, record.line_name, record.line_geojson);
               path.points[0] = record.point_osm_id;
               pathsList.push(path);
           } else {
               path.points.push(record.point_osm_id);
           }
       }
       res.send(pathsList);
     })
     .catch(function (error) {
       console.log('ERROR:', error)
       res.send('error');
     })
})

app.get('/peaks', function (req, res) {
   console.log("Got a GET request for /peaks");

   db.any(peaksQuery + req.query.id)
     .then(function (data) {
       console.log('success')
       res.send(data);

     })
     .catch(function (error) {
       console.log('ERROR:', error)
       res.send('error');
     })
})
