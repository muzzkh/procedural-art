"""Procedural Tools: a small Blender add-on from the Procedural Art course.

Adds two entries to Add > Mesh and a panel in the 3D viewport's sidebar (press N, "Procedural" tab).

Install (Blender 4.2 or newer): Edit > Preferences > Get Extensions > the menu at the top right >
Install from Disk, and choose the zip built from this folder. See Blender lesson 4.

Tested with Blender 5.3.
"""
import bpy
from bpy.props import FloatProperty, IntProperty

from . import generators

# Only needed by Blender versions older than 4.2, which read this instead of blender_manifest.toml.
bl_info = {
    "name": "Procedural Tools",
    "author": "Your Name",
    "version": (1, 0, 0),
    "blender": (4, 2, 0),
    "location": "View3D > Add > Mesh, and View3D > Sidebar > Procedural",
    "description": "Seeded procedural meshes from the Procedural Art course",
    "category": "Add Mesh",
}


def build_object(context, name, vertices, faces):
    """Turn generated data into an object at the 3D cursor, selected and active."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    context.collection.objects.link(obj)
    obj.location = context.scene.cursor.location
    for other in context.selected_objects:
        other.select_set(False)
    obj.select_set(True)
    context.view_layer.objects.active = obj
    return obj


class MESH_OT_procedural_terrain(bpy.types.Operator):
    """Add a noise terrain generated from a seed"""          # this text is the tooltip
    bl_idname = "mesh.procedural_terrain"                     # how the operator is called from Python
    bl_label = "Procedural Terrain"                           # its name in menus
    bl_options = {"REGISTER", "UNDO"}                         # UNDO also gives the adjust panel after running

    # Properties are declared as annotations. Blender builds the interface for them.
    seed: IntProperty(name="Seed", default=1, min=0)
    size: FloatProperty(name="Size", default=8.0, min=0.1, unit="LENGTH")
    cells: IntProperty(name="Resolution", default=64, min=4, max=512)
    height: FloatProperty(name="Height", default=2.0, min=0.0)
    scale: FloatProperty(name="Feature Scale", default=0.45, min=0.01)

    def execute(self, context):
        vertices, faces = generators.terrain(self.seed, self.size, self.cells, self.height, self.scale)
        build_object(context, f"Terrain {self.seed}", vertices, faces)
        return {"FINISHED"}


class MESH_OT_procedural_vase(bpy.types.Operator):
    """Add a twisted, ribbed vase generated from a seed (in millimetres)"""
    bl_idname = "mesh.procedural_vase"
    bl_label = "Procedural Vase"
    bl_options = {"REGISTER", "UNDO"}

    seed: IntProperty(name="Seed", default=1, min=0)
    height: FloatProperty(name="Height (mm)", default=120.0, min=1.0)
    radius: FloatProperty(name="Radius (mm)", default=30.0, min=1.0)
    twist: FloatProperty(name="Twist", default=1.0)
    ribs: IntProperty(name="Ribs", default=8, min=0, max=64)
    wall: FloatProperty(name="Wall (mm)", default=2.4, min=0.4)

    def execute(self, context):
        vertices, faces = generators.vase(self.seed, self.height, self.radius, self.twist, self.ribs)
        obj = build_object(context, f"Vase {self.seed}", vertices, faces)
        solidify = obj.modifiers.new("Wall", "SOLIDIFY")       # an editable wall thickness
        solidify.thickness = self.wall
        solidify.offset = -1.0
        return {"FINISHED"}


class VIEW3D_PT_procedural_tools(bpy.types.Panel):
    bl_label = "Procedural Tools"
    bl_space_type = "VIEW_3D"               # which editor
    bl_region_type = "UI"                   # its sidebar
    bl_category = "Procedural"              # the tab name

    def draw(self, context):
        layout = self.layout
        layout.label(text="Add from a seed:")
        column = layout.column(align=True)
        column.operator(MESH_OT_procedural_terrain.bl_idname, icon="RNDCURVE")
        column.operator(MESH_OT_procedural_vase.bl_idname, icon="MESH_CYLINDER")


def menu_entries(self, context):
    self.layout.separator()
    self.layout.operator(MESH_OT_procedural_terrain.bl_idname, icon="RNDCURVE")
    self.layout.operator(MESH_OT_procedural_vase.bl_idname, icon="MESH_CYLINDER")


classes = (MESH_OT_procedural_terrain, MESH_OT_procedural_vase, VIEW3D_PT_procedural_tools)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.VIEW3D_MT_mesh_add.append(menu_entries)


def unregister():
    bpy.types.VIEW3D_MT_mesh_add.remove(menu_entries)
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
