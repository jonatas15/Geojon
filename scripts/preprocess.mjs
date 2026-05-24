import shapefile from 'shapefile';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const SHP = 'shapefile/ide_2002_mg_potencialidade_cavidades_pol.shp';
const OUT = 'public/data/cavidades.geojson';

if (!existsSync('public/data')) {
  await mkdir('public/data', { recursive: true });
}

console.log('Lendo shapefile...');
const source = await shapefile.open(SHP, undefined, { encoding: 'latin1' });
const features = [];
let id = 0;

let result = await source.read();
while (!result.done) {
  const feature = result.value;
  feature.id = id++;
  if (feature.properties?.metodologi) {
    feature.properties.metodologi = feature.properties.metodologi.trim();
  }
  features.push(feature);
  result = await source.read();
}

const geojson = { type: 'FeatureCollection', features };
const json = JSON.stringify(geojson);

await writeFile(OUT, json, 'utf8');
const mb = (json.length / 1024 / 1024).toFixed(2);
console.log(`✓ ${features.length} feições → ${OUT} (${mb} MB)`);

const grades = {};
for (const f of features) {
  const g = f.properties?.grau_de_po || 'N/A';
  grades[g] = (grades[g] || 0) + 1;
}
console.log('Distribuição por grau:', grades);
