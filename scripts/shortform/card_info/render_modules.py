"""Render selected module plans; reuse the already-generated dry narration."""
import argparse,hashlib,json,math,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
import render_cards as drawlib
from card_modules import RULES,make_plan

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
OUT=ROOT/'output/round2';OUT.mkdir(parents=True,exist_ok=True)
L=RULES['layout'];W=L['width'];H=L['height'];FPS=L['fps']
drawlib.P['warning']=L['ink']
INK=L['ink'];YELLOW=L['highlight']

# Exact measured word boundaries in the original single narration take.
VOICE_SLICES={
 'vehicle_1':(7.779,12.817),
 'inspection_1':(28.712,34.227),
 'insurance_1':(19.912,25.508),
 'insurance_2':(15.697,19.308),
 'options_1':(37.141,41.239)
}
CAPTIONS={
 'vehicle_1':[(0,5.038,'2021년 5월, 33,475킬로미터입니다.')],
 'inspection_1':[(0,2.392,'교환, 판금 확인 표시가 있습니다.'),(2.995,5.515,'상세 부위는 기록부 확인이 필요합니다.')],
 'insurance_1':[(0,3.018,'다만 내차 피해 한 번이 표시되어 있습니다.'),(3.715,5.596,'소유자 변경도 한 번입니다.')],
 'insurance_2':[(0,3.611,'전손과 도난, 침수 보험 이력은 없습니다.')],
 'options_1':[(0,4.098,'열선시트, 선루프, 후방카메라가 표시되어 있습니다.')]
}

def run(args):subprocess.run(args,check=True,stdout=subprocess.DEVNULL)

def prepare_voice(plan,stem):
    if any(s['scene_id'] not in VOICE_SLICES for s in plan['scenes']):
        raise ValueError('These cards need their own verified narration and word times; use --silent for a layout check')
    binding=json.loads((HERE/'narration_binding.json').read_text())
    if plan.get('input_sha256')!=binding['input_sha256']:raise ValueError('Narration is bound to a different vehicle snapshot; regenerate verified narration and timings')
    dry=ROOT/'output/narration_dry.mp3'
    if not dry.is_file():raise FileNotFoundError('Place the original dry narration at output/narration_dry.mp3')
    if hashlib.sha256(dry.read_bytes()).hexdigest()!=binding['dry_audio_sha256']:raise ValueError('Dry narration hash does not match the measured take')
    segments=[];captions=[];parts=[];cursor=0
    for idx,scene in enumerate(plan['scenes']):
        a,b=VOICE_SLICES[scene['scene_id']];duration=math.ceil((b-a+0.65)*FPS)/FPS
        part=OUT/f'{stem}_voice_{idx:02}.wav'
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(a),'-i',str(dry),'-af',f'atrim=duration={b-a},asetpts=PTS-STARTPTS,adelay=250:all=1,apad=whole_dur={duration},atrim=duration={duration}','-ar','48000','-ac','1',str(part)])
        parts.append(part);segments.append({'start':cursor,'end':cursor+duration,'scene_id':scene['scene_id'],'source_audio_start':a,'source_audio_end':b})
        for start,end,line in CAPTIONS[scene['scene_id']]:captions.append({'start':cursor+start+.25,'end':cursor+end+.25,'lines':[line]})
        cursor+=duration
    concat=OUT/f'{stem}_voice_list.txt';concat.write_text('\n'.join("file '"+str(p.resolve())+"'" for p in parts))
    raw_reference=OUT/f'{stem}_reference_raw.wav'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-c:a','pcm_s16le',str(raw_reference)])
    reference=OUT/f'{stem}_reference.wav'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(raw_reference),'-af','loudnorm=I=-14:TP=-3:LRA=11','-ar','48000','-ac','1',str(reference)])
    mix=OUT/f'{stem}_mix.wav'
    script="import {makeDialogueMix} from './scripts/lib/shortform-audio.mjs';makeDialogueMix("+json.dumps({'voice':str(reference.resolve()),'output':str(mix.resolve()),'delayMs':0,'durationSeconds':cursor})+");"
    subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,check=True)
    normalized=OUT/f'{stem}_normalized.wav'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(mix),'-af','volume=4.85dB','-ar','48000','-ac','2',str(normalized)])
    return segments,captions,reference,normalized

def base(plan,idx,preview=False):
    im=Image.new('RGB',(W,H),L['background']);d=ImageDraw.Draw(im)
    drawlib.text(d,(80,235),'보배드림',48,'#FFFFFF',True)
    label='타임라인 카드 틀 · 실제 이력 아님' if preview else plan.get('vehicle_label','선택한 차량')+' · 선택한 정보만 요약'
    drawlib.text(d,(80,315),label,34,'#FFFFFF',maxw=850)
    types=plan.get('included_types',[])
    progress=f'{idx+1:02} / {len(plan["scenes"]):02}'
    drawlib.text(d,(800,250),progress,30,'#FFFFFF',maxw=150)
    if not preview:drawlib.text(d,(80,1580),'매물 표시 확인본 · '+str(plan.get('source_snapshot_date','확인일 미기록')).replace('-','.'),30,'#FFFFFF',maxw=850)
    else:drawlib.text(d,(80,1580),'날짜·조회 결과를 넣지 않은 레이아웃 예시',30,'#FFFFFF',maxw=850)
    return im

