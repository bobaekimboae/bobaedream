import sys,json,subprocess,numpy as np
from faster_whisper import WhisperModel
m=WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo',device='cpu',compute_type='int8')
for k in sys.argv[1:]:
    a=subprocess.run(['ffmpeg','-v','error','-i',f'{k}/voice_a.mp3','-f','s16le','-ac','1','-ar','16000','-'],capture_output=True).stdout
    x=np.frombuffer(a,np.int16).astype(np.float32)/32768
    segs,_=m.transcribe(x,language='ko',word_timestamps=True)
    W=[[round(w.start,3),round(w.end,3),w.word.strip()] for s in segs for w in s.words]
    json.dump(W,open(f'{k}/voice_a_words.json','w'),ensure_ascii=False)
    print('==',k,len(W),round(len(x)/16000,1)); print(' '.join(f'{i}:{w[2]}' for i,w in enumerate(W)))
