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
 * @classDescription Base class for Shapes.
 * @extends ORYX.Core.AbstractShape
 */
ORYX.Core.Shape = {

	/**
	 * Constructor
	 */
	construct: function(options, stencil) {
		// call base class constructor
		arguments.callee.$.construct.apply(this, arguments);
		
		this.dockers = [];
		this.magnets = [];
		
		this.incoming = [];
		this.outgoing = [];
		
		this.nodes = [];
		
		this._dockerChangedCallback = this._dockerChanged.bind(this);
		
		//Hash map for all labels. Labels are not treated as children of shapes.
		this._labels = new ORYX.Hash();
	},

	/**
	 * If changed flag is set, refresh method is called.
	 */
	update: function() {
		//if(this.isChanged) {
			//this.layout();
		//}
	},
	
	/**
	 * !!!Not called from any sub class!!!
	 */
	_update: function() {

	},
	
	/**
	 * Calls the super class refresh method
	 *  and updates the svg elements that are referenced by a property.
	 */
	refresh: function() {
		//call base class refresh method
		arguments.callee.$.refresh.apply(this, arguments);
		
		//adjust SVG to properties' values
		var me = this;
		this.propertiesChanged.each((function(propChanged) {
			if(propChanged.value) {
				var prop = this.properties.get(propChanged.key);
				var property = this.getStencil().property(propChanged.key);
				if (property != undefined) {
					this.propertiesChanged.set(propChanged.key, false);

					//handle choice properties
					if(property.type() == ORCHESTRATOR.TYPES.CHOICE) {
						//iterate all references to SVG elements
						property.refToView().each((function(ref) {
							//if property is referencing a label, update the label
							if(ref !== "") {
								var label = this._labels.get(this.id + ref);
								if (label && property.item(prop)) {
									label.text(property.item(prop).title());
								}
							}
						}).bind(this));
					} else { //handle properties that are not of type choice
						//iterate all references to SVG elements
						property.refToView().each((function(ref) {
							//if the property does not reference an SVG element,
							// do nothing

							if(ref === "") { return; }
		
							var refId = this.id + ref;

							if (property.complexAttributeToView()) {
								var label = this._labels.get(refId);
								if (label) {
									try {
								    	propJson = prop.evalJSON();
								    	var value = propJson[property.complexAttributeToView()];
								    	label.text(value ? value : prop);
								    } catch (e) {
								    	label.text(prop);
								    }
								}
								
							} else {
								switch (property.type()) {
									case ORCHESTRATOR.TYPES.STRING:
									case ORCHESTRATOR.TYPES.INTEGER:
									case ORCHESTRATOR.TYPES.FLOAT:
										var label = this._labels.get(refId);
										if (label) {
											label.text(prop);
										}
										break;
								}
							}
						}).bind(this));
						
						
					}
				}
				
			}
		}).bind(this));
		
		//update labels
		this._labels.values().each(function(label) {
			label.update();
		});
	},
	
	layout: function() {
		//this.getStencil().layout(this)
		var layoutEvents = this.getStencil().layout();
		if (layoutEvents) {
			layoutEvents.each(function(event) {
				
				// setup additional attributes
				event.shape = this;
				event.forceExecution = true;
				
				// do layouting
				this._delegateEvent(event);
			}.bind(this));
			
		}
	},
	
	/**
	 * Returns an array of Label objects.
	 */
	getLabels: function() {
		return this._labels.values();
	},
	
	/**
	 * Returns the label for a given ref
	 * @return {ORYX.Core.Label} Returns null if there is no label
	 */
	getLabel: function(ref){
		if (!ref){
			return null;
		}
		return (this._labels.find(function(o){
				return o.key.endsWith(ref);
			})||{}).value || null;
	},
	
	/**
	 * Hides all related labels
	 * 
	 */
	hideLabels: function(){
		this.getLabels().invoke("hide");
	},

	/**
	 * Shows all related labels
	 * 
	 */
	showLabels: function(){
		var labels = this.getLabels();
		labels.invoke("show");
		labels.each(function(label) {
				label.update();
		});
	},
	
	/**
	 * Returns an array of dockers of this object.
	 */
	getDockers: function() {
		return this.dockers;
	},
	
	getMagnets: function() {
		return this.magnets;
	},
	
	getDefaultMagnet: function() {
		if(this._defaultMagnet) {
			return this._defaultMagnet;
		} else if (this.magnets.length > 0) {
			return this.magnets[0];
		} else {
			return undefined;
		}
	},

	getParentShape: function() {
		return this.parent;
	},
	
	getIncomingShapes: function(iterator) {
		if(iterator) {
			this.incoming.each(iterator);
		}
		return this.incoming;
	},
	
	getIncomingNodes: function(iterator) {
        return this.incoming.select(function(incoming){
            var isNode = (incoming instanceof ORYX.Core.Node);
            if(isNode && iterator) iterator(incoming);
            return isNode;
        });
    },
	
	
	getOutgoingShapes: function(iterator) {
		if(iterator) {
			this.outgoing.each(iterator);
		}
		return this.outgoing;
	},
    
    getOutgoingNodes: function(iterator) {
        return this.outgoing.select(function(out){
            var isNode = (out instanceof ORYX.Core.Node);
            if(isNode && iterator) iterator(out);
            return isNode;
        });
    },
	
	getAllDockedShapes: function(iterator) {
		var result = this.incoming.concat(this.outgoing);
		if(iterator) {
			result.each(iterator);
		}
		return result;
	},

	getCanvas: function() {
		if(this.parent instanceof ORYX.Core.Canvas) {
			return this.parent;
		} else if(this.parent instanceof ORYX.Core.Shape) {
			return this.parent.getCanvas();
		} else {
			return undefined;
		}
	},
	
	/**
	 * 
	 * @param {Object} deep
	 * @param {Object} iterator
	 */
	getChildNodes: function(deep, iterator) {
		if(!deep && !iterator) {
			return this.nodes.clone();
		} else {
			var result = [];
			this.nodes.each(function(uiObject) {
				if(!uiObject.isVisible){return;}
				if(iterator) {
					iterator(uiObject);
				}
				result.push(uiObject);
				
				if(deep && uiObject instanceof ORYX.Core.Shape) {
					result = result.concat(uiObject.getChildNodes(deep, iterator));
				}
			});
	
			return result;
		}
	},
	
	/**
	 * Overrides the UIObject.add method. Adds uiObject to the correct sub node.
	 * @param {UIObject} uiObject
	 * @param {Number} index
	 */
	add: function(uiObject, index, silent) {
		//parameter has to be an UIObject, but
		// must not be an Edge.
		if(uiObject instanceof ORYX.Core.UIObject 
			&& !(uiObject instanceof ORYX.Core.Edge)) {
			
			if (!(this.children.member(uiObject))) {
				//if uiObject is child of another parent, remove it from that parent.
				if(uiObject.parent) {
					uiObject.parent.remove(uiObject, true);
				}

				//add uiObject to this Shape
				if(index != undefined)
					this.children.splice(index, 0, uiObject);
				else
					this.children.push(uiObject);

				//set parent reference
				uiObject.parent = this;

				//add uiObject to this depending on the type of uiObject
				if(uiObject instanceof ORYX.Core.Node) {
					this.nodes.push(uiObject);
					uiObject.show();
				} else if(uiObject instanceof ORYX.Core.Controls.Control) {
					if(uiObject instanceof ORYX.Core.Controls.Docker) {
						if (this.dockers.length >= 2){
							this.dockers.splice(index!==undefined?Math.min(index, this.dockers.length-1):this.dockers.length-1, 0, uiObject);
						} else {
							this.dockers.push(uiObject);
						}
					} else if(uiObject instanceof ORYX.Core.Controls.Magnet) {
						this.magnets.push(uiObject);
					}
				}

				this._changed();
				//uiObject.bounds.registerCallback(this._changedCallback);
				
				if(this.eventHandlerCallback && silent !== true)
					this.eventHandlerCallback({type:ORCHESTRATOR.EVENTS.SHAPEADDED,shape:uiObject});
					
			} else {
				ORYX.Log.warn("add: ORYX.Core.UIObject is already a child of this object.");
			}
		}
	},

	/**
	 * Overrides the UIObject.remove method. Removes uiObject.
	 * @param {UIObject} uiObject
	 */
	remove: function(uiObject, silent) {
		//if uiObject is a child of this object, remove it.
		if (this.children.member(uiObject)) {
			//remove uiObject from children
			var parent = uiObject.parent;

			this.children = this.children.without(uiObject);

			//delete parent reference of uiObject
			uiObject.parent = undefined;

			//delete uiObject
			uiObject.hide();
			if(uiObject instanceof ORYX.Core.Shape) {
				if(!(uiObject instanceof ORYX.Core.Edge)) {
					this.nodes = this.nodes.without(uiObject);
				}
			} else if(uiObject instanceof ORYX.Core.Controls.Control) {
				if (uiObject instanceof ORYX.Core.Controls.Docker) {
					this.dockers = this.dockers.without(uiObject);
				} else if (uiObject instanceof ORYX.Core.Controls.Magnet) {
					this.magnets = this.magnets.without(uiObject);
				}
			}

			if(this.eventHandlerCallback && silent !== true)
				this.eventHandlerCallback({type: ORCHESTRATOR.EVENTS.SHAPEREMOVED, shape: uiObject, parent: parent});
			
			this._changed();
		} else {
			ORYX.Log.warn("remove: ORYX.Core.UIObject is not a child of this object.");
		}
	},
	
	/**
	 * Calculate the Border Intersection Point between two points
	 * @param {PointA}
	 * @param {PointB}
	 */
	getIntersectionPoint: function() {
			
		var pointAX, pointAY, pointBX, pointBY;
		
		// Get the the two Points	
		switch(arguments.length) {
			case 2:
				pointAX = arguments[0].x;
				pointAY = arguments[0].y;
				pointBX = arguments[1].x;
				pointBY = arguments[1].y;
				break;
			case 4:
				pointAX = arguments[0];
				pointAY = arguments[1];
				pointBX = arguments[2];
				pointBY = arguments[3];
				break;
			default:
				throw "getIntersectionPoints needs two or four arguments";
		}
		
		// Defined an include and exclude point
		var includePointX, includePointY, excludePointX, excludePointY;

		var bounds = this.absoluteBounds();
		
		if(this.isPointIncluded(pointAX, pointAY, bounds)){
			includePointX = pointAX;
			includePointY = pointAY;
		} else {
			excludePointX = pointAX;
			excludePointY = pointAY;
		}

		if(this.isPointIncluded(pointBX, pointBY, bounds)){
			includePointX = pointBX;
			includePointY = pointBY;
		} else {
			excludePointX = pointBX;
			excludePointY = pointBY;
		}
				
		// If there is no inclue or exclude Shape, than return
		if(!includePointX || !includePointY || !excludePointX || !excludePointY) {
			return undefined;
		}

		var midPointX = 0;
		var midPointY = 0;		
		
		var refPointX, refPointY;
		
		var minDifferent = 1;
		// Get the UpperLeft and LowerRight
		//var ul = bounds.upperLeft();
		//var lr = bounds.lowerRight();
		
		var i = 0;
		
		while(true) {
			// Calculate the midpoint of the current to points	
			var midPointX = Math.min(includePointX, excludePointX) + ((Math.max(includePointX, excludePointX) - Math.min(includePointX, excludePointX)) / 2.0);
			var midPointY = Math.min(includePointY, excludePointY) + ((Math.max(includePointY, excludePointY) - Math.min(includePointY, excludePointY)) / 2.0);
			
			
			// Set the new midpoint by the means of the include of the bounds
			if(this.isPointIncluded(midPointX, midPointY, bounds)){
				includePointX = midPointX;
				includePointY = midPointY;
			} else {
				excludePointX = midPointX;
				excludePointY = midPointY;
			}			
			
			// Calc the length of the line
			var length = Math.sqrt(Math.pow(includePointX - excludePointX, 2) + Math.pow(includePointY - excludePointY, 2));
			if(length < 1) {
				refPointX = includePointX;
				refPointY = includePointY;
				break;
			}
			// Calc a point one step from the include point
			refPointX = includePointX + ((excludePointX - includePointX) / length),
			refPointY = includePointY + ((excludePointY - includePointY) / length);
			
			// If the reference point not in the bounds, break
			if(!this.isPointIncluded(refPointX, refPointY, bounds)) {
				break;
			}
		}

		// Return the last includepoint
		return {x:refPointX , y:refPointY};
	},

    /**
     * Calculate if the point is inside the Shape
     * @param {PointX}
     * @param {PointY} 
     */
    isPointIncluded: function(){
		return  false;
	},

    /**
     * Calculate if the point is over an special offset area
     * @param {Point}
     */
    isPointOverOffset: function(){
		return  this.isPointIncluded.apply( this , arguments );
	},
		
	_dockerChanged: function() {

	},
		
	/**
	 * Create a Docker for this Edge
	 *
	 */
	createDocker: function(index, position) {
		var docker = new ORYX.Core.Controls.Docker({eventHandlerCallback: this.eventHandlerCallback, paper: this.paper});
		docker.bounds.registerCallback(this._dockerChangedCallback);
		if(position) {
			docker.bounds.centerMoveTo(position);
		}
		this.add(docker, index);
		return docker;
	},

	/**
	 * Get the serialized object
	 * return Array with hash-entrees (prefix, name, value)
	 * Following values will given:
	 * 		Bounds
	 * 		Outgoing Shapes
	 * 		Parent
	 */
	serialize: function() {
		var serializedObject = arguments.callee.$.serialize.apply(this);

		// Add the bounds
		serializedObject.push({name: 'bounds', value: this.bounds.serializeForERDF(), type: 'literal'});

		// Add the outgoing shapes
		this.getOutgoingShapes().each((function(followingShape){
			serializedObject.push({name: 'outgoing', value: '#'+ERDF.__stripHashes(followingShape.resourceId), type: 'resource'});			
		}).bind(this));

		// Add the parent shape, if the parent not the canvas
		//if(this.parent instanceof ORYX.Core.Shape){
			serializedObject.push({name: 'parent', value: '#'+ERDF.__stripHashes(this.parent.resourceId), type: 'resource'});	
		//}			
		
		return serializedObject;
	},
		
		
	deserialize: function(serialize, json){
		arguments.callee.$.deserialize.apply(this, arguments);
		
		// Set the Bounds
		var bounds = serialize.find(function(ser){ return 'bounds' === ser.name; });
		if (bounds) {
			var b = bounds.value.replace(/,/g, " ").split(" ").without("");
			b[0] = parseFloat(b[0]);
			b[1] = parseFloat(b[1]);
			b[2] = parseFloat(b[2]);
			b[3] = parseFloat(b[3]);
			if(!isNaN(b[0]) && !isNaN(b[1]) && !isNaN(b[2]) && !isNaN(b[3])) {
				if (this instanceof ORYX.Core.Edge) {
					if (!this.dockers[0].isChanged)
						this.dockers[0].bounds.centerMoveTo(b[0], b[1]);
					if (!this.dockers.last().isChanged)
						this.dockers.last().bounds.centerMoveTo(b[2], b[3]);
				} else {
					this.bounds.set(b[0], b[1], b[2], b[3]);
				}
			}
		}
		
		if (json && json.labels instanceof Array){
			json.labels.each(function(slabel){
				var label = this.getLabel(slabel.ref);
				if (label){
					label.deserialize(slabel, this);
				}
			}.bind(this));
		}
	},
	
	toJSON: function(){
		var json = arguments.callee.$.toJSON.apply(this, arguments);
		
		var labels = [], id = this.id;
		this._labels.each(function(obj){
			var slabel = obj.value.serialize();
			if (slabel){
				slabel.ref = obj.key.replace(id, '');
				labels.push(slabel);
			}
		});
		
		if (labels.length > 0){
			json.labels = labels;
		}
		return json;
	},

		
	/**
	 * Private methods.
	 */

	/**
	 * Child classes have to overwrite this method for initializing a loaded
	 * SVG representation.
	 * @param {SVGDocument} svgDocument
	 */
	_init: function() {
	},

	toString: function() { return "ORYX.Core.Shape " + this.getId(); }
};
ORYX.Core.Shape = ORYX.Core.AbstractShape.extend(ORYX.Core.Shape);
