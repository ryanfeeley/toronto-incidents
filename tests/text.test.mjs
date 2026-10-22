import {test} from 'node:test';
import assert from 'node:assert/strict';
import {formatEventName,formatAddress,formatDetail} from '../text.mjs';
test('event names use DineSafe-style title case and small words',()=>{
 assert.equal(formatEventName('FIRE -  HIGHRISE RESIDENTIAL'),'Fire - Highrise Residential');
 assert.equal(formatEventName('RESCUE - WATER/ICE - NO FIREBOAT'),'Rescue - Water/Ice - No Fireboat');
 assert.equal(formatEventName('THEFT OF A VEHICLE'),'Theft of a Vehicle');
 assert.equal(formatEventName('MEDICAL'),'Medical');
 assert.equal(formatEventName('MVC WITH EMS'),'MVC with EMS');
});
test('Toronto addresses preserve street suffixes, directions and borough codes',()=>{
 assert.equal(formatAddress('  ASHBRIDGES BAY PARK RD - LAKE SHORE BLVD E '),'Ashbridges Bay Park Rd - Lake Shore Blvd E');
 assert.equal(formatAddress('JANE ST, NY · FIRGROVE CRES / YEWTREE BLVD'),'Jane St, NY · Firgrove Cres / Yewtree Blvd');
 assert.equal(formatAddress('100 QUEEN STREET WEST, UNIT 4B'),'100 Queen Street West, Unit 4B');
 assert.equal(formatAddress('M3C'),'M3C');assert.equal(formatAddress('m4k1n6'),'M4K 1N6');
});
test('proper-name punctuation, accents and special capitalization',()=>{
 assert.equal(formatAddress("O’CONNOR DR / ST. CLAIR AVE W"),'O’Connor Dr / St. Clair Ave W');
 assert.equal(formatAddress('MCDONALD’S / MCCAUL ST'),'McDonald’s / McCaul St');
 assert.equal(formatAddress('ÉGLISE ST'),'Église St');
});
test('detail formatting retains unit and division identifiers',()=>{
 assert.equal(formatDetail('ALARM 2 · UNITS A142, CMD30C, HR114, P112'),'Alarm 2 · Units A142, CMD30C, HR114, P112');
 assert.equal(formatDetail('DIVISION D55'),'Division D55');
});
test('formatting is null-safe, idempotent and leaves source records intact',()=>{
 assert.equal(formatAddress(null),'');assert.equal(formatEventName(undefined),'');
 const raw={type:'FIRE',address:'JANE ST, NY'};const before=JSON.stringify(raw);
 for(const f of [formatEventName,formatAddress,formatDetail]){const text=f(raw.address);assert.equal(f(text),text);}
 assert.equal(JSON.stringify(raw),before);
 assert.equal(formatAddress('43.67, -79.35'),'43.67, -79.35');
});
