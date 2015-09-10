var fs = require('fs');

var Canvas = require('canvas');
var Image = Canvas.Image;

var cwidth = 3150;
var cheight = 5512;
var canvas = new Canvas(cwidth, cheight);
var ctx = canvas.getContext('2d');
var face_width, face_height;

var imgtotal = 0;
var loadImage = function(url, location) {
  var i = new Image();
  i.onload = function() {
    if (imgtotal % 500 === 0) {
      console.log(imgtotal);
    }
    ctx.drawImage(i, location[0], location[1], face_width, face_height);
    imgtotal++;
  };
  i.src = __dirname + '/static/faces/' + url;
};

var gj = require(__dirname + '/static/country.json');

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
}

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
  return [Math.round(x / 3) + 150, Math.round(y / 3) + 3430];
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
	return null;
}
function findRightBound (y) {
	for (var px = cwidth; px >= 0; px--) {
	  var relativepx = 4 * ((cwidth * y) + px);
	  if (canvasdata[relativepx + 3] > 0) {
		// drawn area
		return px + Math.ceil(face_width / 2);
	  }
	}
	return null;
}

var faces = fs.readdirSync(__dirname + '/static/faces');

console.log('total: ' + faces.length + ' faces');

faces.sort(function() {
  return Math.random() - 0.5;
});

var totalpix = cwidth * cheight;
var pix_per_face = totalpix / (faces.length - 1) / 3.9;
// 3 width : 4 height ratio
var pix_unit = Math.pow(pix_per_face / 12, 0.5);
face_width = Math.round(pix_unit * 3);
face_height = Math.round(pix_unit * 4);

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
		if (cursor[0] === null) {
		  console.log((f+1) + "/" + faces.length + " photos loaded");
      var output = fs.createWriteStream(__dirname + '/map.png')
      var stream = canvas.pngStream()
        .on('data', function(chunk){
          output.write(chunk);
        })
        .on('end', function(){
          console.log('saved png');
        });
		  break;
		}
		if (!cursor[0] && cursor[0] !== 0) {
		  console.log(f + " / " + faces.length);
      var output = fs.createWriteStream(__dirname + '/map.png')
      var stream = canvas.pngStream()
        .on('data', function(chunk){
          output.write(chunk);
        })
        .on('end', function(){
          console.log('saved png');
        });
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

if (f >= faces.length) {
  var output = fs.createWriteStream(__dirname + '/map.png')
  var stream = canvas.pngStream()
    .on('data', function(chunk){
      output.write(chunk);
    })
    .on('end', function(){
      console.log('saved png');
    });
}
