from PIL import Image
im = Image.open('assets/receipt_blank.jpg')
print('Size:', im.size)
w, h = im.size
crop_date = im.crop((int(w * 0.03), int(h * 0.25), int(w * 0.28), int(h * 0.38)))
crop_date.save('scratch/date_region.png')
print('Saved scratch/date_region.png')
