"""Fetch official current feeds. Never retain incidents from a failed source."""
import json, os, urllib.request, urllib.parse, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

POLICE='https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/C4S_Public_NoGO/FeatureServer/0'
FIRE='https://www.toronto.ca/data/fire/livecad.xml'
UTC=timezone.utc
TORONTO=ZoneInfo('America/Toronto')

def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'TorontoIncidents/1.0 (https://github.com/ryanfeeley/toronto-incidents)','Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=30) as r:
        return r.read()

def local_time(value):
    dt=datetime.fromisoformat(value)
    # Ambiguous fall-back timestamps cannot establish freshness unambiguously.
    if dt.tzinfo is None:
        a,b=dt.replace(tzinfo=TORONTO,fold=0),dt.replace(tzinfo=TORONTO,fold=1)
        if a.utcoffset()!=b.utcoffset():
            raise ValueError('Ambiguous local timestamp')
        dt=a
    return dt.astimezone(UTC)

def iso(dt): return dt.isoformat().replace('+00:00','Z')
def epoch(ms): return datetime.fromtimestamp(ms/1000,UTC)
def check_time(dt,now):
    if not -60 <= (now-dt).total_seconds() <= 1800:
        raise ValueError('Official source timestamp is expired or invalid; incidents hidden.')

def police(now,fetch=get):
    meta=json.loads(fetch(POLICE+'?f=json'))
    updated=epoch(meta['editingInfo']['lastEditDate']);check_time(updated,now)
    url=POLICE+'/query?'+urllib.parse.urlencode({'where':'1=1','outFields':'*','outSR':'4326','f':'json'})
    payload=json.loads(fetch(url))
    if payload.get('error') or payload.get('exceededTransferLimit') or not isinstance(payload.get('features'),list):
        raise ValueError('Police response incomplete or invalid')
    incidents=[]
    for f in payload['features']:
        a=f['attributes'];ms=a.get('OCCURRENCE_TIME_AGOL')
        if not isinstance(ms,(int,float)): raise ValueError('Police UTC time missing')
        time=epoch(ms)
        if not -60 <= (now-time).total_seconds() <= 14400: continue
        lat,lon=a.get('LATITUDE'),a.get('LONGITUDE')
        if not isinstance(lat,(int,float)) or not isinstance(lon,(int,float)) or not 43.5<=lat<=43.95 or not -79.75<=lon<=-79.05:lat=lon=None
        incidents.append({'id':'TPS-'+str(a['OBJECTID']),'source':'police','type':a['CALL_TYPE'],'time':iso(time),'address':a.get('CROSS_STREETS') or 'Location withheld','lat':lat,'lon':lon,'detail':'Division '+str(a.get('DIVISION') or 'unknown')})
    return updated,incidents

def fire(now,fetch=get):
    root=ET.fromstring(fetch(FIRE))
    if root.tag!='tfs_active_incidents': raise ValueError('Unexpected Fire schema')
    updated=local_time(root.findtext('update_from_db_time'));check_time(updated,now)
    incidents=[]
    for e in root.findall('event'):
        text=lambda k:(e.findtext(k) or '').strip()
        time=local_time(text('dispatch_time'))
        if time>now: raise ValueError('Future Fire dispatch timestamp')
        prime=text('prime_street');cross=text('cross_streets').strip(' /')
        address=' · '.join(x for x in (prime,cross) if x) or 'Location withheld'
        if not text('event_num') or not text('event_type'):raise ValueError('Fire record missing required fields')
        # The official feed has no coordinates. Do not guess medical postal areas,
        # street midpoints or exact locations from an approximate published street.
        incidents.append({'id':text('event_num'),'source':'fire','type':text('event_type'),'time':iso(time),'address':address,'lat':None,'lon':None,'detail':'Alarm '+text('alarm_lev')+' · Units '+(text('units_disp') or 'not listed')})
    return updated,incidents

def collect(now=None,fetch=get):
    now=now or datetime.now(UTC);result={'schemaVersion':1,'generatedAt':iso(now),'sources':{},'incidents':[]}
    for name,loader in [('police',police),('fire',fire)]:
        try:
            updated,rows=loader(now,fetch)
            result['sources'][name]={'status':'ok','updatedAt':iso(updated),'fetchedAt':iso(now),'count':len(rows)}
            result['incidents'].extend(rows)
        except Exception as e:
            print(name+': '+str(e))
            result['sources'][name]={'status':'unavailable','updatedAt':None,'fetchedAt':iso(now),'message':'Official feed unavailable, expired, or failed validation. Incidents hidden.'}
    result['incidents']=list({e['id']:e for e in result['incidents']}.values())
    return result

if __name__=='__main__':
    target=Path(__file__).resolve().parents[1]/'data'/'incidents.json'
    result=collect();temporary=target.with_suffix('.tmp');temporary.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');os.replace(temporary,target)
