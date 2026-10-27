"""Extract the supplied base cards and school artwork. No expansion or alternate backs."""
from PIL import Image
from pathlib import Path
for page, first in [(2,1),(4,10),(6,19)]:
 im=Image.open(f'tmp/pdfs/cards-{page:02}.png')
 for i in range(9):
  x=102+(i%3)*310; y=30+(i//3)*478
  im.crop((x,y,x+310,y+478)).save(f'public/cards/{first+i:02}.webp',quality=90)
im=Image.open('tmp/pdfs/cards-08.png')
for name,i in [('wolf',0),('cat',1),('bear',2),('viper',3),('griffin',4),('manticore',5),('ciri',7)]:
 x=102+i%3*310; y=30+i//3*478
 im.crop((x,y,x+310,y+478)).save(f'public/schools/{name}-ability.webp',quality=92)
 im.crop((x,y,x+310,y+140)).resize((620,280)).save(f'public/schools/{name}.webp',quality=92)
# Exact source pictograms, cut from the provided base cards.
for page,icons in [(6,{'attack':(283,50,335,103),'defense':(230,50,272,103),'special':(564,49,613,103),'trace':(619,49,665,103)}),(2,{'alchemy':(202,48,250,103),'potion':(303,522,347,574),'monster':(282,130,331,176)})]:
 im=Image.open(f'tmp/pdfs/cards-{page:02}.png')
 for name,box in icons.items():
  im.crop(box).save(f'public/icons/{name}.webp',quality=95)
Image.open('tmp/pdfs/cards-01.png').crop((102,30,412,508)).save('public/cards/back.webp',quality=85)

im=Image.open('tmp/pdfs/rules-09.png')
for name,box in {'chain':(576,690,632,758),'discard':(576,794,632,867),'recover':(576,1009,635,1088),'on-damage':(572,908,637,980)}.items():
 im.crop(box).save(f'public/icons/{name}.webp',quality=95)
