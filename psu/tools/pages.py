"""Создаёт HTML-страницы всех плат из шаблона tools/template.html и списка tools/boards.json.
Запуск из корня проекта: python3 tools/pages.py
Чтобы добавить плату: допишите её в boards.json (id, file, nav, group, icon, desc, title, h1, lead,
btn, mains, card, ledT, foot, rhint) и запустите скрипт."""
import json, re, html, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B=json.load(open(os.path.join(ROOT,"tools/boards.json"),encoding="utf-8"))
TPL=open(os.path.join(ROOT,"tools/template.html"),encoding="utf-8").read()
EXTRA=[dict(file="extra/psu-basics.html",nav="Основы: блок-схема",group="Теория",icon="book",desc="Как устроен импульсный блок питания")]
CORE=["01-helpers","*parts","*schematic","04-render","*sim","06-loop","07-kit","*scenarios","08-workshop","*probe","09-instruments","*device","10-ui","11-extras","12-pcb","13-exam","14-ux","15-assist","16-pcbflow","17-more","18-nav"]
def ntasks(bid):
    s=open(os.path.join(ROOT,f"boards/{bid}/scenarios.js"),encoding="utf-8").read()
    return len(re.findall(r'\{t:"',s))
def nav(cur):
    items=[]
    for b in B+EXTRA:
        bid=b.get("id","")
        n=ntasks(bid) if bid else 0
        items.append(f'<a href="{b["file"]}" data-id="{bid}" data-group="{b["group"]}" data-icon="{b["icon"]}" data-desc="{html.escape(b["desc"])}" data-n="{n}"'+(' aria-current="page"' if bid==cur else '')+f'>{b["nav"]}</a>')
    return '<nav class="boards" id="devNav" aria-label="Устройства" hidden>'+"".join(items)+'</nav>'
for b in B:
    scripts="\n".join(f'<script src="{("boards/"+b["id"]+"/"+c[1:]) if c[0]=="*" else "js/core/"+c}.js"></script>' for c in CORE)
    s=TPL
    for k,v in dict(TITLE=b["title"],H1=b["h1"],LEAD=b["lead"],BTN=b["btn"],MAINS=b["mains"],CARD=b["card"],LEDT=b["ledT"],FOOT=b["foot"],RHINT=b["rhint"],
                    BOARD=b["id"],NAVNAME=b["nav"],NAV=nav(b["id"]),SCRIPTS=scripts).items():
        s=s.replace("{"+k+"}",v)
    open(os.path.join(ROOT,b["file"]),"w",encoding="utf-8").write(s)
    print("ok",b["file"])
