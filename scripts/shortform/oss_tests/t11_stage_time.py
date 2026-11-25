# 파이썬(합성) CPU와 자식 프로세스(FFmpeg 인코딩 등) CPU를 나눠 잰다. 사용: python stage_time.py common.py <차 폴더>
import resource, runpy, sys, time, json
import os; t = time.perf_counter(); script = os.path.abspath(sys.argv[1]); sys.argv = [script] + sys.argv[2:]; sys.path.insert(0, os.path.dirname(script))
try:
    runpy.run_path(script, run_name='__main__')
except SystemExit:
    pass
w = time.perf_counter() - t; s = resource.getrusage(resource.RUSAGE_SELF); c = resource.getrusage(resource.RUSAGE_CHILDREN)
print('STAGE', json.dumps({'py': sys.version.split()[0], 'wall': round(w, 1), 'python_cpu': round(s.ru_utime + s.ru_stime, 1), 'child_cpu': round(c.ru_utime + c.ru_stime, 1)}))
