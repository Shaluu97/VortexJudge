import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('views/contests.html', 'r', encoding='utf-8') as f:
    text = f.read()

pos = 60900
print(text[pos:pos+900])
