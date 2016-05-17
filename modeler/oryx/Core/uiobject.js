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
if(!ORYX.Core) {ORYX.Core = {};}


/**
 * @classDescription Abstract base class for all objects that have a graphical representation
 * within the editor.
 * @extends Clazz
 */
ORYX.Core.UIObject = {
	/**
	 * Constructor of the UIObject class.
	 */
	construct: function(options) {	
		
		this.isChanged = true;			//Flag, if UIObject has been changed since last update.
		this.isResized = true;
		this.isVisible = true;			//Flag, if UIObject's display attribute is set to 'inherit' or 'none'
		this.isSelectable = false;		//Flag, if UIObject is selectable.
		this.isResizable = false;		//Flag, if UIObject is resizable.
		this.isMovable = false;			//Flag, if UIObject is movable.
		
		this.id = ORYX.Editor.prototype.provideId();	//get unique id
		this.parent = undefined;		//parent is defined, if this object is added to another uiObject.
		this.children = [];				//array for all add uiObjects
		
		this.bounds = new ORYX.Core.Bounds();		//bounds with undefined values

		this._changedCallback = this._changed.bind(this);	//callback reference for calling _changed
		this.bounds.registerCallback(this._changedCallback);	//set callback in bounds
		
		if(options && options.eventHandlerCallback) {
			this.eventHandlerCallback = options.eventHandlerCallback;
			this.paper = options.paper;
		}
	},
	
	setParent: function(parent) {
		this.parent = parent;
	},
	
	/**
	 * Sets isChanged flag to true. Callback for the bounds object.
	 */
	_changed: function(bounds, isResized) {
		this.isChanged = true;
		if(this.bounds == bounds)
			this.isResized = isResized || this.isResized;
	},
	
	/**
	 * If something changed, this method calls the refresh method that must be implemented by subclasses.
	 */
	update: function() {
		if(this.isChanged) {
			this.refresh();
			this.isChanged = false;
			
			//call update of all children
			this.children.each(function(value) {
				value.update();
			});
		}
	},
	
	/**
	 * Is called in update method, if isChanged is set to true. Sub classes should call the super class method.
	 */
	refresh: function() {
		this.children.each(function(child) {
			child.refresh();
		});
	},
	
	/**
	 * @return {Array} Array of all child UIObjects.
	 */
	getChildren: function() {
		return this.children.clone();
	},
	
	/**
	 * @return {Array} Array of all parent UIObjects.
	 */
	getParents: function(){
		var parents = [];
		var parent = this.parent;
		while(parent){
			parents.push(parent);
			parent = parent.parent;
		}
		return parents;
	},
	
	/**
	 * Returns TRUE if the given parent is one of the UIObjects parents or the UIObject themselves, otherwise FALSE.
	 * @param {UIObject} parent
	 * @return {Boolean} 
	 */
	isParent: function(parent){
		var cparent = this;
		while(cparent){
			if (cparent === parent){
				return true;
			}
			cparent = cparent.parent;
		}
		return false;
	},
	
	/**
	 * @return {String} Id of this UIObject
	 */
	getId: function() {
		return this.id;
	},
	
	/**
	 * Method for accessing child uiObjects by id.
	 * @param {String} id
	 * @param {Boolean} deep
	 * 
	 * @return {UIObject} If found, it returns the UIObject with id.
	 */
	getChildById: function(id, deep) {
		return this.children.find(function(uiObj) {
			if(uiObj.getId() === id) {
				return uiObj;
			} else {
				if(deep) {
					var obj = uiObj.getChildById(id, deep);
					if(obj) {
						return obj;
					}
				}
			}
		});
	},
	
	/**
	 * Adds an UIObject to this UIObject and sets the parent of the
	 * added UIObject. It is also added to the SVG representation of this
	 * UIObject.
	 * @param {UIObject} uiObject
	 */
	add: function(uiObject) {
		//add uiObject, if it is not already a child of this object
		if (!(this.children.member(uiObject))) {
			//if uiObject is child of another parent, remove it from that parent.
			if(uiObject.parent) {
				uiObject.remove(uiObject);
			}
			
			//add uiObject to children
			this.children.push(uiObject);
			
			//set parent reference
			uiObject.parent = this;
			
			//register callback to get informed, if child is changed
			uiObject.bounds.registerCallback(this._changedCallback);

			//uiObject.update();
		} else {
			ORYX.Log.info("add: ORYX.Core.UIObject is already a child of this object.");
		}
	},
	
	/**
	 * Removes UIObject from this UIObject. The SVG representation will also
	 * be removed from this UIObject's SVG representation.
	 * @param {UIObject} uiObject
	 */
	remove: function(uiObject) {
		//if uiObject is a child of this object, remove it.
		if (this.children.member(uiObject)) {
			//remove uiObject from children
			this.children = this._uiObjects.without(uiObject);
			
			//delete parent reference of uiObject
			uiObject.parent = undefined;
			
			//delete uiObject.node from this.node
			uiObject.hide();
			
			//unregister callback to get informed, if child is changed
			uiObject.bounds.unregisterCallback(this._changedCallback);
		} else {
			ORYX.Log.info("remove: ORYX.Core.UIObject is not a child of this object.");
		}
		
	},
	
	/**
	 * Calculates absolute bounds of this UIObject.
	 */
	absoluteBounds: function() {
		if(this.parent) {
			var absUL = this.absoluteXY();
			return new ORYX.Core.Bounds(absUL.x, absUL.y,
							absUL.x + this.bounds.width(),
							absUL.y + this.bounds.height());
		} else {
			return this.bounds.clone();
		}
	},

	/**
	 * @return {Point} The absolute position of this UIObject.
	 */
	absoluteXY: function() {
		if(this.parent) {
			var pXY = this.parent.absoluteXY();		
			return {x: pXY.x + this.bounds.upperLeft().x , y: pXY.y + this.bounds.upperLeft().y};
			
		} else {
			return {x: this.bounds.upperLeft().x , y: this.bounds.upperLeft().y};
		}
	},

	/**
	 * @return {Point} The absolute position from the Center of this UIObject.
	 */
	absoluteCenterXY: function() {
		if(this.parent) {
			var pXY = this.parent.absoluteXY();		
			return {x: pXY.x + this.bounds.center().x , y: pXY.y + this.bounds.center().y};
			
		} else {
			return {x: this.bounds.center().x , y: this.bounds.center().y};
		}
	},
	
	/**
	 * Hides this UIObject and all its children.
	 */
	hide: function() {
		this.raphael.forEach(function(el) {el.node.style.display="none";});
		this.isVisible = false;
	},
	
	/**
	 * Enables visibility of this UIObject and all its children.
	 */
	show: function() {
		this.raphael.forEach(function(el) {el.node.style.display=""; el.toFront();});
		this.isVisible = true;
	},
	
	addEventHandlers: function(node) {
		if(this.eventHandlerCallback) {
			ORYX.observe(node, ORCHESTRATOR.EVENTS.MOUSEDOWN, this._delegateEvent.bind(this));
			ORYX.observe(node, ORCHESTRATOR.EVENTS.MOUSEMOVE, this._delegateEvent.bind(this));
			ORYX.observe(node, ORCHESTRATOR.EVENTS.MOUSEUP, this._delegateEvent.bind(this));
			ORYX.observe(node, ORCHESTRATOR.EVENTS.MOUSEOVER, this._delegateEvent.bind(this));
			ORYX.observe(node, ORCHESTRATOR.EVENTS.MOUSEOUT, this._delegateEvent.bind(this));
			ORYX.observe(node, ORCHESTRATOR.EVENTS.CLICK, this._delegateEvent.bind(this));
			ORYX.observe(node, ORCHESTRATOR.EVENTS.DBLCLICK, this._delegateEvent.bind(this));
			this.eventHandlerCallback({type:ORCHESTRATOR.EVENTS.REGISTERED, element:node});
		}
	},

	_delegateEvent: function(event) {
		if(this.eventHandlerCallback) {
			this.eventHandlerCallback(event, this);
		}
	},
	
	toString: function() { return "UIObject " + this.id; }
};
ORYX.Core.UIObject = Clazz.extend(ORYX.Core.UIObject);
