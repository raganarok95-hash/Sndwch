import numpy as np
from PIL import Image, ImageFilter
ST='/home/user/sndwch/docs/marketing/stickers-apertura/'
F='/mnt/project-files/entregas/marketing/pedidosya/fotos/separadas/'
OUT='/mnt/project-files/entregas/marketing/pedidosya/fotos/botellas/'
import os; os.makedirs(OUT,exist_ok=True)
def hexrgb(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)
LIQ={'bloom':'#7F0D31','cold-brew':'#441C0B','cool':'#BFB662','lemon-tea':'#AD5E13','chai':'#772612'}
def tinta(sid):
    s=np.array(Image.open(ST+f'botella-frente-{sid}.png').convert('RGB')).astype(float)
    bg=hexrgb(LIQ[sid]); d=np.sqrt(((s-bg)**2).sum(-1))
    a=np.clip((d-10)/40,0,1)
    gold=np.sqrt(((s-hexrgb('#CBA258'))**2).sum(-1)); a=np.where(gold<14,1.0,a)
    return s,a
def warp(s,a,R,w,h):
    H,W=a.shape
    u=(np.arange(w)-w/2+0.5)
    phi=np.arcsin(np.clip(u/R,-1,1)); half=np.arcsin(min(1,(w/2)/R))
    sx=((phi/half)+1)/2*(W-1)
    sy=np.linspace(0,H-1,h)
    X,Y=np.meshgrid(sx,sy)
    xi=np.clip(X.round().astype(int),0,W-1); yi=np.clip(Y.round().astype(int),0,H-1)
    img=s[yi,xi]; al=a[yi,xi]
    shade=np.cos(phi)[None,:]**0.35
    img=img*shade[...,None]*1.0
    al=al*np.clip(np.cos(phi)[None,:]*1.6,0,1)
    return img,al
def base_from_bloom(clean):
    im=np.array(Image.open(F+'16-the-bloom.jpg').convert('RGB')).astype(float)
    if clean:
        H,W,_=im.shape
        # rebuild background where props are: vertical gradient from clean column at x=900
        col=im[:,900,:]
        bgimg=np.repeat(col[:,None,:],W,1)
        # la base de la botella: el lado izquierdo, espejo del derecho (los adornos tapaban el izquierdo)
        cx=516; y0=770
        mir=im[y0:,cx:cx+140][:, ::-1].copy()
        fade=np.clip((np.arange(y0,H)-y0)/30,0,1)[:,None,None]
        im[y0:,cx-140:cx]=im[y0:,cx-140:cx]*(1-fade)+mir*fade
        red=im[...,0]-(im[...,1]+im[...,2])/2
        props=np.zeros((H,W),bool)
        props[700:,:394]=True; props[900:,:]=True
        props[700:,404:420]&=(red[700:,404:420]>60)&(np.arange(700,H)[:,None]>835)
        m=Image.fromarray((props*255).astype('uint8')).filter(ImageFilter.GaussianBlur(6))
        m=np.array(m)[...,None]/255
        im=im*(1-m)+bgimg*m
        # soft contact shadow under bottle
        yy,xx=np.mgrid[0:H,0:W]
        sh=np.exp(-(((xx-520)/150)**2+((yy-884)/14)**2))*0.22
        im=im*(1-sh[...,None]*np.array([0.35,0.38,0.45]))
    return im
def recolor(im,target):
    red=im[...,0]-(im[...,1]+im[...,2])/2
    pink=(im[...,2]-im[...,1])+(im[...,0]-im[...,1])
    m=np.maximum(np.clip((red-30)/50,0,1),np.clip((pink-22)/30,0,1))
    m=np.array(Image.fromarray((m*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)))/255
    lum=im.mean(-1); ref=np.median(lum[m>0.9])
    T=hexrgb(target)
    k=lum/ref
    new=np.where(k[...,None]<=1, T*k[...,None], T+(255-T)*np.clip(k[...,None]-1,0,1)*0.9)
    return im*(1-m[...,None])+new*m[...,None]
def hacer(sid,salida,base,R=105,cx=516,top=425):
    s,a=tinta(sid)
    w=int(2*R*0.80); h=int(w*100/60*0.80/0.80*0.96)
    img,al=warp(s,a,R,w,h)
    out=base.copy()
    x0=cx-w//2
    reg=out[top:top+h,x0:x0+w]
    out[top:top+h,x0:x0+w]=reg*(1-al[...,None])+img*al[...,None]
    Image.fromarray(np.clip(out,0,255).astype('uint8')).save(OUT+salida+'.jpg',quality=92)
bloom=np.array(Image.open(F+'16-the-bloom.jpg').convert('RGB')).astype(float)
clean=base_from_bloom(True)
hacer('bloom','16-the-bloom',bloom)
hacer('cold-brew','17-cold-brew-tea',recolor(clean,'#4A200D'))
hacer('lemon-tea','19-lemon-tea',recolor(clean,'#A85A12'))
hacer('chai','20-the-chai',recolor(clean,'#7A2A14'))
cool=np.array(Image.open(F+'18-the-cool.jpg').convert('RGB')).astype(float)
hacer('cool','18-the-cool',cool)
