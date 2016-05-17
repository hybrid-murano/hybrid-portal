if(!ORCHESTRATOR) {var ORCHESTRATOR = {};}

if(!ORCHESTRATOR.api) { ORCHESTRATOR.api = {}; }

Object.extend(ORCHESTRATOR.api, {
	getDeployment: function(deploymentId, callback) {
		if(deploymentId) {
			this.url = Lang.sub(ORCHESTRATOR.options.getDeploymentById, {deploymentId:deploymentId});
		} else {
			this.url = ORCHESTRATOR.options.getDeployment;
		}
		this.request(this.url, callback);
	},
	
	deleteDeloyment: function(deploymentId, callback) {
		if(deploymentId) {
			this.url = Lang.sub(ORCHESTRATOR.options.deleteDeployment, {deploymentId:deploymentId});
			this.post('DELETE', this.url, null, callback);
		}
		else {
		    alert("deploymentId parameter is required");
		}
	},

	destroyProcess: function(processInstanceId, callback) {
		if(processInstanceId) {
			this.url = Lang.sub(ORCHESTRATOR.options.destroyProcessById, {processInstanceId:processInstanceId});
			this.post('DELETE', this.url, null, callback);
		}
		else {
		    alert("processInstanceId parameter is required");
		}
	},
	
	getProcessDefinitionModel: function(processDefinition, callback) {
		this.url = Lang.sub(ORCHESTRATOR.options.getProcessDefinitionModel, {processDefinition:processDefinition, tick:(new Date()).getTime()});
		this.request(this.url, callback);
	},
	
	getProcessParams: function(processDefinition, callback) {
		this.url = Lang.sub(ORCHESTRATOR.options.getProcessForm, {processDefinitionId:processDefinition, tick:(new Date()).getTime()});
		this.request(this.url, callback);
	},
	
	startProcess: function(processDefinition, params, callback) {
		this.url = ORCHESTRATOR.options.startProcess;
		this.post('POST', this.url,
				Object.toJSON({processDefinitionKey:processDefinition.substring(0,processDefinition.indexOf(':')), variables:params}),
			callback, 'application/json');
	},
	
	putProcessDefinitionModel: function(processDefinition, params, callback) {
		this.url = Lang.sub(ORCHESTRATOR.options.getProcessDefinitionModel, {processDefinition:processDefinition, tick:(new Date()).getTime()});
		this.post('PUT', this.url, params, callback);
	},

	getProcessDefinition: function(processDefinitionId, callback) {
		if(processDefinitionId) {
			this.url = Lang.sub(ORCHESTRATOR.options.getProcessDefinitionById, {processDefinitionId:processDefinitionId});
		} else {
			this.url = ORCHESTRATOR.options.getProcessDefinition;
		}
		this.request(this.url, callback);
	},
	
	getInstanceHighlight: function(instance, callback) {
		if(instance) {
			this.url = Lang.sub(ORCHESTRATOR.options.getHighlight, {processInstanceId:instance, tick:(new Date()).getTime()});
			this.request(this.url, callback);
		} else {
			alert("processInstanceId parameter is required");
		}
	},
	
	getHistory: function(callback) {
		this.url = ORCHESTRATOR.options.getHistory;
		this.request(this.url, callback);
	},
	
	getHistoryVars: function(instance, key, callback) {
		var self = this;
		if(key) {
			self.url = Lang.sub(ORCHESTRATOR.options.getInstanceHistByKey, {processInstanceId:instance, taskDefinitionKey:key});
		} else {
			self.url = Lang.sub(ORCHESTRATOR.options.getInstanceHist, {processInstanceId:instance});
		}
		self.request(self.url, function(json) {
			if(key) {
				if(json.data.length == 1) {
					self.url = Lang.sub(ORCHESTRATOR.options.getTaskHistory, {taskId:json.data[0].id});
					self.request(self.url, callback);
				} else {
					callback.call(null, {});
				}
			} else {
				callback.call(null, json);
			}
		});
	},
	
	getInstanceVars: function(instance, key, callback) {
		if(instance) {
			if(key) {
				var self = this;
				this.url = Lang.sub(ORCHESTRATOR.options.getInstanceTaskByKey, {processInstanceId:instance, taskDefinitionKey:key});
				this.request(this.url, function(json) {
					if(json.data.length == 1) {
						self.url = Lang.sub(ORCHESTRATOR.options.getTaskForm, {taskId:json.data[0].id});
						self.request(self.url, callback);
					} else {
						self.getHistoryVars(instance, key, callback);
					}
				});
			} else {
				this.url = Lang.sub(ORCHESTRATOR.options.getInstanceVarsById, {processInstanceId:instance});
				this.request(this.url, callback);
			}
		} else {
			alert("processInstanceId parameter is required");
		}
	},
	
	submitTask: function(task, properties, callback) {
		this.url = ORCHESTRATOR.options.submitTask;
		this.post('POST', this.url, Object.toJSON({taskId:task, properties:properties}), callback, 'application/json');
	},
	
	getProcessInstance: function(processDefinitionId, processInstanceId, callback) {
		if(processInstanceId) {
			this.url = Lang.sub(ORCHESTRATOR.options.getProcessInstanceById, {processDefinitionId:processDefinitionId, processInstanceId:processInstanceId});
		} else {
			this.url = ORCHESTRATOR.options.getProcessInstance;
		}
		this.request(this.url, callback);
	}
});

if(!ORCHESTRATOR.api.post) {
	ORCHESTRATOR.api.post = function(method, url, params, callback, type) {
		new PROTOTYPE.Ajax.Request(ORCHESTRATOR.SERVICE_PATH + url, {
			method : method,
			parameters : params,
			contentType : type || 'application/x-www-form-urlencoded',
			onSuccess : function(transport) {
				var data = eval("(" + transport.responseText + ")");
				if (callback) {
					callback.call(null, true, data);
				}
			}.bind(this),
			onFailure: (function(transport) {
				if(callback) {
					callback.call(null, false, transport);
				}
			}).bind(this)
		});
	};
}

if(!ORCHESTRATOR.api.request) {
	ORCHESTRATOR.api.request = function(url, callback) {
		new PROTOTYPE.Ajax.Request(ORCHESTRATOR.SERVICE_PATH + url, {
			method : 'GET',
			onSuccess : function(transport) {
				try {
					var data = eval("(" + transport.responseText + ")");
					if (data) {
						callback.call(null, data);
					}
				} catch (e) {
					ORYX.Log.exception(e);
				}
			}
		});
	};
}
