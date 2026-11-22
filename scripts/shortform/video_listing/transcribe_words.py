import numpy as np,json,sys
from faster_whisper import WhisperModel
a=np.fromfile(sys.argv[1],dtype=np.float32)
m=WhisperModel('large-v3-turbo',device='cpu',compute_type='int8')
segs,_=m.transcribe(a,language='ko',word_timestamps=True,vad_filter=False)
W=[]
for s in segs:
  for w in s.words: W.append([w.word.strip(),round(w.start,2),round(w.end,2)])
json.dump(W,open(sys.argv[2],'w'),ensure_ascii=False)
for i,w in enumerate(W): print(i,w)
