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

/**
 * @classDescription This class wraps the manipulation of a SVG basic shape or a path.
 * uses Inheritance (Clazz)
 * uses PathParser by Kevin Lindsey (http://kevlindev.com/)
 * uses MinMaxPathHandler
 * uses EditPathHandler
 *
 */

//init package
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.SVG) {ORYX.Core.SVG = {};}

ORYX.Core.SVG.SVGShape = {

	/**
	 * Constructor
	 * @param svgElem {SVGElement} An SVGElement that is a basic shape or a path.
	 */
	construct: function(svgElem) {
		arguments.callee.$.construct.apply(this, arguments);

		this.element = svgElem;
		this.x = undefined;
		this.y = undefined;
		this.width = undefined;
		this.height = undefined;
		this.oldX = undefined;
		this.oldY = undefined;
		this.oldWidth = undefined;
		this.oldHeight = undefined;
		this.radiusX = undefined;
		this.radiusY = undefined;
		this.isHorizontallyResizable = false;
		this.isVerticallyResizable = false;
		//this.anchors = [];
		this.anchorLeft = false;
		this.anchorRight = false;
		this.anchorTop = false;
		this.anchorBottom = false;
		
		this.init(); //initialisation of all the properties declared above.
	},

	/**
	 * Initializes the values that are defined in the constructor.
	 */
	init: function() {
		/**initialize position and size*/
		switch (this.element.type) {
		case 'rect':
		case 'image':
			this.oldX = this.element.attr("x");
			this.oldY = this.element.attr("y");
			this.oldWidth = this.element.attr("width");
			this.oldHeight = this.element.attr("height");
			break;
		case 'circle':
			var cx = this.element.attr("cx");
			var cy = this.element.attr("cy");
			this.radiusX = this.element.attr("r");

			this.oldX = cx - this.radiusX;
			this.oldY = cy - this.radiusX;
			this.oldWidth = 2 * this.radiusX;
			this.oldHeight = 2 * this.radiusX;
			break;
		case 'ellipse':
			var cx = this.element.attr("cx");
			var cy = this.element.attr("cy");
			this.radiusX = this.element.attr("rx");
			this.radiusY = this.element.attr("ry");

			this.oldX = cx - this.radiusX;
			this.oldY = cy - this.radiusY;
			this.oldWidth = 2 * this.radiusX;
			this.oldHeight = 2 * this.radiusY;
			break;
		case 'line':
			var x1 = this.element.data("x1");
			var y1 = this.element.data("y1");
			var x2 = this.element.data("x2");
			var y2 = this.element.data("y2");
			this.oldX = Math.min(x1,x2);
			this.oldY = Math.min(y1,y2);
			this.oldWidth = Math.abs(x1-x2);
			this.oldHeight = Math.abs(y1-y2);
			break;
		case 'polygone':
			var pointsArray = this.element.data("points");
			if(pointsArray && pointsArray.length && pointsArray.length > 1) {
				var minX = pointsArray[0];
				var minY = pointsArray[1];
				var maxX = pointsArray[0];
				var maxY = pointsArray[1];

				for(var i = 0; i < pointsArray.length; i++) {
					minX = Math.min(minX, pointsArray[i]);
					maxX = Math.max(maxX, pointsArray[i]);
					i++;
					minY = Math.min(minY, pointsArray[i]);
					maxY = Math.max(maxY, pointsArray[i]);
				}

				this.oldX = minX;
				this.oldY = minY;
				this.oldWidth = maxX-minX;
				this.oldHeight = maxY-minY;
			} else {
				throw "Missing attribute in element " + this.element;
			}
			break;
		case 'path':
			this.editPathParser = new PathParser();
			this.editPathHandler = new ORYX.Core.SVG.EditPathHandler();
			this.editPathParser.setHandler(this.editPathHandler);
			
			var parser = new PathParser();
			var handler = new ORYX.Core.SVG.MinMaxPathHandler();
			parser.setHandler(handler);
			parser.parseData(this.element.attr('path').toString());

			this.oldX = handler.minX;
			this.oldY = handler.minY;
			this.oldWidth = handler.maxX - handler.minX;
			this.oldHeight = handler.maxY - handler.minY;

			delete parser;
			delete handler;
			break;
		default:
			throw "Element is not a shape.";
		}

		//resize
		var resizeAttr = this.element.data("resize");
		if(resizeAttr) {
			resizeAttr = resizeAttr.toLowerCase();
			if(resizeAttr.match(/horizontal/)) {
				this.isHorizontallyResizable = true;
			} else {
				this.isHorizontallyResizable = false;
			}
			if(resizeAttr.match(/vertical/)) {
				this.isVerticallyResizable = true;
			} else {
				this.isVerticallyResizable = false;
			}
		} else {
			this.isHorizontallyResizable = false;
			this.isVerticallyResizable = false;
		}

		//anchors
		var anchorAttr = this.element.data("anchors");
		if(anchorAttr) {
			anchorAttr = anchorAttr.replace("/,/g", " ");
			var anchors = anchorAttr.split(" ").without("");
			
			for(var i = 0; i < anchors.length; i++) {
				switch(anchors[i].toLowerCase()) {
					case "left":
						this.anchorLeft = true;
						break;
					case "right":
						this.anchorRight = true;
						break;
					case "top":
						this.anchorTop = true;
						break;
					case "bottom":
						this.anchorBottom = true;
						break;
				}
			}
		}
		
		// bound
		this.bound = this.element.data("bound")?this.element.data("bound"):false;
		
		this.x = this.oldX;
		this.y = this.oldY;
		this.width = this.oldWidth;
		this.height = this.oldHeight;
	},

	/**
	 * Writes the changed values into the SVG element.
	 */
	refresh: function(options) {
		
		if(this.x !== this.oldX || this.y !== this.oldY || this.width !== this.oldWidth || this.height !== this.oldHeight) {
			switch(this.element.type) {
				case "rect":
					if(this.x !== this.oldX) this.element.attr({x:this.x});
					if(this.y !== this.oldY) this.element.attr({y:this.y});
				 	if(this.width !== this.oldWidth) this.element.attr({width:this.width});
					if(this.height !== this.oldHeight) this.element.attr({height:this.height});
					break;
				case "circle":
				 	this.radiusX = ((this.width < this.height) ? this.width : this.height)/2.0;
					this.element.attr({cx:(this.x + this.width/2.0), cy:(this.y + this.height/2.0), r:this.radiusX});
					break;
				case "ellipse":
					this.radiusX = this.width/2;
					this.radiusY = this.height/2;
					this.element.attr({cx:(this.x + this.radiusX), cy:(this.y + this.radiusY), rx:this.radiusX,ry:this.radiusY});
					break;
				case "line":
					if(this.x !== this.oldX)
						this.element.data("x1", this.x);
						
					if(this.y !== this.oldY)
						this.element.data("y1", this.y);
						
					if(this.x !== this.oldX || this.width !== this.oldWidth)
						this.element.data("x2", this.x + this.width);
					
					if(this.y !== this.oldY || this.height !== this.oldHeight)
						this.element.data("y2", this.y + this.height);
					break;
				case "polygone":
					var points = this.element.data("points");
					if (points) {
						// TODO what if oldWidth == 0?
						var widthDelta = (this.oldWidth === 0) ? 0 : this.width / this.oldWidth;
						var heightDelta = (this.oldHeight === 0) ? 0 : this.height / this.oldHeight;
		
						var updatedPoints = null;
						for ( var i = 0; i < points.length; i++) {
							var x = (points[i] - this.oldX) * widthDelta + this.x;
							updatedPoints.push(x);
							i++;
							var y = (points[i] - this.oldY) * heightDelta + this.y;
							updatedPoints.push(y);
						}
						this.element.data("points", updatedPoints);
					}
					break;
				case "path":
					//calculate scaling delta
					//TODO what if oldWidth == 0?
					var widthDelta = (this.oldWidth === 0) ? 0 : this.width / this.oldWidth;
					var heightDelta = (this.oldHeight === 0) ? 0 : this.height / this.oldHeight;

					//use path parser to edit each point of the path
					this.editPathHandler.init(this.x, this.y, this.oldX, this.oldY, widthDelta, heightDelta);
					this.editPathParser.parseData(this.element.attr('path').toString());

					//change d attribute of path
					this.element.attr("path", this.editPathHandler.d);
					break;
			}

			this.oldX = this.x;
			this.oldY = this.y;
			this.oldWidth = this.width;
			this.oldHeight = this.height;
		}
		
		if(options && this.bound) {
			options.color && this.element.attr({stroke:options.color});
			options.width && this.element.attr('stroke-width', options.width);
		}
	},
	
	isPointIncluded: function(pointX, pointY) {
		// Check if there are the right arguments and if the node is boundary
		if(!pointX || !pointY || !this.bound) {
			return false;
		}

		switch (this.element.type) {
		case "rect":
			return (pointX >= this.x && pointX <= this.x + this.width && pointY >= this.y && pointY <= this.y + this.height);
			break;
		case "circle":
			return ORYX.Core.Math.isPointInEllipse(pointX, pointY, this.x + this.width / 2.0, this.y + this.height / 2.0, this.radiusX, this.radiusX);
			break;
		case "ellipse":
			return ORYX.Core.Math.isPointInEllipse(pointX, pointY, this.x + this.radiusX, this.y + this.radiusY, this.radiusX, this.radiusY);
			break;
		case "line":
			return ORYX.Core.Math.isPointInLine(pointX, pointY, this.x, this.y, this.x + this.width, this.y + this.height);
			break;
		case "polygone":
			var points = this.element.data("points");
			return points?ORYX.Core.Math.isPointInPolygone(pointX, pointY, points):false;
			break;
		case "path":
			// Cache Path handler
			if (!this.handler) {
				var parser = new PathParser();
				this.handler = new ORYX.Core.SVG.PointsPathHandler();
				parser.setHandler(this.handler);
				parser.parseData(this.element.attr('path').toString());
			}
			return ORYX.Core.Math.isPointInPolygone(pointX, pointY, this.handler.points);
			break;
		default:
			return false;
		}
	},

	toString: function() { return (this.element) ? "SVGShape " + this.element.id : "SVGShape " + this.element;}
};
ORYX.Core.SVG.SVGShape = Clazz.extend(ORYX.Core.SVG.SVGShape);
