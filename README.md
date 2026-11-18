# Procedural Art

A self-teaching course in procedural and generative art. Every example on every page is live: edit the code beside the picture and it redraws.

**Read it online:** https://muzzkh.github.io/procedural-art/

## What is in it

| Section | Folder | Pages |
|---|---|---|
| The lessons, from a first rectangle to finished generative work | `lessons/` | 19 |
| The maths underneath | `math/` | 6 |
| Special topics: interaction, practical uses, fabrication, sound, hardware, AI, critique, publishing, workflow | `special/` | 9 |
| 3D printing and G-code | `printing/` | 5 |
| three.js | `three/` | 3 |
| Blender scripting, geometry nodes and add-ons | `blender/` | 4 |
| Website design | `web/` | 2 |
| Three longer projects | `projects/` | 3 |
| Glossary, cheat sheet, artists to study | `reference/` | 3 |

Each lesson ends with a challenge to build yourself. The starter files are in `challenges/`. There are no solutions.

## Running it on your own computer

There is nothing to install and no build step. Download or clone the repository and open `index.html` in a browser.

To do the challenges, open a file from `challenges/` in a code editor, write your sketch, and refresh the browser.

The three.js pages load three.js from a CDN, so they need an internet connection. Everything else works offline.

## How it is made

Plain HTML, CSS and JavaScript drawing on a canvas.

- `assets/pa.js`: a small helper library (seeded randomness, noise, colour).
- `assets/lesson.js`: runs the live examples.
- `assets/site.js`: navigation, colour themes and the generative page decorations.
- `assets/lesson.css`: one stylesheet, with five colour themes. Blueprint is the default; the Theme button on any page switches between them.
- `assets/mesh.js`: 3D mesh helpers for the printing section.
