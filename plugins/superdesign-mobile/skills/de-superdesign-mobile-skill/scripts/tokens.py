"""tokens.py: src/tokens.json, the ONE token source of a mobile app redesign, turned into what the
HTML drafts and the React Native app need. Used by build.py ({{tokens}} in the head partial) and
tokens_export.py (theme/tokens.ts). Not run directly. Standard library only.

tokens.json shape (templates/tokens.example.json):
  fonts     {"href": Google Fonts URL, "sans": [families...], "display": [...]}
  colors    primitives by hue and step: {"ink": {"900": "#..."}, "white": "#FFFFFF"}
  semantic  {"light": {"bg": "paper-50", "fg": "ink-900", "scrim": "ink-950/40", ...}, "dark": {...}}
            values: a primitive name, "name/NN" (opacity %), or "#hex"
  type      roles in points: {"body": {"font": "sans", "size": 17, "lh": 22, "weight": 400, "track": -0.4}}
  radius    {"md": 12, "sheet": 28, "pill": 999} (points)
  space     [0, 4, 8, 12, 16, 20, 24, 32, 40, 48] (points; drafts use Tailwind's 4px scale)
  shadow    {"card": {"y": 2, "blur": 12, "color": "ink-950", "opacity": 0.08}}

Drafts get: Tailwind colors for every primitive and semantic name (semantic ones read CSS custom
properties, so html.dark swaps them), type-role classes .t-<role> in rem (TEXT_SCALE renders grow
them like Dynamic Type), radius and shadow utilities, and the device metrics as custom properties.
"""
import json
import re


def strip(o):
    if isinstance(o, dict):
        return {k: strip(v) for k, v in o.items() if not k.startswith("_")}
    if isinstance(o, list):
        return [strip(v) for v in o]
    return o


def load(path):
    return strip(json.loads(open(path, encoding="utf-8").read()))


def flatten(colors):
    pal = {}
    for name, val in colors.items():
        if isinstance(val, dict):
            for step, hexv in val.items():
                pal[name if step == "DEFAULT" else f"{name}-{step}"] = hexv
        else:
            pal[name] = val
    return pal


def hex_rgb(h):
    h = h.strip().lstrip("#")
    if len(h) in (3, 4):
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def resolve(value, pal, depth=0):
    """'ink-900', 'ink-950/40', '#0E1626' -> ((r, g, b), alpha)."""
    alpha = 1.0
    m = re.fullmatch(r"(.+?)/(\d{1,3})", value)
    if m:
        value, alpha = m.group(1), int(m.group(2)) / 100
    if value.startswith("#"):
        return hex_rgb(value), alpha
    if value in pal:
        return hex_rgb(pal[value]), alpha
    raise KeyError(f"unknown color '{value}' (not a primitive in tokens.json colors)")


def semantic(tokens):
    pal = flatten(tokens.get("colors", {}))
    out = {}
    for theme, m in (tokens.get("semantic") or {}).items():
        out[theme] = {name: resolve(v, pal) for name, v in m.items()}
    return out


def rgba(rgb, a):
    return f"rgb({rgb[0]} {rgb[1]} {rgb[2]} / {a:g})" if a < 1 else "#%02X%02X%02X" % rgb


def shadow_css(spec, pal):
    rgb, _ = resolve(spec.get("color", "#000000"), pal)
    return f"0 {spec.get('y', 0)}px {spec.get('blur', 0)}px {spec.get('spread', 0)}px rgba({rgb[0]},{rgb[1]},{rgb[2]},{spec.get('opacity', 0.1)})"


