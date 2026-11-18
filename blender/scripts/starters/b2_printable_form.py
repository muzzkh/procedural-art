"""BLENDER CHALLENGE 2: A PRINTABLE FORM
Full brief: blender/02-meshes-and-modifiers.html

Checklist
[ ] The base shape comes from your own function (from_pydata or bmesh)
[ ] At least two modifiers are added by the script
[ ] Modelled in millimetres, within 256 x 256 x 250, with a flat base
[ ] Seeded, and the seed is stored on the object: obj["seed"] = SEED
[ ] The script exports an STL named after the seed
[ ] Opened in a slicer: size confirmed

Units: one Blender unit = one millimetre.
"""
import math
import os
import random

import bpy

SEED = 1
HEIGHT = 120.0          # millimetres
RADIUS = 30.0
WALL = 2.4

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

rng = random.Random(SEED)


def surface(u, v):
    """u goes round the form, v goes up it, both from 0 to 1. Return (x, y, z) in millimetres."""
    angle = u * math.tau
    r = RADIUS                              # ---- your radius rule here ----
    return (r * math.cos(angle), r * math.sin(angle), v * HEIGHT)


NU, NV = 96, 60
vertices = [surface(i / NU, j / NV) for j in range(NV + 1) for i in range(NU)]
faces = []
for j in range(NV):
    for i in range(NU):
        a = j * NU + i
        b = j * NU + (i + 1) % NU
        faces.append((a, b, b + NU, a + NU))
faces.append(tuple(reversed(range(NU))))            # the floor

mesh = bpy.data.meshes.new("Form")
mesh.from_pydata(vertices, [], faces)
mesh.update()
form = bpy.data.objects.new("Form", mesh)
bpy.context.scene.collection.objects.link(form)
form["seed"] = SEED

# ---- your modifiers here ----

# ---- export ----
# form.select_set(True)
# bpy.context.view_layer.objects.active = form
# path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"form-{SEED}.stl")
# bpy.ops.wm.stl_export(filepath=path, export_selected_objects=True, apply_modifiers=True)
