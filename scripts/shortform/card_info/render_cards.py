#!/usr/bin/env python3
"""Deterministic cards from verified JSON. Python 3 + Pillow + FFmpeg."""
import argparse, json, math, subprocess, hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
DATA = json.loads((HERE / 'cards_input.json').read_text())
RULES = json.loads((HERE / 'card_rules.json').read_text())
W, H = RULES['width'], RULES['height']
P = RULES['palette']
FPS = RULES['fps']
OUT = ROOT / 'output'
OUT.mkdir(exist_ok=True)
FONTS = {}

def font(size, bold=False):
    key = (size,bold)
    if key not in FONTS:
        FONTS[key] = ImageFont.truetype(RULES['typography']['font_bold' if bold else 'font_regular'],size,index=1)
    return FONTS[key]

def text(draw,xy,s,size,color=None,bold=False,maxw=820):
    while draw.textlength(s,font=font(size,bold)) > maxw and size>26:
        size-=1
    assert draw.textlength(s,font=font(size,bold))<=maxw, f'Text overflow: {s}'
    draw.text(xy,s,font=font(size,bold),fill=color or P['ink'],stroke_width=0)

def wrap(draw,s,size,maxw):
    lines=[]; line=''
    for word in s.split():
        candidate=(line+' '+word).strip()
        if line and draw.textlength(candidate,font=font(size))>maxw:
            lines.append(line);line=word
        else:line=candidate
    if line:lines.append(line)
    return lines

def build_cards(data=DATA):
    v=data.get('vehicle',{}); ins=data.get('insurance',{})
    required=['maker','model','trim','price_manwon','year_month','mileage_km','fuel','transmission','displacement_cc']
    if any(v.get(k) is None for k in required):
        raise ValueError('Basic vehicle fields missing; cannot build an identified car sample')
    if not isinstance(v['price_manwon'],(int,float)) or v['price_manwon']<=0:
        raise ValueError('Price must be a positive number')
    enabled={o['name'] for o in data.get('options',[]) if o['status']=='listed_enabled'}
    opt=[x for x in ['열선시트','선루프','후방카메라'] if x in enabled]
    cards = [
      dict(id='price',section='차량 가격',tag='매물 표시',hero=f"{v['price_manwon']:,}",unit='만원',rows=[('차량',f"{v['maker']} {v['trim']}"),('모델',v['model'])],note='판매 희망가 · 취득·이전 비용 별도',caption=f"{v['maker']} {v['trim']}, 판매가는 {v['price_manwon']:,}만원입니다."),
      dict(id='vehicle',section='차량 정보',tag='기본 정보',hero=f"{v['mileage_km']:,}",unit='km',rows=[('연식',v['year_month']),('연료 · 변속기',v['fuel']+' · '+v['transmission']),('배기량',f"{v['displacement_cc']:,}cc")],note='차란차 기본 정보에 표시된 값',caption=f"{v['year_month']} · 주행거리 {v['mileage_km']:,}km"),
      dict(id='insurance_special',section='보험 이력',tag='보험 기록',hero='특수 사고',unit='보험 이력',rows=[('전손','없음' if ins.get('total_loss')==0 else str(ins.get('total_loss'))+'회'),('도난','없음' if ins.get('theft')==0 else str(ins.get('theft'))+'회'),('침수','없음' if ins.get('flood')==0 else str(ins.get('flood'))+'회')],note='보험 기록의 없음은 무사고를 뜻하지 않습니다.',caption='보험 기록 요약: '+' · '.join(f"{label} {ins.get(key)}회" for label,key in [('전손','total_loss'),('도난','theft'),('침수','flood')])),
      dict(id='insurance_damage',section='피해 · 소유 이력',tag='확인할 정보',hero=f"내차 피해 {ins.get('own_damage')}회",unit='',rows=[('상대 차 피해',f"{ins.get('other_damage')}회"),('소유자 변경',f"{ins.get('owner_change')}회")],note='수리 금액·부위는 상세 보고서 확인 필요',caption=f"내차 피해 {ins.get('own_damage')}회 · 소유자 변경 {ins.get('owner_change')}회",warn=True),
      dict(id='inspection',section='성능 점검',tag='상세 확인',hero=data.get('inspection',{}).get('summary',''),unit='사이트 요약',rows=[('확인 범위','사이트 요약 표시'),('상세 부위','기록부 확인 필요')],note='교환·판금 부위와 주요 골격 상태는 미확인',caption=f"{data.get('inspection',{}).get('summary','')} · 상세 기록부 확인 필요",warn=True),
      dict(id='options',section='옵션 정보',tag='매물 표시',hero='핵심 옵션',unit='',rows=[('표시 옵션',x) for x in opt],note='비활성 표시인 통풍시트는 포함하지 않았습니다.',caption=' · '.join(opt)),
      dict(id='warranty',section='보증 상태',tag='개별 확인',hero=data.get('warranty',{}).get('site_summary',''),unit='사이트 표시',rows=[('확인 범위','차란차 보증 정보'),('확인 방법','제조사 · 판매자')] ,note='실제 잔여 보증은 제조사·판매자에게 확인하세요.',caption=f"사이트 {data.get('warranty',{}).get('site_summary','')} 표시 · 실제 잔여 확인 필요",warn=True)
    ]
    allowed={'price':True,'vehicle':True,
      'insurance_special':all(ins.get(k) is not None for k in ['total_loss','theft','flood']),
      'insurance_damage':all(ins.get(k) is not None for k in ['own_damage','other_damage','owner_change']),
      'inspection':bool(data.get('inspection',{}).get('summary')),
      'options':bool(opt), 'warranty':bool(data.get('warranty',{}).get('site_summary'))}
    return [c for c in cards if allowed[c['id']]]