def card_layer(scene,show_rows=3,preview=False):
    im=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(im)
    d.rounded_rectangle(tuple(L['card_box']),32,fill=L['paper'])
    drawlib.text(d,(126,464),scene['title'],60,INK,True,maxw=770)
    if scene['type']=='history_timeline':
        drawlib.text(d,(126,566),'국토부 조회 사건 · 시간순' if not preview else '실제 조회 이력이 아닙니다',34,INK,maxw=770)
        d.line((151,668,151,993),fill=YELLOW,width=8)
        for idx,(when,title) in enumerate(scene['rows'][:show_rows]):
            y=660+idx*145
            d.ellipse((139,y,163,y+24),fill=INK)
            drawlib.text(d,(194,y-12),when,34,INK,True,maxw=660)
            drawlib.text(d,(194,y+45),title,42,INK,True,maxw=660)
    else:
        drawlib.text(d,(126,580),scene['hero'],86,INK,True,maxw=770)
        for idx,(label,value) in enumerate(scene['rows'][:show_rows]):
            y=750+idx*100
            d.line((126,y-12,895,y-12),fill='#D9DDD7',width=2)
            drawlib.text(d,(126,y),label,34,'#66706C',maxw=250)
            valuefont=44
            while d.textlength(value,font=drawlib.font(valuefont,True))>490 and valuefont>30:valuefont-=1
            width=d.textlength(value,font=drawlib.font(valuefont,True))
            drawlib.text(d,(895-width,y-3),value,valuefont,INK,True,maxw=490)
    lines=drawlib.wrap(d,scene['note'],30,770)
    assert len(lines)<=2
    for i,line in enumerate(lines):drawlib.text(d,(126,1060+41*i),line,30,INK,maxw=770)
    return im

def caption(im,lines):
    d=ImageDraw.Draw(im);rendered=[]
    for line in lines:rendered.extend(drawlib.wrap(d,line,L['caption_font_px'],850))
    if len(rendered)>2:raise ValueError('Caption exceeds 2 meaning-unit lines: '+' '.join(lines))
    for i,line in enumerate(rendered):drawlib.text(d,(80,L['caption_top']+i*82),line,L['caption_font_px'],'#FFFFFF',True,maxw=850)

def render(plan,stem,segments,events,preview=False):
    video=OUT/f'{stem}_silent.mp4';duration=segments[-1]['end']
    proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','ultrafast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(video)],stdin=subprocess.PIPE)
    backgrounds=[base(plan,i,preview) for i in range(len(plan['scenes']))]
    layers=[[card_layer(s,r,preview) for r in range(4)] for s in plan['scenes']]
    try:
        for frame in range(math.ceil(duration*FPS)):
            t=frame/FPS;idx=next((i for i,s in enumerate(segments) if s['start']<=t<s['end']),len(segments)-1)
            local=t-segments[idx]['start'];q=min(1,local/L['entrance_seconds']);q=1-(1-q)**3
            im=backgrounds[idx].copy()
            count=min(3,max(0,int((local-.15)/L['rows_stagger_seconds'])+1));layer=layers[idx][count]
            if idx and q<1:im.paste(layers[idx-1][3],(0,0),layers[idx-1][3])
            im.paste(layer,(0,round(50*(1-q))),layer)
            e=next((x for x in events if x['start']<=t<x['end']),None)
            if e:caption(im,e['lines'])
            proc.stdin.write(im.tobytes())
    finally:proc.stdin.close()
    if proc.wait():raise RuntimeError('Video encoding failed')
    for i,scene in enumerate(plan['scenes']):
        im=backgrounds[i].copy();im.paste(layers[i][3],(0,0),layers[i][3]);im.save(OUT/f'{stem}_{scene["scene_id"]}.png')
    return video

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--cards',default='');ap.add_argument('--input',type=Path,default=HERE/'cards_input.json');ap.add_argument('--name',required=True);ap.add_argument('--silent',action='store_true');ap.add_argument('--layout-preview',action='store_true');a=ap.parse_args()
    data=json.loads(a.input.read_text());plan=make_plan(data,[x for x in a.cards.split(',') if x]);plan['input_sha256']=hashlib.sha256(a.input.read_bytes()).hexdigest()
    if a.layout_preview:
        plan={'preview_only':True,'included_types':['history_timeline'],'scenes':[{'type':'history_timeline','scene_id':'layout_only','title':'차량 이력 타임라인','hero':'','rows':[['사건 발생일','검사 이력 항목'],['사건 발생일','정비 이력 항목'],['사건 발생일','성능점검 이력 항목']],'note':'정확한 날짜와 원문 근거가 있을 때만 노출'}]}
        a.silent=True
    (OUT/f'{a.name}_plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2))
    if not plan['scenes']:print('No selected usable cards. No video generated; original vehicle edit continues.');return
    if a.silent:
        segments=[{'start':i*4,'end':(i+1)*4,'scene_id':s['scene_id']} for i,s in enumerate(plan['scenes'])]
        events=[];reference=mix=None
    else:segments,events,reference,mix=prepare_voice(plan,a.name)
    video=render(plan,a.name,segments,events,a.layout_preview)
    if mix:
        final=OUT/f'{a.name}.mp4';run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(video),'-i',str(mix),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',str(final)]);video.unlink();video=final
    srt=[]
    for i,e in enumerate(events):srt.append(f'{i+1}\n{drawlib.timecode(e["start"])} --> {drawlib.timecode(e["end"])}\n'+ '\n'.join(e['lines']))
    (OUT/f'{a.name}.srt').write_text('\n\n'.join(srt))
    contract={'target':str(video.relative_to(ROOT)),'reference':str(reference.relative_to(ROOT)) if reference else None,'expectedDelayMs':0,'durationSeconds':segments[-1]['end'],'segments':segments,'captions':events,'scene_ids':[s['scene_id'] for s in plan['scenes']]}
    (OUT/f'{a.name}_contract.json').write_text(json.dumps(contract,ensure_ascii=False,indent=2));print(json.dumps(contract,ensure_ascii=False))

if __name__=='__main__':main()
