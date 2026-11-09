import json,os,numpy as np
SS={}
def load(src,vid):
    k=(src,vid)
    if k not in SS:
        p=f'ss/{src}_{vid}.json'
        SS[k]=json.load(open(p)) if os.path.exists(p) else None
    return SS[k]
def feat(src,vid,t,lo=-0.25,hi=0.3):
    d=load(src,vid)
    if d is None: return None
    h=d['hop']; n=d['n']
    i0=max(0,int((t+lo)/h)); i1=min(n,int((t+hi)/h)+1)
    if i1<=i0+1: return None
    pre0=max(0,int((t-0.8)/h)); pre1=max(pre0+1,int((t-0.3)/h))
    def w(k): return np.array(d[k][i0:i1],float)
    def pre(k): return np.array(d[k][pre0:pre1],float)
    ton=w('tonal'); j=int(ton.argmax())
    fl=w('flux'); lo_=w('lowj'); hE=w('hE'); full=w('full'); sp=w('sp')
    bi=min(len(d['beat'])-1,int(t/1.0))
    f=[ton.max(), np.log10(d['tonal_f'][i0+j]+1), (j*h+lo), d['line_db'][i0+j]-np.median(pre('full')) if len(pre('full')) else 0,
       fl.max()-np.median(pre('flux')) if len(pre('flux')) else fl.max(), lo_.max(),
       hE.max()-np.median(pre('hE')) if len(pre('hE')) else 0, np.array(d['flat'][i0:i1]).max(),
       full.max()-np.median(pre('full')) if len(pre('full')) else 0, np.median(pre('sp')) if len(pre('sp')) else -80,
       d['beat'][bi], np.median(d['full'])]
    return f
NAMES=['tonal','tonal_logf','tonal_dt','line_rel','flux_j','low_j','hE_j','flat_max','full_j','pre_speech','beat','vid_level']
