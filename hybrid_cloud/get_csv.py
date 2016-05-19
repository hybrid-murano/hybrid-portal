import csv
with open('./report.csv' , 'rb') as f :
    reader=csv.reader(f)
    for row in reader:
        print row
        
f.close()

import os
os.system("pause")