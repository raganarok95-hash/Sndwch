import base64, io, json, sys
from PIL import Image
F='/tmp/claude-0/-home-user-Sndwch/28da3334-b050-583a-a4d9-fd222faefa13/scratchpad/latas/fuentes/'
IMG='/home/user/Sndwch/img/'
b64=lambda p: base64.b64encode(open(p,'rb').read()).decode()
def foto(p, lado=220):
    x=Image.open(p).convert('RGB'); s=min(x.size); l=(x.width-s)//2; t=(x.height-s)//2
    x=x.crop((l,t,l+s,t+s)).resize((lado,lado), Image.LANCZOS); bio=io.BytesIO(); x.save(bio,'JPEG',quality=82)
    return 'data:image/jpeg;base64,'+base64.b64encode(bio.getvalue()).decode()
def png(p, ancho):
    x=Image.open(p).convert('RGBA'); h=int(x.height*ancho/x.width); x=x.resize((ancho,h), Image.LANCZOS); bio=io.BytesIO(); x.save(bio,'PNG',optimize=True)
    return 'data:image/png;base64,'+base64.b64encode(bio.getvalue()).decode()
t=open('orbita.template.html',encoding='utf-8').read()
rep={'__F_ANTON__':b64(F+'f3.woff2'),'__F_ARCHIVO__':b64(F+'f6.woff2'),'__F_PLEX5__':b64(F+'f10.woff2'),'__F_PLEX6__':b64(F+'f15.woff2'),'__F_SERIF__':b64(F+'f18.woff2'),
     '__I_ASOMA__':png(IMG+'wicho_asoma.png',300),'__I_CELEBRA__':png(IMG+'wicho2_celebra.png',320),'__I_LOGO__':png(IMG+'logo-avatar-96.png',72),
     '__FOTOS__':json.dumps({k:foto(IMG+f'prot_{k.lower()}.webp') for k in ['P09','P04','P06','P08','P05']})}
for k,v in rep.items(): t=t.replace(k,v)
open('armador-espiral.html','w',encoding='utf-8').write(t)
print(len(t)//1024,'KB')