CARDS=build_cards()

def base(style,idx):
    dark=style=='stack'
    im=Image.new('RGB',(W,H),P['night'] if dark else P['canvas']);d=ImageDraw.Draw(im)
    fg=P['paper'] if dark else P['ink']
    text(d,(80,238),'보배드림',40,fg,True)
    text(d,(80,304),DATA['vehicle']['trim']+'  /  차량 정보 요약',31,fg)
    text(d,(822,250),f'{idx+1:02d} / {len(CARDS):02d}',28,fg,maxw=150)
    for j in range(len(CARDS)):
        x=80+j*120
        d.rounded_rectangle((x,390,x+101,396),3,fill=P['accent'] if j<=idx else ('#444D49' if dark else '#C9CFC7'))
    text(d,(80,1510),'출처: '+DATA.get('source_name','차란차')+' 매물 표시 · '+DATA['verified_at'][:10].replace('-','.')+' 확인',26,fg,maxw=850)
    text(d,(80,1552),'상세 기록·실차 상태는 별도 확인하세요.',26,fg,maxw=850)
    return im

def panel(card,style,rows_count=3):
    im=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(im)
    if style=='stack':
        d.rounded_rectangle((108,468,916,1322),34,fill='#39413D')
        d.rounded_rectangle((94,452,930,1306),34,fill='#707970')
    d.rounded_rectangle((80,434,944,1294),34,fill=P['paper'])
    d.rounded_rectangle((126,482,142,532),6,fill=P['warning'] if card.get('warn') else P['ink'])
    text(d,(164,480),card['section'],42,bold=True,maxw=560)
    text(d,(126,558),card['tag'],30,P['warning'] if card.get('warn') else P['muted'])
    sz=118 if card['id']=='price' else 92 if len(card['hero'])<8 else 80
    if card['id']=='price':
        d.rounded_rectangle((122,636,896,803),15,fill=P['accent'])
    text(d,(126,635),card['hero'],sz,bold=True,maxw=770)
    if card['unit']:text(d,(130,795),card['unit'],34,P['muted'])
    for r,(label,value) in enumerate(card['rows'][:rows_count]):
        y=892+r*94
        d.line((126,y-10,894,y-10),fill=P['line'],width=2)
        text(d,(126,y),label,30,P['muted'],maxw=260)
        width=d.textlength(value,font=font(41,True))
        text(d,(max(400,894-width),y-3),value,41,bold=True,maxw=490)
    note=wrap(d,card['note'],28,766)
    assert len(note)<=2, 'Note requires more than 2 lines'
    for j,line in enumerate(note):text(d,(126,1192+j*37),line,28,P['warning'] if card.get('warn') else P['muted'],maxw=766)
    return im

def captions(im,lines,style):
    d=ImageDraw.Draw(im);fg=P['paper'] if style=='stack' else P['ink']
    lines=[part for line in lines for part in wrap(d,line,40,850)]
    assert len(lines)<=2, 'Captions require more than two lines'
    for j,line in enumerate(lines):text(d,(80,1350+j*58),line,40,fg,True,maxw=850)

def run(cmd):
    subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL)

