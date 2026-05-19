import re

title_updates = [
    ('doosletters-rotterdam/index.html',
     'Doosletters Rotterdam — channel letters, front-lit en halo-lit | Alfa Reclame',
     'Doosletters Rotterdam — Channel Letters | Alfa Reclame'),
    ('bestickering-rotterdam/index.html',
     'Bestickering Rotterdam — vinyl voor voertuigen, ramen en objecten | Alfa Reclame',
     'Bestickering Rotterdam — Vinyl &amp; Wraps | Alfa Reclame'),
    ('fleet-wrap-rotterdam/index.html',
     'Fleet Wrap Rotterdam — wagenpark belettering 5–25+ voertuigen | Alfa Reclame',
     'Fleet Wrap Rotterdam — Wagenpark | Alfa Reclame'),
    ('autoreclame-rotterdam/index.html',
     'Autoreclame Rotterdam — bedrijfswagen belettering vanaf &euro;395 | Alfa Reclame',
     'Autoreclame Rotterdam vanaf &euro;395 | Alfa Reclame'),
    ('lichtreclame-rotterdam/index.html',
     'Lichtreclame Rotterdam — LED-lichtbak, doosletters en halo-lit | Alfa Reclame',
     'Lichtreclame Rotterdam — LED &amp; Doosletters | Alfa'),
    ('gevelreclame-rotterdam/index.html',
     'Gevelreclame Rotterdam — lichtbak, 3D letters en gevelbelettering | Alfa Reclame',
     'Gevelreclame Rotterdam — 3D &amp; Lichtbak | Alfa'),
    ('materialen/index.html',
     'Materialen — A-merk Vinyl 3M, Avery, Hexis &amp; Orafol | Alfa Reclame Rotterdam',
     'Materialen — 3M, Avery, Hexis | Alfa Reclame'),
    ('werkwijze/index.html',
     'Onze Werkwijze — Van Offerte tot Oplevering in 7 Stappen | Alfa Reclame Rotterdam',
     'Werkwijze — Offerte tot Oplevering | Alfa Reclame'),
]

meta_updates = [
    ('index.html',
     'Alfa Reclame Rotterdam: raambelettering, autoreclame, gevelreclame. 14 jaar vakwerk, A-merk vinyl, 2 jaar garantie. Vraag offerte aan.'),
    ('doosletters-rotterdam/index.html',
     'Doosletters Rotterdam: front-lit, halo-lit, side-lit channel letters. CNC-gefreesd, 5 jaar LED-garantie. Pakketten vanaf &euro;2495.'),
    ('bestickering-rotterdam/index.html',
     'Bestickering Rotterdam: voertuig-, raam-, wand- en vloervinyl. A-merk vinyl, vakkundige montage. Vanaf &euro;149.'),
    ('fleet-wrap-rotterdam/index.html',
     'Fleet wrap Rotterdam voor 5-25+ voertuigen. 3M, Avery, Hexis vinyl, SLA 48u repair. Vanaf &euro;1995.'),
    ('autoreclame-rotterdam/index.html',
     'Autoreclame Rotterdam: bestelbus, vrachtwagen, fleet. 3M &amp; Avery cast vinyl, 2 jaar garantie. Vanaf &euro;395.'),
    ('lichtreclame-rotterdam/index.html',
     'Lichtreclame Rotterdam: LED-lichtbakken, doosletters, neon-look LED. Osram/Samsung, 5 jaar garantie. Vanaf &euro;1495.'),
    ('gevelreclame-rotterdam/index.html',
     'Gevelreclame Rotterdam: vinyl, 3D freesletters, lichtbak, doosletters. A-merk materialen, 2 jaar garantie. Vanaf &euro;295.'),
    ('materialen/index.html',
     'A-merk vinyl en LED: 3M, Avery, Hexis, Orafol, Osram. Cast vinyl, LED-modules, freesletters, garantie tot 10 jaar.'),
    ('branches/index.html',
     'Branche-signage Rotterdam: horeca, retail, zorg, industrie. Raambelettering, autoreclame, gevelreclame &amp; wayfinding.'),
    ('werkwijze/index.html',
     'Werkwijze Alfa Reclame: WhatsApp-aanvraag, locatiebezoek, proefdruk, productie en oplevering met 2 jaar garantie.'),
    ('faq/index.html',
     'FAQ Alfa Reclame Rotterdam: raambelettering, autoreclame, gevelreclame, materialen, prijzen en garantie. 30 vragen.'),
    ('offerte/index.html',
     'Bereken direct uw offerte voor reclamebord, autoreclame of raambelettering Rotterdam. Gratis offerte binnen 1 werkdag.'),
    ('reviews/index.html',
     '4.9 sterren uit 25+ Google-reviews. 14 jaar Alfa Reclame Rotterdam in raambelettering, autoreclame en gevelreclame.'),
    ('over-ons/index.html',
     'Alfa Reclame Rotterdam sinds 2012: raambelettering, autoreclame, gevelreclame. KvK 88606902, 500+ projecten, 4.9&#9733;.'),
]

print('=== TITLES ===')
for fp, old, new in title_updates:
    s = open(fp, encoding='utf-8').read()
    old_tag = '<title>' + old + '</title>'
    new_tag = '<title>' + new + '</title>'
    if old_tag in s:
        s = s.replace(old_tag, new_tag, 1)
        open(fp, 'w', encoding='utf-8').write(s)
        decoded_len = len(re.sub(r'&[a-z]+;|&#\d+;', 'x', new))
        print(f'{fp:50s} OK ({decoded_len} chars)')
    else:
        print(f'{fp:50s} NOT FOUND')

print()
print('=== META DESCRIPTIONS ===')
META_RE = re.compile(
    r'(<meta\s+name="description"\s+content=")([^"]*)("\s*/?>)'
)
for fp, new_desc in meta_updates:
    s = open(fp, encoding='utf-8').read()
    m = META_RE.search(s)
    if not m:
        print(f'{fp:50s} NO meta tag')
        continue
    s2 = META_RE.sub(lambda mm: mm.group(1) + new_desc + mm.group(3), s, count=1)
    open(fp, 'w', encoding='utf-8').write(s2)
    decoded_len = len(re.sub(r'&[a-z]+;|&#\d+;', 'x', new_desc))
    print(f'{fp:50s} OK ({decoded_len} chars)')
