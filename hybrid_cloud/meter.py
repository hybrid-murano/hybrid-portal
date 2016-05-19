import logging
from datetime import datetime
from datetime import timedelta
import os
try:
    import xml.etree.cElementTree as ET
except ImportError:
    import xml.etree.ElementTree as ET

from openerp import SUPERUSER_ID
from openerp import tools
from openerp.modules.module import get_module_resource
from openerp.osv import fields, osv
from openerp.tools.translate import _
from bdb import set_trace

_logger = logging.getLogger(__name__)

from openerp import http
from openerp.http import request
import werkzeug.wrappers

class Meter(http.Controller):
    global_meter_result = {} #{target: [{timestamp, meter}]}
    global_targets = []

    @http.route('/action/restart', type='http', auth="none")
    def restart(self, s_action=None, **kw):
        if request.httprequest.method == 'POST':
            users = kw.get('users')
            freq = kw.get('freq')
            address = kw.get('address')
            now = datetime.utcnow()
            if len(self.global_meter_result) == 0:
                self.global_meter_result[address] = []
                for i in range(4):
                    ntime = now - timedelta(seconds=(i*15))
                    self.global_meter_result[address].insert(0, {str(ntime).replace(" ", "T"): 0})
            _logger.debug('restart:{0}, {1}, {2}'.format(users, freq, address))
            currentPath = os.path.dirname(os.path.realpath(__file__))
            logfile = '%s/%s.xml' % (currentPath, address)
            f = currentPath + '/meter.jmx'
            tree = ET.parse(f)
            root = tree.getroot()
            for child in root.iter('stringProp'):
                if child.attrib['name'] == "ThreadGroup.num_threads":
                    child.text = users
                elif child.attrib['name'] == "ThreadGroup.ramp_time":
                    child.text = freq
                elif child.attrib['name'] == "HTTPSampler.domain":
                    child.text = address
                elif child.attrib['name'] == "HTTPSampler.port":
                    child.text = '80'
                elif child.attrib['name'] == "filename":
                    child.text = currentPath + '/' + address + '.xml'
                else:
                    continue
            tree.write(f)
            os.system("ps -ef|grep jmeter | awk '$8!=\"grep\"{system(\"kill -9 \" $2)}'")
            os.system('jmeter -n -t %s &' % f)
            os.system("ps -ef|grep sync_meter_result | awk '$8!=\"grep\"{system(\"kill -9 \" $2)}'")
            os.system('python %s/%s %s &' % (currentPath, 'sync_meter_result.py', address))
            return '{"ret": "success"}'
            #return '{"ret": %s}' % global_meter_result

