if(!ORYX) {var ORYX = {};}

/**
 * The Editor class.
 * @class ORYX.Editor
 * @extends Clazz
 * @param {Object} config An editor object, passed to {@link ORYX.Editor#loadSerialized}
 * @param {String} config.id Any ID that can be used inside the editor. If fullscreen=false, any HTML node with this id must be present to render the editor to this node.
 * @param {boolean} [config.fullscreen=true] Render editor in fullscreen mode or not.
 * @param {String} config.stencilset.url Stencil set URL.
 * @param {String} [config.stencil.id] Stencil type used for creating the canvas.  
 * @param {Object} config.properties Any properties applied to the canvas.
*/
ORYX.Editor = {
	construct: function(parent, options) {
		var myoptions;
		if(!options) {
			var vars = window.location.search.substring(1).split("&");
			var query_string = {};
			for (var i=0;i<vars.length;i++) {
				var pair = vars[i].split("=");
				query_string[pair[0]] = pair[1];
			}
			
			myoptions = {};
			myoptions.processDefinition = query_string["processDefinition"];
			myoptions.processInstanceId = query_string["processInstanceId"];
			myoptions.editMode = (query_string["editMode"] != 'false');
		} else {
			myoptions = options;
		}
		
		this._init(parent);
		if(!myoptions.editMode) {
			this.enableReadOnlyMode();
		}

		if(myoptions.processDefinition) {
			ORCHESTRATOR.api.getProcessDefinitionModel(myoptions.processDefinition, function(meta) {
				meta.instance = myoptions.processInstanceId;
				this.load(meta);
			}.bind(this));
		} else {
			this.load(myoptions.meta);
		}
	},
	
	_init: function(parent) {
		// initialization.
		this._eventsQueue 		= [];
		this.loadedPlugins 		= [];
		this.pluginsData 		= [];
		this.focus				= true;
		this.selection			= [];
		this.readonly			= false;

		if(parent) {
			this.parent = Object.isString(parent)?document.getElementById(parent):parent;
			ORYX.observe(this.parent, ORCHESTRATOR.EVENTS.RESIZE, this.handleResize.bind(this));	// nouse default, just for extension
		}
		
		// Initialize the eventlistener
		this.DOMEventListeners	= new ORYX.Hash();
		this._initEventListener();

		this._eventHandler = this.raiseEvent.bind(this);
		this._elementsObserved = [];
		this.registerOnEvent(ORCHESTRATOR.EVENTS.REGISTERED, this._registerElement.bind(this));

		// get the stencil associated with the type
		if(!ORYX.Editor.stencilset) {
			ORYX.Editor.stencilset = new ORYX.Core.StencilSet.StencilSet();
		}
		if(!ORYX.Editor.rules) {
			ORYX.Editor.rules = new ORYX.Core.StencilSet.Rules();
			ORYX.Editor.rules.initializeRules(ORYX.Editor.stencilset);
		}
		
		// init svg document
		this.loadPlugins();
	},
	
	init: function(meta, parent) {
		this._init(parent);
		this.load(meta);
	},
	
	hide: function() {
		this.raiseEvent({type:ORCHESTRATOR.EVENTS.CANVAS_HIDE, forceExecution:true});
		this.focus = false;
	},
	
	show: function() {
		this.focus = true;
		this.raiseEvent({type:ORCHESTRATOR.EVENTS.CANVAS_SHOW});
	},
	
	clear: function(options) {
		options = options || {};
		var callback = function() {
			this.unregisterOnEvent(ORCHESTRATOR.EVENTS.DISCARDED, callback);
			this._elementsObserved.each(function(el) {
				ORYX.stopObserving(el);
			});
			this._elementsObserved = [];
			this._canvas = null;
			if(this.paper) {
				this.paper.remove();
			}
			callback = null;
			
			this.raiseEvent({type:ORCHESTRATOR.EVENTS.CLEAR, force:options.force});
			if(options.callback) {
				options.callback.call();
			}
		}.bind(this);
		this.registerOnEvent(ORCHESTRATOR.EVENTS.DISCARDED, callback);
		this.raiseEvent({type:ORCHESTRATOR.EVENTS.BEFORECLEAR, force:options.force});
	},
	
	load: function(meta, parent) {
		if(parent) {
			this.parent = Object.isString(parent)?document.getElementById(parent):parent;
			ORYX.observe(this.parent, ORCHESTRATOR.EVENTS.RESIZE, this.handleResize.bind(this));	// nouse default, just for extension
		} else if(!meta) {
			return;
		}

		this.modelMetaData = meta;
		if(this._canvas) {
			this.clear({callback:this._load.bind(this)});
		} else {
			this._load();
		}
	},
	
	_load: function() {
		var meta = this.modelMetaData || {};
		var model = meta.model || meta;
		if(model.properties) {
			model.properties.deployment = meta.deployment;
		}
		
		if(meta.instance) {
			this.enableReadOnlyMode();
		}

		var canvasStencil = ORYX.Editor.stencilset.stencil("BPMNDiagram");
		if(!canvasStencil) {
			ORYX.Log.error('Failed to get canvas stecil...');
			return;
		}
		
		this.paper = Raphael(this.parent, 1, 1);
		this._canvas = new ORYX.Core.Canvas({
			id						: model.resourceId || model.id || ORYX.Editor.prototype.provideId(),
			'eventHandlerCallback'	: this.getEventHandler(),
			parentNode				: this.parent,
			paper					: this.paper
		}, canvasStencil);
		this.loadedPlugins.each(function(plugin) {
			if(plugin.redraw) {
				plugin.redraw(this.paper);
			}
		}.bind(this));

		setTimeout(function() {
			if(this._canvas) {
				this._canvas.addShapeObjects(model.childShapes, this.getEventHandler());
		        if(model.properties) {
		        	for(key in model.properties) {
		        		var value = model.properties[key];
						var prop = this._canvas.getStencil().property(key);
		        		if (!(typeof value === "string") && (!prop || !prop.isList())) {
		        			value = Object.toJSON(value);
		        		}
		            	this._canvas.setProperty(key, value);
		            }
		        }
		        this._canvas.update();
				this._canvas.updateSize(true);
				this.setSelection(null, null, true);
				this.raiseEvent({type:ORCHESTRATOR.EVENTS.LOADED});
				if(meta.instance) {
					this.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT, instance:meta.instance});
				}
			}
		}.bind(this), 0);

		Element.setStyle(this.parent, {'-webkit-user-select':'none'});
	},
	
	_registerElement: function(options) {
		this._elementsObserved.push(options.element);
	},
	
	_initEventListener: function(){
		// Register on Events
		ORYX.observe(document.documentElement, ORCHESTRATOR.EVENTS.KEYDOWN, this.catchKeyDownEvents.bind(this));
		ORYX.observe(document.documentElement, ORCHESTRATOR.EVENTS.KEYUP, this.catchKeyUpEvents.bind(this));
		ORYX.observe(window, ORCHESTRATOR.EVENTS.RESIZE, this.handleResize.bind(this));

		// Enable Key up and down Event
		this._keydownEnabled	= true;
		this._keyupEnabled		= true;

		this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.MOUSEDOWN, []);
		this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.MOUSEUP, []);
		this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.MOUSEOVER, []);
		this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.MOUSEOUT, []);
		this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.SELECTION_CHANGED, []);
		this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.MOUSEMOVE, []);
	},
	
	loadPlugins: function() {
		var me = this;

		// Available Plugins will be initalize
		var facade = this._getPluginFacade();
		
		ORCHESTRATOR.availablePlugins.each(function(value) {
			try {
				var className 	= eval(value.name);
				if( className ){
					ORYX.Log.debug("Initializing plugin '%0'", value.name);
					me.loadedPlugins.push( new className(facade, value) );
				}
			} catch(e) {
				ORYX.Log.warn("Plugin %0 is not available", value.name);
				ORYX.Log.exception(e);
			}
		});

		this.loadedPlugins.each(function(value) {
			// If there is an GUI-Plugin, they get all Plugins-Offer-Meta-Data
			if(value.registryChanged) {
				value.registryChanged(me.pluginsData);
			}

			// If there have an onSelection-Method it will pushed to the Editor Event-Handler
			if(value.onSelectionChanged) {
				me.registerOnEvent(ORCHESTRATOR.EVENTS.SELECTION_CHANGED, value.onSelectionChanged.bind(value));
			}
		});

		this.registerPluginsOnKeyEvents();
	},

	/**
	 * Returns a per-editor singleton plugin facade.
	 * To be used in plugin initialization.
	 */
	_getPluginFacade: function() {
		// if there is no pluginfacade already created:
		if(!(this._pluginFacade)) {
			// create it.
			this._pluginFacade = {

				offer					: this.offer.bind(this),
				getRules				: this.getRules.bind(this),
				createShape				: this.createShape.bind(this),
				deleteShape				: this.deleteShape.bind(this),
				getSelection			: this.getSelection.bind(this),
				setSelection			: this.setSelection.bind(this),
				updateSelection			: this.updateSelection.bind(this),
				getCanvas				: this.getCanvas.bind(this),
				getRootNode				: this.getRootNode.bind(this),
				getStencilset			: this.getStencilset.bind(this),

				getPaper				: this.getPaper.bind(this),
				setPaper				: this.setPaper.bind(this),
				load					: this.load.bind(this),
				
				show					: this.show.bind(this),
				hide					: this.hide.bind(this),
				clear					: this.clear.bind(this),
				get						: this.get.bind(this),
				
				importJSON				: this.importJSON.bind(this),
                getJSON					: this.getJSON.bind(this),
				
				executeCommands			: this.executeCommands.bind(this),
				isExecutingCommands		: this.isExecutingCommands.bind(this),
				
				getEventHandler			: this.getEventHandler.bind(this),
				registerOnEvent			: this.registerOnEvent.bind(this),
				unregisterOnEvent		: this.unregisterOnEvent.bind(this),
				raiseEvent				: this.raiseEvent.bind(this),
				enableEvent				: this.enableEvent.bind(this),
				disableEvent			: this.disableEvent.bind(this),
				enableReadOnlyMode		: this.enableReadOnlyMode.bind(this),
				disableReadOnlyMode		: this.disableReadOnlyMode.bind(this),
				
				eventCoordinates		: this.eventCoordinates.bind(this),
				
				getModelMetaData		: this.getModelMetaData.bind(this)
			};
		}
		return this._pluginFacade;
	},
	
	get: function(name) {
		return Element.retrieve(this.parent, name);
	},
	
	getPaper: function() {
		return this.paper;
	},
	
	setPaper: function(paper) {
		this.paper = paper;
		this.loadedPlugins.each(function(plugin) {
			if(plugin.redraw) {
				plugin.redraw(this.paper);
			}
		}.bind(this));
	},

	isExecutingCommands: function(){
		return !!this.commandExecuting;
	},

	/**
	 * Implementes the command pattern
	 * (The real usage of the command pattern
	 * is implemented and shown in the Plugins/undo.js)
	 *
	 * @param <Oryx.Core.Command>[] Array of commands
	 */
	executeCommands: function(commands){
		if (!this.commandStack){
			this.commandStack = [];
		}
		if (!this.commandStackExecuted){
			this.commandStackExecuted = [];
		}
		
		this.commandStack = [].concat(this.commandStack).concat(commands);
		
		// Check if already executes
		if (this.commandExecuting){ return; }
		
		// Start execution
		this.commandExecuting = true;
		
		// Iterate over all commands
		while(this.commandStack.length > 0){
			var command = this.commandStack.shift();
			// and execute it
			try {
				command.execute();
			} catch(e) {
				ORYX.Log.exception(e);
			}
			this.commandStackExecuted.push(command);
		}
		
		// Raise event for executing commands
		this.raiseEvent({type:ORCHESTRATOR.EVENTS.EXECUTE_COMMANDS, commands:this.commandStackExecuted});
		
		// Remove temporary vars
		delete this.commandStack;
		delete this.commandStackExecuted;
		delete this.commandExecuting;
		
		this.updateSelection();
	},
	
    /**
     * Returns JSON of underlying canvas (calls ORYX.Canvas#toJSON()).
     * @return {Object} Returns JSON representation as JSON object.
     */
    getJSON: function(){
        return this.getCanvas().toJSON();
    },
    
	/**
	* Imports shapes in JSON as expected by {@link ORYX.Editor#loadSerialized}
	* @param {Object|String} jsonObject The (serialized) json object to be imported
	* @param {boolean } [noSelectionAfterImport=false] Set to true if no shapes should be selected after import
	* @throws {SyntaxError} If the serialized json object contains syntax errors
	*/
	importJSON: function(jsonObject, noSelectionAfterImport) {
		
        try {
            jsonObject = this.renewResourceIds(jsonObject);
        } catch(error){
            throw error;
        }     
		//check, if the imported json model can be loaded in this editor
		// (stencil set has to fit)
		if(jsonObject.stencilset.namespace && jsonObject.stencilset.namespace !== this.getCanvas().getStencil().stencilSet().namespace()) {
			alert(String.format(ORCHESTRATOR.Save.IMPORT_MISMATCH, jsonObject.stencilset.namespace, this.getCanvas().getStencil().stencilSet().namespace()));
			return null;
		} else {
			var commandClass = ORYX.Core.Command.extend({
				construct: function(jsonObject, loadSerializedCB, noSelectionAfterImport, facade){
					this.jsonObject = jsonObject;
					this.noSelection = noSelectionAfterImport;
					this.facade = facade;
					this.connections = [];
					this.parents = new ORYX.Hash();
					this.selection = this.facade.getSelection();
					this.loadSerialized = loadSerializedCB;
				},			
				execute: function(){
					if (!this.shapes) {
						// Import the shapes out of the serialization		
						this.shapes	= this.loadSerialized( this.jsonObject );		
						
						//store all connections
						this.shapes.each(function(shape) {
							
							if (shape.getDockers) {
								var dockers = shape.getDockers();
								if (dockers) {
									if (dockers.length > 0) {
										this.connections.push([dockers[0], dockers[0].getDockedShape(), dockers[0].referencePoint]);
									}
									if (dockers.length > 1) {
										this.connections.push([dockers.last(), dockers.last().getDockedShape(), dockers.last().referencePoint]);
									}
								}
							}
							
							//store parents
							this.parents.set(shape.id, shape.parent);
						}.bind(this));
					} else {
						this.shapes.each(function(shape) {
							this.parents.get(shape.id).add(shape);
						}.bind(this));
						
						this.connections.each(function(con) {
							con[0].setDockedShape(con[1]);
							con[0].setReferencePoint(con[2]);
							con[0].update();
						});
					}
					
					//this.parents.values().uniq().invoke("update");
					this.facade.getCanvas().update();			
						
					if(!this.noSelection)
						this.facade.setSelection(this.shapes);
					else
						this.facade.updateSelection();
						
					// call updateSize again, because during loadSerialized the edges' bounds  
					// are not yet initialized properly
					this.facade.getCanvas().updateSize();
				},
				rollback: function(){
					var selection = this.facade.getSelection();
					
					this.shapes.each(function(shape) {
						selection = selection.without(shape);
						this.facade.deleteShape(shape);
					}.bind(this));
					
					/*this.parents.values().uniq().each(function(parent) {
						if(!this.shapes.member(parent))
							parent.update();
					}.bind(this));*/
					
					this.facade.getCanvas().update();
					
					this.facade.setSelection(selection);
				}
			});
			
			var command = new commandClass(jsonObject, 
											this.loadSerialized.bind(this),
											noSelectionAfterImport,
											this._getPluginFacade());
			
			this.executeCommands([command]);	
			
			return command.shapes.clone();
		}
	},
    
    /**
     * This method renew all resource Ids and according references.
     * Warning: The implementation performs a substitution on the serialized object for
     * easier implementation. This results in a low performance which is acceptable if this
     * is only used when importing models.
     * @param {Object|String} jsonObject
     * @throws {SyntaxError} If the serialized json object contains syntax errors.
     * @return {Object} The jsonObject with renewed ids.
     * @private
     */
    renewResourceIds: function(jsonObject){
        // For renewing resource ids, a serialized and object version is needed
        if(ORYX.type(jsonObject) === "string"){
            try {
                var serJsonObject = jsonObject;
                jsonObject = eval("(" + jsonObject + ")");
            } catch(error){
                throw new SyntaxError(error.message);
            }
        } else {
            var serJsonObject = Object.toJSON(jsonObject);
        }        
        
        // collect all resourceIds recursively
        var collectResourceIds = function(shapes){
            if(!shapes) return [];
            
            return shapes.map(function(shape){
                return collectResourceIds(shape.childShapes).concat(shape.resourceId);
            }).flatten();
        };
        var resourceIds = collectResourceIds(jsonObject.childShapes);
        
        // Replace each resource id by a new one
        resourceIds.each(function(oldResourceId){
            var newResourceId = ORYX.Editor.prototype.provideId();
            serJsonObject = serJsonObject.gsub('"'+oldResourceId+'"', '"'+newResourceId+'"');
        });
        
        return eval("(" + serJsonObject + ")");
    },
	
    /**
     * Loads serialized model to the oryx.
     * @example
     * editor.loadSerialized({
     *    resourceId: "mymodel1",
     *    childShapes: [
     *       {
     *          stencil:{ id:"Subprocess" },
     *          outgoing:[{resourceId: 'aShape'}],
     *          target: {resourceId: 'aShape'},
     *          bounds:{ lowerRight:{ y:510, x:633 }, upperLeft:{ y:146, x:210 } },
     *          resourceId: "myshape1",
     *          childShapes:[],
     *          properties:{},
     *       }
     *    ],
     *    properties:{
     *       language: "English"
     *    },
     *    stencilset:{
     *       url:"http://localhost:8080/oryx/stencilsets/bpmn1.1/bpmn1.1.json"
     *    },
     *    stencil:{
     *       id:"BPMNDiagram"
     *    }
     * });
     * @param {Object} model Description of the model to load.
     * @param {Array} [model.ssextensions] List of stenctil set extensions.
     * @param {String} model.stencilset.url
     * @param {String} model.stencil.id 
     * @param {Array} model.childShapes
     * @param {Array} [model.properties]
     * @param {String} model.resourceId
     * @return {ORYX.Core.Shape[]} List of created shapes
     * @methodOf ORYX.Editor.prototype
     */
    loadSerialized: function(model, requestMeta){
        var canvas  = this.getCanvas();

        var shapes = this.getCanvas().addShapeObjects(model.childShapes, this.raiseEvent.bind(this));
        
        if(model.properties) {
        	for(key in model.properties) {
        		var value = model.properties[key];
				var prop = this.getCanvas().getStencil().property(key);
        		if (!(typeof value === "string") && (!prop || !prop.isList())) {
        			value = Object.toJSON(value);
        		}
            	this.getCanvas().setProperty(key, value);
            }
        }
        
        
        this.getCanvas().updateSize();
		
		// Force to update the selection
		this.selection = [null];
		this.setSelection([]);
		
        return shapes;
    },
	
	disableEvent: function(eventType){
		if(!eventType) {
			this._keydownEnabled = false;
			this._keyupEnabled = false;
			this.DOMEventListeners.each((function(pair) {
				var value = this.DOMEventListeners.unset(pair.key);
				this.DOMEventListeners.set('disable_' + pair.key, pair.value);
			}).bind(this));
		} else {
			if(eventType == ORCHESTRATOR.EVENTS.KEYDOWN) {
				this._keydownEnabled = false;
			}
			if(eventType == ORCHESTRATOR.EVENTS.KEYUP) {
				this._keyupEnabled = false;
			}
			if(this.DOMEventListeners.keys().member(eventType)) {
				var value = this.DOMEventListeners.unset(eventType);
				this.DOMEventListeners.set('disable_' + eventType, value);
			}
		}
	},

	enableEvent: function(eventType){
		if(eventType == ORCHESTRATOR.EVENTS.KEYDOWN) {
			this._keydownEnabled = true;
		} else if(eventType == ORCHESTRATOR.EVENTS.KEYUP) {
			this._keyupEnabled = true;
		}
		
		if(this.DOMEventListeners.keys().member("disable_" + eventType)) {
			var value = this.DOMEventListeners.unset("disable_" + eventType);
			this.DOMEventListeners.set(eventType, value);
		}
	},
	
	enableReadOnlyMode: function(){
		this.readonly = true;
		this.loadedPlugins.each(function(plugin) {
			if(plugin.enableReadOnlyMode) {
				try {
					plugin.enableReadOnlyMode();
				} catch(e) {
					ORYX.Log.exception(e);
				}
			}
		});
	},

	disableReadOnlyMode: function(){
		this.readonly = false;
		this.loadedPlugins.each(function(plugin) {
			if(plugin.disableReadOnlyMode) {
				try {
					plugin.disableReadOnlyMode();
				} catch(e) {
					ORYX.Log.exception(e);
				}
			}
		});
	},

	/**
	 *  Methods for the PluginFacade
	 */
	getEventHandler: function() {
		return this._eventHandler;
	},

	registerOnEvent: function(eventType, callback) {
		if(!(this.DOMEventListeners.keys().member(eventType))) {
			if(this.DOMEventListeners.keys().member("disable_" + eventType)) {
				eventType = "disable_" + eventType;
			} else {
				this.DOMEventListeners.set(eventType, []);
			}
		}
		this.DOMEventListeners.get(eventType).push(callback);
	},

	unregisterOnEvent: function(eventType, callback) {
		if(!(this.DOMEventListeners.keys().member(eventType))) {
			if(this.DOMEventListeners.keys().member("disable_" + eventType)) {
				eventType = "disable_" + eventType;
			} else {
				// Event is not supported
				ORYX.Log.warn(eventType + " not found, unregister ignored.");
				return;
			}
		}
		this.DOMEventListeners.set(eventType, this.DOMEventListeners.get(eventType).without(callback));
	},

	getSelection: function() {
		return this.selection || [];
	},

	getRules: function() {
		return ORYX.Editor.rules;
	},
	
	offer: function(pluginData) {
		if(!this.pluginsData.member(pluginData)){
			this.pluginsData.push(pluginData);
		}
	},
	
	/**
	 * It creates an new event or adds the callback, if already existing,
	 * for the key combination that the plugin passes in keyCodes attribute
	 * of the offer method.
	 * 
	 * The new key down event fits the schema:
	 * 		key.event[.metactrl][.alt][.shift].'thekeyCode'
	 */
	registerPluginsOnKeyEvents: function() {
		this.pluginsData.each(function(pluginData) {
			
			if(pluginData.keyCodes) {
				
				pluginData.keyCodes.each(function(keyComb) {
					var eventName = "key.event";
					
					/* Include key action */
					eventName += '.' + keyComb.keyAction;
					
					if(keyComb.metaKeys) {
						/* Register on ctrl or apple meta key as meta key */
						if(keyComb.metaKeys.
							indexOf(ORCHESTRATOR.CONST.META_KEY_META_CTRL) > -1) {
								eventName += "." + ORCHESTRATOR.CONST.META_KEY_META_CTRL;
						}
							
						/* Register on alt key as meta key */
						if(keyComb.metaKeys.
							indexOf(ORCHESTRATOR.CONST.META_KEY_ALT) > -1) {
								eventName += '.' + ORCHESTRATOR.CONST.META_KEY_ALT;
						}
						
						/* Register on shift key as meta key */
						if(keyComb.metaKeys.
							indexOf(ORCHESTRATOR.CONST.META_KEY_SHIFT) > -1) {
								eventName += '.' + ORCHESTRATOR.CONST.META_KEY_SHIFT;
						}		
					}
					
					/* Register on the actual key */
					if(keyComb.keyCode)	{
						eventName += '.' + keyComb.keyCode;
					}
					
					/* Register the event */
					ORYX.Log.debug("Register Plugin on Key Event: %0", eventName);
					if (pluginData.toggle === true && pluginData.buttonInstance) {
						this.registerOnEvent(eventName, function(){
							pluginData.buttonInstance.toggle(!pluginData.buttonInstance.pressed); // Toggle 
							pluginData.functionality.call(pluginData, pluginData.buttonInstance, pluginData.buttonInstance.pressed); // Call function
						});
					} else {
						this.registerOnEvent(eventName, pluginData.functionality);
					}
				
				}.bind(this));
			}
		}.bind(this));
	},
	
	isEqual: function(a,b){
		return a === b || (a.length === b.length && a.all(function(r){ return b.include(r); }));
	},
	
	isDirty: function(a){
		return a.any(function(shape){ return shape.isPropertyChanged(); });
	},

	setSelection: function(elements, subSelectionElement, force) {
		
		if (!elements) { elements = []; }
		if (!(elements instanceof Array)) { elements = [elements]; }
		
		elements = elements.findAll(function(n){ return n && n instanceof ORYX.Core.Shape; });
		
		if (elements[0] instanceof ORYX.Core.Canvas) {
			elements = [];
		}
		
		if (!force && this.isEqual(this.selection, elements) && !this.isDirty(elements)){
			return;
		}
		
		this.selection = elements;
		this._subSelection = subSelectionElement;
		
		this.raiseEvent({type:ORCHESTRATOR.EVENTS.SELECTION_CHANGED, elements:elements, subSelection: subSelectionElement, force: !!force});
	},
	
	updateSelection: function(check) {
		this.setSelection(this.selection, this._subSelection, !check);
		/*var s = this.selection;
		this.setSelection();
		this.setSelection(s);*/
	},

	getCanvas: function() {
		return this._canvas;
	},
	
	getRootNode: function() {
		return this.parent;
	},

	getStencilset: function() {
		return ORYX.Editor.stencilset;
	},

	/**
	*	option = {
	*		type: string,
	*		position: {x:int, y:int},
	*		connectingType:	uiObj-Class
	*		connectedShape: uiObj
	*		draggin: bool
	*       parent: ORYX.Core.AbstractShape
	*		template: a template shape that the newly created inherits properties from.
	*		}
	*/
	createShape: function(option) {

		if(option && option.serialize && option.serialize instanceof Array){
		
			var type = option.serialize.find(function(obj){return (obj.name) == "type";});
			var stencil = ORYX.Editor.stencilset.stencil(type.value);
		
			if(stencil.type() == 'node'){
				var newShapeObject = new ORYX.Core.Node({'eventHandlerCallback':this.raiseEvent.bind(this), 'paper':option.paper}, stencil);	
			} else {
				var newShapeObject = new ORYX.Core.Edge({'eventHandlerCallback':this.raiseEvent.bind(this), 'paper':option.paper}, stencil);	
			}
		
			this.getCanvas().add(newShapeObject);
			newShapeObject.deserialize(option.serialize);
		
			return newShapeObject;
		}

		// If there is no argument, throw an exception
		if(!option || !option.type) { throw "To create a new shape you have to give an argument with type";}
		
		var canvas = this.getCanvas();
		var newShapeObject;

		// Get the shape type
		var shapetype = option.type;

		// Get the stencil set
		var sset = ORYX.Editor.stencilset;

		// Create an New Shape, dependents on an Edge or a Node
		if(sset.stencil(shapetype).type() == "node") {
			newShapeObject = new ORYX.Core.Node({'eventHandlerCallback':this.raiseEvent.bind(this), 'paper':option.paper}, sset.stencil(shapetype));
		} else {
			newShapeObject = new ORYX.Core.Edge({'eventHandlerCallback':this.raiseEvent.bind(this), 'paper':option.paper}, sset.stencil(shapetype));
		}
		
		// when there is a template, inherit the properties.
		if(option.template) {

			newShapeObject._jsonStencil.properties = option.template._jsonStencil.properties;
			newShapeObject.postProcessProperties();
		}

		// Add to the canvas
		if(!option.parent || !(newShapeObject instanceof ORYX.Core.Node)) {
			option.parent = canvas;
		}
		option.parent.add(newShapeObject);
		
        // prepare deserialisation parameter
		if(option.properties) {
			var properties = [];
			for(field in option.properties){
			    properties.push({
			      name: field,
			      value: option.properties[field]
			    });
			  }
			  
			  //Parent
			  properties.push({
			    name: 'parent',
			    value: option.parent
			  });
			  newShapeObject.deserialize(properties);
		}

		// Set the position
		var point = option.position ? option.position : {x:100, y:200};
		var parentUL = option.parent.absoluteXY();
		point.x -= parentUL.x;
		point.y -= parentUL.y;
		
		var con;
		// If there is create a shape and in the argument there is given an ConnectingType and is instance of an edge
		if(option.connectingType && option.connectedShape && !(newShapeObject instanceof ORYX.Core.Edge)) {

			// there will be create a new Edge
			con = new ORYX.Core.Edge({'eventHandlerCallback':this.raiseEvent.bind(this), 'paper':paper}, sset.stencil(option.connectingType));
			
			// And both endings dockers will be referenced to the both shapes
			con.dockers[0].setDockedShape(option.connectedShape);
			
			var magnet = option.connectedShape.getDefaultMagnet();
			var cPoint = magnet ? magnet.bounds.center() : option.connectedShape.bounds.midPoint();
			con.dockers[0].setReferencePoint( cPoint );
			con.dockers.last().setDockedShape(newShapeObject);
			con.dockers.last().setReferencePoint(newShapeObject.getDefaultMagnet().bounds.center());		
			
			// The Edge will be added to the canvas and be updated
			canvas.add(con);	
			//con.update();
			
		} 
		
		// Move the new Shape to the position
		if(newShapeObject instanceof ORYX.Core.Edge && option.connectedShape) {

			newShapeObject.dockers[0].setDockedShape(option.connectedShape);
			
			if( option.connectedShape instanceof ORYX.Core.Node ){
				newShapeObject.dockers[0].setReferencePoint(option.connectedShape.getDefaultMagnet().bounds.center());					
				newShapeObject.dockers.last().bounds.centerMoveTo(point);			
			} else {
				newShapeObject.dockers[0].setReferencePoint(option.connectedShape.bounds.midPoint());								
			}

		} else {
			
			var b = newShapeObject.bounds;
			if( newShapeObject instanceof ORYX.Core.Node && newShapeObject.dockers.length == 1){
				b = newShapeObject.dockers[0].bounds;
			}
			
			b.centerMoveTo(point);
			
			var upL = b.upperLeft();
			b.moveBy( -Math.min(upL.x, 0) , -Math.min(upL.y, 0) );
			
			var lwR = b.lowerRight();
			b.moveBy( -Math.max(lwR.x-canvas.bounds.width(), 0) , -Math.max(lwR.y-canvas.bounds.height(), 0) );
			
		}
		
		// Update the shape
		if (newShapeObject instanceof ORYX.Core.Edge) {
			newShapeObject._update(false);
		}
		
		// And refresh the selection
		if(!(newShapeObject instanceof ORYX.Core.Edge)&&!(option.dontUpdateSelection)) {
			this.setSelection([newShapeObject]);
		}
		
		if(con && con.alignDockers) {
			con.alignDockers();
		} 
		if(newShapeObject.alignDockers) {
			newShapeObject.alignDockers();
		}

		return newShapeObject;
	},
	
	deleteShape: function(shape) {
		
		if (!shape || !shape.parent){ return; }
		
		//remove shape from parent
		// this also removes it from DOM
		shape.parent.remove(shape);
		
		//delete references to outgoing edges
		shape.getOutgoingShapes().each(function(os) {
			var docker = os.getDockers()[0];
			if(docker && docker.getDockedShape() == shape) {
				docker.setDockedShape(undefined);
			}
		});
		
		//delete references to incoming edges
		shape.getIncomingShapes().each(function(is) {
			var docker = is.getDockers().last();
			if(docker && docker.getDockedShape() == shape) {
				docker.setDockedShape(undefined);
			}
		});
		
		//delete references of the shape's dockers
		shape.getDockers().each(function(docker) {
			docker.setDockedShape(undefined);
		});
	},
	
	/**
	 * Returns an object with meta data about the model.
	 * Like name, description, ...
	 * 
	 * Empty object with the current backend.
	 * 
	 * @return {Object} Meta data about the model
	 */
	getModelMetaData: function() {
		return this.modelMetaData;
	},

	/* Event-Handler Methods */
	
	/**
	* Helper method to execute an event immediately. The event is not
	* scheduled in the _eventsQueue. Needed to handle Layout-Callbacks.
	*/
	_executeEventImmediately: function(eventObj) {
		if(this.DOMEventListeners.keys().member(eventObj.event.type)) {
			try {
				this.DOMEventListeners.get(eventObj.event.type).each((function(value) {
					value(eventObj.event, eventObj.arg);		
				}).bind(this));
			} catch(e) {
				ORYX.Log.debug(eventObj.event.type + ":" + this.DOMEventListeners.get(eventObj.event.type));
				ORYX.Log.exception(e);
			}
		}
	},

	_executeEvents: function() {
		this._queueRunning = true;
		while(this._eventsQueue.length > 0) {
			var val = this._eventsQueue.shift();
			this._executeEventImmediately(val);
		}
		this._queueRunning = false;
	},
	
	/**
	 * Leitet die Events an die Editor-Spezifischen Event-Methoden weiter
	 * @param {Object} event Event , welches gefeuert wurde
	 * @param {Object} uiObj Target-UiObj
	 */
	raiseEvent: function(event, uiObj) {
		if(!this.focus) { return; }
		
		ORYX.Log.trace("Dispatching event type %0 on %1", event.type, uiObj);

		switch(event.type) {
			case ORCHESTRATOR.EVENTS.MOUSEDOWN:
				this._handleMouseDown(event, uiObj);
				break;
			case ORCHESTRATOR.EVENTS.MOUSEMOVE:
				this._handleMouseMove(event, uiObj);
				break;
			case ORCHESTRATOR.EVENTS.MOUSEUP:
				this._handleMouseUp(event, uiObj);
				break;
			case ORCHESTRATOR.EVENTS.MOUSEOVER:
				this._handleMouseHover(event, uiObj);
				break;
			case ORCHESTRATOR.EVENTS.MOUSEOUT:
				this._handleMouseOut(event, uiObj);
				break;
		}
		/* Force execution if necessary. Used while handle Layout-Callbacks. */
		if(event.forceExecution) {
			this._executeEventImmediately({event: event, arg: uiObj});
		} else {
			this._eventsQueue.push({event: event, arg: uiObj});
		}
		
		if(!this._queueRunning) {
			this._executeEvents();
		}
		
		// TODO: Make this return whether no listener returned false.
		// So that, when one considers bubbling undesireable, it won't happen.
		return false;
	},

	isValidEvent: function(e){
		try {
			var isInput = ["INPUT", "TEXTAREA"].include(e.target.tagName.toUpperCase());
			return !isInput;
		} catch(e){
			return false;
		}
	},
	
	handleResize: function(event) {
		if(this.readonly) { return; }
		if(this._canvas) {
			this._canvas.updateSize(true);
		}
	},

	catchKeyUpEvents: function(event) {
		if(!this._keyupEnabled) {
			return;
		}
		/* assure we have the current event. */
        if (!event) 
            event = window.event;
        
		// Checks if the event comes from some input field
		if (!this.isValidEvent(event)){
			return;
		}
		
		/* Create key up event type */
		var keyUpEvent = this.createKeyCombEvent(event,	ORCHESTRATOR.CONST.KEY_ACTION_UP);
		
		ORYX.Log.trace("Key Event to handle: %0", keyUpEvent);

		/* forward to dispatching. */
		this.raiseEvent({type: keyUpEvent, event:event});
	},
	
	/**
	 * Catches all key down events and forward the appropriated event to 
	 * dispatching concerning to the pressed keys.
	 * 
	 * @param {Event} 
	 * 		The key down event to handle
	 */
	catchKeyDownEvents: function(event) {
		if(!this._keydownEnabled) {
			return;
		}
		/* Assure we have the current event. */
        if (!event) 
            event = window.event;
        
		/* Fixed in FF3 */
		// This is a mac-specific fix. The mozilla event object has no knowledge
		// of meta key modifier on osx, however, it is needed for certain
		// shortcuts. This fix adds the metaKey field to the event object, so
		// that all listeners that registered per Oryx plugin facade profit from
		// this. The original bug is filed in
		// https://bugzilla.mozilla.org/show_bug.cgi?id=418334
		//if (this.__currentKey == ORYX.CONFIG.KEY_CODE_META(224)) {
		//	event.appleMetaKey = true;
		//}
		//this.__currentKey = pressedKey;
		
		// Checks if the event comes from some input field
		if (!this.isValidEvent(event)){
			return;
		}
		
		/* Create key up event type */
		var keyDownEvent = this.createKeyCombEvent(event, ORCHESTRATOR.CONST.KEY_ACTION_DOWN);
		
		ORYX.Log.trace("Key Event to handle: %0", keyDownEvent);
		
		/* Forward to dispatching. */
		this.raiseEvent({type: keyDownEvent,event: event});
	},
	
	/**
	 * Creates the event type name concerning to the pressed keys.
	 * 
	 * @param {Event} keyDownEvent
	 * 		The source keyDownEvent to build up the event name
	 */
	createKeyCombEvent: function(keyEvent, keyAction) {

		/* Get the currently pressed key code. */
        var pressedKey = keyEvent.which || keyEvent.keyCode;
		//this.__currentKey = pressedKey;
		
		/* Event name */
		var eventName = "key.event";
		
		/* Key action */
		if(keyAction) {
			eventName += "." + keyAction;
		}
		
		/* Ctrl or apple meta key is pressed */
		if(keyEvent.ctrlKey || keyEvent.metaKey) {
			eventName += "." + ORCHESTRATOR.CONST.META_KEY_META_CTRL;
		}
		
		/* Alt key is pressed */
		if(keyEvent.altKey) {
			eventName += "." + ORCHESTRATOR.CONST.META_KEY_ALT;
		}
		
		/* Alt key is pressed */
		if(keyEvent.shiftKey) {
			eventName += "." + ORCHESTRATOR.CONST.META_KEY_SHIFT;
		}
		
		/* Return the composed event name */
		return  eventName + "." + pressedKey;
	},

	_handleMouseDown: function(event, uiObj) {
		// get canvas.
		var canvas = this.getCanvas();
	
		// find the shape that is responsible for this element's id.
		var elementController = uiObj;

		// gather information on selection.
		var currentIsSelectable = (elementController !== null) &&
			(elementController !== undefined) && (elementController.isSelectable);
		var currentIsMovable = (elementController !== null) &&
			(elementController !== undefined) && (elementController.isMovable);
		var modifierKeyPressed = event.shiftKey || event.ctrlKey;
		var noObjectsSelected = this.selection.length === 0;
		var currentIsSelected = this.selection.member(elementController);


		// Rule #1: When there is nothing selected, select the clicked object.
		if(currentIsSelectable && noObjectsSelected) {

			this.setSelection([elementController]);

			ORYX.Log.trace("Rule #1 applied for mouse down on %0", uiObj);

		// Rule #3: When at least one element is selected, and there is no
		// control key pressed, and the clicked object is not selected, select
		// the clicked object.
		} else if(currentIsSelectable && !noObjectsSelected &&
			!modifierKeyPressed && !currentIsSelected) {

			this.setSelection([elementController]);

			//var objectType = elementController.readAttributes();
			//alert(objectType[0] + ": " + objectType[1]);

			ORYX.Log.trace("Rule #3 applied for mouse down on %0", uiObj);

		// Rule #4: When the control key is pressed, and the current object is
		// not selected, add it to the selection.
		} else if(currentIsSelectable && modifierKeyPressed
			&& !currentIsSelected) {
				
			var newSelection = this.selection.clone();
			newSelection.push(elementController);
			this.setSelection(newSelection);

			ORYX.Log.trace("Rule #4 applied for mouse down on %0", uiObj);

		// Rule #5: When there is at least one object selected and no control
		// key pressed, we're dragging.
		/*} else if(currentIsSelectable && !noObjectsSelected
			&& !modifierKeyPressed) {

			if(this.log.isTraceEnabled())
				this.log.trace("Rule #5 applied for mouse down on "+element.id);
*/
		// Rule #2: When clicked on something that is neither
		// selectable nor movable, clear the selection, and return.
		} else if (!currentIsSelectable && !currentIsMovable) {
			
			this.setSelection([]);
			
			ORYX.Log.trace("Rule #2 applied for mouse down on %0", uiObj);

			return;

		// Rule #7: When the current object is not selectable but movable,
		// it is probably a control. Leave the selection unchanged but set
		// the movedObject to the current one and enable Drag. Dockers will
		// be processed in the dragDocker plugin.
		} else if(!currentIsSelectable && currentIsMovable && !(elementController instanceof ORYX.Core.Controls.Docker)) {
			
			// TODO: If there is any moveable elements, do this in a plugin
			//ORYX.Core.UIEnableDrag(event, elementController);

			ORYX.Log.trace("Rule #7 applied for mouse down on %0", uiObj);
		
		// Rule #8: When the element is selectable and is currently selected and no 
		// modifier key is pressed
		} else if(currentIsSelectable && currentIsSelected &&
			!modifierKeyPressed) {
			
			this._subSelection = this._subSelection != elementController ? elementController : undefined;
						
			this.setSelection(this.selection, this._subSelection);
			
			ORYX.Log.trace("Rule #8 applied for mouse down on %0", uiObj);
		}
		
		
		// prevent event from bubbling, return.
		//Event.stop(event);
		return;
	},

	_handleMouseMove: function(event, uiObj) {
	},

	_handleMouseUp: function(event, uiObj) {
	},

	_handleMouseHover: function(event, uiObj) {
	},

	_handleMouseOut: function(event, uiObj) {
	},

	provideId: function() {
		var res = [], hex = '0123456789ABCDEF';

		for (var i = 0; i < 36; i++) res[i] = Math.floor(Math.random()*0x10);

		res[14] = 4;
		res[19] = (res[19] & 0x3) | 0x8;

		for (var i = 0; i < 36; i++) res[i] = hex[res[i]];

		res[8] = res[13] = res[18] = res[23] = '-';

		return "rid_" + res.join('');
	},
	
	/**
	 * Calculates the event coordinates to SVG document coordinates.
	 * @param {Event} event
	 * @return {SVGPoint} The event coordinates in the SVG document
	 */
	eventCoordinates: function(event) {
		var a = this._canvas.getScreenCTM();
		return {x:(event.clientX-a.e), y:(event.clientY-a.f)};
	}
};
ORYX.Editor = Clazz.extend(ORYX.Editor);
modeler = function(parent, options) {
	return (new ORYX.Editor(parent, options))._getPluginFacade();
};
