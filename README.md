## faces-map

[![Greenkeeper badge](https://badges.greenkeeper.io/mapmeld/faces-map.svg)](https://greenkeeper.io/)

<img src="https://raw.githubusercontent.com/mapmeld/faces-map/master/minifiedmap.png"/>

Fill a GeoJSON shape with photo thumbnails

Created for the 2015 Myanmar elections

## Usage

Put a GeoJSON FeatureCollection as static/country.json

Put many images in the static/faces directory. Run imagemagick to make them smaller

```bash
brew install imagemagick
cd static/faces
mogrify -path ./ -resize 20% -format jpg *.png
rm *.png
```

Run this to see the map on http://localhost:8080

```bash
npm install
npm start
```

Run this to create an image from the command line

```bash
npm install
node cli.js
```

Output is map.png

## License

Open source with an MIT license