#    @http.route('/action/restart', type='http', auth="none")
#    def restart(self, s_action=None, **kw):
#        if request.httprequest.method == 'POST':
#            users = kw.get('users')
#            freq = kw.get('freq')
#            address = kw.get('address')
#            _logger.debug('restart:{0}, {1}, {2}'.format(users, freq, address))
#            currentPath = os.path.dirname(os.path.realpath(__file__))
#            for i in range(len(users)):
#                f = currentPath + '/meter.jmx'
#                tree = ET.parse(f)
#                root = tree.getroot()
#                for child in root.iter('stringProp'):
#                    if child.attrib['name'] == "ThreadGroup.num_threads":
#                        child.text = users
#                    elif child.attrib['name'] == "ThreadGroup.ramp_time":
#                        child.text = freq
#                    elif child.attrib['name'] == "HTTPSampler.domain":
#                        child.text = address
#                    elif child.attrib['name'] == "HTTPSampler.port":
#                        child.text = '80'
#                    elif child.attrib['name'] == "filename":
#                        child.text = currentPath + '/result%s.xml' % i
#                    else:
#                        continue
#                tree.write(currentPath + '/meter%s.jmx' % i)
#            os.system("ps -ef|grep jmeter | awk '$8!=\"grep\"{system(\"kill -9 \" $2)}'")
#            for i in range(len(users)):
#                configfile = currentPath + '/meter%s.jmx' % i
#                os.system('jmeter -n -t %s &' % configfile)
#            return '{"ret": "success"}'
    
    @http.route('/action/turnover', type='http', auth="none")
    def turnover(self, s_action=None, **kw):
        if request.httprequest.method == 'POST':
            return '{"ret": "success"}'
    
    @http.route('/api/status', type='http', auth="none")
    def stub(self, s_action=None, **kw):
        return '''{"valid":true,
                "frontend":[{"nodeCount":2, "load":"30%", "az":"az01", "region":"shenzhen--fusionsphere"},
                          {"nodeCount":3, "load":"15%", "az":"az11", "region":"shenzhen--vcloud"},
                          {"nodeCount":2, "load":"50%", "az":"az32", "region":"tokyo--aws"}],
                "backend":[{"inst":"backend-01", "region":"shenzhen--fusionsphere", "az":"az01", "status":"standby"},
                         {"inst":"backend-02", "region":"shenzhen--vcloud", "az":"az11", "status":"active"}]}'''

    @http.route('/api/meter', type='http', auth="none")
    def meter(self, s_action=None, **kw):
        return '''{"stats":[
        {"timestamp":"2016-05-06T07:19:55.428728329Z","meter":{"cluster1":4721689099007,"cluster2":4721768817321}},
        {"timestamp":"2016-05-06T07:19:56.428867426Z","meter":{"cluster1":4721743003302,"cluster2":4721796745933}},
        {"timestamp":"2016-05-06T07:19:57.42949298Z","meter":{"cluster1":4721768817321,"cluster2":4721814730548}},
        {"timestamp":"2016-05-06T07:19:58.42888513Z","meter":{"cluster1":4721796745933,"cluster2":4721876802794}},
        {"timestamp":"2016-05-06T07:19:59.429039054Z","meter":{"cluster1":4721814730548,"cluster2":4721903980568}}
        ]}'''

    @http.route('/api/model', type='http', auth="none")
    def model(self, s_action=None, **kw):
        return '{"resourceId":"canvas1","properties":{"name":"","documentation":"","process_id":"process","process_author":"","process_executable":"Yes","process_version":"","process_namespace":"http://www.activiti.org/processdef","executionlisteners":"","eventlisteners":"","dataproperties":""},"stencil":{"id":"BPMNDiagram"},"childShapes":[{"resourceId":"oryx_34DC689D-37A4-4C3C-AE17-A5DABC4B4127","properties":{"overrideid":"","name":"","documentation":"","formproperties":"","initiator":"","formkeydefinition":"","executionlisteners":""},"stencil":{"id":"StartNoneEvent"},"childShapes":[],"outgoing":[{"resourceId":"oryx_B9C0E12B-FC44-4FE2-946F-1E493F27CD8E"},{"resourceId":"oryx_1E93D0EC-E2ED-4A53-9AA7-FF27F5BABD8E"}],"bounds":{"lowerRight":{"x":227.5,"y":45},"upperLeft":{"x":197.5,"y":15}},"dockers":[]},{"resourceId":"oryx_B9C0E12B-FC44-4FE2-946F-1E493F27CD8E","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55"}],"bounds":{"lowerRight":{"x":203.41349805717107,"y":116.38909963381802},"upperLeft":{"x":147.3482206928289,"y":42.04840036618198}},"dockers":[{"x":15,"y":15},{"x":92,"y":33.5}],"target":{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55"}},{"resourceId":"oryx_1E93D0EC-E2ED-4A53-9AA7-FF27F5BABD8E","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245"}],"bounds":{"lowerRight":{"x":283.07059042913755,"y":116.41296787241336},"upperLeft":{"x":222.32003457086242,"y":42.02453212758664}},"dockers":[{"x":15,"y":15},{"x":85.50000000000001,"y":33}],"target":{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245"}},{"resourceId":"oryx_A2C1089D-0E33-4552-B3DE-1A49072E35F7","properties":{"overrideid":"","name":"cluster_shenzhen","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55","properties":{"overrideid":"","name":"az01--fusionsphere","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":"","looptype":"None","dataproperties":""},"stencil":{"id":"SubProcess"},"childShapes":[{"resourceId":"oryx_DD6F5A9E-AD94-47C3-8F21-4ACF6EDCF3DD","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":70,"y":61.5},"upperLeft":{"x":30,"y":21.5}},"dockers":[]},{"resourceId":"oryx_9742BA28-E1A5-4B01-8357-162C4F54A741","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":145,"y":61.5},"upperLeft":{"x":105,"y":21.5}},"dockers":[]}],"outgoing":[{"resourceId":"oryx_8F4C4BA3-6420-4BF0-B1A2-B2C5850E2EAB"}],"bounds":{"lowerRight":{"x":199,"y":101.5},"upperLeft":{"x":15,"y":34.5}},"dockers":[]},{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245","properties":{"overrideid":"","name":"az11--vcloud","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":"","looptype":"None","dataproperties":""},"stencil":{"id":"SubProcess"},"childShapes":[{"resourceId":"oryx_D34C6ADF-58F3-4012-856F-A3694C05D586","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":61,"y":61},"upperLeft":{"x":21,"y":21}},"dockers":[]},{"resourceId":"oryx_A991DA22-BC01-4E6B-BFE4-26E07A2C9DC0","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":145,"y":61},"upperLeft":{"x":105,"y":21}},"dockers":[]}],"outgoing":[{"resourceId":"oryx_FFA13E89-D8EA-42DD-A731-B2B15091F3F2"}],"bounds":{"lowerRight":{"x":381,"y":101},"upperLeft":{"x":210,"y":35}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":410,"y":195},"upperLeft":{"x":15,"y":82}},"dockers":[]},{"resourceId":"oryx_224A42F4-8664-4236-9BE2-26A7F73E01AE","properties":{"overrideid":"","name":"cluster_tokyo","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_7224FF2E-8113-487E-BF3C-6609473BD712","properties":{"overrideid":"","name":"az32--aws","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":"","looptype":"None","dataproperties":""},"stencil":{"id":"SubProcess"},"childShapes":[{"resourceId":"oryx_5B404C90-B3B7-467B-9C41-0914D0837F94","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":128,"y":60},"upperLeft":{"x":88,"y":20}},"dockers":[]}],"outgoing":[{"resourceId":"oryx_9D463149-F2A0-48BA-A8B6-1F27B550A531"}],"bounds":{"lowerRight":{"x":172,"y":105.5},"upperLeft":{"x":15,"y":37.5}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":603,"y":195.5},"upperLeft":{"x":420,"y":80.5}},"dockers":[]},{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"ParallelGateway"},"childShapes":[],"outgoing":[{"resourceId":"oryx_AA40CC8B-FA9A-4BA2-A253-CEA64F54982D"},{"resourceId":"oryx_553C58F1-CF81-49B8-BCE2-C2B3BD06D248"}],"bounds":{"lowerRight":{"x":330.4166717529297,"y":280},"upperLeft":{"x":290.4166717529297,"y":240}},"dockers":[]},{"resourceId":"oryx_8F4C4BA3-6420-4BF0-B1A2-B2C5850E2EAB","properties":{"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}],"bounds":{"lowerRight":{"x":297.77703100917876,"y":252.6208202868811},"upperLeft":{"x":179.53580080987868,"y":183.5901172131189}},"dockers":[{"x":92,"y":33.5},{"x":20,"y":20}],"target":{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}},{"resourceId":"oryx_FFA13E89-D8EA-42DD-A731-B2B15091F3F2","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}],"bounds":{"lowerRight":{"x":310.8380302890385,"y":239.64453835933426},"upperLeft":{"x":310.62747018493764,"y":183.8046803906657}},"dockers":[{"x":85.50000000000001,"y":33},{"x":20.5,"y":20.5}],"target":{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}},{"resourceId":"oryx_9D463149-F2A0-48BA-A8B6-1F27B550A531","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}],"bounds":{"lowerRight":{"x":449.3111814453417,"y":253.24661914584328},"upperLeft":{"x":324.45965824582044,"y":186.37838085415672}},"dockers":[{"x":78.5,"y":34},{"x":20.5,"y":20.5}],"target":{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}},{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799","properties":{"overrideid":"","name":"","documentation":"","executionlisteners":""},"stencil":{"id":"EndNoneEvent"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":260.4166717529297,"y":342},"upperLeft":{"x":232.4166717529297,"y":314}},"dockers":[]},{"resourceId":"oryx_8FA76418-B008-4272-A62D-D338E7BEE1B5","properties":{"overrideid":"","name":"","documentation":"","executionlisteners":""},"stencil":{"id":"EndNoneEvent"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":388.5833282470703,"y":342},"upperLeft":{"x":360.5833282470703,"y":314}},"dockers":[]},{"resourceId":"oryx_AA40CC8B-FA9A-4BA2-A253-CEA64F54982D","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799"}],"bounds":{"lowerRight":{"x":301.1555014813834,"y":317.78482180884686},"upperLeft":{"x":256.177842024476,"y":270.71517819115314}},"dockers":[{"x":20.5,"y":20.5},{"x":14,"y":14}],"target":{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799"}},{"resourceId":"oryx_553C58F1-CF81-49B8-BCE2-C2B3BD06D248","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"Association"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":366,"y":317},"upperLeft":{"x":321.08219182751776,"y":270.92696406502586}},"dockers":[{"x":20.5,"y":20.5},{"x":366,"y":317}]},{"resourceId":"oryx_B6FCDE7B-B394-44E8-B390-C1843F03028B","properties":{"overrideid":"","name":"","documentation":"","formproperties":"","initiator":"","formkeydefinition":"","executionlisteners":""},"stencil":{"id":"StartNoneEvent"},"childShapes":[],"outgoing":[{"resourceId":"oryx_AE06C02F-3C48-4CAE-90C6-9F34C57E6A5F"}],"bounds":{"lowerRight":{"x":526.5,"y":45},"upperLeft":{"x":496.5,"y":15}},"dockers":[]},{"resourceId":"oryx_AE06C02F-3C48-4CAE-90C6-9F34C57E6A5F","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_7224FF2E-8113-487E-BF3C-6609473BD712"}],"bounds":{"lowerRight":{"x":512.9367337597607,"y":117.64075934540261},"upperLeft":{"x":511.75076624023933,"y":45.296740654597365}},"dockers":[{"x":15,"y":15},{"x":78.5,"y":34}],"target":{"resourceId":"oryx_7224FF2E-8113-487E-BF3C-6609473BD712"}}],"bounds":{"lowerRight":{"x":1485,"y":1050},"upperLeft":{"x":0,"y":0}},"stencilset":{"url":"../stencilsets/bpmn2.0/bpmn2.0.json","namespace":"http://b3mn.org/stencilset/bpmn2.0#"},"ssextensions":[]}'
