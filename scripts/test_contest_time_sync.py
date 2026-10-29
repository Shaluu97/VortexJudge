# -*- coding: utf-8 -*-
import re
import unittest
import urllib.request
import urllib.parse
import json

class TestContestTimeSync(unittest.TestCase):
    
    def test_admin_html_ui_structure(self):
        with open('views/admin.html', 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Labels check
        self.assertIn('<label class="form-label" for="cmStart">Boshlanish vaqti:</label>', content)
        self.assertIn('<label class="form-label" for="cmDuration">Davomiyligi (soat:daqiqa):</label>', content)
        self.assertIn('<label class="form-label" for="cmEnd">Tugash vaqti:</label>', content)

        # 2. Separate form-groups
        self.assertRegex(content, r'<div class="form-group">\s*<label class="form-label" for="cmStart">Boshlanish vaqti:</label>\s*<input[^>]+id="cmStart"')
        self.assertRegex(content, r'<div class="form-group">\s*<label class="form-label" for="cmDuration">Davomiyligi \(soat:daqiqa\):</label>\s*<input[^>]+id="cmDuration"')
        self.assertRegex(content, r'<div class="form-group">\s*<label class="form-label" for="cmEnd">Tugash vaqti:</label>\s*<input[^>]+id="cmEnd"')

        # 3. Reactive callbacks
        self.assertIn('calcCmEndTimeFromDuration()', content)
        self.assertIn('calcCmDurationFromEndTime()', content)
        self.assertIn('formatLocalDateTime', content)
        self.assertIn('parseLocalInputDate', content)

    def test_contests_html_ui_structure(self):
        with open('views/contests.html', 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn('<label for="fStart">Boshlanish vaqti:</label>', content)
        self.assertIn('<label for="fDuration">Davomiyligi (soat:daqiqa):</label>', content)
        self.assertIn('<label for="fEnd">Tugash vaqti:</label>', content)
        self.assertIn('calcEndTimeFromDuration()', content)
        self.assertIn('calcDurationFromEndTime()', content)

    def test_contest_workspace_html_ui_structure(self):
        with open('views/contest_workspace.html', 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn('<label class="form-label" for="cwStart">Boshlanish vaqti:</label>', content)
        self.assertIn('<label class="form-label" for="cwDuration">Davomiyligi (soat:daqiqa):</label>', content)
        self.assertIn('<label class="form-label" for="cwEnd">Tugash vaqti:</label>', content)
        self.assertIn('calcCwEndTimeFromDuration()', content)
        self.assertIn('calcCwDurationFromEndTime()', content)

    def test_local_date_and_duration_math(self):
        # Emulate JS calculation
        def pad(n): return f"{n:02d}"
        
        # Test 1: 11/03/2026 09:00 AM + 04:00 -> 11/03/2026 01:00 PM (13:00)
        from datetime import datetime, timedelta
        s = datetime(2026, 11, 3, 9, 0)
        dur_hours = 4
        dur_mins = 0
        e = s + timedelta(hours=dur_hours, minutes=dur_mins)
        self.assertEqual(e.strftime('%Y-%m-%dT%H:%M'), '2026-11-03T13:00')

        # Reverse: 13:00 - 09:00 -> 4h 0m -> "04:00"
        diff_mins = int((e - s).total_seconds() // 60)
        rev_dur = f"{pad(diff_mins // 60)}:{pad(diff_mins % 60)}"
        self.assertEqual(rev_dur, '04:00')

        # Test 2: Crossing midnight: 22:30 + 03:00 -> 01:30 next day
        s2 = datetime(2026, 11, 3, 22, 30)
        e2 = s2 + timedelta(hours=3, minutes=0)
        self.assertEqual(e2.strftime('%Y-%m-%dT%H:%M'), '2026-11-04T01:30')
        diff_mins2 = int((e2 - s2).total_seconds() // 60)
        self.assertEqual(f"{pad(diff_mins2 // 60)}:{pad(diff_mins2 % 60)}", '03:00')

if __name__ == '__main__':
    unittest.main()
