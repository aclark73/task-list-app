"""
Simple script to fix broken task ids in the log history
"""

import csv
import json
import re
import sys

filename = '/Users/adam/.config/configstore/task-list-app.json'


data = None
with open(filename, 'rb') as f:
  data = json.load(f)

out = csv.DictWriter(sys.stdout, data['log'][0].keys())
out.writeheader()

for log in data['log']:
  out.writerow(log)
