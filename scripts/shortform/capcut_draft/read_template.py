"""캡컷 견본 프로젝트(draft_content.json)에서 시점·위치·크기·등장 효과를 읽어 템플릿 JSON으로 저장한다.
사용(노트북): python read_template.py <프로젝트이름> <출력.json>
"""
import json, os, sys

name, outp = sys.argv[1], sys.argv[2]
D = os.path.expandvars(rf"%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft\{name}\draft_content.json")
j = json.load(open(D, encoding="utf-8"))
vids = {m["id"]: m for m in j["materials"]["videos"]}
auds = {m["id"]: m for m in j["materials"]["audios"]}
anims = {m["id"]: m for m in j["materials"].get("material_animations", [])}
texts = {m["id"]: m for m in j["materials"]["texts"]}
out = {"canvas": j.get("canvas_config"), "duration": j["duration"], "tracks": []}
for t in j["tracks"]:
    tr = {"type": t["type"], "segs": []}
    for s in t["segments"]:
        mid = s["material_id"]
        seg = {"start": s["target_timerange"]["start"] / 1e6, "dur": s["target_timerange"]["duration"] / 1e6}
        c = s.get("clip") or {}
        if c:
            seg.update(x=c["transform"]["x"], y=c["transform"]["y"], scale=c["scale"]["x"])
        if mid in vids:
            seg["path"] = vids[mid]["path"]
        if mid in auds:
            seg["path"] = auds[mid]["path"]; seg["volume"] = s.get("volume")
        if mid in texts:
            seg["text"] = json.loads(texts[mid]["content"]).get("text")
        an = [{"type": a.get("type"), "name": a.get("name"), "dur": a.get("duration", 0) / 1e6}
              for r in s.get("extra_material_refs", []) if r in anims for a in anims[r].get("animations", [])]
        if an:
            seg["anim"] = an
        tr["segs"].append(seg)
    out["tracks"].append(tr)
json.dump(out, open(outp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(out["tracks"]))
