"""Optional card modules. Pure planning; never logs vehicle identifiers or contacts."""
import argparse, hashlib, json, re
from datetime import date
from pathlib import Path

HERE=Path(__file__).resolve().parent
RULES=json.loads((HERE/'module_rules.json').read_text())

def known(value):
    return value is not None and value!=''

def usable_fact(fact):
    return isinstance(fact,dict) and fact.get('verified') is True and known(fact.get('text')) and known(fact.get('evidence_ref'))

def date_key(value):
    if not isinstance(value,str):raise ValueError('Event date must be a string')
    if re.fullmatch(r'\d{4}-\d{2}',value):
        date.fromisoformat(value+'-01');return value+'-01','month'
    if re.fullmatch(r'\d{4}-\d{2}-\d{2}',value):
        date.fromisoformat(value);return value,'day'
    raise ValueError('No invented or ambiguous timeline dates')

def history_events(data):
    accepted=[];rejected=[];seen=set()
    for event in data.get('history_timeline',{}).get('events',[]):
        key=event.get('event_id','unidentified')
        source=event.get('source',{})
        reason=None
        if source.get('system')!=RULES['history']['source_system']:reason='not_molit_source'
        elif not all(known(source.get(k)) for k in ['response_ref','retrieved_at','lookup_scope']):reason='missing_source_provenance'
        elif not isinstance(key,str) or not key:reason='missing_event_id'
        elif event.get('event_type') not in RULES['history']['allowed_events']:reason='unsupported_event_type'
        elif not known(event.get('title')):reason='missing_title'
        try:
            sort_date,precision=date_key(event.get('occurred_on'))
            if date.fromisoformat(sort_date)>date.fromisoformat(source['retrieved_at'][:10]):reason='event_after_retrieval'
        except (ValueError,TypeError,KeyError):reason=reason or 'missing_or_invalid_event_date'
        if reason:rejected.append({'event_id':key,'reason':reason});continue
        unique=(event['event_type'],event['occurred_on'],event['title'],source['response_ref'])
        if unique in seen:rejected.append({'event_id':key,'reason':'duplicate_event'});continue
        seen.add(unique)
        accepted.append({'event_id':key,'event_type':event['event_type'],'occurred_on':event['occurred_on'],'date_precision':precision,'title':event['title'],'source':{k:source[k] for k in ['system','response_ref','retrieved_at','lookup_scope']},'_sort':sort_date})
    accepted.sort(key=lambda e:(e['_sort'],e['event_type'],e['title']))
    for e in accepted:e.pop('_sort')
    return accepted,rejected

