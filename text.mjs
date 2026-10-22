/** Display translations shared by incident cards, type choices and location labels.
 * Raw feed fields, filter keys, IDs and map queries remain unchanged.
 */
export const ACRONYMS = new Set(['TPS','TFS','EMS','CPR','AED','MVC','DVP','QEW','OPP','TTC','GO','CN','CP','UHN','TMU','UOFT','YMCA','YWCA','NY','EY','SC','TT','ET']);
export const ADDRESS_WORDS = Object.freeze({ave:'Ave',avenue:'Avenue',blvd:'Blvd',boulevard:'Boulevard',bldg:'Bldg',building:'Building',cres:'Cres',crescent:'Crescent',ct:'Ct',court:'Court',dr:'Dr',drive:'Drive',e:'E',east:'East',flr:'Flr',floor:'Floor',ln:'Ln',lane:'Lane',n:'N',north:'North',pkwy:'Pkwy',parkway:'Parkway',pl:'Pl',place:'Place',rd:'Rd',road:'Road',rm:'Rm',room:'Room',s:'S',south:'South',st:'St',street:'Street',ste:'Ste',suite:'Suite',unit:'Unit',w:'W',west:'West'});
const SMALL_WORDS = new Set(['a','an','and','at','by','for','from','in','of','on','or','the','to','with']);
const cap=s=>s?s[0].toLocaleUpperCase('en-CA')+s.slice(1).toLocaleLowerCase('en-CA'):s;
function tokenTitle(token,address,first){
 const upper=token.toUpperCase(),lower=token.toLowerCase();
 if(ACRONYMS.has(upper))return upper;
 if(address&&ADDRESS_WORDS[lower])return ADDRESS_WORDS[lower];
 if(/^(?:[A-Z]\d[A-Z]|\d[A-Z]\d|[A-Z]\d[A-Z]\d[A-Z]\d)$/i.test(token))return upper;
 // Preserve apparatus, division, highway and apartment identifiers.
 if(/^(?:[a-z]+\d+[a-z\d]*|\d+[a-z]+)$/i.test(token))return upper;
 if(!address&&!first&&SMALL_WORDS.has(lower))return lower;
 if(/^mcdonald'?s$/i.test(token))return 'McDonald’s';
 if(/^mc\p{L}/iu.test(token)&&token.length>3)return 'Mc'+cap(token.slice(2));
 return token.split(/(['’])/).map((part,i,parts)=>part==="'"||part==='’'?'’':parts[i-1]==="'"||parts[i-1]==='’'?part.toLowerCase()==='s'?'s':cap(part):cap(part)).join('');
}
export function toTitleCase(value,{address=false}={}){
 let first=true;
 return String(value??'').normalize('NFKC').replace(/[\u2018\u2019\u02bc]/g,"'").replace(/\s+/g,' ').trim().replace(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu,(token,offset,all)=>{
  const start=first||/[:–—·/]\s*$/.test(all.slice(0,offset))||/\s-\s*$/.test(all.slice(0,offset));first=false;return tokenTitle(token,address,start);
 }).replace(/'/g,'’');
}
export const formatEventName=value=>toTitleCase(value);
export function formatAddress(value){
 return toTitleCase(value,{address:true}).replace(/\b([A-Z]\d[A-Z])\s*(\d[A-Z]\d)\b/g,'$1 $2').replace(/\s*,\s*/g,', ');
}
export const formatDetail=value=>toTitleCase(value);
