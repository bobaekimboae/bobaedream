import json, numpy as np
from PIL import Image, ImageDraw, ImageFont
CAPS=[(1,5,"메르세데스-AMG가\n왜 이 차에"),(6,9,"GT라는 이름을 붙였는지\n보여드리겠습니다"),
(10,16,"2027년식, 메르세데스-AMG\nGT 63 4도어 쿠페입니다"),(17,21,"그릴 안 에어패널이\n9단계로"),
(22,26,"열리고 닫히며\n공기 흐름을 조절합니다"),(27,29,"800V 전기차라"),(30,36,"10%에서 80%까지\n11분이면 충전됩니다"),
(37,41,"커피 한 잔 마실 시간입니다"),(42,44,"최고출력 1,169마력"),(45,49,"제로백은 2.4초입니다"),
(50,53,"보닛 아래에도 62L"),(54,57,"뒤 트렁크는 507L입니다"),(58,62,"10.2인치 계기판과"),
(63,69,"14인치 화면이\n유리 한 장으로 이어집니다"),(70,73,"스티어링 휠 버튼 하나로"),(74,78,"리어 스포일러를\n세울 수 있습니다"),
(79,86,"모터 3개로 네 바퀴를 굴리는\n4MATIC+"),(87,89,"뒷바퀴 조향도 기본입니다"),(90,92,"뒤쪽에는 원형 테일램프가"),
(93,96,"양쪽에 3개씩 들어갔습니다"),(97,101,"주행거리와 사고 이력,\n남은 보증까지"),(102,106,"보배드림 앱에서\n자세한 매물정보 확인하세요")]
FONT=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc',66,index=1)
MAP={0:[0,2,3,4],2:[0,1,3,4,5,6],3:[0,1,2,3],5:[0,2],6:[0,2,4,6],8:[0,1],9:[0,1],10:[0,1,2],11:[0,1,2],12:[0,4],13:[0,2,3,4,5,6],16:[0,1,3,4,5,6],19:[0,1,3]}
YEL=(0xEE,0xEF,0x05,255)
from PIL import ImageFilter
def _render(lines,hi,W=1080):
    """lines: list of token lists; hi: global token index highlighted (-1 none). BE style: white bold + soft shadow, spoken token yellow."""
    im=Image.new('RGBA',(W,260),(0,0,0,0)); sh=Image.new('RGBA',(W,260),(0,0,0,0))
    d=ImageDraw.Draw(im); ds=ImageDraw.Draw(sh)
    sp=FONT.getlength(' '); lh=80; y0=130-lh*len(lines)/2; g=0
    for li,toks in enumerate(lines):
        tw=sum(FONT.getlength(t) for t in toks)+sp*(len(toks)-1); x=(W-tw)/2; y=y0+li*lh
        for t in toks:
            ds.text((x+4,y+6),t,font=FONT,fill=(0,0,0,230),stroke_width=8,stroke_fill=(0,0,0,200))
            d.text((x,y),t,font=FONT,fill=YEL if g==hi else (255,255,255,255),stroke_width=6,stroke_fill=(0,0,0,255))
            x+=FONT.getlength(t)+sp; g+=1
    sh=sh.filter(ImageFilter.GaussianBlur(6)); out=Image.alpha_composite(sh,im)
    a=np.array(out).astype(np.float32); return a[...,2::-1].copy(),a[...,3:]/255.0
def build(words,fps,W=1080):
    out=[]
    for k,(a,b,txt) in enumerate(CAPS):
        t0=words[a]['start']-0.05; t1=words[b]['end']+0.25
        if k+1<len(CAPS):
            nx=words[CAPS[k+1][0]]['start']-0.05
            t1=nx if nx-t1<0.6 else t1
            t1=min(t1,nx)
        lines=[l.split(' ') for l in txt.split('\n')]; nd=sum(len(l) for l in lines); ns=b-a+1
        # display token j -> spoken word start (proportional map)
        off=MAP.get(k,list(range(nd))); assert len(off)==nd,k
        tst=[words[a+o]['start'] for o in off]
        frames=[(_render(lines,j),tst[j]) for j in range(nd)]
        out.append(dict(n0=int(round(t0*fps)),n1=int(round(t1*fps)),frames=frames,txt=txt))
    return out
def draw(fr,caps,n,yc=1229):
    for c in caps:
        if c['n0']<=n<=c['n1']:
            t=n/30.0; cur=c['frames'][0][0]
            for img,ts in c['frames']:
                if t>=ts-0.03: cur=img
            rgb,a=cur; h=rgb.shape[0]; y0=yc-h//2
            fr[y0:y0+h]=fr[y0:y0+h]*(1-a)+rgb*a
