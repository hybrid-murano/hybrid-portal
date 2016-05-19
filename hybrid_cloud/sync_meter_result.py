import json
import os
import sys
from datetime import datetime, timedelta
from time import sleep


def sync_meter_result(clusters):
    currentPath = os.path.dirname(os.path.realpath(__file__))
    result = []
    total_lines = {}
    timestamps = get_timestamps()

    for t in timestamps:
        t_result = {}
        for c in clusters:
            t_result[c] = 0
        result.append({"timestamp": t,
                       "meter": t_result})
    for c in clusters:
        total_lines[c] = 0

    meter_result_file = "%s/meter_result_new" % currentPath
    meter_total_file = "%s/meter_total_new" % currentPath
    if os.path.exists(meter_result_file) is False:
        with open(meter_result_file, 'w') as f:
            json.dump(result, f)
    else:
        with open(meter_result_file, 'r') as f:
            try:
                result = json.load(f)
            except Exception:
                pass
    if os.path.exists(meter_total_file) is False:
        with open(meter_total_file, 'w') as f:
            json.dump(total_lines, f)
    else:
        with open(meter_total_file, 'r') as f:
            try:
                total_lines = json.load(f)
            except Exception:
                pass
    while True:
        sleep(15)
        # timestamp = str(datetime.utcnow()).replace(" ", "T")
        t_result = {}
        for c in clusters:
            target_result_file = "%s/%s.xml" % (currentPath, c)
            if os.path.exists(target_result_file) is True:
                total_line = int(os.popen("wc -l %s" % target_result_file).read().split(" ")[0])
                # result.pop(0)
                if total_line < total_lines[c]:
                    t_result[c] = total_line * 4
                else:
                    t_result[c] = (total_line - total_lines[c]) * 4
                total_lines[c] = total_line
            else:
                t_result[c] = 0
                total_lines[c] = 0
        if len(result) == 60:
            result.pop(0)
        timestamp = str(datetime.utcnow()).replace(" ", "T")
        result.append({"timestamp": timestamp,
                       "meter": t_result})
        with open(meter_result_file, 'w') as f:
            json.dump(result, f)
        with open(meter_total_file, 'w') as f:
            json.dump(total_lines, f)


def get_timestamps():
    now = datetime.utcnow()
    timestamps = []
    for i in range(10):
        timestamps.insert(0, str(now - timedelta(seconds=i*15)).replace(" ", "T"))
    return timestamps

if __name__ == "__main__":
    sync_meter_result(sys.argv[1:])

