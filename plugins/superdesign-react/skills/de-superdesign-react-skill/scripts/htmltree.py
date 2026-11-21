"""htmltree.py: a small, forgiving HTML tree for the contract checks (build.py or check.py
checks and block_inventory.py). Standard library only; not run directly.

parse(html) returns the document node. Nodes have .tag ('#text' and '#comment' for those), .attrs
(dict), .children, .parent and .data (text and comments). Built drafts are well-formed, so end tags
close the nearest open element with the same name and stray end tags are ignored.
"""
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SKIP_TEXT = {"script", "style", "template", "noscript"}


class Node:
    __slots__ = ("tag", "attrs", "children", "parent", "data")

    def __init__(self, tag, attrs=None, parent=None, data=""):
        self.tag = tag
        self.attrs = attrs or {}
        self.children = []
        self.parent = parent
        self.data = data

    # navigation -------------------------------------------------------------
    def elements(self):
        return [c for c in self.children if not c.tag.startswith("#")]

    def iter(self):
        for c in self.children:
            yield c
            if not c.tag.startswith("#"):
                yield from c.iter()

    def find_all(self, tag=None, attr=None):
        for n in self.iter():
            if n.tag.startswith("#"):
                continue
            if tag and n.tag != tag:
                continue
            if attr and attr not in n.attrs:
                continue
            yield n

    def find(self, tag=None, attr=None):
        return next(self.find_all(tag, attr), None)

    def ancestors(self):
        p = self.parent
        while p is not None:
            yield p
            p = p.parent

    def prev_comment(self):
        """The HTML comment just before this element (skipping whitespace), or ''."""
        if not self.parent:
            return ""
        sibs = self.parent.children
        i = sibs.index(self) - 1
        while i >= 0:
            s = sibs[i]
            if s.tag == "#text" and not s.data.strip():
                i -= 1
                continue
            return s.data.strip() if s.tag == "#comment" else ""
        return ""

    # content ----------------------------------------------------------------
    @property
    def classes(self):
        return (self.attrs.get("class") or "").split()

    def text(self):
        parts = []
        for n in self.iter():
            if n.tag == "#text" and not any(a.tag in SKIP_TEXT for a in n.ancestors()):
                parts.append(n.data)
        return " ".join(" ".join(parts).split())

    def __repr__(self):
        cls = " ".join(self.classes[:4])
        return f"<{self.tag}{' #' + self.attrs['id'] if self.attrs.get('id') else ''}{' .' + cls if cls else ''}>"


class _Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#document")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, {k: (v if v is not None else "") for k, v in attrs}, self.stack[-1])
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        node = Node(tag, {k: (v if v is not None else "") for k, v in attrs}, self.stack[-1])
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(Node("#text", parent=self.stack[-1], data=data))

    def handle_comment(self, data):
        self.stack[-1].children.append(Node("#comment", parent=self.stack[-1], data=data))


def parse(html):
    b = _Builder()
    b.feed(html)
    b.close()
    return b.root
