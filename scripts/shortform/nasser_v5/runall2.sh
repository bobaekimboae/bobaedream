for k in title year grille ev charge power zero trunk screen spoiler awd lamp history; do
  mkdir -p anim/$k
  python3 chip3d.py "$(python3 -c "import json;print(json.dumps(json.load(open('specs2.json'))['$k']))")" $PWD/anim/$k 45 > anim/$k.log 2>&1
  echo done $k $(ls anim/$k | wc -l)
done
