import cv2, numpy as np, re, sys
v=[float(re.search(r'All:([0-9.]+)',l).group(1)) for l in open('ssim.log')]
segs=[(4.4,7.1),(7.4,15.03),(19.1,20.87),(33.77,38.0),(40.67,48.53),(54.27,56.33)]
picks=[min(range(int(a*30),int(b*30)+1),key=lambda i:v[i]) for a,b in segs]
A=cv2.VideoCapture('out_pil.mp4'); B=cv2.VideoCapture('out_skia.mp4')
rows=[]; info=[]
for fi in picks:
    A.set(1,fi); B.set(1,fi); _,a=A.read(); _,b=B.read()
    d=cv2.absdiff(a,b).max(2); m=(cv2.GaussianBlur(d,(0,0),3)>12).astype(np.uint8)
    ys,xs=np.nonzero(m)
    if len(xs)==0: continue
    x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max(); info.append((round(fi/30,2),int(x0),int(y0),int(x1),int(y1)))
    cx,cy=(x0+x1)//2,(y0+y1)//2; hw=max(160,(x1-x0)//2+40); hh=max(160,(y1-y0)//2+40)
    X0,X1=max(0,cx-hw),min(1080,cx+hw); Y0,Y1=max(0,cy-hh),min(1920,cy+hh)
    ca=a[Y0:Y1,X0:X1]; cb=b[Y0:Y1,X0:X1]; s=360/ca.shape[0]
    ca=cv2.resize(ca,None,fx=s,fy=s); cb=cv2.resize(cb,None,fx=s,fy=s)
    full=lambda im: cv2.resize(im,(203,360))
    lab=lambda im,t: cv2.putText(im.copy(),t,(6,22),cv2.FONT_HERSHEY_SIMPLEX,0.7,(0,0,255),2)
    rows.append(np.hstack([lab(full(a),f'PIL {fi/30:.1f}s'),lab(full(b),'skia'),lab(ca,'PIL x'),lab(cb,'skia x')]))
w=max(r.shape[1] for r in rows); rows=[np.pad(r,((0,4),(0,w-r.shape[1]),(0,0))) for r in rows]
cv2.imwrite('arrow_pil_vs_skia.jpg',np.vstack(rows),[cv2.IMWRITE_JPEG_QUALITY,85]); print(info)
