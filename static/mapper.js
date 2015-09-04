var canvas = $("canvas")[0];
var ctx = canvas.getContext('2d');
var cwidth = $("canvas").width();
var cheight = $("canvas").height();
var face_width, face_height;

var imgtotal = 0;
var loadImage = function(url, location) {
  var i = new Image();
  i.onload = function() {
    ctx.drawImage(i, location[0], location[1], face_width, face_height);
    imgtotal++;
  };
  i.src = '/faces/' + url;
};

$.getJSON('/country.geojson', function (gj) {
  /*
  function dedupe(coordinates) {
    var outcoord = [];
    var lastcoord = [0, 0];
    for (var c = 0; c < coordinates.length; c++) {
      if (typeof coordinates[c][0] === 'number') {
        if (coordinates[c][0] != lastcoord[0] || coordinates[c][1] != lastcoord[1]) {
          lastcoord = [coordinates[c][0], coordinates[c][1]];
          outcoord.push( lastcoord.concat([]) );
        }
      } else {
        coordinates[c] = dedupe(coordinates[c]);
      }
    }
    if (outcoord.length) {
      coordinates = outcoord;
    }
    return coordinates;
  }
  for (var f = 0; f < gj.features.length; f++) {
    gj.features[f].geometry.coordinates = dedupe(gj.features[f].geometry.coordinates);
  }
  console.log(JSON.stringify(gj));
  */

  function ptinpoly(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

  // bounds = [west, south, east, north]
  function findBounds(bounds, coordinates) {
    for (var c = 0; c < coordinates.length; c++) {
      if (typeof coordinates[c][0] === 'number') {
        bounds = [
          Math.min(bounds[0], coordinates[c][0]),
          Math.min(bounds[1], coordinates[c][1]),
          Math.max(bounds[0], coordinates[c][0]),
          Math.max(bounds[1], coordinates[c][1])
        ];
      } else {
        bounds = findBounds(bounds, coordinates[c]);
      }
    }
    return bounds;
  }

  var bounds = findBounds([180, 90, -180, 90], gj.features[0].geometry.coordinates);
  function lltopt (lnglat) {
    var x = (lnglat[0] - bounds[0]) / (bounds[2] - bounds[0]) * cwidth;
    var y = (bounds[3] - lnglat[1]) / (bounds[3] - bounds[1]) * cheight;
    return [Math.round(x / 3), Math.round(y / 3) + 2200];
  }

  function pttoll (pt) {
    var x = pt[0] * 3 / cwidth * (bounds[2] - bounds[0]);
    var y = (pt[1] - 2200) * 3 / cheight * (bounds[3] - bounds[1]);

    x += bounds[0];
    y = bounds[3] - y;
    console.log([x, y]);
    return [x, y];
  }

  var gjpoints = [];
  function mapFeatures(coordinates) {
    if (typeof coordinates[0][0] === 'number') {
      var start = lltopt(coordinates[0]);
      gjpoints = [start];
      ctx.moveTo(start[0], start[1]);
      ctx.beginPath();

      for (var c = 1; c < coordinates.length; c++) {
        var pt = lltopt(coordinates[c]);
        gjpoints.push(pt);
        ctx.lineTo(pt[0], pt[1]);
        ctx.moveTo(pt[0], pt[1]);
      }
      ctx.lineTo(start[0], start[1]);
      ctx.stroke();
    } else {
      //coordinates.map(mapFeatures);
      mapFeatures(coordinates[0]);
    }
  }

  //ctx.strokeWidth = '4px';
  mapFeatures(gj.features[0].geometry.coordinates);

  var canvasdata = ctx.getImageData(0, 0, cwidth, cheight).data;
  function findLeftBound (y) {
    for (var px = 0; px < cwidth; px++) {
      var relativepx = 4 * ((cwidth * y) + px);
      if (canvasdata[relativepx + 3] > 0) {
        // drawn area
        return px - Math.ceil(face_width / 2);
      }
    }
    return findLeftBound(y + 30);

  }
  function findRightBound (y) {
    for (var px = cwidth; px >= 0; px--) {
      var relativepx = 4 * ((cwidth * y) + px);
      if (canvasdata[relativepx + 3] > 0) {
        // drawn area
        return px + Math.ceil(face_width / 2);
      }
    }
    return findRightBound(y + 30);
  }

  $.getJSON("/all", function (faces) {
    faces.sort(function() {
      return Math.random() - 0.5;
    });

    var totalpix = cwidth * cheight;
    var pix_per_face = totalpix / (faces.length - 1) / 4.25;
    // 3 width : 4 height ratio
    var pix_unit = Math.ceil(Math.pow(pix_per_face / 12, 0.5));
    face_width = pix_unit * 3;
    face_height = pix_unit * 4;

    var cursor = [findLeftBound(face_height / 2), Math.round(face_height * 1.5)];
    var rightBound = findRightBound(face_height / 2);
    var inClearing = false;

    for (var f = 0; f < faces.length; f++) {
      if (faces[f].indexOf("README") > -1) {
        continue;
      }
      if (cursor[0] + face_width >= rightBound) {
        inClearing = false;
        loadImage(faces[f], cursor.concat([]));
        cursor[1] += face_height;
        cursor[0] = findLeftBound(cursor[1] + Math.ceil(face_height / 2));
        if (!cursor[0]) {
          console.log(f + " / " + faces.length);
          break;
        }
        rightBound = findRightBound(cursor[1] + Math.ceil(face_height / 2));
      } else if (!ptinpoly([cursor[0] + face_width, cursor[1] + face_height / 2], gjpoints)) {
        if (inClearing) {
          f--;
        } else {
          loadImage(faces[f], cursor.concat([]));
          inClearing = true;
        }
      } else {
        inClearing = false;
        loadImage(faces[f], cursor.concat([]));
      }
      cursor[0] += face_width;
    }
  });
});
