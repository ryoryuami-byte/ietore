# -*- coding: utf-8 -*-
import numpy as np
from PIL import Image
import cv2, os

SRC = '/root/.claude/uploads/7453bf9f-7119-5e38-a963-9a298874d49c/1cf80e78-9DF7129B6C99422CB03359102FB9494B.png'
OUT = '/tmp/claude-0/-home-user-ietore/7453bf9f-7119-5e38-a963-9a298874d49c/scratchpad/icons2'
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert('RGB')
a = np.array(img).astype(np.uint8)
H, W, _ = a.shape

hsv = cv2.cvtColor(a, cv2.COLOR_RGB2HSV)
sat = hsv[..., 1].astype(int)
bg_like = (sat < 40).astype(np.uint8)  # candidate: page white + shadow + interior white linework

# keep ONLY the connected background component(s) touching the image border —
# this separates the true outer background/shadow from interior white line-art
n, labels = cv2.connectedComponents(bg_like, connectivity=4)
border_labels = set(labels[0, :].tolist()) | set(labels[-1, :].tolist()) | set(labels[:, 0].tolist()) | set(labels[:, -1].tolist())
border_labels.discard(0)
outer_bg = np.isin(labels, list(border_labels))

ys, xs = np.where(~outer_bg)
y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
print('icon bbox', x0, y0, x1, y1, 'canvas', W, H)

side = max(x1 - x0, y1 - y0) + 1
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
half = side // 2 + 1
cx0, cy0 = max(0, cx - half), max(0, cy - half)
cx1, cy1 = min(W, cx + half), min(H, cy + half)

crop = a[cy0:cy1, cx0:cx1]
crop_outer_bg = outer_bg[cy0:cy1, cx0:cx1]
print('crop size', crop.shape, 'outer bg px in crop', crop_outer_bg.sum())

mask = (crop_outer_bg.astype(np.uint8)) * 255
mask = cv2.dilate(mask, np.ones((7, 7), np.uint8), iterations=1)
crop_bgr = cv2.cvtColor(crop, cv2.COLOR_RGB2BGR)
inpainted_bgr = cv2.inpaint(crop_bgr, mask, 12, cv2.INPAINT_TELEA)
inpainted = cv2.cvtColor(inpainted_bgr, cv2.COLOR_BGR2RGB)

clean = Image.fromarray(inpainted, 'RGB')
s = min(clean.size)
clean = clean.crop((0, 0, s, s))
clean.save(os.path.join(OUT, 'clean-full.png'))
Image.fromarray((mask)).save(os.path.join(OUT, 'debug-mask.png'))
print('clean size', clean.size)
