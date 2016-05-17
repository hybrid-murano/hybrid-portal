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
if(!ORYX.Core.Controls) {ORYX.Core.Controls = {};}


/**
 * @classDescription Represents a movable docker that can be bound to a shape. Dockers are used
 * for positioning shape objects.
 * @extends {Control}
 * 
 * TODO absoluteXY und absoluteCenterXY von einem Docker liefern falsche Werte!!!
 */
ORYX.Core.Controls.Docker = {
	/**
	 * Constructor
	 */
	construct: function() {
		arguments.callee.$.construct.apply(this, arguments);
		
		this.isMovable = true;				// Enables movability
		this.bounds.set(0, 0, 16, 16);		// Set the bounds
		this.referencePoint = undefined;		// Refrenzpoint 
		this._dockedShapeBounds = undefined;		
		this._dockedShape = undefined;
		this._oldRefPoint1 = undefined;
		this._oldRefPoint2 = undefined;
		
		this._dockerNode = this.paper.circle(8,8,3).attr({stroke:"black", fill:"red", "stroke-width":"1"});
		this.raphael = this.paper.set().push(this._dockerNode);
		this.addEventHandlers(this._dockerNode.node);

		// Hide the Docker
		this.hide();
		
		// Buffer the Update Callback for un-/register on Event-Handler 
		this._updateCallback = this._changed.bind(this);
	},
	
	update: function() {
		// If there have an DockedShape
		if(this._dockedShape) {
			if(this._dockedShapeBounds && this._dockedShape instanceof ORYX.Core.Node) {
				// Calc the delta of width and height of the lastBounds and the current Bounds
				var dswidth = this._dockedShapeBounds.width();
				var dsheight = this._dockedShapeBounds.height();
				if(!dswidth)
					dswidth = 1;
				if(!dsheight)
					dsheight = 1;	
				var widthDelta = 	this._dockedShape.bounds.width() 	/ dswidth;
				var heightDelta = 	this._dockedShape.bounds.height() 	/ dsheight;
				
				// If there is an different
				if(widthDelta !== 1.0 || heightDelta !== 1.0) {
					// Set the delta
					this.referencePoint.x *= widthDelta;
					this.referencePoint.y *= heightDelta;
				}
	
				// Clone these bounds
				this._dockedShapeBounds = this._dockedShape.bounds.clone();				
			}
			
			// Get the first and the last Docker of the parent Shape
			var dockerIndex = this.parent.dockers.indexOf(this);
			var dock1 = this;
			var dock2 = this.parent.dockers.length > 1 ? 
							(dockerIndex === 0?							// If there is the first element
							 	this.parent.dockers[dockerIndex + 1]:	// then take the next docker
								this.parent.dockers[dockerIndex - 1]):  // if not, then take the docker before
							undefined;
			
			// Calculate the first absolute Refenzpoint 
			var absoluteReferenzPoint1 = dock1.getDockedShape() ? 
				dock1.getAbsoluteReferencePoint() : 
				dock1.bounds.center();

			// Calculate the last absolute Refenzpoint 
			var absoluteReferenzPoint2 = dock2 && dock2.getDockedShape() ? 
				dock2.getAbsoluteReferencePoint() : 
				dock2 ? 
					dock2.bounds.center() :
					undefined;

			// If there is no last absolute Referenzpoint		
			if(!absoluteReferenzPoint2) {
				// Calculate from the middle of the DockedShape
				var center = this._dockedShape.absoluteCenterXY();
				var distx = center.x - absoluteReferenzPoint1.x;
				var disty = center.y - absoluteReferenzPoint1.y;
				var ul = this._dockedShape.bounds.upperLeft();
				var lr = this._dockedShape.bounds.lowerRight();
				if(this._dockedShape.bounds.width() - Math.abs(distx)*2 < this._dockedShape.bounds.height() - Math.abs(disty)*2) {
					absoluteReferenzPoint2 = { x: (distx>0) ? (ul.x-1) : (lr.x+1), y: absoluteReferenzPoint1.y };
				} else {
					absoluteReferenzPoint2 = { x: absoluteReferenzPoint1.x, y: (disty>0) ? (ul.y-1) : (lr.y+1) };
				}
			}
			
			var newPoint = undefined;
			
			// Get the new point for the Docker, calucalted by the intersection point of the Shape and the two points
			newPoint = this._dockedShape.getIntersectionPoint(absoluteReferenzPoint1, absoluteReferenzPoint2);
			
			// If there is new point, take the referencepoint as the new point
			if(!newPoint) {
				newPoint = this.getAbsoluteReferencePoint();
			}
			
			if(this.parent && this.parent.parent) {
				var grandParentPos = this.parent.parent.absoluteXY();
				newPoint.x -= grandParentPos.x;
				newPoint.y -= grandParentPos.y;
			}
			
			// Set the bounds to the new point
			this.bounds.centerMoveTo(newPoint);
		
			this._oldRefPoint1 = absoluteReferenzPoint1;
			this._oldRefPoint2 = absoluteReferenzPoint2;
		} 
		
		// Call the super class
		arguments.callee.$.update.apply(this, arguments);
	},

	/**
	 * Calls the super class refresh method and updates the view of the docker.
	 */
	refresh: function() {
		arguments.callee.$.refresh.apply(this, arguments);
		
		// Refresh the dockers node
		var p = this.bounds.upperLeft();
		this.raphael.transform('t' + p.x + ', ' + p.y);
		
		// Refresh the referencepoints node
		p = Object.clone(this.referencePoint);
		
		if(p && this._dockedShape){
			var upL;
			if(this.parent instanceof ORYX.Core.Edge) {
				upL = this._dockedShape.absoluteXY();
			} else {
				upL = this._dockedShape.bounds.upperLeft();
			}
			p.x += upL.x;
			p.y += upL.y;
		} else {
			p = this.bounds.center();
		}
	},

	/**
	 * Set the reference point
	 * @param {Object} point
	 */	
	setReferencePoint: function(point) {
		// Set the referencepoint
		if(this.referencePoint !== point &&
			(!this.referencePoint || 
			!point ||
			this.referencePoint.x !== point.x || 
			this.referencePoint.y !== point.y)) {
				
			this.referencePoint = point;
			this._changed();			
		}
	},
	
	/**
	 * Get the absolute referencepoint
	 */
	getAbsoluteReferencePoint: function() {
		if(!this.referencePoint || !this._dockedShape) {
			return undefined;
		} else {
			var absUL = this._dockedShape.absoluteXY();
			return {	
						x: this.referencePoint.x + absUL.x,
						y: this.referencePoint.y + absUL.y
					};
		}
	},	
	
	/**
	 * Set the docked Shape from the docker
	 * @param {Object} shape
	 */
	setDockedShape: function(shape) {

		// If there is an old docked Shape
		if(this._dockedShape) {
			this._dockedShape.bounds.unregisterCallback(this._updateCallback);
			
			// Delete the Shapes from the incoming and outgoing array
			// If this Docker the incoming of the Shape
			if(this === this.parent.dockers[0]) {
				
				this.parent.incoming = this.parent.incoming.without(this._dockedShape);
				this._dockedShape.outgoing = this._dockedShape.outgoing.without(this.parent);
			
			// If this Docker the outgoing of the Shape	
			} else if (this === this.parent.dockers.last()){
	
				this.parent.outgoing = this.parent.outgoing.without(this._dockedShape);
				this._dockedShape.incoming = this._dockedShape.incoming.without(this.parent);
							
			}
			
		}

		
		// Set the new Shape
		this._dockedShape = shape;
		this._dockedShapeBounds = undefined;
		var referencePoint = undefined;
		
		// If there is an Shape, register the updateCallback if there are changes in the shape bounds
		if(this._dockedShape) {
			
			// Add the Shapes to the incoming and outgoing array
			// If this Docker the incoming of the Shape
			if(this === this.parent.dockers[0]) {
				
				this.parent.incoming.push(shape);
				shape.outgoing.push(this.parent);
			
			// If this Docker the outgoing of the Shape	
			} else if (this === this.parent.dockers.last()){
	
				this.parent.outgoing.push(shape);
				shape.incoming.push(this.parent);
							
			}
			
			// Get the bounds and set the new referencepoint
			var bounds = this.bounds;
			var absUL = shape.absoluteXY();
			
			referencePoint = {
				x: bounds.center().x - absUL.x,
				y: bounds.center().y - absUL.y
			};
						
			this._dockedShapeBounds = this._dockedShape.bounds.clone();
			
			this._dockedShape.bounds.registerCallback(this._updateCallback);
			
			// Set the color of the docker as docked
			this.setDockerColor(ORCHESTRATOR.CONFIG.DOCKER_DOCKED_COLOR);				
		} else {
			// Set the color of the docker as undocked
			this.setDockerColor(ORCHESTRATOR.CONFIG.DOCKER_UNDOCKED_COLOR);
		}

		// Set the referencepoint
		this.setReferencePoint(referencePoint);
		this._changed();
		//this.update();
	},
	
	/**
	 * Get the docked Shape
	 */
	getDockedShape: function() {
		return this._dockedShape;
	},

	/**
	 * Returns TRUE if the docker has a docked shape
	 */
	isDocked: function() {
		return !!this._dockedShape;
	},
		
	/**
	 * Set the Color of the Docker
	 * @param {Object} color
	 */
	setDockerColor: function(color) {
		this._dockerNode.attr("fill", color);
	},
	
	preventHiding: function(prevent){
		this._preventHiding = Math.max(0, (this._preventHiding||0) + (prevent ? 1 : -1));
	},
	
	toString: function() { return "Docker " + this.id; }
};
ORYX.Core.Controls.Docker = ORYX.Core.Controls.Control.extend(ORYX.Core.Controls.Docker);
