import re, glob, os

files = []
for pat in ['*.html', '**/*.html']:
    files.extend(glob.glob(pat, recursive=True))

def keep(f):
    f2 = f.replace(os.sep, '/')
    return 'tmp-21st-init/' not in f2 and 'tasks/' not in f2

files = sorted(set(f for f in files if keep(f)))

ANCHOR_RE = re.compile(
    r'(<a\b[^>]*href="mailto:[^"]+"[^>]*>.*?</a>)',
    re.DOTALL
)

total = 0
changed = []
for fp in files:
    s = open(fp, encoding='utf-8').read()
    if 'mailto:' not in s:
        continue
    out = []
    pos = 0
    w = 0
    for m in ANCHOR_RE.finditer(s):
        out.append(s[pos:m.start()])
        a = m.group(1)
        prefix = s[max(0, m.start() - 20):m.start()]
        if '<!--email_off-->' in prefix[-20:]:
            out.append(a)
        else:
            out.append('<!--email_off-->' + a + '<!--/email_off-->')
            w += 1
        pos = m.end()
    out.append(s[pos:])
    new = ''.join(out)
    if new != s:
        open(fp, 'w', encoding='utf-8').write(new)
        total += w
        changed.append((fp, w))

for f, n in changed:
    print(f, '->', n)
print('TOTAL:', total)
