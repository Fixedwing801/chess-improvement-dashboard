from html.parser import HTMLParser
from pathlib import Path
import subprocess
import sys
import tempfile

class InlineScripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.external = False
        self.current = []
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "script":
            self.in_script = True
            self.external = any(k.lower() == "src" for k, _ in attrs)
            self.current = []

    def handle_data(self, data):
        if self.in_script and not self.external:
            self.current.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "script" and self.in_script:
            source = "".join(self.current).strip()
            if source:
                self.scripts.append(source)
            self.in_script = False
            self.external = False
            self.current = []

files = [Path(p) for p in sys.argv[1:]]
count = 0
for html_file in files:
    parser = InlineScripts()
    parser.feed(html_file.read_text(encoding="utf-8"))
    for index, source in enumerate(parser.scripts, start=1):
        with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as temp:
            temp.write(source)
            temp_path = Path(temp.name)
        try:
            subprocess.run(["node", "--check", str(temp_path)], check=True)
        finally:
            temp_path.unlink(missing_ok=True)
        count += 1
print(f"Validated {count} inline JavaScript block(s) across {len(files)} HTML file(s).")
