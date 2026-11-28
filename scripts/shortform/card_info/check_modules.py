import copy,itertools,json
from pathlib import Path
from card_modules import RULES,make_plan

DATA=json.loads((Path(__file__).parent/'cards_input.json').read_text())
checks=[]
def check(name,condition):
    assert condition,name
    checks.append(name)

check('no_default_cards',make_plan(DATA)['scenes']==[])
check('explicit_zero_cards',not make_plan(DATA,[])['insert_cards'])
check('one_selected_type_only',make_plan(DATA,['insurance'])['included_types']==['insurance'])
check('no_forced_vehicle_or_price',all(x['type']=='insurance' for x in make_plan(DATA,['insurance'])['scenes']))
check('core_relative_order',make_plan(DATA,['insurance','inspection','vehicle'])['included_types']==['vehicle','inspection','insurance'])
check('duplicates_removed',make_plan(DATA,['options','options'])['included_types']==['options'])
try:make_plan(DATA,['made_up_type'])
except ValueError:check('unknown_type_rejected',True)
else:raise AssertionError('Unknown type was accepted')
check('missing_timeline_skipped',make_plan(DATA,['history_timeline'])['omitted'][0]['reason']=='no_verified_dated_events')
check('selected_unavailable_card_not_replaced',make_plan(DATA,['added_options'])['scene_count']==0)
options=make_plan(DATA,['options'])['scenes'][0]
check('disabled_option_excluded','통풍시트' not in [r[1] for r in options['rows']])
d=copy.deepcopy(DATA);d['insurance']['own_damage']=None
check('unknown_not_zero',not any(r[0]=='내차 피해' for s in make_plan(d,['insurance'])['scenes'] for r in s['rows']))

# Synthetic test-only normalized records. Never used as this vehicle's history.
src={'system':'molit_integrated_history','response_ref':'test-fixture-only','retrieved_at':'2026-11-26','lookup_scope':'fixture-not-a-lookup'}
events=[{'event_id':str(i),'event_type':'inspection','occurred_on':f'202{i}-05-01','title':'검사(테스트)','source':src} for i in [4,1,3,2]]
d=copy.deepcopy(DATA);d['history_timeline']={'events':events}
p=make_plan(d,['history_timeline'])
check('timeline_chronological',[r[0] for s in p['scenes'] for r in s['rows']]==['2021.05.01','2022.05.01','2023.05.01','2024.05.01'])
check('timeline_pagination_preserves_all',p['scene_count']==2 and sum(len(s['events']) for s in p['scenes'])==4)
d['history_timeline']['events']=[dict(events[0],occurred_on=None)]
check('undated_event_not_invented',not make_plan(d,['history_timeline'])['insert_cards'])
d['history_timeline']['events']=[dict(events[0],event_type='insurance_claim')]
check('insurance_claim_not_molit_timeline',not make_plan(d,['history_timeline'])['insert_cards'])
d['history_timeline']['events']=[dict(events[0],source=dict(src,system='insurance_provider'))]
check('wrong_source_rejected',not make_plan(d,['history_timeline'])['insert_cards'])
d['history_timeline']['events']=[dict(events[0],source=dict(src,response_ref=None))]
check('source_evidence_required',not make_plan(d,['history_timeline'])['insert_cards'])
d['history_timeline']['events']=[dict(events[0],occurred_on='2026-02-30')]
check('invalid_calendar_date_rejected',not make_plan(d,['history_timeline'])['insert_cards'])
d['history_timeline']['events']=[dict(events[0],occurred_on='2027-01-01')]
check('future_after_retrieval_rejected',not make_plan(d,['history_timeline'])['insert_cards'])
d['history_timeline']['events']=[dict(events[0],occurred_on='2024-05')]
check('month_precision_preserved',make_plan(d,['history_timeline'])['scenes'][0]['events'][0]['occurred_on']=='2024-05')
d['history_timeline']['events']=[events[0],events[0]]
check('duplicate_events_removed',len(make_plan(d,['history_timeline'])['scenes'][0]['events'])==1)
d['history_timeline']['events']=[dict(events[0],owner_name='PRIVATE_TEST_VALUE',source=dict(src,raw_private_token='DO_NOT_COPY'))]
check('private_extra_fields_not_copied','PRIVATE_TEST_VALUE' not in json.dumps(make_plan(d,['history_timeline'])) and 'DO_NOT_COPY' not in json.dumps(make_plan(d,['history_timeline'])))
for selected in itertools.permutations(RULES['core_order']):
    p=make_plan(DATA,list(selected));assert p['selected_types']==RULES['core_order']
check('all_24_core_input_orders_consistent',True)
for n in range(9):
    for subset in itertools.combinations(RULES['canonical_order'],n):
        p=make_plan(DATA,list(reversed(subset)))
        assert p['selected_types']==list(subset)
check('all_256_selection_subsets_consistent',True)
from render_modules import prepare_voice
try:prepare_voice({'input_sha256':'a-different-vehicle','scenes':[{'scene_id':'vehicle_1'}]},'must_not_generate')
except ValueError:check('wrong_vehicle_narration_binding_rejected',True)
else:raise AssertionError('Wrong vehicle narration accepted')
print(json.dumps({'passed':True,'count':len(checks),'checks':checks},ensure_ascii=False,indent=2))
