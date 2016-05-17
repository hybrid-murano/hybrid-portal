if(!ORYX) {var ORYX = {};}
if(!ORYX.Plugins) {ORYX.Plugins = {};}

/**
 * This plugin is responsible for resizing the canvas.
 * @param {Object} facade The editor plugin facade to register enhancements with.
 */
ORYX.Plugins.CanvasResize = {

    construct: function(facade){
		this.facade = facade;
		var delta = ORCHESTRATOR.CONFIG.ICON_SIZE/2;
		this.north_g = new ORYX.Core.Controls.Button({
			name: "arrowup",
			click: this.resize.bind(this, 'N', ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL),
			facade: this.facade,
			pos: {x:-delta, y:0, dirX:true}
		});
		this.north_s = new ORYX.Core.Controls.Button({
			name: "arrowdown",
			click: this.resize.bind(this, 'N', -ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL),
			facade: this.facade,
			pos: {x:delta, y:0, dirX:true}
		});
		this.south_g = new ORYX.Core.Controls.Button({
			name: "arrowdown",
			click: this.resize.bind(this, 'S', ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL),
			facade: this.facade,
			pos: {x:-delta, y:-2*delta, dirX:true}
		});
		this.south_s = new ORYX.Core.Controls.Button({
			name: "arrowup",
			click: this.resize.bind(this, 'S', -ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL),
			facade: this.facade,
			pos: {x:delta, y:-2*delta, dirX:true}
		});
		this.west_g = new ORYX.Core.Controls.Button({
			name: "arrowleft",
			click: this.resize.bind(this, 'W', ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL),
			facade: this.facade,
			pos: {x:0, y:-delta, dirY:true}
		});
		this.west_s = new ORYX.Core.Controls.Button({
			name: "arrowright",
			click: this.resize.bind(this, 'W', -ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL),
			facade: this.facade,
			pos: {x:0, y:delta, dirY:true}
		});
		this.east_g = new ORYX.Core.Controls.Button({
			name: "arrowright",
			click: this.resize.bind(this, 'E', ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL),
			facade: this.facade,
			pos: {x:-2*delta, y:-delta, dirY:true}
		});
		this.east_s = new ORYX.Core.Controls.Button({
			name: "arrowleft",
			click: this.resize.bind(this, 'E', -ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL),
			facade: this.facade,
			pos: {x:-2*delta, y:delta, dirY:true}
		});

		this.callbackMouseMove = this.handleMouseMove.bind(this);
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
    },
    
	enableReadOnlyMode: function(){
		this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
		this.hide();
	},
	
	disableReadOnlyMode: function(){
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
	},
	
    hide: function() {
    	if(this.canvas) {
			this.west_g.hide();
			this.west_s.hide();
			this.north_g.hide();
			this.north_s.hide();
			this.east_g.hide();
			this.east_s.hide();
			this.south_g.hide();
			this.south_s.hide();
    	}
    },
    
    redraw: function(paper) {
    	this.canvas = this.facade.getCanvas();
		this.root = this.facade.getRootNode();
		this.north_g.redraw(paper);
		this.north_s.redraw(paper);
		this.south_g.redraw(paper);
		this.south_s.redraw(paper);
		this.west_g.redraw(paper);
		this.west_s.redraw(paper);
		this.east_g.redraw(paper);
		this.east_s.redraw(paper);
    },
    
    resize: function(direction, size) {
    	var b = this.canvas.bounds;
    	switch(direction) {
    	case 'N':
        	this.canvas.moveBy(0, size);
    		this.canvas.setSize({width: (b.width()), height: (b.height() + size)}, (function(){
    			this.showNorth();
    		}).bind(this));
    		this.facade.updateSelection();
    		break;
    	case 'S':
			var last = this.root.scrollTop;
    		this.canvas.setSize({width: (b.width()), height: (b.height() + size)}, (function(){
    			this.root.scrollTop = last + size;
        		this.showSouth();
    		}).bind(this));
    		break;
    	case 'W':
        	this.canvas.moveBy(size, 0);
    		this.canvas.setSize({width: (b.width() + size), height: (b.height())}, (function(){
    			this.showWest();
    		}).bind(this));
    		this.facade.updateSelection();
    		break;
		default: // case 'E':
			var last = this.root.scrollLeft;
			this.canvas.setSize({width: (b.width() + size), height: (b.height())}, (function(){
				this.root.scrollLeft = last + size;
				this.showEast();
			}).bind(this));
    		break;
    	}
    },
    
    showNorth: function() {
		this.north_g.show();
		if(this.canvas.bbox.upperLeft().y > ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL) {
			this.north_s.show();
		} else {
			this.north_s.hide();
		}
    },
    
    showSouth: function() {
		this.south_g.show();
		if((this.root.clientWidth != this.root.offsetWidth)
    			&& (this.canvas.paper.height - this.canvas.bbox.lowerRight().y > ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL)) {
			this.south_s.show();
		} else {
			this.south_s.hide();
		}
    },
    
    showWest: function() {
		this.west_g.show();
		if(this.canvas.bbox.upperLeft().x > ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL) {
			this.west_s.show();
		} else {
			this.west_s.hide();
		}
    },
    
    showEast: function() {
		this.east_g.show();
		if((this.root.clientHeight != this.root.offsetHeight)
				&& (this.canvas.paper.width - this.canvas.bbox.lowerRight().x > ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL)) {
			this.east_s.show();
		} else {
			this.east_s.hide();
		}
    },
    
    handleMouseMove: function(event, uiObj) {
    	posX = event.offsetX;
    	posY = event.offsetY;
		this.hide();
    	if(posX < ORCHESTRATOR.CONFIG.RESIZE_BORDER) {
    		this.showWest();
    	} else if(posY < ORCHESTRATOR.CONFIG.RESIZE_BORDER) {
    		this.showNorth();
    	} else {
    		var cwidth = this.canvas.paper.width;
    		var cheight = this.canvas.paper.height;
    		var dimensions = Element.getDimensions(this.root);
			if (cwidth - posX < ORCHESTRATOR.CONFIG.RESIZE_BORDER) {
				if(cwidth < dimensions.width) {
					this.canvas.setSize({width:dimensions.width, height:dimensions.height - 5});
				}
				this.showEast();
			}
			if (cheight - posY < ORCHESTRATOR.CONFIG.RESIZE_BORDER) {
				if(cheight + ORCHESTRATOR.CONFIG.SCROLLBAR_WIDTH < dimensions.height) {
					this.canvas.setSize({width:dimensions.width, height:dimensions.height});
				}
				this.showSouth();
			}
    	}
    }
};
ORYX.Plugins.CanvasResize = Clazz.extend(ORYX.Plugins.CanvasResize);
