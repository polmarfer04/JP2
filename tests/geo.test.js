import {test} from 'node:test';import assert from 'node:assert/strict';
import {validCoords,hasLocation,parseCoords} from '../src/geo.js';
test('Activity locations: coordinate validation and Google Maps parsing',()=>{
 assert.equal(validCoords('',''),true);assert.equal(validCoords(undefined,undefined),true);
 assert.equal(validCoords('34.6937','135.5023'),true);assert.equal(validCoords('-33.9','151.2'),true);
 assert.equal(validCoords('91','10'),false);assert.equal(validCoords('10','181'),false);assert.equal(validCoords('34.6',''),false);assert.equal(validCoords('abc','1'),false);assert.equal(validCoords(34,135),false);
 assert.equal(hasLocation({lat:'35.0116',lng:'135.7681'}),true);assert.equal(hasLocation({}),false);
 assert.deepEqual(parseCoords('34.6937, 135.5023'),{lat:'34.6937',lng:'135.5023'});
 assert.deepEqual(parseCoords('https://www.google.com/maps/place/Fushimi+Inari/@34.9671402,135.7726717,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d34.9676945!4d135.7791876'),{lat:'34.967695',lng:'135.779188'});
 assert.deepEqual(parseCoords('https://maps.google.com/?q=35.6586,139.7454'),{lat:'35.6586',lng:'139.7454'});
 assert.equal(parseCoords('https://maps.app.goo.gl/abc123'),null);assert.equal(parseCoords('Templo Kinkaku-ji'),null);assert.equal(parseCoords('120, 10'),null);
});
