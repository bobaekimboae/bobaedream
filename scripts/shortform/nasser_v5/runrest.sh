for k in year title grille ev charge power wheel zero trunk screen spoiler awd lamp history; do
  [ -f anim/$k/f_0044.png ] && continue
  mkdir -p anim/$k
  python3 chip3d.py "$(python3 -c "import json;print(json.dumps(json.load(open('specs2.json'))['$k'],ensure_ascii=False))")" $PWD/anim/$k 45 > anim/$k.log 2>&1
  echo done $k $(ls anim/$k | wc -l)
done
