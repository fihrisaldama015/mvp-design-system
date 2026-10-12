"""Put Figma variant exports and a Storybook screenshot on one image for review.
Usage: python3 scripts/figma/compareSheet.py <out.png> <storybook.png> <figma1.png> [figma2.png ...] [--cols N]
Needs Pillow (pip install pillow)."""
import sys
from PIL import Image, ImageDraw

args = sys.argv[1:]
cols = 6
if "--cols" in args:
    i = args.index("--cols"); cols = int(args[i + 1]); del args[i:i + 2]
out, storybook, figs = args[0], args[1], args[2:]
ims = [Image.open(f) for f in figs]
cw = max(i.width for i in ims) + 24
ch = max(i.height for i in ims) + 24
rows = (len(ims) + cols - 1) // cols
fig = Image.new("RGBA", (cw * cols, ch * rows + 40), "white")
ImageDraw.Draw(fig).text((10, 10), "FIGMA", fill="black")
for k, im in enumerate(ims):
    fig.paste(im, ((k % cols) * cw + 12, 40 + (k // cols) * ch + 12), im)
sb = Image.open(storybook)
sheet = Image.new("RGB", (max(fig.width, sb.width), fig.height + sb.height + 40), "white")
sheet.paste(fig, (0, 0))
ImageDraw.Draw(sheet).text((10, fig.height + 10), "STORYBOOK", fill="black")
sheet.paste(sb, (0, fig.height + 40))
sheet.save(out)
print(out, sheet.size)
