"""Blender lesson 4: batch generation without opening Blender's window.

Generates one terrain per seed, and for each saves a rendered PNG and an STL file into
the "output" folder beside this script. Run from a terminal:

    blender --background --python 04_batch_generate.py -- --seeds 1 2 3 --size 400

Everything after the lone "--" is passed to the script rather than to Blender.
Uses proclib.py from this folder and the generators from the add-on.

Tested with Blender 5.3.
"""
import argparse
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.append(HERE)                                              # so that "import proclib" works
sys.path.append(os.path.join(HERE, "..", "addons"))                # and the add-on's generators

import proclib                                                     # noqa: E402
from procedural_tools import generators                            # noqa: E402

# ---- read our own command-line arguments ----
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument("--seeds", type=int, nargs="+", default=[1, 2, 3])
parser.add_argument("--size", type=int, default=400, help="image size in pixels")
parser.add_argument("--no-render", action="store_true")
args = parser.parse_args(argv)

out_dir = os.path.join(HERE, "output")
os.makedirs(out_dir, exist_ok=True)

for seed in args.seeds:
    proclib.clear_scene()                                          # this also removes unused materials...
    land = proclib.material("Land", (0.35, 0.55, 0.3), roughness=0.9)     # ...so make ours afterwards
    vertices, faces = generators.terrain(seed=seed, size=8.0, cells=96, height=2.4)
    terrain = proclib.mesh_object(f"Terrain {seed}", vertices, faces, smooth=True)
    terrain.data.materials.append(land)
    proclib.camera_and_sun(location=(8, -8, 6.5), target=(0, 0, 0.4))

    # one STL per seed. the seed is in the file name, so any output can be regenerated
    for obj in bpy.context.scene.objects:
        obj.select_set(obj == terrain)
    bpy.context.view_layer.objects.active = terrain
    bpy.ops.wm.stl_export(filepath=os.path.join(out_dir, f"terrain-{seed:04d}.stl"), export_selected_objects=True)

    if not args.no_render:
        proclib.render_still(os.path.join(out_dir, f"terrain-{seed:04d}.png"), size=args.size)
    print(f"seed {seed}: {len(faces)} faces written")

print("Done:", out_dir)
