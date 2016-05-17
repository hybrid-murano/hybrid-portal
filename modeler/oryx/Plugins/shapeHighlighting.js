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

ORYX.Plugins.ShapeHighlighting = {
	construct: function(facade) {
		arguments.callee.$.construct.apply(this, arguments);
		this.eventHandlerCallback = facade.getEventHandler();
		this.highlightNodes = {};
		facade.registerOnEvent(ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, this.setHighlight.bind(this));
		facade.registerOnEvent(ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, this.hideHighlight.bind(this));
	},
	
	redraw: function(paper) {
		this.paper = paper;
		this.highlightNodes = {};
	},

	setHighlight: function(options) {
		if(options && options.highlightId){
			var obj = this.highlightNodes[options.highlightId];
			if(!obj){
				obj = this.paper.path('').attr({"stroke-width":2});
				this.addEventHandlers(obj.node);
				this.highlightNodes[options.highlightId] = obj;
			}

			if(options.elements && options.elements.length > 0) {
				this.setAttributesByStyle( obj, options );
				this.show(obj);
			} else {
				this.hide(obj);
			}
		}
	},
	
	hideHighlight: function(options) {
		if(options && options.highlightId) {
			obj = this.highlightNodes[options.highlightId];
			if(obj) {
				this.hide(obj);
			}
		}
	},
	
	hide: function(obj) {
		obj.node.style.display = 'none';
	},

	show: function(obj) {
		obj.node.style.display = '';
		obj.toFront();
	},
	
	setAttributesByStyle: function( obj, options ){
		// If the style say, that it should look like a rectangle
		if( options.style && options.style == ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE ){
			// Set like this
			var bo = options.elements[0].absoluteBounds();
			var strWidth = options.strokewidth?options.strokewidth:ORCHESTRATOR.CONFIG.BORDER_OFFSET;
			obj.attr({path: this.getPathRectangle(bo.a,bo.b,strWidth),
					stroke: options.color?options.color:ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_COLOR,
					'stroke-opacity': options.opacity?options.opacity:0.2,
					"stroke-width": strWidth} );
		} else if(options.elements.length == 1 
					&& options.elements[0] instanceof ORYX.Core.Edge &&
					options.highlightId != "selection") {
			/* Highlight containment of edge's childs */
			obj.attr({path: this.getPathEdge(options.elements[0].dockers),
					stroke: options.color?options.color:ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_COLOR,
					'stroke-opacity': options.opacity?options.opacity:0.2,
					"stroke-width": ORCHESTRATOR.CONFIG.OFFSET_BOUNDS} );
		}else {
			// If not, set just the corners
			obj.attr({path: this.getPathByElements(options.elements),
					stroke: options.color?options.color:ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_COLOR,
					'stroke-opacity': options.opacity?options.opacity:1,
					"stroke-width": options.strokewidth?options.strokewidth:2.0} );
		}
	},
	
	getPathByElements: function(elements){
		if(!elements || elements.length <= 0) {return undefined;}
		
		// Get the padding and the size
		var padding = ORCHESTRATOR.CONFIG.SELECTED_AREA_PADDING;
		
		var path = "";
		
		// Get thru all Elements
		elements.each((function(element) {
			if(!element) {return;}
			// Get the absolute Bounds and the two Points
			var bounds = element.absoluteBounds();
			bounds.widen(padding);
			var a = bounds.upperLeft();
			var b = bounds.lowerRight();
			
			path = path + this.getPath(a ,b);

		}).bind(this));

		return path;
	},

	getPath: function(a, b){
		return this.getPathCorners(a, b);
	},
			
	getPathCorners: function(a, b){
		var size = ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_SIZE;
		var path = "";

		// Set: Upper left 
		path = path + "M" + a.x + " " + (a.y + size) + " l0 -" + size + " l" + size + " 0 ";
		// Set: Lower left
		path = path + "M" + a.x + " " + (b.y - size) + " l0 " + size + " l" + size + " 0 ";
		// Set: Lower right
		path = path + "M" + b.x + " " + (b.y - size) + " l0 " + size + " l-" + size + " 0 ";
		// Set: Upper right
		path = path + "M" + b.x + " " + (a.y + size) + " l0 -" + size + " l-" + size + " 0 ";
		
		return path;
	},
	
	getPathRectangle: function(a, b, strokeWidth){
		var size = ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_SIZE;
		var path 	= "";
		var offset 	= strokeWidth / 2.0;
		 
		// Set: Upper left 
		path = path + "M" + (a.x + offset) + " " + (a.y);
		path = path + " L" + (a.x + offset) + " " + (b.y - offset);
		path = path + " L" + (b.x - offset) + " " + (b.y - offset);
		path = path + " L" + (b.x - offset) + " " + (a.y + offset);
		path = path + " L" + (a.x + offset) + " " + (a.y + offset);

		return path;
	},
	toString: function() { return "highlight " + this.id; },

	getPathEdge: function(edgeDockers) {
		var length = edgeDockers.length;
		var path = "M" + edgeDockers[0].bounds.center().x + " " 
					+  edgeDockers[0].bounds.center().y;
		
		for(i=1; i<length; i++) {
			var dockerPoint = edgeDockers[i].bounds.center();
			path = path + " L" + dockerPoint.x + " " +  dockerPoint.y;
		}
		
		return path;
	}
	
};
ORYX.Plugins.ShapeHighlighting = ORYX.Core.UIObject.extend(ORYX.Plugins.ShapeHighlighting);

ORYX.Plugins.HighlightingSelectedShapes = {
	construct: function(facade) {
		this.facade = facade;
		this.opacityFull = 0.9;
		this.opacityLow = 0.4;
	},

	/**
	 * On the Selection-Changed
	 *
	 */
	onSelectionChanged: function(event) {
		if(event.elements && event.elements.length > 1) {
			this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, 
										highlightId:'selection',
										elements:	event.elements.without(event.subSelection),
										color:		ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_COLOR,
										opacity: 	!event.subSelection ? this.opacityFull : this.opacityLow
									});

			if(event.subSelection){
				this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, 
											highlightId:'subselection',
											elements:	[event.subSelection],
											color:		ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_COLOR,
											opacity: 	this.opacityFull
										});
			} else {
				this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:'subselection'});				
			}
		} else {
			this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:'selection'});
			this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:'subselection'});
		}		
	}
};
ORYX.Plugins.HighlightingSelectedShapes = Clazz.extend(ORYX.Plugins.HighlightingSelectedShapes);
