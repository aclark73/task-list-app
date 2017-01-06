"""
Simple script to fix broken task ids in the log history
"""

import json
import re

filename = '/Users/adam/.config/configstore/task-list-app.json'

data = None
with open(filename, 'rb') as f:
  data = json.load(f)
  
for log in data['log']:
  task_id = log['taskId']
  if re.match(r'T.redmine.[^\d].*', task_id):
    m = re.match(r'#(\d+)', log['taskName'])
    if m:
      issue_id = m.group(1)
      log['taskId'] = 'T.redmine.%s' % issue_id

with open(filename, 'wb') as f:
  json.dump(data, f, indent=4)
