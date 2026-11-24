#!/bin/bash
# M235i 작업 폴더 다시 만들기(/dev/shm은 재시작하면 지워짐). 사용: m235_prep.sh <원본 mp4> <일레븐랩스 음성 mp3 주소 또는 파일>
set -e
# FFmpeg 9.0 사용(2026-11-25, 6.1과 비교 렌더 SSIM 0.993 · 검사 둘 다 통과)
H0=$(cd "$(dirname "$0")" && pwd); bash $H0/../install_ffmpeg9.sh; export PATH=${FF9_DIR:-/opt/ff9}:$PATH
D=${M235_DIR:-/dev/shm/m235/job}; H=$(cd "$(dirname "$0")" && pwd); mkdir -p $D; cd $D
cp $H/samples/m235_job.json job.json
python3 - "$1" <<'P'
import json,subprocess,sys
j=json.load(open('job.json')); L=open('list.txt','w')
for k,c in enumerate(j['cuts']):
    a,b=c['orig']; f=f'q{k:02d}.mp4'
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(a),'-i',sys.argv[1],'-t',str(round(b-a,3)),'-an','-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30','-c:v','libx264','-preset','veryfast','-crf','18',f],check=True); L.write(f"file '{f}'\n")
L.close(); subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i','list.txt','-c','copy','src.mp4'],check=True)
P
case "$2" in http*) curl -s -o voice_raw.mp3 "$2";; *) cp "$2" voice_raw.mp3;; esac
python3 $H/place_voice.py $D
python3 -c "import json;w=json.load(open('words.json'));json.dump([x[:3] for x in w],open('words_clean.json','w'),ensure_ascii=False)"
python3 - <<P
import json;j=json.load(open("$H/samples/m235_input.json"));j["words"]="$D/words_clean.json";j["src"]="$D/src.mp4";json.dump(j,open("$D/m235_input.json","w"),ensure_ascii=False)
P
python3 $H/feature_edit_planner.py $D/m235_input.json --out $D/plan_auto.json
