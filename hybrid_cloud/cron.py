import os
import sys
import json

f = os.popen('ls *.xml').read().strip('\n').split('\n')
print f

sys.exit(1)
rs = os.popen('wc -l %s' % f).read()
currentPath = os.path.dirname(os.path.realpath(__file__))
filename = currentPath + 'cron.log'
#with open(filename, 'r') as f:
    
print os.popen('wc -l %s' % f).read() 
