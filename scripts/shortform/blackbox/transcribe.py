import sys,json,soundfile as sf,subprocess,numpy as np
from faster_whisper import WhisperModel
src,out=sys.argv[1],sys.argv[2]
subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-ac','1','-ar','16000','/tmp/v.wav'],check=True)
a,sr=sf.read('/tmp/v.wav',dtype='float32')
m=WhisperModel('large-v3-turbo',device='cpu',compute_type='int8')
seg,_=m.transcribe(a,language='ko',word_timestamps=True,vad_filter=False)
W=[[w.word.strip(),round(w.start,3),round(w.end,3)] for s in seg for w in s.words]
json.dump(W,open(out,'w'),ensure_ascii=False); print(len(W),' '.join(x[0] for x in W))
