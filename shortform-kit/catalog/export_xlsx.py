"""export_sheet.py 표를 xlsx 한 파일로(구글 시트에 올리는 사본). python3 export_xlsx.py 출력경로"""
import os, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import export_sheet, build

out = sys.argv[1]
C = __import__('json').load(open(build.SRC, encoding='utf-8'))
wb = Workbook()
ws = wb.active
ws.title = '안내'
for r in [['숏폼 자동 편집 매뉴얼 — 깃허브 사본'], [f"버전 v{C['version']} · 갱신 {C['updated']}"],
          ['고치는 원본은 깃허브 shortform-kit 하나입니다. 이 시트는 export_xlsx.py로 만든 보기용 사본이라 직접 고쳐도 다음 갱신 때 덮어써집니다.'],
          ['깃허브: https://github.com/bobaekimboae/bobaedream/tree/shootkit/nuxt-4.6.4/shortform-kit'],
          ['작업 추적(체크리스트): 노션 「숏폼 자동 편집 최종 작업 계획서 · 체크리스트」']]:
    ws.append(r)
ws['A1'].font = Font(name='Arial', bold=True, size=14)
for tab, rows in export_sheet.tabs().items():
    w = wb.create_sheet(tab)
    for r in rows:
        w.append([str(x) for x in r])
    for c in w[1]:
        c.font = Font(name='Arial', bold=True, color='FFFFFF')
        c.fill = PatternFill('solid', fgColor='222222')
    w.freeze_panes = 'A2'
    for col in w.columns:
        L = max(len(str(c.value or '')) for c in col)
        w.column_dimensions[col[0].column_letter].width = min(60, max(10, L * 1.1))
        for c in col[1:]:
            c.alignment = Alignment(wrap_text=True, vertical='top')
            c.font = Font(name='Arial')
wb.save(out)
print(out)
