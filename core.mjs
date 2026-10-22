export const MAX_AGE=30*60*1000;
export function fresh(source,now=Date.now()) { const t=Date.parse(source?.updatedAt);return source?.status==='ok'&&Number.isFinite(t)&&now-t<=MAX_AGE&&t<=now+60000; }
export function distance(a,b) { const r=Math.PI/180,x=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.lon)*r/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(x))); }
export function inToronto(p){return Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&p.lat>=43.5&&p.lat<=43.95&&p.lon>=-79.75&&p.lon<=-79.05;}
export function select(data,{coords=null,radius=0,type='',sort='recent',now=Date.now()}={}) {
 return (data?.incidents||[]).filter(e=>fresh(data.sources?.[e.source],now)&&Number.isFinite(Date.parse(e.time))&&Date.parse(e.time)<=now+60000&&(e.source!=='police'||now-Date.parse(e.time)<=4*3600000)).map(e=>({...e,distance:coords&&inToronto({lat:e.lat,lon:e.lon})?distance(coords,e):null})).filter(e=>(!type||e.type===type)&&(!radius||(e.distance!==null&&e.distance<=radius))).sort((a,b)=>sort==='closest'?(a.distance??Infinity)-(b.distance??Infinity)||Date.parse(b.time)-Date.parse(a.time):Date.parse(b.time)-Date.parse(a.time));
}
