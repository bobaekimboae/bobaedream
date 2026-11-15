for k in logo engine phev wheel headrest dial screen spec; do
  [ -f anim_bgt/$k/f_0044.png ] && continue
  mkdir -p anim_bgt/$k
  python3 chip3d.py "$(python3 -c "import json;print(json.dumps(json.load(open('specs_bgt.json'))['$k'],ensure_ascii=False))")" $PWD/anim_bgt/$k 45 > anim_bgt/$k.log 2>&1
  echo done $k $(ls anim_bgt/$k | wc -l)
done