def tailwind_config(tokens):
    pal = flatten(tokens.get("colors", {}))
    sem = semantic(tokens)
    colors = dict(tokens.get("colors", {}))
    names = sorted({n for m in sem.values() for n in m})
    for n in names:
        first = next(m[n] for m in sem.values() if n in m)
        colors[n] = f"rgb(var(--c-{n}) / <alpha-value>)" if first[1] == 1 else f"var(--c-{n})"
    fams = {k: v for k, v in (tokens.get("fonts") or {}).items() if isinstance(v, list)}
    radius = {k: (f"{v}px" if isinstance(v, (int, float)) else v) for k, v in (tokens.get("radius") or {}).items()}
    shadows = {k: shadow_css(v, pal) for k, v in (tokens.get("shadow") or {}).items()}
    return {"darkMode": "class", "theme": {"extend": {"colors": colors, "fontFamily": fams, "borderRadius": radius, "boxShadow": shadows}}}


def _var(rgb, a):
    return f"{rgb[0]} {rgb[1]} {rgb[2]}" if a == 1 else f"rgb({rgb[0]} {rgb[1]} {rgb[2]} / {a:g})"


def role_css(name, r, fams):
    size = r.get("size", 17)
    decl = []
    if r.get("font") in fams:
        decl.append("font-family:" + ",".join(fams[r["font"]]))
    decl.append(f"font-size:{size / 16:g}rem")
    if r.get("lh"):
        decl.append(f"line-height:{r['lh'] / 16:g}rem")
    if r.get("weight"):
        decl.append(f"font-weight:{r['weight']}")
    if r.get("track"):
        decl.append(f"letter-spacing:{r['track'] / size:.4f}em")
    if r.get("tabular"):
        decl.append("font-variant-numeric:tabular-nums")
    if r.get("case") == "upper":
        decl.append("text-transform:uppercase")
    return f".t-{name}{{{';'.join(decl)}}}"


DEVICE = {"width": 390, "height": 844, "status": 47, "home": 34, "tabbar": 49, "navbar": 44}


def device_of(cfg):
    d = dict(DEVICE)
    d.update(cfg.get("device") or {})
    return d


def css(tokens, device):
    """Plain CSS: custom properties per theme and device metrics."""
    sem = semantic(tokens)
    lines = []
    for theme, sel in (("light", ":root"), ("dark", ".dark")):
        if theme in sem:
            lines.append(sel + "{" + ";".join(f"--c-{n}:{_var(*v)}" for n, v in sem[theme].items()) + "}")
    d = device
    lines.append(f":root{{--device-w:{d['width']}px;--device-h:{d['height']}px;--status-h:{d['status']}px;--home-h:{d['home']}px;"
                 f"--tabbar-h:{d['tabbar']}px;--navbar-h:{d['navbar']}px}}")
    if "light" in sem:
        lines.append(":root{color-scheme:light}.dark{color-scheme:dark}")
    return "\n".join(lines)


def layer_css(tokens, device):
    """Tailwind-processed CSS: .t-<role> classes (so components can @apply them), body type, .screen."""
    fams = {k: v for k, v in (tokens.get("fonts") or {}).items() if isinstance(v, list)}
    roles = tokens.get("type") or {}
    comp = [role_css(n, r, fams) for n, r in roles.items()]
    d = device
    # a screen is the device: a fixed screen is exactly one device tall, a scroll screen at least one
    comp.append(f".screen{{position:relative;min-height:{d['height']}px;display:flex;flex-direction:column}}"
                f".screen[data-screen=\"fixed\"]{{height:{d['height']}px;overflow:hidden}}")
    base = ("body{" + role_css("body", roles["body"], fams).split("{", 1)[1]) if "body" in roles else ""
    return "@layer base{" + base + "}\n@layer components{\n" + "\n".join(comp) + "\n}"


def head_block(tokens, cfg):
    conf = json.dumps(tailwind_config(tokens), indent=1)
    dev = device_of(cfg)
    return (f"<script>\ntailwind.config = {conf}\n</script>\n<style>\n{css(tokens, dev)}\n</style>\n"
            f"<style type=\"text/tailwindcss\">\n{layer_css(tokens, dev)}\n</style>")


def font_links(tokens):
    href = (tokens.get("fonts") or {}).get("href")
    if not href:
        return ""
    return ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            f'<link href="{href}" rel="stylesheet">')
