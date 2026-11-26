"""Checks high-impact data mistakes in the card transformation, not pixel snapshots."""
import copy, json
from render_cards import DATA, build_cards

cards=build_cards();assert len(cards)==7
options=next(c for c in cards if c['id']=='options')
assert '통풍시트' not in [value for _,value in options['rows']]
assert '무사고' not in ' '.join(c['hero']+' '+c['caption'] for c in cards)
d=copy.deepcopy(DATA);d['insurance']['flood']=None
assert not any(c['id']=='insurance_special' for c in build_cards(d))
d=copy.deepcopy(DATA);d['insurance']['flood']=1
c=next(c for c in build_cards(d) if c['id']=='insurance_special')
assert ('침수','1회') in c['rows'] and '없습니다' not in c['caption']
d=copy.deepcopy(DATA);d['options']=[];d['warranty']={};d['inspection']={}
assert [c['id'] for c in build_cards(d)]==['price','vehicle','insurance_special','insurance_damage']
d=copy.deepcopy(DATA);d['vehicle']['price_manwon']=0
try:build_cards(d)
except ValueError:pass
else:raise AssertionError('Invalid price accepted')
d=copy.deepcopy(DATA);d['vehicle']['price_manwon']=9999
assert build_cards(d)[0]['hero']=='9,999' and '9,999' in build_cards(d)[0]['caption']
print(json.dumps({'passed':True,'checks':['disabled_option_excluded','no_accident_free_inference','unknown_not_zero','positive_insurance_preserved','missing_card_omission','invalid_price_rejected','price_caption_from_input']},ensure_ascii=False))
