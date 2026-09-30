#!/usr/bin/env python3
"""
Build the stand-alone demo and the WordPress plugin zip.

    python3 tools/build.py

Outputs
    index.html, demo/index.html   one self-contained page (styles, fonts and scripts inlined); the root copy is what Vercel serves
    dist/mkurugenzi.zip   the plugin, ready for Plugins > Add New > Upload Plugin
"""
import base64
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')


def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()


def build_demo():
    css = read('assets', 'rack.css')
    css = re.sub(
        r'url\("(fonts/[^"]+)"\)',
        lambda m: 'url("data:font/woff2;base64,' + base64.b64encode(open(os.path.join(A, m.group(1)), 'rb').read()).decode() + '")',
        css,
    )
    js = '\n'.join(read('assets', f) for f in ('products.js', 'cart.js', 'rack.js'))
    html = read('preview.html')
    tags = '  <script src="assets/products.js"></script>\n  <script src="assets/cart.js"></script>\n  <script src="assets/rack.js"></script>'
    assert tags in html, 'preview.html script tags changed'
    html = html.replace('<link rel="stylesheet" href="assets/rack.css">', '<style>\n' + css + '\n</style>')
    html = html.replace(tags, '<script>\n' + js.replace('</script', '<\\/script') + '\n</script>')
    html = html.replace('<title>Mkurugenzi preview</title>', '<title>Mkurugenzi</title>')
    html = re.sub(r'<p class="note">.*?</p>', '', html, flags=re.S)
    os.makedirs(os.path.join(ROOT, 'demo'), exist_ok=True)
    for out in (os.path.join(ROOT, 'demo', 'index.html'), os.path.join(ROOT, 'index.html')):
        with open(out, 'w', encoding='utf-8') as f:
            f.write(html)
    print('index.html + demo/index.html', len(html), 'bytes')


def build_zip():
    files = ['mkurugenzi.php', 'README.md', 'preview.html']
    for dirpath, _, names in os.walk(A):
        for n in names:
            files.append(os.path.relpath(os.path.join(dirpath, n), ROOT))
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    out = os.path.join(ROOT, 'dist', 'mkurugenzi.zip')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(files):
            z.write(os.path.join(ROOT, f), os.path.join('mkurugenzi', f))
    print('dist/mkurugenzi.zip', os.path.getsize(out), 'bytes,', len(files), 'files')


if __name__ == '__main__':
    build_demo()
    build_zip()
