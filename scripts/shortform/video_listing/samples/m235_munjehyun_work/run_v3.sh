set -e
W=/home/claude/work/m235/w/; R=/home/claude/bobaedream/scripts/shortform; V=$R/video_listing; CAR=$V/samples/m235_munjehyun_car.json; EDIT=$V/samples/m235_munjehyun_edit.json
cd $W; OUTNAME=bobae_m235_munjehyun_be_v3.mp4 python3 build_inputs.py
G350_DIR=$W CAR=$CAR python3 $V/car_track.py
python3 - <<'PY'
import json
t=json.load(open('tracks.json')); p=json.load(open('picks_v2.json'))
for k,v in t.items():
    tw=p[k]['track'][0]; n=len(v['pts']); v['vis']=[1.0 if tw-0.6<=v['s0']+i/30<=tw+1.4 else 0.0 for i in range(n)]
json.dump(t,open('tracks.json','w'))
PY
G350_DIR=$W CAR=$CAR EDIT=$EDIT DUMPWS=1 python3 $V/g350_v8_render.py >/dev/null 2>&1 || true
python3 $V/feature_edit_planner.py plan_input.json --out plan_auto.json
G350_DIR=$W CAR=$CAR EDIT=$EDIT G350_OUT=bobae_m235_munjehyun_be_v3.mp4 LOG=1 python3 $V/g350_v8_render.py
echo RENDER_DONE
