"""BLENDER CHALLENGE 4: YOUR OWN ADD-ON
Full brief: blender/04-addons-and-libraries.html

Checklist
[ ] At least one operator generating geometry from a seed, with four or more limited properties
[ ] The adjust panel regenerates the result when a property changes
[ ] A panel in the viewport sidebar, and an entry in the Add menu
[ ] All generating code is in generators.py, which imports nothing from the interface
[ ] The folder builds with: blender --command extension build --source-dir . --output-dir ..
[ ] Generated objects carry their seed and settings as custom properties
[ ] A batch script uses generators.py to produce files for a list of seeds
[ ] Enable, disable, enable again: no errors in the console
"""
import bpy
from bpy.props import FloatProperty, IntProperty

from . import generators


class MESH_OT_my_generator(bpy.types.Operator):
    """Add an object from my generator"""
    bl_idname = "mesh.my_generator"
    bl_label = "My Generator"
    bl_options = {"REGISTER", "UNDO"}

    seed: IntProperty(name="Seed", default=1, min=0)
    size: FloatProperty(name="Size", default=2.0, min=0.1)
    # ---- your properties here ----

    def execute(self, context):
        vertices, faces = generators.generate(self.seed, self.size)
        mesh = bpy.data.meshes.new("Generated")
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        obj = bpy.data.objects.new("Generated", mesh)
        context.collection.objects.link(obj)
        obj["seed"] = self.seed
        return {"FINISHED"}


# ---- your panel here ----


def menu_entry(self, context):
    self.layout.operator(MESH_OT_my_generator.bl_idname)


classes = (MESH_OT_my_generator,)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.VIEW3D_MT_mesh_add.append(menu_entry)


def unregister():
    bpy.types.VIEW3D_MT_mesh_add.remove(menu_entry)
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
