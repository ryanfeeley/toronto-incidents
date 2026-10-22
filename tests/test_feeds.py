import unittest,sys,json
from pathlib import Path
from datetime import datetime,timezone
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from fetch_feeds import collect,fire,police,local_time
NOW=datetime(2026,10,22,1,0,tzinfo=timezone.utc)
# Synthetic fixtures exist only in tests; never copied into deployment.
XML=b'<tfs_active_incidents><update_from_db_time>2026-10-21 20:59:00</update_from_db_time><event><event_num>TEST</event_num><event_type>Fire</event_type><dispatch_time>2026-10-21T19:00:00</dispatch_time><prime_street>TEST ST</prime_street></event></tfs_active_incidents>'
class Feeds(unittest.TestCase):
 def test_fire_timezone_and_unlocated(self):
  updated,rows=fire(NOW,lambda _:XML)
  self.assertEqual(rows[0]['time'],'2026-10-21T23:00:00Z');self.assertIsNone(rows[0]['lat'])
 def test_expired_fire(self):
  with self.assertRaises(ValueError):fire(NOW,lambda _:XML.replace(b'20:59:00',b'18:00:00'))
 def test_failure_removes_all_records(self):
  result=collect(NOW,lambda _:b'<html>blocked</html>')
  self.assertEqual(result['incidents'],[]);self.assertTrue(all(s['status']=='unavailable' for s in result['sources'].values()))
 def test_one_source_failure_does_not_hide_other(self):
  result=collect(NOW,lambda u:XML if 'livecad.xml' in u else b'{}')
  self.assertEqual(len(result['incidents']),1);self.assertEqual(result['sources']['police']['status'],'unavailable')
 def test_ambiguous_dst_rejected(self):
  with self.assertRaises(ValueError):local_time('2026-11-01T01:30:00')
 def test_police_truncation_rejected(self):
  def fetch(u):return json.dumps({'editingInfo':{'lastEditDate':int(NOW.timestamp()*1000)}} if '/query?' not in u else {'features':[],'exceededTransferLimit':True}).encode()
  with self.assertRaises(ValueError):police(NOW,fetch)
if __name__=='__main__':unittest.main()
