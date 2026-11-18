"""BLENDER CHALLENGE 1: THE RULE SCENE
Full brief: blender/01-scripting-blender.html

Checklist
[ ] One script clears the scene and builds everything, including a camera and a light
[ ] At least 200 objects sharing no more than three meshes
[ ] At least three properties per object follow from two different fields
[ ] A SEED constant: the same seed always gives the same scene
[ ] No operator calls inside the main loop
[ ] Runs with: blender --background --python b1_rule_scene.py   and saves a rendered image
"""
import math
import os
import random

import bpy
from mathutils import Vector, noise

SEED = 1
SIZE = 16

# ---- start from an empty scene ----
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

rng = random.Random(SEED)
offset = Vector((rng.uniform(-100, 100), rng.uniform(-100, 100), 0.0))

collection = bpy.data.collections.new("Rule Scene")
bpy.context.scene.collection.children.link(collection)

# ---- your shared meshes and materials here ----

# ---- your loop here ----
for j in range(SIZE):
    for i in range(SIZE):
        pass

# ---- your camera and light here ----

# ---- render ----
# scene = bpy.context.scene
# scene.render.filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"rule-scene-{SEED}.png")
# bpy.ops.render.render(write_still=True)
