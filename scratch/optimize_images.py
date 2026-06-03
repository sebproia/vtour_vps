import os
from PIL import Image

src_dir = r"c:\Users\sebas\test_antigrativy\food-tour-app\public"

images_to_optimize = {
    "donut.png": 300,
    "donut-dial.png": 300,
    "grade-disgusted.png": 350,
    "grade-skeptical.png": 350,
    "grade-smiling.png": 350,
    "grade-happy.png": 350,
    "grade-laughing.png": 350
}

print("--- Optimizing Images ---")
for fname, max_dim in images_to_optimize.items():
    fpath = os.path.join(src_dir, fname)
    if os.path.exists(fpath):
        orig_size = os.path.getsize(fpath) / 1024
        with Image.open(fpath) as img:
            # Calculate new size maintaining aspect ratio
            width, height = img.size
            if width > max_dim or height > max_dim:
                if width > height:
                    new_width = max_dim
                    new_height = int(height * (max_dim / width))
                else:
                    new_height = max_dim
                    new_width = int(width * (max_dim / height))
                
                # Resize with high quality Resampling
                resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            else:
                resized_img = img.copy()
            
            # Save the image with optimization
            # For PNG, optimize=True attempts to compress it as much as possible
            resized_img.save(fpath, format="PNG", optimize=True)
            
            new_size = os.path.getsize(fpath) / 1024
            reduction = ((orig_size - new_size) / orig_size) * 100
            print(f"{fname}: Resized to {resized_img.size[0]}x{resized_img.size[1]} | Size: {orig_size:.2f} KB -> {new_size:.2f} KB (-{reduction:.1f}%)")
    else:
        print(f"{fname}: NOT FOUND")
