## faces-map

<img src="https://raw.githubusercontent.com/mapmeld/faces-map/master/minifiedmap.png"/>

Fill a GeoJSON shape with photo thumbnails

Goal: use imagemagick to shrink images to better size, output image directly from node-canvas

Created for the 2015 Myanmar elections

## Usage

Put a GeoJSON FeatureCollection as static/country.geojson

Put many images in the static/faces directory. Run imagemagick to make them smaller

```bash
brew install imagemagick
cd static/faces
mogrify -path ./ -resize 20% -format jpg *.png
rm *.png
```

Run this to see the map:

```bash
npm install
npm start
```

## License

Open source with an MIT license
