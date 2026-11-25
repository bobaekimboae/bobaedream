import json,sys
S=sys.argv[1]; d=open(S+'/data.json',encoding='utf-8').read()
tpl=open(S+'/tpl.html',encoding='utf-8').read()
open(S+'/index.html','w',encoding='utf-8').write(tpl.replace('/*DATA*/[]',d))
