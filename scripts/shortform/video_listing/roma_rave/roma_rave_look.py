import os
import cv2, numpy as np, json, sys, math
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision as vis
HL = vis.HandLandmarker.create_from_options(vis.HandLandmarkerOptions(base_options=mpt.BaseOptions(model_asset_path='hand_landmarker.task'), running_mode=vis.RunningMode.IMAGE, num_hands=2, min_hand_detection_confidence=0.2, min_hand_presence_confidence=0.2))
W,H=1080,1920
T={'grille':(8.0,.20,.53,.5),'exh':(127.5,.50,.589,.55),'sill':(35.0,.32,.43,.45),'defl':(43.0,.22,.46,.5),'paddle':(69.6,.62,.66,.55),'pdisp':(81.0,.62,.63,.5)}
cap=cv2.VideoCapture(os.environ.get('ROMA_SRC', '../raw/roma.mp4')); SH=int(cap.get(4))
tiles=[]
for k,(tt,tx,ty,yf) in T.items():
    y0=int(min(SH-H,max(0,yf*SH-H/2))); cap.set(cv2.CAP_PROP_POS_MSEC,tt*1000); ok,f=cap.read(); f=f[y0:y0+H].copy()
    r=HL.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=np.ascontiguousarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB))))
    for hl in r.hand_landmarks:
        for i,L in enumerate(hl): cv2.circle(f,(int(L.x*W),int(L.y*H)),9 if i==8 else 5,(0,255,255) if i==8 else (0,0,255),-1)
    cv2.drawMarker(f,(int(tx*W),int(ty*SH-y0)),(255,0,255),cv2.MARKER_CROSS,60,6)
    for gx in range(0,W,108): cv2.line(f,(gx,0),(gx,H),(255,255,255),1)
    for gy in range(0,H,192): cv2.line(f,(0,gy),(W,gy),(255,255,255),1)
    cv2.putText(f,k,(30,90),0,3,(0,255,0),6); tiles.append(cv2.resize(f,(360,640)))
cv2.imwrite('/tmp/look.jpg',np.hstack(tiles))
