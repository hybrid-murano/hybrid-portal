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

ORYX.Plugins.SelectionFrame = {
	construct: function(facade) {
		arguments.callee.$.construct.apply(this, arguments);
		this.facade = facade;

		// Some initiale variables
		this.start 		= {x:0, y:0};
		this.stop		= {x:0, y:0};
		this.dragging	= false;
		this.callbackMouseMove = this.handleMouseMove.bind(this);
		this.callbackMouseUp = this.handleMouseUp.bind(this);
		
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN, this.handleMouseDown.bind(this));
	},
	
	redraw: function(paper) {
		this.raphael = paper.rect(0, 0, 0, 0).attr({stroke:'#777777', fill:'none', 'stroke-dasharray':'- '});
		this.eventHandlerCallback = this.facade.getEventHandler();
		this.addEventHandlers(this.raphael.node);
		this.hide();
	},

	handleMouseDown: function(event, uiObj) {
		// If there is the Canvas
		if(( uiObj instanceof ORYX.Core.Canvas ) ||(event.shiftKey)) {
			// Calculate the Offset
			this.start = this.facade.eventCoordinates(event);
			this.stop = this.start;
			this.resize();
			this.show();
			
			// Register Mouse-Move Event
			this.dragging = true;
			this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
			this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
		}
	},

	handleMouseUp: function(event) {
		this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
		this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);

		// If there was an MouseMoving
		if(this.dragging) {
			// Hide the Frame
			this.hide();

			var tmp;
			if(this.stop.x < this.start.x) {
				tmp = this.start.x;
				this.start.x = this.stop.x;
				this.stop.x = tmp;
			}			
			if(this.stop.y < this.start.y) {
				tmp = this.start.y;
				this.start.y = this.stop.y;
				this.stop.y = tmp;
			}
			
			// Calculate the elements from the childs of the canvas
			var elements = this.facade.getCanvas().getChildShapes(true).findAll((function(value) {
				var absBounds = value.absoluteBounds();
				var bA = absBounds.upperLeft();
				var bB = absBounds.lowerRight();
				if(bA.x >= this.start.x && bA.y >= this.start.y && bB.x <= this.stop.x && bB.y <= this.stop.y)
					return true;
				return false;
			}).bind(this));

			// Set the selection
			this.facade.setSelection(elements);
		}
		this.dragging = false;
	},

	handleMouseMove: function(event) {
		if(!this.dragging) { return; }
		
		if(!ORYX.isLeftClick(event)) {
			return this.handleMouseUp(event);
		}

		this.stop = this.facade.eventCoordinates(event);

		// Set the size
		this.resize();
	},

	resize: function() {
		width = this.stop.x - this.start.x;
		height = this.stop.y - this.start.y;
		if(width < 0) {
			x = this.stop.x;
			width = - width;
		} else {
			x = this.start.x;
		}
		if(height < 0) {
			y = this.stop.y;
			height = -height;
		} else {
			y = this.start.y;
		}

		this.raphael.transform('t' + x + ',' + y).attr({width:width, height:height});
	},

	toString: function() { return "SelectionFrame " + this.id; },

	hide: function() {
		this.raphael.node.style.display = "none";
	},

	show: function() {
		this.raphael.node.style.display = "";
		this.raphael.toFront();
	}
};
ORYX.Plugins.SelectionFrame = ORYX.Core.UIObject.extend(ORYX.Plugins.SelectionFrame);
