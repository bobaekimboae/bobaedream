import os
src=open(os.path.dirname(os.path.abspath(__file__))+'/render3.py').read().split('SFXT=[]; NEIGH')[0]; exec(src)
import numpy as np
def meas(im,name):
    a=np.array(im)
    alpha=a[:,:,3]; rgb=a[:,:,:3].astype(int)
    # 칠: 불투명 + 밝은(노랑/흰) 픽셀, 글자/아이콘: 불투명 + 어두운 픽셀
    paint=(alpha>200)&(rgb.sum(2)>500); ink=(alpha>200)&(rgb.sum(2)<250)
    # 가운데 높이 줄에서 칠 좌우 끝
    ys=np.where(paint.any(1))[0]; ym=(ys[0]+ys[-1])//2
    row=np.where(paint[ym])[0]; px0,px1=row[0],row[-1]
    xs=np.where(ink.any(0))[0]; ix0,ix1=xs[0],xs[-1]
    iy=np.where(ink.any(1))[0]
    print(f'{name:22s} 칠폭 {px1-px0:4d} 높이 {ys[-1]-ys[0]:3d} | 왼쪽여백 {ix0-px0:3d} 오른쪽여백 {px1-ix1:3d} | 글자높이 {iy[-1]-iy[0]}')
meas(gchip('3.0 V6 디젤'),'노랑 칩 3.0 V6 디젤')
meas(gchip('디퍼렌셜 락 3개'),'노랑 칩 디퍼렌셜')
for im,n in zip(EP+[T1L,DPL,DW1],['토크','7단','제로백','기본','잠금','바퀴']): meas(im,'흰 붓 '+n)
