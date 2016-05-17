/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
if(!ORYX) {var ORYX = {};}
if(!ORYX.Plugins) {ORYX.Plugins = {};}

ORYX.Plugins.Save = {
	construct: function(facade){
		this.facade = facade;
		
		this.facade.offer({
			functionality: this.save.bind(this),
			keyCodes: [{
			 		metaKeys: [ORCHESTRATOR.CONST.META_KEY_META_CTRL],
					keyCode: 83, // s-Keycode
					keyAction: ORCHESTRATOR.CONST.KEY_ACTION_DOWN 
				}
			 ]
		});
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.SAVE, this.save.bind(this));
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.LOAD, this.load.bind(this));
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.BEFORECLEAR, this.clear.bind(this));
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.HIGHLIGHT, this.highlight.bind(this));

		window.onbeforeunload = this.onUnLoad.bind(this);
		window.onunload = this.onLeave.bind(this);
		
		this.changeDifference = 0;
		
		// Register on event for executing commands --> store all commands in a stack
		// --> Execute
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.UNDO_EXECUTE, function(){ this.changeDifference++; this.updateTitle(); }.bind(this) );
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.EXECUTE_COMMANDS, function(){ this.changeDifference++; this.updateTitle(); }.bind(this) );
		// --> Rollback
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.UNDO_ROLLBACK, function(){ this.changeDifference--; this.updateTitle(); }.bind(this) );
	},
	
	updateTitle: function(){
		if(ORCHESTRATOR.CONFIG.FULLSCREEN) {
			var value = window.document.title || document.getElementsByTagName("title")[0].childNodes[0].nodeValue;
			if (this.changeDifference === 0 && value.startsWith(ORCHESTRATOR.CONFIG.CHANGE_SYMBOL)){
				window.document.title = value.slice(1);
			} else if (this.changeDifference !== 0 && !value.startsWith(ORCHESTRATOR.CONFIG.CHANGE_SYMBOL)){
				window.document.title = ORCHESTRATOR.CONFIG.CHANGE_SYMBOL + value;
			}
		}
		Element.store(this.facade.getRootNode(), ORCHESTRATOR.DATA.MODIFY_FLAG, this.changeDifference !== 0);
	},
	
	onLeave: function(){
		this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.LEAVE});
	},
	
	onUnLoad: function(){
		if(this.changeDifference !== 0) {
			return ORCHESTRATOR.Save.UNSAVED_DATA;
		}
	},
	
	clear: function(options) {
		if(!options.force) {
			var msg = this.onUnLoad();
			if(msg && (!confirm(msg))) { return; }
		}
		this.changeDifference = 0;
		this.updateTitle();
		this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.DISCARDED});
	},
	
	load: function(options) {
		if(!options.force) {
			var msg = this.onUnLoad();
			if(msg && (!confirm(msg))) { return; }
		}
		this.changeDifference = 0;
		this.updateTitle();
		this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.DISCARDED});
		if(options.url) {
			ORCHESTRATOR.api.request(options.src, function(meta) {
				this.facade.load(meta);
				if(!options.editMode) {
					this.facade.enableReadOnlyMode();
				} else {
					this.facade.disableReadOnlyMode();
				}
			}.bind(this));
		} else {
			if(options.forceNew) {
				meta = {};
				meta.key = options.processDefinition;
				if(options.properties) {
					meta.name = options.properties.name;
					meta.description = options.properties.description;
					meta.deployment = options.properties.deployment;
					meta.model = {};
					meta.model.properties = {};
					meta.model.properties.process_id = options.processDefinition;
					meta.model.properties.category = options.properties.category;
					meta.model.properties.name = options.properties.name;
				}
				this.facade.load(meta, options.parent);
			} else {
				ORCHESTRATOR.api.getProcessDefinitionModel(options.processDefinition, function(meta) {
					meta.instance = options.processInstanceId;
					meta.history = options.processHistoryId;
					this.facade.load(meta, options.parent);
					if(!options.editMode) {
						this.facade.enableReadOnlyMode();
					} else {
						this.facade.disableReadOnlyMode();
					}
				}.bind(this));
			}
		}
	},
	
	highlight : function(options) {
		ORCHESTRATOR.api.getInstanceHighlight(options.instance, function(info) {
			var canvas = this.facade.getCanvas();
			this.highlights = [];
			info.activities && info.activities.each(function(id){
				this.highlights.push(canvas.getChildShapeByResourceId(id));
			}.bind(this));
			info.flows && info.flows.each(function(id){
				this.highlights.push(canvas.getChildShapeByResourceId(id));
			}.bind(this));
			this.highlights.each(function(element){
				element.refresh({
					color:(options.color||ORCHESTRATOR.CONFIG.HIGHLIGHT_COLOR),
					width:(options.strokewidth||ORCHESTRATOR.CONFIG.HIGHLIGHT_STROKE)
				});
			});
		}.bind(this));
	},
	
	saveSynchronously: function(meta){
		if (!meta) {
			return;
		}
		
		// Get json
		var json = this.facade.getJSON();
		meta.model.properties.deployment = json.properties.deployment;
		json = Object.toJSON(json);
		
		var params = {
			id: meta.key,
			json_xml: json,
			name: meta.name||"",
			type: this.facade.getCanvas().getStencil().stencilSet().title(),
			parent: meta.parent,
			deployment: meta.model.properties.deployment,
			description: meta.description||""
		};

		this.saving = false;
		
		// Send the request to the server.
		ORCHESTRATOR.api.putProcessDefinitionModel(params.id, params, function(success, transport) {
			if(success) {
				// Reset changes
				this.changeDifference = 0;
				this.updateTitle();
				this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.SAVED});
			} else {
				alert("Something went wrong when trying to save your diagram. Please try again.");
			}
		}.bind(this));
	},
	
	/**
	 * Saves the current process to the server.
	 */
	save: function(event){
		if(event.event) {
			ORYX.stop(event.event);
		}

		// Check if currently is saving
		if (this.saving){
			return true;
		}
		
		this.saving = true;
		
		// ... save asynchronously
		try {
			this.saveSynchronously(this.facade.getModelMetaData());
		} catch(e) {
			this.saving = false;
			ORYX.Log.exception(e);
		}

		return true;
	}
};
ORYX.Plugins.Save = Clazz.extend(ORYX.Plugins.Save);