def make_plan(data,selected=None):
    selected=[] if selected is None else selected
    if not isinstance(selected,list) or any(not isinstance(x,str) for x in selected):raise ValueError('Selected modules must be a list of names')
    unknown=set(selected)-set(RULES['canonical_order'])
    if unknown:raise ValueError('Unknown card type: '+','.join(sorted(unknown)))
    ordered=[x for x in RULES['canonical_order'] if x in selected]
    groups={};omitted=[];events,rejected=history_events(data)
    def add(kind,hero,rows,note,refs,**extras):
        if rows:groups.setdefault(kind,[]).append({'type':kind,'title':RULES['names'][kind],'hero':hero,'rows':rows,'note':note,'fact_refs':refs,**extras})
    v=data.get('vehicle',{});i=data.get('insurance',{})
    if 'vehicle' in ordered:
        rows=[]
        for label,key,unit in [('연식','year_month',''),('주행거리','mileage_km','km'),('연료','fuel','')]:
            val=v.get(key)
            if known(val):rows.append([label,f'{val:,}{unit}' if isinstance(val,(int,float)) else str(val)+unit])
        price=v.get('price_manwon');hero=f'{price:,}만원' if isinstance(price,(int,float)) and price>0 else v.get('trim','차량 정보')
        add('vehicle',hero,rows,'매물 표시 기준', ['vehicle.'+k for k in ['price_manwon','year_month','mileage_km','fuel'] if known(v.get(k))])
    if 'inspection' in ordered and known(data.get('inspection',{}).get('summary')):
        x=data['inspection'];add('inspection',x['summary'],[['표시 범위','매물 요약'],['상세 부위','원문 기록부 확인']], '상세 성능기록부 미확보', ['inspection.summary'])
    if 'insurance' in ordered:
        rows=[];refs=[]
        for label,key in [('내차 피해','own_damage'),('상대 차 피해','other_damage'),('소유자 변경','owner_change')]:
            val=i.get(key)
            if isinstance(val,int) and not isinstance(val,bool) and val>=0:rows.append([label,str(val)+'회']);refs.append('insurance.'+key)
        special=[]
        for label,key in [('전손','total_loss'),('도난','theft'),('침수','flood')]:
            val=i.get(key)
            if isinstance(val,int) and not isinstance(val,bool) and val>=0:special.append(f'{label} {val}회');refs.append('insurance.'+key)
        add('insurance','피해 · 소유 이력',rows,'보험 기록만으로 무사고를 판정하지 않습니다.',refs)
        if special:add('insurance','특수 사고 기록',[[x.split()[0],x.split()[1]] for x in special],'보험이력 요약 표시 · 국토부 이력과 구분',refs)
    if 'history_timeline' in ordered:
        per=RULES['history']['events_per_page']
        for start in range(0,len(events),per):
            page=events[start:start+per]
            add('history_timeline','시간순 이력',[[e['occurred_on'].replace('-','.'),e['title']] for e in page],'국토부 통합이력 수신 사건 · 조회 범위 내', ['history_timeline.events.'+e['event_id'] for e in page],events=page,page=start//per+1,pages=(len(events)+per-1)//per)
    if 'options' in ordered:
        values=[x['name'] for x in data.get('options',[]) if x.get('status')=='listed_enabled' and known(x.get('name'))]
        priority=['열선시트','선루프','후방카메라']
        values.sort(key=lambda x:priority.index(x) if x in priority else len(priority))
        add('options','표시 옵션', [['옵션',x] for x in values[:3]],'매물 활성 표시 기준', ['options.'+x for x in values[:3]])
    if 'added_options' in ordered:
        values=[x for x in data.get('added_options',[]) if x.get('verified') is True and known(x.get('name')) and known(x.get('evidence_ref'))]
        rows=[[x['name'],f"{x['price_manwon']:,}만원" if isinstance(x.get('price_manwon'),(int,float)) else '가격 미확인'] for x in values[:3]]
        add('added_options','선택 장착 옵션',rows,'기본·등록 옵션 개수로 대체하지 않습니다.',[x['evidence_ref'] for x in values[:3]])
    for kind in ['features','seller']:
        if kind in ordered:
            values=[x for x in data.get(kind,[]) if usable_fact(x)]
            add(kind,RULES['names'][kind],[['확인 내용',x['text']] for x in values[:3]],'원문에서 확인된 사실', [x['evidence_ref'] for x in values[:3]])
    scenes=[]
    for kind in ordered:
        if kind not in groups:omitted.append({'type':kind,'reason':'no_verified_dated_events' if kind=='history_timeline' else 'no_usable_source_data'})
        for idx,s in enumerate(groups.get(kind,[])):
            s['scene_id']=f'{kind}_{idx+1}';scenes.append(s)
    return {'vehicle_label':v.get('trim','선택한 차량'),'version':RULES['version'],'selected_types':ordered,'included_types':[x for x in ordered if x in groups],'omitted':omitted,'rejected_history_events':rejected,'insert_cards':bool(scenes),'scene_count':len(scenes),'source_snapshot_date':data.get('verified_at'),'scenes':scenes}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,default=HERE/'cards_input.json');ap.add_argument('--cards',default='');ap.add_argument('--preset',choices=RULES['presets']);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
    if a.preset and a.cards:ap.error('Choose --preset or --cards')
    selection=RULES['presets'][a.preset] if a.preset else [x.strip() for x in a.cards.split(',') if x.strip()]
    data=json.loads(a.input.read_text());plan=make_plan(data,selection);plan['input_sha256']=hashlib.sha256(a.input.read_bytes()).hexdigest();plan['rules_sha256']=hashlib.sha256((HERE/'module_rules.json').read_bytes()).hexdigest()
    a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(plan,ensure_ascii=False,indent=2));print(json.dumps({k:plan[k] for k in ['selected_types','included_types','omitted','scene_count','insert_cards']},ensure_ascii=False))

if __name__=='__main__':main()
