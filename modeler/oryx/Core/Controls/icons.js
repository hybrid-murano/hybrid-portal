if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.Controls) {ORYX.Core.Controls = {};}

ORYX.Core.Controls.Icon = {
	construct: function(options) {
		arguments.callee.$.construct.apply(this, arguments);
		this.name = options.name;
		this.click = options.click;
		this.bounds.set(-32, -32, 0, 0);
	},
	
	redraw: function(paper) {
		this.icon = paper.path(ORCHESTRATOR.icon[this.name]).attr({fill: "#333", stroke: "none", opacity:0.5}).transform('T-32,-32');
		this.snap = paper.rect(0, 0, 32, 32).attr({fill: "#000", opacity: 0}).transform('T-32,-32');
		this.raphael = paper.set().push(this.icon);
		if(this.click) {
			this.icon.click(this.click);
			this.snap.click(this.click);
		}
		this.icon.hover(this.hoverIn.bind(this), this.hoverOut.bind(this));
		this.snap.hover(this.hoverIn.bind(this), this.hoverOut.bind(this));
		this.hide();
	},
	
	hoverIn: function() {
		this.icon.attr({opacity:1});
	},
	
	hoverOut: function() {
		this.icon.attr({opacity:0.5});
	},
	
	hide: function() {
		arguments.callee.$.hide.apply(this, arguments);
		this.icon.unclick(this.click);
		this.snap.unclick(this.click);
	},
	
	show: function() {
		if(!this.isVisible) {
			arguments.callee.$.show.apply(this, arguments);
			this.icon.click(this.click);
			this.snap.click(this.click);
		}
	},
	
	update: function() {
		arguments.callee.$.update.apply(this, arguments);
	},
	
	_update: function() {
		arguments.callee.$.update.apply(this, arguments);
	},
	
	refresh: function() {
		arguments.callee.$.refresh.apply(this, arguments);
		var p = this.absoluteBounds().upperLeft();
		this.icon.transform('t' + p.x + ', ' + p.y).toFront();
		this.snap.transform('t' + p.x + ', ' + p.y).toFront();
	},
	
	toString: function() {
		return "Icon " + this.id;
	}
};
ORYX.Core.Controls.Icon = ORYX.Core.Controls.Control.extend(ORYX.Core.Controls.Icon);

ORYX.Core.Controls.Button = {
	construct: function(options) {
		this.facade = options.facade;
		options.eventHandlerCallback = options.eventHandlerCallback || this.facade.getEventHandler();
		arguments.callee.$.construct.apply(this, arguments);
		this.pos = options.pos;
	},
	
	redraw: function(paper) {
		this.root = this.facade.getRootNode();
		arguments.callee.$.redraw.apply(this, arguments);
	},
	
	show: function() {
		var x, y;
    	var offset = Element.cumulativeOffset(this.root);
		var upperLeft = this.facade.eventCoordinates({clientX:offset.left, clientY:offset.top});
		var lowerRight = {x:upperLeft.x+this.root.clientWidth, y:upperLeft.y+this.root.clientHeight};
		var center = {x:(upperLeft.x+lowerRight.x)/2, y:(upperLeft.y+lowerRight.y)/2};
		if(this.pos.dirX) {
			x = center.x + this.pos.x;
			if(this.pos.y < 0) {
				y = lowerRight.y + this.pos.y;
			} else {
				y = upperLeft.y;
			}
		} else if(this.pos.dirY){
			y = center.y + this.pos.y;
			if(this.pos.x < 0) {
				x = lowerRight.x + this.pos.x;
			} else {
				x = upperLeft.x;
			}
		} else {
			if(this.pos.x < 0) {
				x = lowerRight.x + this.pos.x;
			} else {
				x = upperLeft.x;
			}
			if(this.pos.y < 0) {
				y = lowerRight.y + this.pos.y;
			} else {
				y = upperLeft.y;
			}
		}
		this.bounds.moveTo(x, y);
		this.refresh();
		arguments.callee.$.show.apply(this, arguments);
	},
	
	hide: function() {
		arguments.callee.$.hide.apply(this, arguments);
	}
};
ORYX.Core.Controls.Button = ORYX.Core.Controls.Icon.extend(ORYX.Core.Controls.Button);
