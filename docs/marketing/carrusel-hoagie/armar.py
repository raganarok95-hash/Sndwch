# Carrusel «arma tu Italian Hoagie»: compone cada capa (generada aislada sobre fondo de color) sobre el pan abierto,
# acumulando, para que todas las láminas sean el mismo pan. Receta: docs/hechos/CARTA.md (15CM, 85 g de embutido).
import numpy as np, os
from PIL import Image, ImageFilter
D=os.path.dirname(os.path.abspath(__file__)); C=D+'/capas/'
def key(p):
    im=np.asarray(Image.open(p).convert('RGB')).astype(float)[8:-8,8:-8]
    bg=np.median(np.concatenate([im[:8].reshape(-1,3),im[-8:].reshape(-1,3)]),axis=0)
    d=np.sqrt(((im-bg)**2).sum(2)); a=np.clip((d-60)/70,0,1)
    # quitar el reflejo del fondo en los bordes
    sp=bg/255.0; dom=np.argmax(bg)
    im2=im.copy(); oth=[i for i in range(3) if i!=dom]
    lim=im2[...,oth].max(2) if dom!=0 or True else None
    im2[...,dom]=np.minimum(im2[...,dom], np.maximum(im2[...,oth[0]],im2[...,oth[1]])*1.05+10)
    if bg[0]>200 and bg[2]>200: # magenta: rojo y azul
        g=im2[...,1]; im2[...,0]=np.minimum(im2[...,0],g*1.15+25); im2[...,2]=np.minimum(im2[...,2],g*1.1+20)
    rgba=np.dstack([im2,a*255]).clip(0,255).astype('uint8')
    o=Image.fromarray(rgba,'RGBA'); return o.crop(o.getbbox())
base=Image.open(C+'0-pan.png').convert('RGBA')
BX0,BX1,BY0,BY1=196,822,628,828   # miga de la mitad de abajo
cx,cy=(BX0+BX1)/2,(BY0+BY1)/2
capas=[('1-jamon',1.0,0.95,0,0),('2-salame',0.94,0.78,4,4),('3-pepperoni',0.92,0.62,-4,-2),('4-queso',0.62,0.92,0,0),
       ('5-lechuga',1.02,0.9,0,4),('6-tomate',0.9,0.72,4,-6),('7-cebolla-pimiento',0.98,0.8,0,2)]
cur=base.copy(); cur.convert('RGB').save(D+'/l0.png')
for i,(n,fw,fh,dx,dy) in enumerate(capas,1):
    L=key(C+n+'.png'); W=(BX1-BX0)*fw; H=(BY1-BY0)*fh
    s=min(W/L.width,H/L.height); sx=s; sy=min(H/L.height, s*1.35) if fw>=0.9 else s
    if fw>=0.9: sx=W/L.width; sy=min(H/L.height, sx*1.35)
    L=L.resize((int(L.width*sx),int(L.height*sy)),Image.LANCZOS)
    x=int(cx-L.width/2+dx); y=int(cy-L.height/2+dy)
    sh=Image.new('RGBA',L.size,(0,0,0,0)); al=L.split()[3].filter(ImageFilter.GaussianBlur(5)).point(lambda v:int(v*0.38))
    sh.putalpha(al); cur.alpha_composite(sh,(x+5,y+7)); cur.alpha_composite(L,(x,y))
    cur.convert('RGB').save(D+f'/l{i}.png')
print('ok')
