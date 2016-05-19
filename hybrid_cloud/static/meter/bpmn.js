if(!ORCHESTRATOR) {var ORCHESTRATOR = {};}

if(!ORCHESTRATOR.PropertyWindow) ORCHESTRATOR.PropertyWindow = {};
ORCHESTRATOR.PropertyWindow.TITLE		= "Properties";
ORCHESTRATOR.PropertyWindow.SELECTED	= "selected";
ORCHESTRATOR.PropertyWindow.EDIT_HEADER	= "Editor for a Text Type";

if(!ORCHESTRATOR.Save) ORCHESTRATOR.Save = {};
ORCHESTRATOR.Save.UNSAVED_DATA			= "There are unsaved data, please save before you leave, otherwise your changes get lost!";
ORCHESTRATOR.Save.IMPORT_MISMATCH		= "The stencil set of the imported file ({0}) does not match to the loaded stencil set ({1}).";

ORCHESTRATOR.model = {
  "title" : "BPMN 2.0",
  "namespace" : "http://b3mn.org/stencilset/bpmn2.0#",
  "description" : "This is the BPMN 2.0 stencil set specification.",
  "propertyPackages" : [ {
    "name" : "elementbase",
    "properties" : [ /*{
      "id" : "overrideid",
      "type" : "String",
      "title" : "Id",
      "value" : "",
      "description" : "Unique identifier of the element.",
      "popular" : true
    }*/ ]
  }, {
    "name" : "baseattributes",
    "properties" : [ {
      "id" : "name",
      "type" : "String",
      "title" : "Name",
      "value" : "",
      "description" : "The descriptive name of the BPMN element.",
      "popular" : true,
      "refToView" : "text_name"
    }, {
      "id" : "documentation",
      "type" : "Text",
      "title" : "Documentation",
      "value" : "",
      "description" : "The description of the BPMN element.",
      "popular" : true
    } ]
  }, {
    "name" : "diagrambase",
    "properties" : [ {
      "id" : "category",
      "type" : "String",
      "title" : "Category",
      "value" : "",
      "description" : "Distinguishable category of the process definition.",
      "popular" : true
    },  {
      "id" : "process_id",
      "type" : "String",
      "title" : "Process identifier",
      "value" : "process",
      "description" : "Unique identifier of the process definition.",
      "popular" : true
    },  {
        "id" : "deployment",
        "type" : "String",
        "title" : "Deployment",
        "value" : "",
        "description" : "Deployment file of the process definition.",
        "popular" : true
    }, {
      "id" : "process_author",
      "type" : "String",
      "title" : "Process author",
      "value" : "",
      "description" : "Author of the process definition.",
      "popular" : false
    }, {
      "id" : "process_version",
      "type" : "String",
      "title" : "Process version string (documentation only)",
      "value" : "",
      "description" : "Version identifier for documentation purpose.",
      "popular" : false
    }/*, {
      "id" : "process_namespace",
      "type" : "String",
      "title" : "Target namespace",
      "value" : "http://www.activiti.org/processdef",
      "description" : "Target namespace for the process definition.",
      "popular" : false
    }*/ ]
  }, {
    "name" : "usertaskbase",
    "properties" : [ {
      "id" : "formkeydefinition",
      "type" : "String",
      "title" : "Form key",
      "value" : "",
      "description" : "Form key of the user task.",
      "popular" : true
    }, {
      "id" : "duedatedefinition",
      "type" : "String",
      "title" : "Due date",
      "value" : "",
      "description" : "Due date of the user task.",
      "popular" : true
    }, {
      "id" : "prioritydefinition",
      "type" : "String",
      "title" : "Priority",
      "value" : "",
      "description" : "Priority of the user task.",
      "popular" : true
    } ]
  }, {
    "name" : "usertaskassignment",
    "properties" : [ {
      "id" : "usertaskassignment",
      "type" : "Complex",
      "title" : "Assignments",
      "value" : "",
      "description" : "Assignment definition for the user task",
      "popular" : true,
      "complexItems" : [ {
        "id" : "assignment_type",
        "name" : "Type",
        "name_de" : "Typ",
        "type" : "Choice",
        "value" : "",
        "width" : 100,
        "optional" : false,
        "items" : [ {
          "id" : "c1",
          "title" : "Assignee",
          "value" : "assignee",
          "refToView" : ""
        }, {
          "id" : "c2",
          "title" : "Candidate users",
          "value" : "candidateUsers",
          "refToView" : ""
        }, {
          "id" : "c3",
          "title" : "Candidate groups",
          "value" : "candidateGroups",
          "refToView" : ""
        } ]
      }, {
        "id" : "resourceassignmentexpr",
        "name" : "Resource assignment expression",
        "type" : "String",
        "description" : "This defines the expression used for the resource assignment.",
        "value" : "",
        "width" : 200,
        "optional" : true
      } ]
    } ]
  }, {
    "name" : "formdefinition",
    "properties" : [ {
      "id" : "formproperties",
      "type" : "Complex",
      "title" : "Form properties",
      "value" : "",
      "description" : "Definition of the form with a list of form properties",
      "popular" : true,
      "complexItems" : [ {
        "id" : "formproperty_id",
        "name" : "Id",
        "name_de" : "Typ",
        "type" : "String",
        "description" : "This defines the expression used for the resource assignment.",
        "value" : "",
        "width" : 100,
        "optional" : false
      }, {
        "id" : "formproperty_name",
        "name" : "Name",
        "name_de" : "Typ",
        "type" : "String",
        "description" : "This defines the expression used for the resource assignment.",
        "value" : "",
        "width" : 150,
        "optional" : false
      }, {
        "id" : "formproperty_type",
        "name" : "Type",
        "name_de" : "Typ",
        "type" : "Choice",
        "value" : "",
        "width" : 100,
        "optional" : false,
        "items" : [ {
          "id" : "c1",
          "title" : "String",
          "value" : "string",
          "refToView" : ""
        }, {
          "id" : "c2",
          "title" : "Date",
          "value" : "date",
          "refToView" : ""
        }, {
          "id" : "c3",
          "title" : "Long",
          "value" : "long",
          "refToView" : ""
        }, {
          "id" : "c3",
          "title" : "Boolean",
          "value" : "boolean",
          "refToView" : ""
        } ]
      }, {
        "id" : "formproperty_expression",
        "name" : "Expression",
        "name_de" : "Typ",
        "type" : "String",
        "description" : "This defines the expression used for the resource assignment.",
        "value" : "",
        "width" : 200,
        "optional" : false
      }, {
        "id" : "formproperty_variable",
        "name" : "Variable",
        "name_de" : "Typ",
        "type" : "String",
        "description" : "This defines the expression used for the resource assignment.",
        "value" : "",
        "width" : 200,
        "optional" : false
      } ]
    } ]
  }, {
    "name" : "tasklistenersbase",
    "properties" : [ {
      "id" : "tasklisteners",
      "type" : "multiplecomplex",
      "title" : "Task listeners",
      "value" : "",
      "description" : "Listeners for a user task",
      "popular" : true,
      "complexItems" : [ {
        "id" : "task_listener_event_type",
        "name" : "Event",
        "type" : "Choice",
        "value" : "",
        "width" : 100,
        "optional" : false,
        "items" : [ {
          "id" : "c1",
          "title" : "Create",
          "value" : "create",
          "refToView" : ""
        }, {
          "id" : "c2",
          "title" : "Assignment",
          "value" : "assignment",
          "refToView" : ""
        }, {
          "id" : "c3",
          "title" : "Complete",
          "value" : "complete",
          "refToView" : ""
        }, {
          "id" : "c4",
          "title" : "All Events",
          "value" : "all",
          "refToView" : ""
        } ]
      }, {
        "id" : "task_listener_class",
        "name" : "Class",
        "type" : "String",
        "description" : "Listener class.",
        "value" : "",
        "width" : 200,
        "optional" : true
      }, {
        "id" : "task_listener_expression",
        "name" : "Expression",
        "type" : "String",
        "description" : "Listener expression definition.",
        "value" : "",
        "width" : 200,
        "optional" : true
      }, {
        "id" : "task_listener_delegate_expression",
        "name" : "Delegate expression",
        "type" : "String",
        "description" : "Listener delegate expression definition.",
        "value" : "",
        "width" : 200,
        "optional" : true
      }, {
        "id" : "task_listener_fields",
        "name" : "Fields",
        "type" : "Complex",
        "width" : 100,
        "optional" : false,
        "complexItems" : [ {
          "id" : "task_listener_field_name",
          "name" : "Name",
          "type" : "String",
          "value" : "",
          "width" : 200,
          "optional" : false
        }, {
          "id" : "task_listener_field_value",
          "name" : "String value",
          "type" : "String",
          "value" : "",
          "width" : 200,
          "optional" : false
        }, {
          "id" : "task_listener_field_expression",
          "name" : "Expression",
          "type" : "String",
          "value" : "",
          "width" : 200,
          "optional" : false
        } ]
      } ]
    } ]
  }, {
    "name" : "servicetaskbase",
    "properties" : [ {
      "id" : "servicetaskclass",
      "type" : "String",
      "title" : "Class",
      "value" : "",
      "description" : "Class that implements the service task logic.",
      "popular" : true
    }, {
      "id" : "servicetaskexpression",
      "type" : "String",
      "title" : "Expression",
      "value" : "",
      "description" : "Service task logic defined with an expression.",
      "popular" : true
    }, {
      "id" : "servicetaskdelegateexpression",
      "type" : "String",
      "title" : "Delegate expression",
      "value" : "",
      "description" : "Service task logic defined with a delegate expression.",
      "popular" : true
    }, {
      "id" : "servicetaskresultvariable",
      "type" : "String",
      "title" : "Result variable name",
      "value" : "",
      "description" : "Process variable name to store the service task result.",
      "popular" : true
    }, {
      "id" : "servicetaskfields",
      "type" : "Complex",
      "title" : "Class fields",
      "value" : "",
      "description" : "Field extensions",
      "popular" : true,
      "complexItems" : [ {
        "id" : "servicetask_field_name",
        "name" : "Name",
        "type" : "String",
        "value" : "",
        "width" : 200,
        "optional" : false
      }, {
        "id" : "servicetask_field_value",
        "name" : "String value",
        "type" : "String",
        "value" : "",
        "width" : 200,
        "optional" : false
      }, {
        "id" : "servicetask_field_expression",
        "name" : "Expression",
        "type" : "String",
        "value" : "",
        "width" : 200,
        "optional" : false
      } ]
    } ]
  }, {
    "name" : "scripttaskbase",
    "properties" : [ {
      "id" : "scriptformat",
      "type" : "String",
      "title" : "Script format",
      "value" : "",
      "description" : "Script format of the script task.",
      "popular" : true
    }, {
      "id" : "scripttext",
      "type" : "Text",
      "title" : "Script",
      "value" : "",
      "description" : "Script text of the script task.",
      "popular" : true
    } ]
  }, {
    "name" : "ruletaskbase",
    "properties" : [ {
      "id" : "ruletask_class",
      "type" : "String",
      "title" : "Class",
      "value" : "",
      "description" : "Class of the rule task.",
      "popular" : true
    }, {
      "id" : "ruletask_variables_input",
      "type" : "String",
      "title" : "Input variables",
      "value" : "",
      "description" : "Input variables of the rule task.",
      "popular" : true
    }, {
      "id" : "ruletask_result",
      "type" : "String",
      "title" : "Result variable",
      "value" : "",
      "description" : "Result variable of the rule task.",
      "popular" : true
    }, {
      "id" : "ruletask_rules",
      "type" : "String",
      "title" : "Rules",
      "value" : "",
      "description" : "Rules of the rule task.",
      "popular" : true
    }, {
      "id" : "ruletask_exclude",
      "type" : "Choice",
      "title" : "Exclude",
      "value" : "No",
      "description" : "Use the rules property as exclusion.",
      "popular" : true,
      "items" : [ {
        "id" : "no",
        "title" : "No",
        "value" : "No"
      }, {
        "id" : "yes",
        "title" : "Yes",
        "value" : "Yes"
      } ]
    } ]
  }, {
    "name" : "mailtaskbase",
    "properties" : [ {
      "id" : "mailtaskto",
      "type" : "Text",
      "title" : "To",
      "value" : "",
      "description" : "The recipients if the e-mail. Multiple recipients are defined in a comma-separated list.",
      "popular" : true
    }, {
      "id" : "mailtaskfrom",
      "type" : "Text",
      "title" : "From",
      "value" : "",
      "description" : "The sender e-mail address. If not provided, the default configured from address is used.",
      "popular" : true
    }, {
      "id" : "mailtasksubject",
      "type" : "Text",
      "title" : "Subject",
      "value" : "",
      "description" : "The subject of the e-mail.",
      "popular" : true
    }, {
      "id" : "mailtaskcc",
      "type" : "Text",
      "title" : "Cc",
      "value" : "",
      "description" : "The cc's of the e-mail. Multiple recipients are defined in a comma-separated list",
      "popular" : true
    }, {
      "id" : "mailtaskbcc",
      "type" : "Text",
      "title" : "Bcc",
      "value" : "",
      "description" : "The bcc's of the e-mail. Multiple recipients are defined in a comma-separated list",
      "popular" : true
    }, {
      "id" : "mailtasktext",
      "type" : "Text",
      "title" : "Text",
      "value" : "",
      "description" : "The content of the e-mail, in case one needs to send plain none-rich e-mails. Can be used in combination with html, for e-mail clients that don't support rich content. The client will then fall back to this text-only alternative.",
      "popular" : true
    }, {
      "id" : "mailtaskhtml",
      "type" : "Text",
      "title" : "Html",
      "value" : "",
      "description" : "A piece of HTML that is the content of the e-mail.",
      "popular" : true
    }, {
      "id" : "mailtaskcharset",
      "type" : "String",
      "title" : "Charset",
      "value" : "",
      "description" : "Allows to change the charset of the email, which is necessary for many non-English languages. ",
      "popular" : true
    } ]
  }, {
    "name" : "callactivitybase",
    "properties" : [ {
      "id" : "callactivitycalledelement",
      "type" : "complexgrid",
      "title" : "Called element",
      "value" : "",
      "description" : "Process reference.",
      "popular" : true
    }, {
      "id" : "callactivityinparameters",
      "type" : "Complex",
      "title" : "In parameters",
      "value" : "",
      "description" : "Definition of the input parameters",
      "popular" : true,
      "complexItems" : [ {
        "id" : "ioparameter_source",
        "name" : "Source",
        "type" : "String",
        "value" : "",
        "width" : 200,
        "optional" : false
      }, {
        "id" : "ioparameter_sourceexpression",
        "name" : "Source expression",
        "type" : "String",
        "value" : "",
        "width" : 200,
        "optional" : false
      }, {
        "id" : "ioparameter_target",
        "name" : "Target",
        "type" : "String",
        "value" : "",
        "width" : 200,
        "optional" : false
      } ]
    }, {
      "id" : "callactivityoutparameters",
      "type" : "Complex",
      "title" : "Out parameters",
      "value" : "",
      "description" : "Definition of the output parameters",
      "popular" : true,
      "complexItems" : [ {
        "id" : "ioparameter_source",
        "name" : "Source",
        "type" : "String",
        "value" : "",
        "width" : 200,
        "optional" : false
      }, {
        "id" : "ioparameter_sourceexpression",
        "name" : "Source expression",
        "type" : "String",
        "value" : "",
        "width" : 200,
        "optional" : false
      }, {
        "id" : "ioparameter_target",
        "name" : "Target",
        "type" : "String",
        "value" : "",
        "width" : 200,
        "optional" : false
      } ]
    } ]
  }, {
    "name" : "sequenceflowbase",
    "properties" : [ {
      "id" : "conditionsequenceflow",
      "type" : "Text",
      "title" : "Flow condition",
      "value" : "",
      "description" : "The condition of the sequence flow",
      "popular" : true
    }, {
      "id" : "defaultflow",
      "type" : "Choice",
      "title" : "Default flow",
      "value" : "None",
      "description" : "Define the sequence flow as default",
      "popular" : true,
      "items" : [ {
        "id" : "none",
        "title" : "Standard",
        "value" : "None"
      }, {
        "id" : "default",
        "title" : "Default Flow",
        "value" : "Default",
        "icon" : "connector/list/type.default.png",
        "refToView" : "default"
      } ]
    }, {
      "id" : "conditionalflow",
      "type" : "Choice",
      "title" : "Conditional flow",
      "value" : "None",
      "description" : "Define the sequence flow with a condition",
      "popular" : true,
      "items" : [ {
        "id" : "none",
        "title" : "Standard",
        "value" : "None"
      }, {
        "id" : "default",
        "title" : "Conditional Flow",
        "value" : "Conditional",
        "icon" : "connector/list/type.expression.png",
        "refToView" : "conditional"
      } ]
    } ]
  }, {
    "name" : "timerdefinition",
    "properties" : [ {
      "id" : "timerdurationdefinition",
      "type" : "String",
      "title" : "Time duration (e.g. PT5M)",
      "value" : "",
      "description" : "Define the timer with a ISO-8601 duration.",
      "popular" : true
    }, {
      "id" : "timerdatedefinition",
      "type" : "String",
      "title" : "Time date in ISO-8601",
      "value" : "",
      "description" : "Define the timer with a ISO-8601 date definition.",
      "popular" : true
    }, {
      "id" : "timercycledefinition",
      "type" : "String",
      "title" : "Time cycle (e.g. R3/PT10H)",
      "value" : "",
      "description" : "Define the timer with a ISO-8601 cycle.",
      "popular" : true
    } ]
  }, {
    "name" : "messagerefdefinition",
    "properties" : [ {
      "id" : "messageref",
      "type" : "String",
      "title" : "Message reference",
      "value" : "",
      "description" : "Define the message name.",
      "popular" : true
    } ]
  }, {
    "name" : "signalrefdefinition",
    "properties" : [ {
      "id" : "signalref",
      "type" : "String",
      "title" : "Signal reference",
      "value" : "",
      "description" : "Define the signal name.",
      "popular" : true
    } ]
  }, {
    "name" : "errorrefdefinition",
    "properties" : [ {
      "id" : "errorref",
      "type" : "String",
      "title" : "Error reference",
      "value" : "",
      "description" : "Define the error name.",
      "popular" : true
    } ]
  }, {
    "name" : "nonestarteventbase",
    "properties" : [ {
      "id" : "initiator",
      "type" : "String",
      "title" : "Initiator",
      "value" : "",
      "description" : "Initiator of the process.",
      "popular" : true
    } ]
  }, {
    "name" : "textannotationbase",
    "properties" : [ {
      "id" : "text",
      "type" : "String",
      "title" : "Text",
      "value" : "",
      "description" : "The text of the text annotation.",
      "popular" : true,
      "refToView" : "text"
    } ]
  }, {
    "name" : "asynchronousbase",
    "properties" : [ {
      "id" : "asynchronousdefinition",
      "type" : "Choice",
      "title" : "Asynchronous",
      "value" : "No",
      "description" : "Define the activity as asynchronous.",
      "popular" : true,
      "items" : [ {
        "id" : "no",
        "title" : "No",
        "value" : "No"
      }, {
        "id" : "yes",
        "title" : "Yes",
        "value" : "Yes"
      } ]
    }, {
      "id" : "exclusivedefinition",
      "type" : "Choice",
      "title" : "Exclusive",
      "value" : "Yes",
      "description" : "Define the activity as exclusive.",
      "popular" : true,
      "items" : [ {
        "id" : "no",
        "title" : "No",
        "value" : "No"
      }, {
        "id" : "yes",
        "title" : "Yes",
        "value" : "Yes"
      } ]
    } ]
  }, {
    "name" : "executionlistenersbase",
    "properties" : [ {
      "id" : "executionlisteners",
      "type" : "multiplecomplex",
      "title" : "Execution listeners",
      "value" : "",
      "description" : "Listeners for an activity, process, sequence flow, start and end event.",
      "popular" : true,
      "complexItems" : [ {
        "id" : "execution_listener_event_type",
        "name" : "Event",
        "type" : "Choice",
        "value" : "",
        "width" : 200,
        "optional" : false,
        "items" : [ {
          "id" : "c1",
          "title" : "Start",
          "value" : "start",
          "refToView" : ""
        }, {
          "id" : "c2",
          "title" : "End",
          "value" : "end",
          "refToView" : ""
        }, {
          "id" : "c2",
          "title" : "Take (only sequence flows)",
          "value" : "take",
          "refToView" : ""
        } ]
      }, {
        "id" : "execution_listener_class",
        "name" : "Class",
        "type" : "String",
        "description" : "Listener class.",
        "value" : "",
        "width" : 200,
        "optional" : true
      }, {
        "id" : "execution_listener_expression",
        "name" : "Expression",
        "type" : "String",
        "description" : "Listener expression definition.",
        "value" : "",
        "width" : 200,
        "optional" : true
      }, {
        "id" : "execution_listener_delegate_expression",
        "name" : "Delegate expression",
        "type" : "String",
        "description" : "Listener delegate expression definition.",
        "value" : "",
        "width" : 200,
        "optional" : true
      }, {
        "id" : "execution_listener_fields",
        "name" : "Fields",
        "type" : "Complex",
        "width" : 100,
        "optional" : false,
        "complexItems" : [ {
          "id" : "execution_listener_field_name",
          "name" : "Name",
          "type" : "String",
          "value" : "",
          "width" : 200,
          "optional" : false
        }, {
          "id" : "execution_listener_field_value",
          "name" : "String value",
          "type" : "String",
          "value" : "",
          "width" : 200,
          "optional" : false
        }, {
          "id" : "execution_listener_field_expression",
          "name" : "Expression",
          "type" : "String",
          "value" : "",
          "width" : 200,
          "optional" : false
        } ]
      } ]
    } ]
  }, {
    "name" : "customformdefinition",
    "properties" : [ {
      "id" : "customformdefinition",
      "type" : "Choice",
      "title" : "Custom form",
      "value" : "",
      "description" : "Des A",
      "popular" : true,
      "items" : [ {
        "id" : "1",
        "title" : "form 1",
        "value" : "1"
      }, {
        "id" : "2",
        "title" : "form 2",
        "value" : "2"
      }, {
        "id" : "3",
        "title" : "form 3",
        "value" : "3"
      } ]
    } ]
  }, {
    "name" : "loopcharacteristics",
    "properties" : [/* {
      "id" : "looptype",
      "type" : "Choice",
      "title" : "Loop type",
      "value" : "None",
      "description" : "Repeated activity execution (parallel or sequential) can be displayed through different loop types",
      "popular" : false,
      "items" : [ {
        "id" : "c1",
        "title" : "None",
        "value" : "None",
        "refToView" : "none"
      }, {
        "id" : "c2",
        "title" : "Standard",
        "value" : "Standard",
        "icon" : "activity/list/looptype.standard.png",
        "refToView" : "loop"
      }, {
        "id" : "c3",
        "title" : "MI Parallel",
        "value" : "Parallel",
        "icon" : "activity/list/mi.parallel.png",
        "refToView" : "parallel"
      }, {
        "id" : "c4",
        "title" : "MI Sequential",
        "value" : "Sequential",
        "icon" : "activity/list/mi.sequential.png",
        "refToView" : "sequential"
      } ]
    } */]
  }, {
    "name" : "activity",
    "properties" : [ /*{
      "id" : "multiinstance_sequential",
      "type" : "Choice",
      "title" : "Sequential (Multi-instance)",
      "value" : "Yes",
      "description" : "Define the multi instance as sequential.",
      "popular" : true,
      "items" : [ {
        "id" : "no",
        "title" : "No",
        "value" : "No"
      }, {
        "id" : "yes",
        "title" : "Yes",
        "value" : "Yes"
      } ]
    }, {
      "id" : "multiinstance_cardinality",
      "type" : "String",
      "title" : "Cardinality (Multi-instance)",
      "value" : "",
      "description" : "Define the cardinality of multi instance.",
      "popular" : true
    }, {
      "id" : "multiinstance_collection",
      "type" : "String",
      "title" : "Collection (Multi-instance)",
      "value" : "",
      "description" : "Define the collection for the multi instance.",
      "popular" : true
    }, {
      "id" : "multiinstance_variable",
      "type" : "String",
      "title" : "Element variable (Multi-instance)",
      "value" : "",
      "description" : "Define the element variable for the multi instance.",
      "popular" : true
    }, {
      "id" : "multiinstance_condition",
      "type" : "String",
      "title" : "Completion condition (Multi-instance)",
      "value" : "",
      "description" : "Define the completion condition for the multi instance.",
      "popular" : true
    }, {
      "id" : "isforcompensation",
      "type" : "Boolean",
      "title" : "Is for compensation",
      "value" : "false",
      "description" : "A flag that identifies whether this activity is intended for the purposes of compensation.",
      "popular" : false,
      "refToView" : "compensation"
    }*/ ]
  } ],
  "stencils" : [ {
    "type" : "node",
    "id" : "BPMNDiagram",
    "title" : "BPMN-Diagram",
    "description" : "A BPMN 2.0 diagram.",
    "raphael" : function() { var paper=Raphael(0,0,800,600); return paper; },
    "minimumSize" : {width:1, height:1},
    "magnets" : [],
    "docker" : {},
    "view" : "diagram.svg",
    "icon" : "diagram.png",
    "groups" : [ "Diagram" ],
    "mayBeRoot" : true,
    "hide" : true,
    "propertyPackages" : [ "baseattributes", "diagrambase", "executionlistenersbase" ],
    "roles" : [ ]
  }, {
    "type" : "node",
    "id" : "StartNoneEvent",
    "title" : "Start event",
    "description" : "A start event without a specific trigger",
    "raphael" : function(paper) {
    	paper.setStart();
    	paper.circle(16,16,16).attr({'stroke':'none','fill':'white'}).data('bound',true);
		paper.image('/hybrid_cloud/static/img/lb.png',0,0,32,32);
    	paper.text(16,40,'').attr({'font-size':11});
    	return paper.setFinish(); },
    "view" : "startevent/none.svg",
    "icon" : "startevent/none.png",
    "groups" : [ "Start Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "formdefinition", "nonestarteventbase", "executionlistenersbase" ],
    "roles" : [ "Startevents_all", "sequence_start", "StartEventsMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "StartTimerEvent",
    "title" : "Start timer event",
    "description" : "A start event with a timer trigger",
    "raphael" : function(paper) {
    		 paper.setStart();
    		 paper.circle(16,16,15).attr({fill:'white'}).data('bound',true);
    		 paper.circle(16,16,10);
    		 paper.path('M16,6L16,9M21,7L19.5,10M25,11L22,12.5M26,16L23,16M25,21L22,19.5M21,25L19.5,22M16,26L16,23M11,25L12.5,22M7,21L10,19.5M6,16L9,16M7,11L10,12.5M11,7L12.5,10M18,9L16,16L20,16');
    		 paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
    		 return paper.setFinish(); },
    "view" : "startevent/timer.svg",
    "icon" : "startevent/timer.png",
    "groups" : [ "Start Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "timerdefinition", "executionlistenersbase" ],
    "roles" : [ "Startevents_all", "sequence_start", "StartEventsMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "StartMessageEvent",
    "title" : "Start message event",
    "description" : "A start event with a message trigger",
    "raphael" : function(paper) {
			 paper.setStart();
			 paper.circle(16,16,15).attr({fill:'white'}).data('bound',true);
			 paper.path('M8,11 L8,21 L24,21 L24,11z M8,11 L16,17 L24,11');
			 paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
			 return paper.setFinish(); },
    "view" : "startevent/message.svg",
    "icon" : "startevent/message.png",
    "groups" : [ "Start Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "messagerefdefinition", "executionlistenersbase" ],
    "roles" : [ "Startevents_all", "sequence_start", "StartEventsMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "StartErrorEvent",
    "title" : "Start error event",
    "description" : "A start event that catches a thrown BPMN error",
    "raphael" : function(paper) {
			 paper.setStart();
			 paper.circle(16,16,15).attr({fill:'white'}).data('bound',true);
			 paper.path('M 22.820839,11.171502 L 19.36734,24.58992 L 13.54138,14.281819 L 9.3386512,20.071607 L 13.048949,6.8323057 L 18.996148,16.132659 L 22.820839,11.171502 z');
			 paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
			 return paper.setFinish(); },
    "view" : "startevent/error.svg",
    "icon" : "startevent/error.png",
    "groups" : [ "Start Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "errorrefdefinition", "executionlistenersbase" ],
    "roles" : [ "Startevents_all", "sequence_start", "StartEventsMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "UserTask",
    "title" : "User task",
    "description" : "A manual task assigned to a specific person",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.rect(0,0,100,80,0).data('resize','vertical horizontal').data('bound',true);
		 text_frame = paper.rect(1,1,94,79,10).attr({'stroke':'none','stroke-width':0}).data('anchors','bottom top right left');
		 paper.text(50,40,'').attr({'font-size':12}).data('align','middle center').data('fittoelem',text_frame).data('id','text_name');
		 return paper.setFinish(); },
    "minimumSize" : {width:50, height:40},
    "magnets" : [
         {cx:1,cy:20,anchors:"left"},{cx:1,cy:40,anchors:"left"},{cx:1,cy:60,anchors:"left"},
         {cx:25,cy:79,anchors:"bottom"},{cx:50,cy:79,anchors:"bottom"},{cx:75,cy:79,anchors:"bottom"},
         {cx:99,cy:20,anchors:"right"},{cx:99,cy:40,anchors:"right"},{cx:99,cy:60,anchors:"right"},
         {cx:25,cy:1,anchors:"top"},{cx:50,cy:1,anchors:"top"},{cx:75,cy:1,anchors:"top"},
         {cx:50,cy:40,defaultAnchor:"yes"}
    ],
    "view" : "activity/usertask.svg",
    "icon" : "activity/list/type.user.png",
    "groups" : [ "Activities" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "usertaskbase", "usertaskassignment", "formdefinition", "tasklistenersbase", "asynchronousbase", "loopcharacteristics", "activity" ],
    "roles" : [ "sequence_start", "Activity", "sequence_end", "ActivitiesMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "ServiceTask",
    "title" : "Service task",
    "description" : "An automatic task with service logic",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.rect(0,0,100,80,10).attr({fill:'#ffffcc'}).data('resize','vertical horizontal').data('bound',true);
		 text_frame = paper.rect(1,1,94,79,10).attr({'stroke':'none','stroke-width':0}).data('anchors','bottom top right left');
		 paper.text(50,40,'').attr({'font-size':12}).data('align','middle center').data('fittoelem',text_frame).data('id','text_name');
		 paper.polygone([18.58,11.4254,20.3142,9.78323,21.9339,11.3171,20.2005,12.958,20.8388,14.4175,23.2917,14.4175,23.2917,16.5859,20.8401,16.5859,20.2018,18.0454,21.9366,19.6882,20.3169,21.2214,18.5834,19.5798,17.0422,20.1843,17.0422,22.5072,14.7523,22.5072,14.7523,20.1856,13.2111,19.5811,11.4762,21.2233,9.85781,19.6901,11.5906,18.0486,10.953,16.5891,8.5,16.5891,8.5,14.4207,10.951,14.4207,11.5899,12.9618,9.85578,11.319,11.4749,9.78579,13.2077,11.4267,14.7489,10.8235,14.7489,8.5,17.0395,8.5,17.0395,10.821]).attr({fill:'#FFFFFF'}).data('anchors','top left');
		 paper.circle(15.89621,15.50326,2.38057).attr({stroke:'#000000'}).data('anchors','top left');
		 paper.polygone([22.6413,15.2712,24.3754,13.6291,25.9952,15.1629,24.2617,16.8038,24.9,18.2633,27.353,18.2633,27.353,20.4317,24.9014,20.4317,24.2631,21.8912,25.9979,23.534,24.3781,25.0672,22.6447,23.4257,21.1034,24.0301,21.1034,26.353,18.8135,26.353,18.8135,24.0314,17.2723,23.427,15.5375,25.0691,13.9191,23.5359,15.6519,21.8944,15.0142,20.4349,12.5612,20.4349,12.5612,18.2665,15.0122,18.2665,15.6512,16.8076,13.917,15.1648,15.5361,13.6316,17.2689,15.2725,18.8102,14.6694,18.8102,12.3458,21.1007,12.3458,21.1007,14.6668]).attr({fill:'#F0EFF0'}).data('anchors','top left');
		 paper.circle(19.95746,19.3491,2.38057).attr({stroke:'#000000'}).data('anchors','top left');
		 return paper.setFinish(); },
	"minimumSize" : {width:50, height:40},
	"magnets" : [
         {cx:1,cy:20,anchors:"left"},{cx:1,cy:40,anchors:"left"},{cx:1,cy:60,anchors:"left"},
         {cx:25,cy:79,anchors:"bottom"},{cx:50,cy:79,anchors:"bottom"},{cx:75,cy:79,anchors:"bottom"},
         {cx:99,cy:20,anchors:"right"},{cx:99,cy:40,anchors:"right"},{cx:99,cy:60,anchors:"right"},
         {cx:25,cy:1,anchors:"top"},{cx:50,cy:1,anchors:"top"},{cx:75,cy:1,anchors:"top"},
         {cx:50,cy:40,defaultAnchor:"yes"}
	],
    "view" : "activity/servicetask.svg",
    "icon" : "activity/list/type.service.png",
    "groups" : [ "Activities" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "servicetaskbase", "asynchronousbase", "executionlistenersbase", "loopcharacteristics", "activity" ],
    "roles" : [ "sequence_start", "Activity", "sequence_end", "ActivitiesMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "ScriptTask",
    "title" : "Script task",
    "description" : "An automatic task with script logic",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.rect(0,0,100,80,10).attr({fill:'#ffffcc'}).data('resize','vertical horizontal').data('bound',true);
		 text_frame = paper.rect(1,1,94,79,10).attr({'stroke':'none','stroke-width':0}).data('anchors','bottom top right left');
		 paper.text(50,40,'').attr({'font-size':12}).data('align','middle center').data('fittoelem',text_frame).data('id','text_name');
		 paper.path('m14.91001,9.5l10.99199,0c0,0 -4.42181,1.8331 -4.42181,3.6125s3.34839,3.88232 3.34839,5.93153s-3.15887,3.28897 -3.15887,3.28897l-11.4347,0c0,0 3.79034,-1.72569 3.79034,-3.23526s-3.47423,-4.36761 -3.47423,-5.98524s4.35889,-3.6125 4.35889,-3.6125z').data('anchors','top left');
		 paper.path('m12.71009,12.08821l7.58068,0').data('anchors','top left');
		 paper.path('m12.93751,14.67642l7.58068,0').data('anchors','top left');
		 paper.path('m14.83269,17.26463l7.58068,0').data('anchors','top left');
		 paper.path('m14.9843,19.85285l7.58068,0').data('anchors','top left');
		 return paper.setFinish(); },
	"minimumSize" : {width:50, height:40},
	"magnets" : [
	     {cx:1,cy:20,anchors:"left"},{cx:1,cy:40,anchors:"left"},{cx:1,cy:60,anchors:"left"},
	     {cx:25,cy:79,anchors:"bottom"},{cx:50,cy:79,anchors:"bottom"},{cx:75,cy:79,anchors:"bottom"},
	     {cx:99,cy:20,anchors:"right"},{cx:99,cy:40,anchors:"right"},{cx:99,cy:60,anchors:"right"},
	     {cx:25,cy:1,anchors:"top"},{cx:50,cy:1,anchors:"top"},{cx:75,cy:1,anchors:"top"},
	     {cx:50,cy:40,defaultAnchor:"yes"}
	],
    "view" : "activity/scripttask.svg",
    "icon" : "activity/list/type.script.png",
    "groups" : [ "Activities" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "scripttaskbase", "asynchronousbase", "executionlistenersbase", "loopcharacteristics", "activity" ],
    "roles" : [ "sequence_start", "Activity", "sequence_end", "ActivitiesMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "BusinessRule",
    "title" : "Business rule task",
    "description" : "An automatic task with rule logic",
    "minimumSize" : {width:50, height:40},
    "view" : "activity/businessruletask.svg",
    "icon" : "activity/list/type.business.rule.png",
    "groups" : [ "Activities" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "ruletaskbase", "asynchronousbase", "executionlistenersbase", "loopcharacteristics", "activity" ],
    "roles" : [ "sequence_start", "Activity", "sequence_end", "ActivitiesMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "ReceiveTask",
    "title" : "Receive task",
    "description" : "An task that waits for a signal",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.rect(0,0,100,80,10).attr({fill:'#ffffcc'}).data('resize','vertical horizontal').data('bound',true);
		 text_frame = paper.rect(1,1,94,79,10).attr({'stroke':'none','stroke-width':0}).data('anchors','bottom top right left');
		 paper.text(50,40,'').attr({'font-size':12}).data('align','middle center').data('fittoelem',text_frame).data('id','text_name');
		 paper.path('M8,11 L8,21 L24,21 L24,11z M8,11 L16,17 L24,11').data('anchors','top left');
		 return paper.setFinish(); },
	"minimumSize" : {width:50, height:40},
	"magnets" : [
	     {cx:1,cy:20,anchors:"left"},{cx:1,cy:40,anchors:"left"},{cx:1,cy:60,anchors:"left"},
	     {cx:25,cy:79,anchors:"bottom"},{cx:50,cy:79,anchors:"bottom"},{cx:75,cy:79,anchors:"bottom"},
	     {cx:99,cy:20,anchors:"right"},{cx:99,cy:40,anchors:"right"},{cx:99,cy:60,anchors:"right"},
	     {cx:25,cy:1,anchors:"top"},{cx:50,cy:1,anchors:"top"},{cx:75,cy:1,anchors:"top"},
	     {cx:50,cy:40,defaultAnchor:"yes"}
	],
    "view" : "activity/receivetask.svg",
    "icon" : "activity/list/type.receive.png",
    "groups" : [ "Activities" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "asynchronousbase", "executionlistenersbase", "loopcharacteristics", "activity" ],
    "roles" : [ "sequence_start", "Activity", "sequence_end", "ActivitiesMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "ManualTask",
    "title" : "Manual task",
    "description" : "An automatic task with no logic",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.rect(0,0,100,80,10).attr({fill:'#ffffcc'}).data('resize','vertical horizontal').data('bound',true);
		 text_frame = paper.rect(1,1,94,79,10).attr({'stroke':'none','stroke-width':0}).data('anchors','bottom top right left');
		 paper.text(50,40,'').attr({'font-size':12}).data('align','middle center').data('fittoelem',text_frame).data('id','text_name');
		 paper.path('m9.5,10.81348l2.78982,-2.31248c0,0 7.62947,0.05906 8.25604,0.05906s-1.65148,2.07554 -1.02492,2.07554s7.97179,0 8.59836,0c0.7967,1.2153 -0.11479,2.25342 -0.56985,2.60919s0.59787,1.36401 -0.68328,3.14284c-0.51246,0.17788 0.51246,1.33412 -0.91081,2.37154c-0.79738,0.41483 0.39835,1.09719 -0.8541,2.01577c-0.79739,0 -14.23471,0.05906 -14.23471,0.05906l-1.36655,-0.94847l0,-9.07204z').data('anchors','top left');
		 paper.path('m18.3826,13.12525l9.22424,0').attr({'stroke-width':2}).data('anchors','top left');
		 paper.path('m18.3826,15.97138l8.54096,0').attr({'stroke-width':2}).data('anchors','top left');
		 paper.path('m18.72424,18.46175l7.51605,0').attr({'stroke-width':1.5}).data('anchors','top left');
		 paper.path('m14.76123,10.35027l4.64628,0').attr({'stroke-width':1.5}).data('anchors','top left');
		 return paper.setFinish(); },
	"minimumSize" : {width:50, height:40},
	"magnets" : [
	     {cx:1,cy:20,anchors:"left"},{cx:1,cy:40,anchors:"left"},{cx:1,cy:60,anchors:"left"},
	     {cx:25,cy:79,anchors:"bottom"},{cx:50,cy:79,anchors:"bottom"},{cx:75,cy:79,anchors:"bottom"},
	     {cx:99,cy:20,anchors:"right"},{cx:99,cy:40,anchors:"right"},{cx:99,cy:60,anchors:"right"},
	     {cx:25,cy:1,anchors:"top"},{cx:50,cy:1,anchors:"top"},{cx:75,cy:1,anchors:"top"},
	     {cx:50,cy:40,defaultAnchor:"yes"}
	],
    "view" : "activity/manualtask.svg",
    "icon" : "activity/list/type.manual.png",
    "groups" : [ "Activities" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "asynchronousbase", "executionlistenersbase", "loopcharacteristics", "activity" ],
    "roles" : [ "sequence_start", "Activity", "sequence_end", "ActivitiesMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "MailTask",
    "title" : "Mail task",
    "description" : "An mail task",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.rect(0,0,100,80,10).attr({fill:'#ffffcc'}).data('resize','vertical horizontal').data('bound',true);
		 text_frame = paper.rect(1,1,94,79,10).attr({'stroke':'none','stroke-width':0}).data('anchors','bottom top right left');
		 paper.text(50,40,'').attr({'font-size':12}).data('align','middle center').data('fittoelem',text_frame).data('id','text_name');
		 paper.path('M8,11 L8,21 L24,21 L24,11 L16,17z').data('anchors','top left');
		 paper.path('M7,10 L16,17 L25 10z').data('anchors','top left');
		 return paper.setFinish(); },
	"minimumSize" : {width:50, height:40},
	"magnets" : [
	     {cx:1,cy:20,anchors:"left"},{cx:1,cy:40,anchors:"left"},{cx:1,cy:60,anchors:"left"},
	     {cx:25,cy:79,anchors:"bottom"},{cx:50,cy:79,anchors:"bottom"},{cx:75,cy:79,anchors:"bottom"},
	     {cx:99,cy:20,anchors:"right"},{cx:99,cy:40,anchors:"right"},{cx:99,cy:60,anchors:"right"},
	     {cx:25,cy:1,anchors:"top"},{cx:50,cy:1,anchors:"top"},{cx:75,cy:1,anchors:"top"},
	     {cx:50,cy:40,defaultAnchor:"yes"}
	],
    "view" : "activity/sendtask.svg",
    "icon" : "activity/list/type.send.png",
    "groups" : [ "Activities" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "mailtaskbase", "asynchronousbase", "executionlistenersbase", "loopcharacteristics", "activity" ],
    "roles" : [ "sequence_start", "Activity", "sequence_end", "ActivitiesMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "SubProcess",
    "title" : "Sub process",
    "description" : "A sub process scope",
    "raphael" : function(paper) {
    	 paper.setStart();
    	 paper.rect(0,0,200,160,10).attr({fill:'white'}).data('anchors', 'bottom top right left').data('bound',true);
    	 text_frame = paper.rect(0,0,190,160,10).attr({stroke:'none','stroke-width':0}).data('anchors','bottom top right left');
    	 paper.text(8,10,'').attr({'font-size':12}).data('align','top left').data('fittoelem',text_frame).data('anchors','top left').data('id','text_name');
    	 return paper.setFinish(); },
	"minimumSize" : {width:60, height:50},
	"magnets" : [
	         {cx:1,cy:50,anchors:"left"},{cx:1,cy:80,anchors:"left"},{cx:1,cy:110,anchors:"left"},
	         {cx:70,cy:159,anchors:"bottom"},{cx:100,cy:159,anchors:"bottom"},{cx:130,cy:159,anchors:"bottom"},
	         {cx:199,cy:50,anchors:"right"},{cx:199,cy:80,anchors:"right"},{cx:199,cy:110,anchors:"right"},
	         {cx:70,cy:1,anchors:"top"},{cx:100,cy:1,anchors:"top"},{cx:130,cy:1,anchors:"top"},
	         {cx:100,cy:80,defaultAnchor:"yes"}
	],
    "view" : "activity/subprocess.expanded.svg",
    "icon" : "activity/expanded.subprocess.png",
    "groups" : [ "Structural" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "asynchronousbase", "executionlistenersbase", "loopcharacteristics" ],
    "roles" : [ "sequence_start", "Activity", "sequence_end", "all" ]
  }, {
    "type" : "node",
    "id" : "EventSubProcess",
    "title" : "Event sub process",
    "description" : "A event sub process scope",
    "raphael": function(paper) {
         paper.setStart();
         paper.rect(0,0,200,160,10).attr({'stroke':'black','stroke-width':1, 'stroke-dasharray':'-', 'stroke-width':2}).data('resize','vertical horizontal').data('bound',true);
         text_frame = paper.rect(0,0,100,20,0).attr({'stroke':'none','stroke-width':0});
         paper.text(8,10,'').attr({'font-size':12}).data('align','top left').data('fittoelem',text_frame).data('id','text_name');
         return paper.setFinish(); },
    "minimumSize" : {width:80, height:60},
    "magnets" : [
         {cx:0,cy:80,anchors:"left"},{cx:100,cy:160,anchors:"bottom"},{cx:200,cy:80,anchors:"right"}, {cx:100,cy:0,anchors:"top"},{cx:100,cy:80,defaultAnchor:"yes"}
    ],
    "view" : "activity/event.subprocess.svg",
    "icon" : "activity/event.subprocess.png",
    "groups" : [ "Structural" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "asynchronousbase", "executionlistenersbase" ],
    "roles" : [ "sequence_start", "Activity", "sequence_end", "all" ]
  }, {
    "type" : "node",
    "id" : "CallActivity",
    "title" : "Call activity",
    "description" : "A call activity",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.rect(0,0,100,80,10).attr({fill:'#ffffcc','stroke-width':4}).data('resize','vertical horizontal').data('bound',true);
		 text_frame = paper.rect(1,1,94,79,10).attr({'stroke':'none','stroke-width':0});
		 paper.text(50,40,'').attr({'font-size':12}).data('align','middle center').data('fittoelem',text_frame).data('id','text_name');
		 return paper.setFinish(); },
	"minimumSize" : {width:50, height:40},
	"magnets" : [
         {cx:1,cy:20,anchors:"left"},{cx:1,cy:40,anchors:"left"},{cx:1,cy:60,anchors:"left"},
         {cx:25,cy:79,anchors:"bottom"},{cx:50,cy:79,anchors:"bottom"},{cx:75,cy:79,anchors:"bottom"},
         {cx:99,cy:20,anchors:"right"},{cx:99,cy:40,anchors:"right"},{cx:99,cy:60,anchors:"right"},
         {cx:25,cy:1,anchors:"top"},{cx:50,cy:1,anchors:"top"},{cx:75,cy:1,anchors:"top"},
         {cx:50,cy:40,defaultAnchor:"yes"}
	],
    "view" : "activity/callactivity.svg",
    "icon" : "activity/task.png",
    "groups" : [ "Structural" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "callactivitybase", "asynchronousbase", "executionlistenersbase", "loopcharacteristics", "activity" ],
    "roles" : [ "sequence_start", "Activity", "sequence_end", "all" ]
  }, {
    "type" : "node",
    "id" : "ExclusiveGateway",
    "title" : "Exclusive gateway",
    "description" : "A choice gateway",
    "raphael": function(paper) {
    		 paper.setStart();
    		 paper.polygone([0,16,16,0,32,16,16,32]).attr({fill:'white'}).data('bound',true);
    		 paper.path('M 8.75,7.55 L 12.75,7.55 L 23.15,24.45 L 19.25,24.45 z').attr({fill:'black'});
    		 paper.path('M 8.75,24.45 L 19.25,7.55 L 23.15,7.55 L 12.75,24.45 z').attr({fill:'black'});
    		 paper.text(26,26,'').data({'align':'left top'}).data('id','text_name');
    		 return paper.setFinish(); },
    "view" : "gateway/exclusive.databased.svg",
    "icon" : "gateway/exclusive.databased.png",
    "groups" : [ "Gateways" ],
    "propertyPackages" : [ "elementbase", "baseattributes" ],
    "roles" : [ "sequence_start", "sequence_end", "GatewaysMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "ParallelGateway",
    "title" : "Parallel gateway",
    "description" : "A parallel gateway",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.rect(0,0,32,32).attr({'stroke':'none','fill':'white'}).data('bound',true);
		 paper.image('/hybrid_cloud/static/img/vip.png',0,0,32,32);
		 return paper.setFinish(); },
    "view" : "gateway/parallel.svg",
    "icon" : "gateway/parallel.png",
    "groups" : [ "Gateways" ],
    "propertyPackages" : [ "elementbase", "baseattributes" ],
    "roles" : [ "sequence_start", "sequence_end", "GatewaysMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "InclusiveGateway",
    "title" : "Inclusive gateway",
    "description" : "An inclusive gateway",
    "raphael": function(paper) {
			 paper.setStart();
			 paper.polygone([0,16,16,0,32,16,16,32]).attr({fill:'white'}).data('bound',true);
			 paper.circle(16,16,9.75).attr({fill:'none','stroke-width':2.5});
			 paper.text(26,26,'').data({'align':'left top'}).data('id','text_name');
			 return paper.setFinish(); },
    "view" : "gateway/inclusive.svg",
    "icon" : "gateway/inclusive.png",
    "groups" : [ "Gateways" ],
    "propertyPackages" : [ "elementbase", "baseattributes" ],
    "roles" : [ "sequence_start", "sequence_end", "GatewaysMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "EventGateway",
    "title" : "Event gateway",
    "description" : "An event gateway",
    "raphael": function(paper) {
			 paper.setStart();
			 paper.rect(0,0,44,31).attr({'stroke':'none','stroke-width':0,'fill':'white'}).data('bound',true);
			 paper.image('/hybrid_cloud/static/img/docker.png',0,0,44,31);
			 return paper.setFinish(); },
    "view" : "gateway/eventbased.svg",
    "icon" : "gateway/eventbased.png",
    "groups" : [ "Gateways" ],
    "propertyPackages" : [ "elementbase", "baseattributes" ],
    "roles" : [ "sequence_start", "sequence_end", "GatewaysMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "BoundaryErrorEvent",
    "title" : "Boundary error event",
    "description" : "A boundary event that catches a BPMN error",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.circle(16,16,15).attr({fill:'white'}).data('bound',true);
		 paper.circle(16,16,12);
		 paper.path('m22.82084,11.1715l-3.4535,13.41842l-5.82596,-10.3081l-4.20273,5.78979l3.7103,-13.2393l5.9472,9.30035l3.82469,-4.96116z').attr({'troke-width':1.5,'stroke-miterlimit':10});
		 paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
		 return paper.setFinish(); },
	"docker" : {cx:16,cy:16},
    "view" : "intermediateevent/error.svg",
    "icon" : "catching/error.png",
    "groups" : [ "Boundary Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "errorrefdefinition" ],
    "roles" : [ "sequence_start", "BoundaryEventsMorph", "IntermediateEventOnActivityBoundary" ]
  }, {
    "type" : "node",
    "id" : "BoundaryTimerEvent",
    "title" : "Boundary timer event",
    "description" : "A boundary event with a timer trigger",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.circle(16,16,15).attr({fill:'white'}).data('bound',true);
		 paper.circle(16,16,12);
		 paper.circle(16,16,10);
		 paper.path('M16,6L16,9M21,7L19.5,10M25,11L22,12.5M26,16L23,16M25,21L22,19.5M21,25L19.5,22M16,26L16,23M11,25L12.5,22M7,21L10,19.5M6,16L9,16M7,11L10,12.5M11,7L12.5,10M18,9L16,16L20,16');
		 paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
		 return paper.setFinish(); },
	"docker" : {cx:16,cy:16},
    "view" : "intermediateevent/timer.svg",
    "icon" : "catching/timer.png",
    "groups" : [ "Boundary Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "timerdefinition" ],
    "roles" : [ "sequence_start", "BoundaryEventsMorph", "IntermediateEventOnActivityBoundary" ]
  }, {
    "type" : "node",
    "id" : "BoundarySignalEvent",
    "title" : "Boundary signal event",
    "description" : "A boundary event with a signal trigger",
    "raphael": function(paper) {
		 paper.setStart();
		 paper.circle(16,16,15).attr({fill:'none'}).data('bound',true);
		 paper.circle(16,16,12).attr({fill:'none'});
		 paper.path('M 8.7124971,21.247342 L 23.333334,21.247342 L 16.022915,8.5759512 L 8.7124971,21.247342 z').attr({fill:'none','stroke-width':1.4});
		 paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
		 return paper.setFinish(); },
    "view" : "intermediateevent/signal.catching.svg",
    "icon" : "catching/signal.png",
    "groups" : [ "Boundary Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "signalrefdefinition" ],
    "roles" : [ "sequence_start", "BoundaryEventsMorph", "IntermediateEventOnActivityBoundary" ]
  }, {
    "type" : "node",
    "id" : "CatchTimerEvent",
    "title" : "Intermediate timer catching event",
    "description" : "An intermediate catching event with a timer trigger",
    "raphael": function(paper) {
    		 paper.setStart();
    		 paper.circle(16,16,15).attr({fill:'white'}).data('bound',true);
    		 paper.circle(16,16,12);
    		 paper.circle(16,16,10);
    		 paper.path('M16,6L16,9M21,7L19.5,10M25,11L22,12.5M26,16L23,16M25,21L22,19.5M21,25L19.5,22M16,26L16,23M11,25L12.5,22M7,21L10,19.5M6,16L9,16M7,11L10,12.5M11,7L12.5,10M18,9L16,16L20,16');
    		 paper.text(16,33,'').attr({'font-size':11}).data('id','text_name');
    		 return paper.setFinish(); },
    "docker" : {cx:16,cy:16},
    "view" : "intermediateevent/timer.svg",
    "icon" : "catching/timer.png",
    "groups" : [ "Intermediate Catching Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "timerdefinition", "executionlistenersbase" ],
    "roles" : [ "sequence_start", "sequence_end", "CatchEventsMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "CatchSignalEvent",
    "title" : "Intermediate signal catching event",
    "description" : "An intermediate catching event with a signal trigger",
    "raphael" : function(paper) { paper.setStart();
			 paper.circle(16,16,15).attr({fill:'none'}).data('bound',true);
			 paper.circle(16,16,12).attr({fill:'none'});
			 paper.path('M 8.7124971,21.247342 L 23.333334,21.247342 L 16.022915,8.5759512 L 8.7124971,21.247342 z').attr({'stroke-width':1.4});
			 paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
			 return paper.setFinish(); },
    "view" : "intermediateevent/signal.catching.svg",
    "icon" : "catching/signal.png",
    "groups" : [ "Intermediate Catching Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "signalrefdefinition", "executionlistenersbase" ],
    "roles" : [ "sequence_start", "sequence_end", "CatchEventsMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "CatchMessageEvent",
    "title" : "Intermediate message catching event",
    "description" : "An intermediate catching event with a message trigger",
    "raphael" : function(paper) { paper.setStart();
			 paper.circle(16,16,15).attr({fill:'none'}).data('bound',true);
			 paper.circle(16,16,12).attr({fill:'none'});
			 paper.path('M8,11 L8,21 L24,21 L24,11z M8,11 L16,17 L24,11').attr({'stroke-width':1.4});
			 paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
			 return paper.setFinish(); },
    "view" : "intermediateevent/message.catching.svg",
    "icon" : "catching/message.png",
    "groups" : [ "Intermediate Catching Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "messagerefdefinition", "executionlistenersbase" ],
    "roles" : [ "sequence_start", "sequence_end", "CatchEventsMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "ThrowNoneEvent",
    "title" : "Intermediate none throwing event",
    "description" : "An intermediate event without a specific trigger",
    "raphael" : function(paper) { paper.setStart();
			 paper.circle(16,16,15).attr({fill:'white'}).data('bound',true);
			 paper.circle(16,16,12).attr({fill:'none'});
			 paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
			 return paper.setFinish(); },
    "view" : "intermediateevent/none.svg",
    "icon" : "throwing/none.png",
    "groups" : [ "Intermediate Throwing Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "executionlistenersbase" ],
    "roles" : [ "sequence_start", "ThrowEventsMorph", "sequence_end", "all" ]
  }, {
    "type" : "node",
    "id" : "ThrowSignalEvent",
    "title" : "Intermediate signal throwing event",
    "description" : "An intermediate event with a signal trigger",
    "raphael" : function(paper) { paper.setStart();
    		 paper.circle(16,16,15).attr({fill:'white'}).data('bound',true);
    		 paper.path('M8.7124971,21.247342L23.333334,21.247342L16.022915,8.5759512L8.7124971,21.247342z').attr({'stroke-width':1.4,fill:'black'});
    		 paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
    		 return paper.setFinish(); },
	"view" : "intermediateevent/signal.throwing.svg",
    "icon" : "throwing/signal.png",
    "groups" : [ "Intermediate Throwing Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "signalrefdefinition", "executionlistenersbase" ],
    "roles" : [ "sequence_start", "ThrowEventsMorph", "sequence_end", "all" ]
  }, {
    "type" : "node",
    "id" : "EndNoneEvent",
    "title" : "End event",
    "description" : "An end event without a specific trigger",
    "raphael": function(paper) {
    	paper.setStart();
    	paper.rect(0,0,32,32,0).attr({'stroke':'none','fill':'white'}).data('bound',true);
		paper.image('/hybrid_cloud/static/img/vm.png',0,0,32,32);
    	paper.text(16,40,'').attr({'font-size':11}).data('id','text_name');
    	return paper.setFinish(); },
    "view" : "endevent/none.svg",
    "icon" : "endevent/none.png",
    "groups" : [ "End Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "executionlistenersbase" ],
    "roles" : [ "EndEventsMorph", "sequence_end", "all" ]
  }, {
    "type" : "node",
    "id" : "EndErrorEvent",
    "title" : "End error event",
    "description" : "An end event that throws an error event",
    "raphael": function(paper) {
    		 paper.setStart(); paper.circle(16,16,14).attr({'stroke-width':3,fill:'white'}).data('bound',true);
    		 paper.path('m22.82084,11.1715l-3.4535,13.41842l-5.82596,-10.3081l-4.20273,5.78979l3.7103,-13.2393l5.9472,9.30035l3.82469,-4.96116z').attr({fill:'black','troke-width':1.5,'stroke-linecap':'butt','stroke-linejoin':'miter','stroke-miterlimit':10});
    		 paper.text(16,32,'').attr({'font-size':11}).data('id','text_name');
    		 return paper.setFinish(); },
    "docker": {cx:16,cy:16},
    "view" : "endevent/error.svg",
    "icon" : "endevent/error.png",
    "groups" : [ "End Events" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "errorrefdefinition", "executionlistenersbase" ],
    "roles" : [ "EndEventsMorph", "sequence_end", "all" ]
  }, {
    "type" : "edge",
    "id" : "SequenceFlow",
    "title" : "Sequence flow",
    "description" : "Sequence flow defines the execution order of activities.",
    "raphael": function(paper) {
    		 var markend = paper.path('m-15,-5l15,5l-15,5l0,-10z').attr({'stroke-width':2,'fill':'black','stroke-linejoin':'round'});
    		 var t = paper.text(0,0,'').data('edgePosition','startTop').data('id','text_name');
    		 return paper.path('m0,50l195,0').attr({'stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round'}).data('marker-end',markend).data('text_name',t); },
    "view" : "connector/sequenceflow.svg",
    "icon" : "connector/sequenceflow.png",
    "groups" : [ "Connecting Objects" ],
    "layout" : [ {
      "type" : "layout.bpmn2_0.sequenceflow"
    } ],
    "propertyPackages" : [ "elementbase", "baseattributes", "sequenceflowbase" ],
    "roles" : [ "ConnectingObjectsMorph", "all" ]
  }, {
    "type" : "edge",
    "id" : "Association",
    "title" : "Association",
    "description" : "Associates a text annotation with an element.",
    "raphael": function(paper) {
		 var t = paper.text(0,0,'').data('edgePosition','midTop').data('offsetTop',6).data('id','text_name');
		 return paper.path('M10 50 L210 50').attr({'stroke-width':2,'stroke-dasharray':'-','stroke-linecap':'round','stroke-linejoin':'round'}).data('text_name',t); },
    "view" : "connector/association.undirected.svg",
    "icon" : "connector/association.undirected.png",
    "groups" : [ "Connecting Objects" ],
    "layout" : [ {
      "type" : "layout.bpmn2_0.sequenceflow"
    } ],
    "propertyPackages" : [ "elementbase", "baseattributes" ],
    "roles" : [ "ConnectingObjectsMorph", "all" ]
  }, {
    "type" : "node",
    "id" : "TextAnnotation",
    "title" : "Text annotation",
    "description" : "Annotates elements with description text.",
    "magnets" : [
                 {cx:2,cy:25,anchors:"left",defaultAnchor:"yes"}
            ],
    "raphael": function(paper) {
			 paper.setStart(); paper.rect(1,1,100,50).attr({'stroke':'none',fill:'white'}).data('bound',true);
			 paper.path('M20,1 L1,1 L1,50 L20,50').attr({fill:'none'});
			 paper.text(16,32,'').attr({'font-size':11}).data('id','text_name');
			 return paper.setFinish(); },
    "view" : "artifact/text.annotation.svg",
    "icon" : "artifact/text.annotation.png",
    "groups" : [ "Artifacts" ],
    "propertyPackages" : [ "elementbase", "baseattributes", "textannotationbase" ],
    "roles" : [ "all" ]
  } ],
  "rules" : {
    "cardinalityRules" : [ {
      "role" : "Startevents_all",
      "incomingEdges" : [ {
        "role" : "SequenceFlow",
        "maximum" : 0
      } ]
    }, {
      "role" : "Endevents_all",
      "outgoingEdges" : [ {
        "role" : "SequenceFlow",
        "maximum" : 0
      } ]
    } ],
    "connectionRules" : [ {
      "role" : "SequenceFlow",
      "connects" : [ {
        "from" : "sequence_start",
        "to" : [ "sequence_end" ]
      } ]
    }, {
      "role" : "Association",
      "connects" : [ {
        "from" : "sequence_start",
        "to" : [ "TextAnnotation" ]
      } ]
    }, {
      "role" : "Association",
      "connects" : [ {
        "from" : "TextAnnotation",
        "to" : [ "sequence_end" ]
      } ]
    }, {
      "role" : "IntermediateEventOnActivityBoundary",
      "connects" : [ {
        "from" : "Activity",
        "to" : [ "IntermediateEventOnActivityBoundary" ]
      } ]
    } ],
    "containmentRules" : [ {
      "role" : "BPMNDiagram",
      "contains" : [ "all" ]
    }, {
      "role" : "SubProcess",
      "contains" : [ "sequence_start", "sequence_end", "from_task_event", "to_task_event", "EventSubprocess", "TextAnnotation" ]
    }, {
      "role" : "EventSubProcess",
      "contains" : [ "sequence_start", "sequence_end", "from_task_event", "to_task_event", "TextAnnotation" ]
    } ],
    "morphingRules" : [ {
      "role" : "ActivitiesMorph",
      "baseMorphs" : [ "UserTask" ],
      "preserveBounds" : true
    }, {
      "role" : "GatewaysMorph",
      "baseMorphs" : [ "ExclusiveGateway" ]
    }, {
      "role" : "StartEventsMorph",
      "baseMorphs" : [ "StartNoneEvent" ]
    }, {
      "role" : "EndEventsMorph",
      "baseMorphs" : [ "StartNoneEvent" ]
    }, {
      "role" : "CatchEventsMorph",
      "baseMorphs" : [ "CatchTimerEvent" ]
    }, {
      "role" : "ThrowEventsMorph",
      "baseMorphs" : [ "ThrowNoneEvent" ]
    }, {
      "role" : "TextAnnotation",
      "baseMorphs" : [ "TextAnnotation" ]
    } ]
  }
};