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
 * @class Oryx canvas.
 * @extends ORYX.Core.AbstractShape
 *
 */
ORYX.Core.Canvas = {
	/**
	 * Constructor
	 */
	construct: function(options) {
		arguments.callee.$.construct.apply(this, arguments);

		this.paper = options.paper;
		this.screenCTM = {e:0,f:0};

		if(!options.parentNode) {
			options.parentNode = document.documentElement;
		}
		this.root = options.parentNode;

		this.resourceId = options.id;

		this.addEventHandlers(this.root);
		this.root.oncontextmenu = function() {return false;};	//disable context menu

		this.node = this.paper.canvas;
		this.bbox = new ORYX.Core.Bounds(0,0,0,0);

		this.nodes = [];
		this.edges = [];
		this.bounds.set(0,0,0,0);
	},
	
	update: function() {
		this.nodes.each(function(node) {
			this._traverseForUpdate(node);
		}.bind(this));
		
		var layoutEvents = this.getStencil().layout();
		
		if(layoutEvents) {
			layoutEvents.each(function(event) {
				// setup additional attributes
				event.shape = this;
				event.forceExecution = true;
				event.target = this.node;
				
				// do layouting
				this._delegateEvent(event);
			}.bind(this));
		}
		
		this.nodes.invoke("_update");
		this.edges.invoke("_update", true);
	},
	
	_traverseForUpdate: function(shape) {
		var childRet = shape.isChanged;
		shape.getChildNodes(false, function(child) {
			if(this._traverseForUpdate(child)) {
				childRet = true;
			}
		}.bind(this));
		
		if(childRet) {
			shape.layout();
			return true;
		} else {
			return false;
		}
	},
	
	layout: function() {
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
	 */
	add: function(uiObject, index, silent) {
		//if uiObject is child of another UIObject, remove it.
		if(uiObject instanceof ORYX.Core.UIObject) {
			if (!(this.children.member(uiObject))) {
				//if uiObject is child of another parent, remove it from that parent.
				if(uiObject.parent) {
					uiObject.parent.remove(uiObject, true);
				}

				//add uiObject to the Canvas
				//add uiObject to this Shape
				if(index != undefined)
					this.children.splice(index, 0, uiObject);
				else
					this.children.push(uiObject);

				//set parent reference
				uiObject.setParent(this);

				//add uiObject.node to this.node depending on the type of uiObject
				if(uiObject instanceof ORYX.Core.Shape) {
					if(uiObject instanceof ORYX.Core.Edge) {
						this.edges.push(uiObject);
					} else {
						this.nodes.push(uiObject);
					}
				} else {	//UIObject
					ORYX.Log.warn('adding unknown obj:' + uiObject);
//					uiObject.node = this.node.appendChild(uiObject.node);
				}

				uiObject.bounds.registerCallback(this._changedCallback);
				uiObject.show();
					
				if(this.eventHandlerCallback && silent !== true)
					this.eventHandlerCallback({type:ORCHESTRATOR.EVENTS.SHAPEADDED,shape:uiObject});
			} else {
				ORYX.Log.warn("add: ORYX.Core.UIObject is already a child of this object.");
			}
		} else {
			ORYX.Log.fatal("add: Parameter is not of type ORYX.Core.UIObject.");
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
			uiObject.hide();
			var parent = uiObject.parent;
						
			this.children = this.children.without(uiObject);

			//delete parent reference of uiObject
			uiObject.setParent(undefined);

			//delete uiObject.node from this.node
			if(uiObject instanceof ORYX.Core.Shape) {
				if(uiObject instanceof ORYX.Core.Edge) {
					this.edges = this.edges.without(uiObject);
				} else {
					this.nodes = this.nodes.without(uiObject);
				}
			} else {	//UIObject
				ORYX.Log.warn('removing unknown obj: ' + UIObject);
//					uiObject.node = this.node.removeChild(uiObject.node);
			}

			if(this.eventHandlerCallback && silent !== true)
				this.eventHandlerCallback({type:ORCHESTRATOR.EVENTS.SHAPEREMOVED,shape:uiObject, parent:parent});
				
			uiObject.bounds.unregisterCallback(this._changedCallback);
		} else {
			ORYX.Log.warn("remove: ORYX.Core.UIObject is not a child of this object.");
		}
	},
    
    /**
     * Creates shapes out of the given collection of shape objects and adds them to the canvas.
     * @example 
     * canvas.addShapeObjects({
         bounds:{ lowerRight:{ y:510, x:633 }, upperLeft:{ y:146, x:210 } },
         resourceId:"oryx_F0715955-50F2-403D-9851-C08CFE70F8BD",
         childShapes:[],
         properties:{},
         stencil:{
           id:"Subprocess"
         },
         outgoing:[{resourceId: 'aShape'}],
         target: {resourceId: 'aShape'}
       });
     * @param {Object} shapeObjects 
     * @param {Function} [eventHandler] An event handler passed to each newly created shape (as eventHandlerCallback)
     * @return {Array} A collection of ORYX.Core.Shape
     * @methodOf ORYX.Core.Canvas.prototype
     */
    addShapeObjects: function(shapeObjects, eventHandler){
        if(!shapeObjects) return;
		
        /*FIXME This implementation is very evil! At first, all shapes are created on
          canvas. In a second step, the attributes are applied. There must be a distinction
          between the configuration phase (where the outgoings, for example, are just named),
          and the creation phase (where the outgoings are evaluated). This must be reflected
          in code to provide a nicer API/ implementation!!! */
        
        var addShape = function(shape, parent){
            // Create a new Stencil
            var stencil = this.getStencil().stencilSet().stencil(shape.stencil.id);

            // Create a new Shape
            var ShapeClass = (stencil.type() == "node") ? ORYX.Core.Node : ORYX.Core.Edge;
            var newShape = new ShapeClass(
              {'eventHandlerCallback': eventHandler, 'paper': this.paper, 'bounds': shape.bounds},
              stencil);
            
            // Set the resource id
            newShape.resourceId = shape.resourceId;
			
            // Set parent to json object to be used later
            // Due to the nested json structure, normally shape.parent is not set/ must not be set. 
            // In special cases, it can be easier to set this directly instead of a nested structure.
            shape.parent = "#" + ((shape.parent && shape.parent.resourceId) || parent.resourceId);
            
            // Add the shape to the canvas
            this.add( newShape );

            return {
              json: shape,
              object: newShape
            };
        }.bind(this);
        
        /** Builds up recursively a flatted array of shapes, including a javascript object and json representation
         * @param {Object} shape Any object that has Object#childShapes
         */
        var addChildShapesRecursively = function(shape){
            var addedShapes = [];
        
			shape.childShapes.each(function(childShape){
				try{
					addedShapes.push(addShape(childShape, shape));
					addedShapes = addedShapes.concat(addChildShapesRecursively(childShape));
				} catch(e) {
					ORYX.Log.debug('failed to create shape: %0', childShape.stencil.id);
					if(e.stack) {
						ORYX.Log.debug(" Exception: " + e.stack);
					} else {
						ORYX.Log.debug(" Exception: " + e);
					}
				}
			});
            
            return addedShapes;
        }.bind(this);

        var shapes = addChildShapesRecursively({
            childShapes: shapeObjects, 
            resourceId: this.resourceId
        });
                    

        // prepare deserialisation parameter
        shapes.each(
            function(shape){
            	var properties = [];
                for(field in shape.json.properties){
                    properties.push({
                      name: field,
                      value: shape.json.properties[field]
                    });
                  }
                  
                  // Outgoings
                  shape.json.outgoing.each(function(out){
                    properties.push({
                      name: 'outgoing',
                      value: "#"+out.resourceId
                    });
                  });
                  
                  // Target 
                  // (because of a bug, the first outgoing is taken when there is no target,
                  // can be removed after some time)
                  if(shape.object instanceof ORYX.Core.Edge) {
	                  var target = shape.json.target || shape.json.outgoing[0];
	                  if(target){
	                    properties.push({
	                      name: 'target',
	                      value: "#"+target.resourceId
	                    });
	                  }
                  }
                  
                  // Bounds
                  if (shape.json.bounds) {
                      properties.push({
                          name: 'bounds',
                          value: shape.json.bounds.upperLeft.x + "," + shape.json.bounds.upperLeft.y + "," + shape.json.bounds.lowerRight.x + "," + shape.json.bounds.lowerRight.y
                      });
                  }
                  
                  //Dockers [{x:40, y:50}, {x:30, y:60}] => "40 50 30 60  #"
                  if(shape.json.dockers){
                    properties.push({
                      name: 'dockers',
                      value: shape.json.dockers.inject("", function(dockersStr, docker){
                        return dockersStr + docker.x + " " + docker.y + " ";
                      }) + " #"
                    });
                  }
                  
                  //Parent
                  properties.push({
                    name: 'parent',
                    value: shape.json.parent
                  });
            
                  shape.__properties = properties;
	         }.bind(this)
        );
  
        // Deserialize the properties from the shapes
        // This can't be done earlier because Shape#deserialize expects that all referenced nodes are already there
        
        // first, deserialize all nodes
        shapes.each(function(shape) {
        	if(shape.object instanceof ORYX.Core.Node) {
        		shape.object.deserialize(shape.__properties, shape.json);
        	}
        });
        
        // second, deserialize all edges
        shapes.each(function(shape) {
        	if(shape.object instanceof ORYX.Core.Edge) {
        		shape.object.deserialize(shape.__properties, shape.json);
				shape.object._oldBounds = shape.object.bounds.clone();
				shape.object._update();
        	}
        });

        this.updateSize();
        return shapes.pluck("object");
    },
    
    /**
     * Updates the size of the canvas, regarding to the containg shapes.
     */
    updateSize: function(keepBounary){
        var maxX = 0;
        var maxY = 0;
    	if(!keepBounary) {
            var minX = null;
            var minY = null;
	        // Check the size for the canvas
	        this.getChildShapes(true, function(shape){
	        	var a = shape.absoluteBounds().upperLeft();
	            var b = shape.absoluteBounds().lowerRight();
	            maxX = Math.max(maxX, b.x);
	            maxY = Math.max(maxY, b.y);
	            if(!minX) {
	            	minX = a.x;
	            	minY = a.y;
	            } else {
	                minX = Math.min(minX, a.x);
	                minY = Math.min(minY, a.y);
	            }
	        });
	        this.bbox.set(minX, minY, maxX, maxY);
    	} else {
    		var b = this.bbox.lowerRight();
    		maxX = b.x;
    		maxY = b.y;
    	}

        this.setSize();
    },

	getScreenCTM: function() {
		if(this.node.getScreenCTM) {
			var a = this.node.getScreenCTM();
			this.screenCTM.e = a.e;
			this.screenCTM.f = a.f;
		} else {
			var root = this.root;
			var scroll = Element.cumulativeScrollOffset(root);
			var upperX = root.offsetLeft+root.clientLeft;
			var upperY = root.offsetTop+root.clientTop;
			this.screenCTM.e = upperX - scroll.left;
			this.screenCTM.f = upperY - scroll.top;
		}
		return this.screenCTM;
	},
	
	getDimensions: function() {
		return Element.getDimensions(this.node);
	},
	
	/**
	 * Return all elements of the same highest level
	 * @param {Object} elements
	 */
	getShapesWithSharedParent: function(elements) {

		// If there is no elements, return []
		if(!elements || elements.length < 1) { return []; }
		// If there is one element, return this element
		if(elements.length == 1) { return elements;}

		return elements.findAll(function(value){
			var parentShape = value.parent;
			while(parentShape){
				if(elements.member(parentShape)) return false;
				parentShape = parentShape.parent;
			}
			return true;
		});		

	},

	setSize: function(size, callback) {
		var dimensions = size;
		if(!size) {
			var b = this.bounds.lowerRight();
			dimensions = {width: b.x, height: b.y};
		}

		var b = this.bbox.lowerRight();
		if(dimensions.width < b.x + ORCHESTRATOR.CONFIG.BOUNDARY_SPACE) {
			dimensions.width = b.x + ORCHESTRATOR.CONFIG.BOUNDARY_SPACE;
		}
		if(dimensions.height < b.y + ORCHESTRATOR.CONFIG.BOUNDARY_SPACE) {
			dimensions.height = b.y + ORCHESTRATOR.CONFIG.BOUNDARY_SPACE;
		}
		
//		var dimensions = Element.getDimensions(this.root);
//		var minX = dimensions.width;
//		var minY = dimensions.height - 5;
		var minX = this.root.clientWidth;
		var minY = this.root.clientHeight - 5;
		if(dimensions.width > minX) {
			minY = minY - ORCHESTRATOR.CONFIG.SCROLLBAR_WIDTH;
		}
		if(dimensions.width < minX) {
			dimensions.width = minX;
		}
		if(dimensions.height < minY) {
			dimensions.height = minY;
		}

		this.paper.setSize(1, 1);
		window.setTimeout(function(){
			this.paper.setSize(dimensions.width, dimensions.height);
			if(callback) {
				callback.apply();
			}
		}.bind(this), 100);

		this.bounds.set({a:{x:0,y:0},b:{x:dimensions.width,y:dimensions.height}});
	},
	
	moveBy: function(x, y) {
		// Move all children
		this.getChildNodes(false, function(shape){
			shape.bounds.moveBy(x, y);
		});
		// Move all dockers, when the edge has at least one docked shape
		var edges = this.getChildEdges().findAll(function(edge){ return edge.getAllDockedShapes().length > 0; });
		var dockers = edges.collect(function(edge){ return edge.dockers.findAll(function(docker){ return !docker.getDockedShape(); });}).flatten();
		dockers.each(function(docker){
			docker.bounds.moveBy(x, y);
		});
		this.update();
		this.bbox.moveBy(x, y);
	},
	
	_delegateEvent: function(event) {
		if(this.eventHandlerCallback && ( event.target == this.node || event.target == this.node.parentNode )) {
			this.eventHandlerCallback(event, this);
		}
	},
	
	toString: function() { return "Canvas " + this.id; },

    /**
     * Calls {@link ORYX.Core.AbstractShape#toJSON} and adds some stencil set information.
     */
    toJSON: function() {
        var json = arguments.callee.$.toJSON.apply(this, arguments);
		json.stencilset = {
			url: this.getStencil().stencilSet().source(),
			namespace: this.getStencil().stencilSet().namespace()
        };
        return json;
    }
};
ORYX.Core.Canvas = ORYX.Core.AbstractShape.extend(ORYX.Core.Canvas);
