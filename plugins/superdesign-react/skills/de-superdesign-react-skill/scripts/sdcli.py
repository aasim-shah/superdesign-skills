"""sdcli.py: how the Python tools call the Superdesign CLI. Not run directly.

Resolution order:
  1. $SUPERDESIGN_CLI, split like a shell command (for example "npx --yes @superdesign/cli@0.9.0").
  2. a `superdesign` executable on PATH.
  3. `npx --yes @superdesign/cli@latest` (the form the Superdesign skill documents).

Every call gets `--json`. Commands that spend credits are refused here, so no tool can reach them.
"""
import json
import os
import shlex
import shutil
import subprocess
import sys

CREDIT_SPENDERS = {"create-design-draft", "iterate-design-draft", "execute-flow-pages", "generate-image",
                   "generate-video", "create-presentation"}
TRANSIENT = ("500", "502", "503", "504", "timeout", "Timeout", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN",
             "fetch failed", "socket hang up", "Service Unavailable", "Bad Gateway")


def command():
    env = os.environ.get("SUPERDESIGN_CLI")
    if env:
        return shlex.split(env)
    if shutil.which("superdesign"):
        return ["superdesign"]
    return ["npx", "--yes", "@superdesign/cli@latest"]


def run(args, cwd=None):
    """Run once. Returns (json_or_None, error_text)."""
    if args and args[0] in CREDIT_SPENDERS:
        sys.exit(f"refused: superdesign {args[0]} spends credits")
    r = subprocess.run([*command(), *args, "--json"], capture_output=True, text=True, cwd=cwd)
    try:
        j = json.loads(r.stdout)
    except ValueError:
        return None, (r.stdout + r.stderr)[-400:]
    if r.returncode == 0 or "draftId" in j or "nodes" in j or "url" in j:
        return j, ""
    return None, json.dumps(j)[:400]


def transient(err):
    return any(t in (err or "") for t in TRANSIENT)


def draft_id(j):
    """The draft id from an import response. Never the node id: imports also return a
    `draft-variant-...` node id, which fetch-design-nodes does not use."""
    if not isinstance(j, dict):
        return None
    for v in (j.get("draftId"), (j.get("draft") or {}).get("id") if isinstance(j.get("draft"), dict) else None, j.get("id")):
        if isinstance(v, str) and v and not v.startswith("draft-variant-"):
            return v
    return None


def printable(args):
    return " ".join(command() + [a if " " not in a else repr(a) for a in args])
