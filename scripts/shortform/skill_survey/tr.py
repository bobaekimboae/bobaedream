import sys,json,subprocess,numpy as np
from faster_whisper import WhisperModel
m=WhisperModel('small',device='cpu',compute_type='int8')
for f,o in zip(sys.argv[1::2],sys.argv[2::2]):
    a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar','16000','-f','s16le','-'],capture_output=True).stdout,np.int16).astype(np.float32)/32768
    segs,_=m.transcribe(a,language='nl',word_timestamps=True,vad_filter=True)
    json.dump([dict(text=w.word.strip(),start=round(w.start,2),end=round(w.end,2)) for s in segs for w in s.words],open(o,'w'),ensure_ascii=False)
    print('ok',o,flush=True)