def render(style,segments,stem,caption_events=None):
    length=segments[-1]['end']; n=math.ceil(length*FPS); output=OUT/(stem+'.mp4')
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','ultrafast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(output)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    bases=[base(style,i) for i in range(len(CARDS))]
    panels=[[panel(c,style,r) for r in range(4)] for c in CARDS]
    d=ImageDraw.Draw(bases[0]);wrapped={c['id']:wrap(d,c['caption'],40,850) for c in CARDS}
    try:
      for f in range(n):
        t=f/FPS
        idx=next((i for i,s in enumerate(segments) if s['start']<=t<s['end']),len(segments)-1)
        s=segments[idx];local=t-s['start']; progress=max(0,min(1,local/RULES['motion']['entrance_seconds']))
        ease=1-(1-progress)**3
        im=bases[idx].copy(); count=min(3,max(0,int((local-0.18)/0.12)+1))
        layer=panels[idx][count]
        if style=='stack':
            if idx>0 and progress<1: im.paste(panels[idx-1][3],(0,0),panels[idx-1][3])
            offset=round((1-ease)*110)
            if progress<1:layer=layer.copy();layer.putalpha(layer.getchannel('A').point(lambda a:round(a*progress)))
            im.paste(layer,(0,offset),layer)
        else:
            if idx>0 and progress<1:
                old=panels[idx-1][3]; im.paste(old,(-round(ease*W),0),old)
            im.paste(layer,(round((1-ease)*W),0),layer)
        if caption_events:
            ev=next((e for e in caption_events if e['start']<=t<e['end']),None)
            if ev:captions(im,ev['lines'],style)
        else:captions(im,wrapped[CARDS[idx]['id']],style)
        proc.stdin.write(im.tobytes())
    finally:proc.stdin.close()
    if proc.wait():raise RuntimeError('FFmpeg failed')
    for i,c in enumerate(CARDS):
        preview=bases[i].copy();preview.paste(panels[i][3],(0,0),panels[i][3]);captions(preview,wrapped[c['id']],style)
        preview.save(OUT/f'{style}_{c["id"]}.png')
    return output

def timecode(seconds):
    msec=round(seconds*1000);h,msec=divmod(msec,3600000);m,msec=divmod(msec,60000);s,ms=divmod(msec,1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'

def main():
    global DATA,CARDS
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,default=HERE/'cards_input.json');ap.add_argument('--narrated',action='store_true');ap.add_argument('--style',choices=['stack','swipe','both'],default='both');args=ap.parse_args()
    DATA=json.loads(args.input.read_text());CARDS=build_cards(DATA)
    styles=['stack','swipe'] if args.style=='both' else [args.style]
    if args.narrated:
        timing=json.loads((HERE/'timing.json').read_text());
        if len(timing['segments'])!=len(CARDS):raise ValueError('Narration timing must match the available card count')
        segments=timing['segments'];events=timing['captions'];suffix='narrated'
        (OUT/'captions.srt').write_text('\n\n'.join(f'{i+1}\n{timecode(e["start"])} --> {timecode(e["end"])}\n'+ '\n'.join(e['lines']) for i,e in enumerate(events)))
    else:
        segments=[{'start':i*3,'end':(i+1)*3} for i in range(len(CARDS))];events=None;suffix='21s'
    rendered=[]
    for style in styles:
        output=render(style,segments,f'card_{style}_{suffix}_silent',events)
        if args.narrated:
            final=OUT/f'card_{style}_narrated.mp4'
            run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(output),'-i',str(OUT/'narration_mix.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-t',str(segments[-1]['end']),'-movflags','+faststart',str(final)])
            output.unlink();output=final
        rendered.append(str(output))
        for i,s in enumerate(segments):
            # Independent clips share the master video's actual timed content.
            clip=OUT/f'{style}_{suffix}_cut_{i+1:02}_{CARDS[i]["id"]}.mp4'
            run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(s['start']),'-i',str(output),'-t',str(s['end']-s['start']),'-c:v','libx264','-preset','ultrafast','-crf','20','-c:a','aac','-movflags','+faststart',str(clip)])
    manifest={'input_sha256':hashlib.sha256(args.input.read_bytes()).hexdigest(),'rules_sha256':hashlib.sha256((HERE/'card_rules.json').read_bytes()).hexdigest(),'size':[W,H],'fps':FPS,'duration':segments[-1]['end'],'card_ids':[c['id'] for c in CARDS],'files':rendered,'narrated':args.narrated}
    (OUT/f'render_{suffix}.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print(json.dumps(manifest,ensure_ascii=False))

if __name__=='__main__':main()
