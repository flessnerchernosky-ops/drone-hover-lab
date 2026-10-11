"""Render preview.gif and social-preview.png from trace.csv. Optional Pillow dependency."""
import csv,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent
with (P/'trace.csv').open(encoding='utf-8') as f:
    metadata=f.readline();rows=list(csv.DictReader(f))
ARM='q1' in rows[0];groups={k:[{a:float(b) for a,b in r.items() if a!='kind'} for r in rows if r['kind']==k] for k in (['centroid','component'] if ARM else ['pd','pid'])}
palette=['#ffbc6f','#70dbc7'];names=['Global centroid','Largest component'] if ARM else ['PD','PID'];n=len(next(iter(groups.values())));stride=max(1,n//200)
def font(size):
    for path in ['C:/Windows/Fonts/segoeui.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if Path(path).exists():return ImageFont.truetype(path,size)
    return ImageFont.load_default(size=size)
def xy(x,y):return (300+x*145,285-y*145) if ARM else (300+x*110,300-y*110)
def draw_frame(index):
    image=Image.new('RGB',(640,360),'#0c1423');d=ImageDraw.Draw(image)
    d.text((20,12),'Pixels -> decision -> reach' if ARM else 'Wind -> attitude -> hover',font=font(23),fill='#e9effb')
    d.text((20,46),'Same-color distractor' if ARM else 'Constant 2 N wind | 1 kg | no command delay',font=font(13),fill='#b9c8df')
    d.text((552,18),f'{next(iter(groups.values()))[index]["time"]:.1f} s',font=font(16),fill='#8edcca')
    for x in [-2,-1,0,1,2]:d.line([xy(x,0),xy(x,1.4 if ARM else 2)],fill='#23324a')
    for y in [0,.5,1,1.5,2]:d.line([xy(-2,y),xy(2,y)],fill='#23324a')
    if ARM:
        for x,y,r,col in [(1.05,.8,10,'#e64150'),(-.8,.9,10,'#4182f0'),(.35,1.2,10,'#3ccd7d'),(-1.25,.4,5,'#e64150')]:
            a,b=xy(x,y);d.ellipse((a-r,b-r,a+r,b+r),fill=col)
    else:
        d.line([xy(-2.5,0),xy(2.5,0)],fill='#899cb5',width=2);a,b=xy(0,1.5);d.rectangle((a-11,b-11,a+11,b+11),outline='#aabbce',width=2)
    for j,records in enumerate(groups.values()):
        r=records[index];col=palette[j];trace=[xy(s['x'],s['y' if ARM else 'z']) for s in records[max(0,index-120):index+1:3]]
        if len(trace)>1:d.line(trace,fill=col,width=1)
        if ARM:
            q1,q2=r['q1'],r['q2'];points=[xy(0,0),xy(math.cos(q1),math.sin(q1)),xy(r['x'],r['y'])];d.line(points,fill=col,width=5)
            for a,b in points:d.ellipse((a-4,b-4,a+4,b+4),fill=col)
        else:
            x,z,t=r['x'],r['z'],r['theta'];a,b=xy(x,z);v=(20*math.cos(t),-20*math.sin(t));d.line((a-v[0],b-v[1],a+v[0],b+v[1]),fill=col,width=5);d.ellipse((a-4,b-4,a+4,b+4),fill=col)
        d.text((20+j*310,324),f'{names[j]} | error {r["error"]:.3f} m',font=font(14),fill=col)
    return image
frames=[draw_frame(i).convert('P',palette=Image.Palette.ADAPTIVE,colors=128) for i in range(0,n,stride)]
frames.append(draw_frame(n-1).convert('P',palette=Image.Palette.ADAPTIVE,colors=128))
frames[0].save(P/'docs'/'preview.gif',save_all=True,append_images=frames[1:],duration=100,loop=0,optimize=False)
cover=Image.new('RGB',(1280,640),'#0c1423');d=ImageDraw.Draw(cover);d.text((40,28),P.name,font=font(38),fill='#e9effb');d.text((40,83),'Hardware-free experiments | Chinese / English | Reproducible data',font=font(24),fill='#80dac9');cover.paste(draw_frame(n-1).resize((832,468)),(220,135));cover.save(P/'docs'/'social-preview.png')
print(f'{len(frames)} frames from {len(rows)} raw samples; GIF and cover saved')
