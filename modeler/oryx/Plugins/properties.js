if(!ORYX) {var ORYX = {};}
if(!ORYX.Plugins) {ORYX.Plugins = {};}

ORYX.Plugins.Properties = {
    construct: function(facade){
		this.facade = facade;
		this.visible = false;
		this.commited = true;
		
		this.shapeSelection = {};
		this.shapeSelection.commonProperties = new Array();
		this.shapeSelection.commonPropertiesValues = new ORYX.Hash();

		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.PROPERTY_UPDATE, this.onchange.bind(this));
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.PROPERTY_WINDOW, this.onvisible.bind(this));
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.DBLCLICK, this.handleMouseDown.bind(this));
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.CLEAR, this.clear.bind(this));
		
		this.clear();
	},
	
	clear: function() {
		this.instance = -1;
		this.history = -1;
	},
	
	onvisible: function(options) {
		this.visible = options.visible;
		if(this.visible) {
			this.onSelectionChanged(options.event);
		}
	},
	
	handleMouseDown: function(event, uiObj) {
		if (event.ctrlKey) {
			if (uiObj instanceof ORYX.Core.Node && uiObj.getStencil().id() === 'CallActivity') {
				this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.JUMP, activity:uiObj.properties.get('callactivitycalledelement')});
			}
	    } else {
			if (this.facade.getModelMetaData().instance || this.facade.getModelMetaData().history) {
				this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.PROPERTY_UI,event:event.event,ui:ORCHESTRATOR.TYPES.UI_STATUS});
		    } else if (!(uiObj instanceof ORYX.Core.Edge) && !(uiObj instanceof ORYX.Core.Controls.Docker)) {
				this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.PROPERTY_UI,event:event.event,ui:ORCHESTRATOR.TYPES.UI_DEFINITION});
		    }
		    if (!event.elements) {
			    event.elements = [ uiObj ];
		    }
		    this.visible = true;
		    this.onSelectionChanged(event);
	    }
	},
	
	onSelectionChanged: function(event) {
		if(!this.visible || !this.commited) { return; }

		this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.PROPERTY_BLUR, forceExecution:true});
		
		/* Case: nothing selected */
		var canvas = this.facade.getCanvas();
		if(!event || !(event.elements) || event.elements.length == 0) {
			if(canvas) {
				this.shapeSelection.shapes = [canvas];
			}
		} else {
			/* Selected shapes */
			this.shapeSelection.shapes = event.elements;
			if(!this.shapeSelection.shapes.first().getStencil) {
				this.shapeSelection.shapes = [canvas];
			}
		}
		
		/* subselection available */
		if(event && event.subSelection) {
			this.shapeSelection.shapes = [event.subSelection];
		}

		if(this.instance == -1) {
			this.instance = this.facade.getModelMetaData().instance;
		}
		
		if(this.history == -1) {
			this.history = this.facade.getModelMetaData().history;
		}
		
		if(this.shapeSelection.shapes) {
			if(this.instance) {
				if(this.shapeSelection.shapes.length == 1) {
					var self = this;
					var id = (this.shapeSelection.shapes[0] === canvas)?null:this.shapeSelection.shapes[0].resourceId;
					ORCHESTRATOR.api.getInstanceVars(this.instance, id, function(json) {
						var props = id?json.formProperties:json;
						if(id == null) {
							props.each(function(prop) {
								prop.id = prop.name;
							});
						}
						if(!props && json.data) {
							props = [];
							json.data.each(function(data) {
								props.push({id:data.variable.name, value:data.variable.value, type:data.variable.type});
							});
						}
						self.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.TASK_SELECT, shapes:self.shapeSelection.shapes, id:json.taskId, properties:props});
					});
				} else {
					this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.TASK_SELECT, shapes:this.shapeSelection.shapes});
				}
			} else if(this.history) {
				if(this.shapeSelection.shapes.length == 1) {
					var self = this;
					var id = (this.shapeSelection.shapes[0] === canvas)?null:this.shapeSelection.shapes[0].resourceId;
					ORCHESTRATOR.api.getHistoryVars(this.history, id, function(json) {
						var props = [];
						var taskid = null;
						if(json.data) {
							json.data.each(function(data) {
								if((!id && !data.taskId) || id) {
									props.push({name:data.variable.name, value:data.variable.value, type:data.variable.type});
								}
							});
							if(id && (json.data.length > 0)) {
								taskid = json.data[0].taskId;
							}
						}
						self.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.TASK_SELECT, shapes:self.shapeSelection.shapes, id:taskid, properties:props});
					});
				} else {
					this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.TASK_SELECT, shapes:this.shapeSelection.shapes});
				}
			} else {
				// Create the Properties
				this.createProperties();
				this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.PROPERTY_SELECT, shapes:this.shapeSelection.shapes, properties:this.properties});
			}
		}
	},

	/**
	 * Identifies the common Properties of the selected shapes.
	 */
	identifyCommonProperties: function() {
		this.shapeSelection.commonProperties.clear();
		
		/* 
		 * A common property is a property, that is part of 
		 * the stencil definition of the first and all other stencils.
		 */
		var stencils = this.getStencilSetOfSelection();
		var firstStencil = stencils.values().first();
		var comparingStencils = stencils.values().without(firstStencil);
		
		if(comparingStencils.length == 0) {
			this.shapeSelection.commonProperties = firstStencil.properties();
		} else {
			var properties = new ORYX.Hash();
			
			/* put all properties of on stencil in a Hash */
			firstStencil.properties().each(function(property){
				properties.set(property.id() + '-' + property.type(), property);
			});
			
			/* Calculate intersection of properties. */
			
			comparingStencils.each(function(stencil){
				var intersection = new ORYX.Hash();
				stencil.properties().each(function(property){
					if(properties.get(property.id() + '-' + property.type())){
						intersection.set(property.id() + '-' + property.type(), property);
					}
				});
				properties = intersection;
			});
			
			this.shapeSelection.commonProperties = properties.values();
		}
	},
	
	/**
	 * Sets this.shapeSelection.commonPropertiesValues.
	 * If the value for a common property is not equal for each shape the value
	 * is left empty in the property window.
	 */
	setCommonPropertiesValues: function() {
		this.shapeSelection.commonPropertiesValues = new ORYX.Hash();
		this.shapeSelection.commonProperties.each(function(property){
			var key = property.id();
			var emptyValue = false;
			var firstShape = this.shapeSelection.shapes.first();
			
			this.shapeSelection.shapes.each(function(shape){
				if(firstShape.properties.get(key) != shape.properties.get(key)) {
					emptyValue = true;
				}
			}.bind(this));
			
			/* Set property value */
			if(!emptyValue) {
				this.shapeSelection.commonPropertiesValues.set(key, firstShape.properties.get(key));
			}
		}.bind(this));
	},
	
	/**
	 * Creates the properties for the ExtJS-Grid from the properties of the
	 * selected shapes.
	 */
	createProperties: function() {
		this.identifyCommonProperties();
		this.setCommonPropertiesValues();

		this.properties = [];

		if(this.shapeSelection.commonProperties) {
			
			// add new property lines
			this.shapeSelection.commonProperties.each((function(pair, index) {

				// Push to the properties-array
				if(pair.visible()) {
					// Popular Properties are those which are set to be popular
					if (pair.popular()) {
						pair.setPopular();
					}
					
					var key = pair.id();
					
					// Get the property pair
					var attribute	= this.shapeSelection.commonPropertiesValues.get(key);
					
					this.properties.push({popular:pair.popular(), name:pair.title(), value:attribute, readonly:pair.readonly(), gridProperties:{
						propId: key,
						type: pair.type(),
						tooltip: pair.description()
					}, pair:pair});
				}
			}).bind(this));
		}
	},

	onchange: function(options) {
		var record = this.properties[options.row];
		var selectedElements = this.shapeSelection.shapes;
		
		var key = record.gridProperties.propId;
		var oldValue 	= record.value;
		var newValue	= options.value;
		var facade		= this.facade;
		
		// Implement the specific command for property change
		var commandClass = ORYX.Core.Command.extend({
			construct: function(){
				this.key 		= key;
				this.selectedElements = selectedElements;
				this.oldValue	= oldValue;
				this.newValue 	= newValue;
				this.facade		= facade;
			},
			execute: function(){
				this.selectedElements.each(function(shape){
					if(!shape.getStencil().property(this.key).readonly()) {
						shape.setProperty(this.key, this.newValue);
					}
				}.bind(this));
				this.facade.setSelection(this.selectedElements);
				this.facade.getCanvas().update();
				this.facade.updateSelection(true);
			},
			rollback: function(){
				this.selectedElements.each(function(shape){
					shape.setProperty(this.key, this.oldValue);
				}.bind(this));
				this.facade.setSelection(this.selectedElements);
				this.facade.getCanvas().update();
				this.facade.updateSelection(true);
			}
		});

		// Instanciated the class
		var command = new commandClass();
		
		// Execute the command
		this.commited = false;
		this.facade.executeCommands([command]);
		this.commited = true;
	},
	
	/**
	 * Returns the set of stencils used by the passed shapes.
	 */
	getStencilSetOfSelection: function() {
		var stencils = new ORYX.Hash();
		
		this.shapeSelection.shapes.each(function(shape) {
			stencils.set(shape.getStencil().id(), shape.getStencil());
		});
		return stencils;
	}
};
ORYX.Plugins.Properties = Clazz.extend(ORYX.Plugins.Properties);
