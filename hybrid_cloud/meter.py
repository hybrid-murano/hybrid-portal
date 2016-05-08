import logging

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
    @http.route('/api/meter', type='http', auth="none")
    def meter(self, s_action=None, **kw):
        return '{"stats":[{"timestamp":"2016-05-06T07:19:55.428728329Z","meter":4721689099007},{"timestamp":"2016-05-06T07:19:56.428867426Z","meter":4721743003302},{"timestamp":"2016-05-06T07:19:57.42949298Z","meter":4721768817321},{"timestamp":"2016-05-06T07:19:58.42888513Z","meter":4721796745933},{"timestamp":"2016-05-06T07:19:59.429039054Z","meter":4721814730548},{"timestamp":"2016-05-06T07:20:00.428861884Z","meter":4721876802794},{"timestamp":"2016-05-06T07:20:01.428930738Z","meter":4721903980568},{"timestamp":"2016-05-06T07:20:02.429934484Z","meter":4721945474876},{"timestamp":"2016-05-06T07:20:03.430606722Z","meter":4721963890654},{"timestamp":"2016-05-06T07:20:04.429663407Z","meter":4722037515389},{"timestamp":"2016-05-06T07:20:05.429392727Z","meter":4722142804431},{"timestamp":"2016-05-06T07:20:06.429327254Z","meter":4722221509834},{"timestamp":"2016-05-06T07:20:07.428854047Z","meter":4722248575269},{"timestamp":"2016-05-06T07:20:08.428908935Z","meter":4722277707092},{"timestamp":"2016-05-06T07:20:09.42903499Z","meter":4722296677964},{"timestamp":"2016-05-06T07:20:10.428799524Z","meter":4722370699752},{"timestamp":"2016-05-06T07:20:11.429701653Z","meter":4722400254373},{"timestamp":"2016-05-06T07:20:12.428844971Z","meter":4722425289375},{"timestamp":"2016-05-06T07:20:13.430526156Z","meter":4722444983272},{"timestamp":"2016-05-06T07:20:14.428752629Z","meter":4722530478075},{"timestamp":"2016-05-06T07:20:15.428788053Z","meter":4722634122262},{"timestamp":"2016-05-06T07:20:16.4295692Z","meter":4722700495558},{"timestamp":"2016-05-06T07:20:17.429962887Z","meter":4722726816259},{"timestamp":"2016-05-06T07:20:18.44218328Z","meter":4722762790825},{"timestamp":"2016-05-06T07:20:19.428799528Z","meter":4722788968228},{"timestamp":"2016-05-06T07:20:20.428893455Z","meter":4722849226678},{"timestamp":"2016-05-06T07:20:21.429916223Z","meter":4722864488030},{"timestamp":"2016-05-06T07:20:22.428878196Z","meter":4722888124701},{"timestamp":"2016-05-06T07:20:23.428927323Z","meter":4722906750872},{"timestamp":"2016-05-06T07:20:24.428892831Z","meter":4722984775776},{"timestamp":"2016-05-06T07:20:25.42867125Z","meter":4723107117096},{"timestamp":"2016-05-06T07:20:26.429751694Z","meter":4723181241970},{"timestamp":"2016-05-06T07:20:27.429861503Z","meter":4723202450741},{"timestamp":"2016-05-06T07:20:28.429665119Z","meter":4723230141249},{"timestamp":"2016-05-06T07:20:29.428985781Z","meter":4723252133101},{"timestamp":"2016-05-06T07:20:30.429092549Z","meter":4723307708746},{"timestamp":"2016-05-06T07:20:31.428915113Z","meter":4723328571150},{"timestamp":"2016-05-06T07:20:32.429160207Z","meter":4723344106582},{"timestamp":"2016-05-06T07:20:33.429799129Z","meter":4723361437893},{"timestamp":"2016-05-06T07:20:34.428824863Z","meter":4723474807236},{"timestamp":"2016-05-06T07:20:35.428820894Z","meter":4723592617238},{"timestamp":"2016-05-06T07:20:36.428918602Z","meter":4723686510662},{"timestamp":"2016-05-06T07:20:37.428855583Z","meter":4723747578227},{"timestamp":"2016-05-06T07:20:38.428808314Z","meter":4723796976193},{"timestamp":"2016-05-06T07:20:39.428789296Z","meter":4723849425105},{"timestamp":"2016-05-06T07:20:40.428823932Z","meter":4723955233293},{"timestamp":"2016-05-06T07:20:41.428910572Z","meter":4723990170909},{"timestamp":"2016-05-06T07:20:42.428955481Z","meter":4724055788286},{"timestamp":"2016-05-06T07:20:43.428882354Z","meter":4724088215670},{"timestamp":"2016-05-06T07:20:44.429637249Z","meter":4724193243082},{"timestamp":"2016-05-06T07:20:45.429442686Z","meter":4724339236486},{"timestamp":"2016-05-06T07:20:46.428935569Z","meter":4724434993171},{"timestamp":"2016-05-06T07:20:47.429742762Z","meter":4724476702744},{"timestamp":"2016-05-06T07:20:48.42980605Z","meter":4724535975599},{"timestamp":"2016-05-06T07:20:49.428825152Z","meter":4724580172868},{"timestamp":"2016-05-06T07:20:50.428940815Z","meter":4724672529483},{"timestamp":"2016-05-06T07:20:51.429055269Z","meter":4724716354788},{"timestamp":"2016-05-06T07:20:52.428890393Z","meter":4724769119283},{"timestamp":"2016-05-06T07:20:53.429002465Z","meter":4724826022615},{"timestamp":"2016-05-06T07:20:54.428712805Z","meter":4724945380208}]}'

    @http.route('/api/model', type='http', auth="none")
    def model(self, s_action=None, **kw):
        return '''{
            "bounds" : {
                "lowerRight" : {
                    "x" : 1485.0,
                    "y" : 1050.0
                },
                "upperLeft" : {
                    "x" : 0.0,
                    "y" : 0.0
                }
            },
            "resourceId" : "canvas",
            "stencil" : {
                "id" : "BPMNDiagram"
            },
            "stencilset" : {
                "namespace" : "http://b3mn.org/stencilset/bpmn2.0#",
                "url" : "../editor/stencilsets/bpmn2.0/bpmn2.0.json"
            },
            "properties" : {
                "process_id" : "vacationRequest",
                "name" : "Vacation request",
                "category" : "http://activiti.org/bpmn20"
            },
            "childShapes" : [
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 120.0,
                            "y" : 186.0
                        },
                        "upperLeft" : {
                            "x" : 90.0,
                            "y" : 156.0
                        }
                    },
                    "resourceId" : "request",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "StartNoneEvent"
                    },
                    "outgoing" : [ {
                        "resourceId" : "flow1"
                    } ]
                },
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 172.0,
                            "y" : 212.0
                        },
                        "upperLeft" : {
                            "x" : 128.0,
                            "y" : 212.0
                        }
                    },
                    "resourceId" : "flow1",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "SequenceFlow"
                    },
                    "dockers" : [ {
                        "x" : 15.0,
                        "y" : 15.0
                    }, {
                        "x" : 77.0,
                        "y" : 38.5
                    } ],
                    "outgoing" : [ {
                        "resourceId" : "handleRequest"
                    } ],
                    "target" : {
                        "resourceId" : "handleRequest"
                    }
                },
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 316.5,
                            "y" : 209.5
                        },
                        "upperLeft" : {
                            "x" : 162.5,
                            "y" : 132.5
                        }
                    },
                    "resourceId" : "handleRequest",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "UserTask"
                    },
                    "properties" : {
                        "name" : "Handle vacation request"
                    },
                    "outgoing" : [ {
                        "resourceId" : "flow2"
                    } ]
                },
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 172.0,
                            "y" : 212.0
                        },
                        "upperLeft" : {
                            "x" : 128.0,
                            "y" : 212.0
                        }
                    },
                    "resourceId" : "flow2",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "SequenceFlow"
                    },
                    "dockers" : [ {
                        "x" : 77.0,
                        "y" : 38.5
                    }, {
                        "x" : 16.0,
                        "y" : 16.0
                    } ],
                    "outgoing" : [ {
                        "resourceId" : "requestApprovedDecision"
                    } ],
                    "target" : {
                        "resourceId" : "requestApprovedDecision"
                    }
                },
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 391.0,
                            "y" : 187.5
                        },
                        "upperLeft" : {
                            "x" : 359.0,
                            "y" : 155.5
                        }
                    },
                    "resourceId" : "requestApprovedDecision",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "ExclusiveGateway"
                    },
                    "properties" : {
                        "name" : "Request approved?"
                    },
                    "outgoing" : [ {
                        "resourceId" : "flow3"
                    }, {
                        "resourceId" : "flow5"
                    } ]
                },
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 172.0,
                            "y" : 212.0
                        },
                        "upperLeft" : {
                            "x" : 128.0,
                            "y" : 212.0
                        }
                    },
                    "resourceId" : "flow3",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "SequenceFlow"
                    },
                    "dockers" : [ {
                        "x" : 16.0,
                        "y" : 16.0
                    }, {
                        "x" : 375.0,
                        "y" : 105.0
                    }, {
                        "x" : 70.5,
                        "y" : 37.5
                    } ],
                    "outgoing" : [ {
                        "resourceId" : "sendApprovalMail"
                    } ],
                    "target" : {
                        "resourceId" : "sendApprovalMail"
                    }
                },
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 570.0,
                            "y" : 142.5
                        },
                        "upperLeft" : {
                            "x" : 429.0,
                            "y" : 67.5
                        }
                    },
                    "resourceId" : "sendApprovalMail",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "ManualTask"
                    },
                    "properties" : {
                        "name" : "Send confirmation e-mail"
                    },
                    "outgoing" : [ {
                        "resourceId" : "flow4"
                    } ]
                },
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 172.0,
                            "y" : 212.0
                        },
                        "upperLeft" : {
                            "x" : 128.0,
                            "y" : 212.0
                        }
                    },
                    "resourceId" : "flow4",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "SequenceFlow"
                    },
                    "dockers" : [ {
                        "x" : 70.5,
                        "y" : 37.5
                    }, {
                        "x" : 14.0,
                        "y" : 14.0
                    } ],
                    "outgoing" : [ {
                        "resourceId" : "theEnd1"
                    } ],
                    "target" : {
                        "resourceId" : "theEnd1"
                    }
                },
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 644.0,
                            "y" : 119.0
                        },
                        "upperLeft" : {
                            "x" : 616.0,
                            "y" : 91.0
                        }
                    },
                    "resourceId" : "theEnd1",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "EndNoneEvent"
                    },
                    "outgoing" : []
                },
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 172.0,
                            "y" : 212.0
                        },
                        "upperLeft" : {
                            "x" : 128.0,
                            "y" : 212.0
                        }
                    },
                    "resourceId" : "flow5",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "SequenceFlow"
                    },
                    "dockers" : [ {
                        "x" : 16.0,
                        "y" : 16.0
                    }, {
                        "x" : 375.0,
                        "y" : 239.0
                    }, {
                        "x" : 69.5,
                        "y" : 36.0
                    } ],
                    "outgoing" : [ {
                        "resourceId" : "adjustVacationRequestTask"
                    } ],
                    "target" : {
                        "resourceId" : "adjustVacationRequestTask"
                    }
                },
                {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 570.0,
                            "y" : 275.0
                        },
                        "upperLeft" : {
                            "x" : 431.0,
                            "y" : 203.0
                        }
                    },
                    "resourceId" : "adjustVacationRequestTask",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "UserTask"
                    },
                    "properties" : {
                        "name" : "Adjust vacation request"
                    },
                    "outgoing" : [ {
                        "resourceId" : "flow7"
                    }, {
                        "resourceId" : "flow8"
                    } ]
                }, {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 172.0,
                            "y" : 212.0
                        },
                        "upperLeft" : {
                            "x" : 128.0,
                            "y" : 212.0
                        }
                    },
                    "resourceId" : "flow7",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "SequenceFlow"
                    },
                    "dockers" : [ {
                        "x" : 69.5,
                        "y" : 36.0
                    }, {
                        "x" : 500.0,
                        "y" : 298.0
                    }, {
                        "x" : 239.0,
                        "y" : 298.0
                    }, {
                        "x" : 77.0,
                        "y" : 38.5
                    } ],
                    "outgoing" : [ {
                        "resourceId" : "handleRequest"
                    } ],
                    "target" : {
                        "resourceId" : "handleRequest"
                    }
                }, {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 644.0,
                            "y" : 253.0
                        },
                        "upperLeft" : {
                            "x" : 616.0,
                            "y" : 225.0
                        }
                    },
                    "resourceId" : "theEnd2",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "EndNoneEvent"
                    },
                    "outgoing" : []
                }, {
                    "bounds" : {
                        "lowerRight" : {
                            "x" : 172.0,
                            "y" : 212.0
                        },
                        "upperLeft" : {
                            "x" : 128.0,
                            "y" : 212.0
                        }
                    },
                    "resourceId" : "flow8",
                    "childShapes" : [],
                    "stencil" : {
                        "id" : "SequenceFlow"
                    },
                    "dockers" : [ {
                        "x" : 69.5,
                        "y" : 36.0
                    }, {
                        "x" : 14.0,
                        "y" : 14.0
                    } ],
                    "outgoing" : [ {
                        "resourceId" : "theEnd2"
                    } ],
                    "target" : {
                        "resourceId" : "theEnd2"
                    }
                } ]
            }'''
