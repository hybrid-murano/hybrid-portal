/**
 * Copyright (c) 2009
 * Willi Tscheschner
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

if(!ORYX){ var ORYX = {}; }
if(!ORYX.Plugins){ ORYX.Plugins = {}; }

/**
   This abstract plugin class can be used to build plugins on.
   It provides some more basic functionality like registering events (on*-handlers)...
   @example
    ORYX.Plugins.MyPlugin = ORYX.Plugins.AbstractPlugin.extend({
        construct: function() {
            // Call super class constructor
            arguments.callee.$.construct.apply(this, arguments);
            
            [...]
        },
        [...]
    });
   
   @class ORYX.Plugins.AbstractPlugin
   @constructor Creates a new instance
   @author Willi Tscheschner
*/
ORYX.Plugins.AbstractPlugin = {
	construct: function( facade ){
		this.facade = facade;
	},

    /**
     * Opens a download window for downloading the given content.
     * @methodOf ORYX.Plugins.AbstractPlugin.prototype
     * @param {String} filename The content's file name
     * @param {String} content The content to download
     */
	openDownloadWindow: function(filename, content) {
		var win = window.open("");
		if (win != null) {
			win.document.open();
			win.document.write("<html><body>");
			var submitForm = win.document.createElement("form");
			win.document.body.appendChild(submitForm);
			
			var createHiddenElement = function(name, value) {
				var newElement = document.createElement("input");
				newElement.name=name;
				newElement.type="hidden";
				newElement.value = value;
				return newElement;
			};
			
			submitForm.appendChild( createHiddenElement("download", content) );
			submitForm.appendChild( createHiddenElement("file", filename) );
			
			
			submitForm.method = "POST";
			win.document.write("</body></html>");
			win.document.close();
			submitForm.action= ORYX.PATH + "/download";
			submitForm.submit();
		}		
	},
    
    /**
     * Sets the editor in read only mode: Edges/ dockers cannot be moved anymore,
     * shapes cannot be selected anymore.
     * @methodOf ORYX.Plugins.AbstractPlugin.prototype
     */
    enableReadOnlyMode: function(){
        //Edges cannot be moved anymore
        this.facade.disableEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN);
        this.facade.disableEvent(ORCHESTRATOR.EVENTS.KEYDOWN);
    },

    /**
     * Disables read only mode, see @see
     * @methodOf ORYX.Plugins.AbstractPlugin.prototype
     * @see ORYX.Plugins.AbstractPlugin.prototype.enableReadOnlyMode
     */
    disableReadOnlyMode: function(){
        // Edges can be moved now again
        this.facade.enableEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN);
        this.facade.enableEvent(ORCHESTRATOR.EVENTS.KEYDOWN);
    },
    
	/**
	 * Raises an event so that registered layouters does
	 * have the posiblility to layout the given shapes 
	 * For further reading, have a look into the AbstractLayouter
	 * class
	 * @param {Object} shapes
	 */
	doLayout: function(shapes){
		// Raises a do layout event
		this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.LAYOUT, shapes:shapes});
	},
	
	
	/**
	 * Does a primitive layouting with the incoming/outgoing 
	 * edges (set the dockers to the right position) and if 
	 * necessary, it will be called the real layouting 
	 * @param {ORYX.Core.Node} node
	 * @param {Array} edges
	 */
	layoutEdges : function(node, allEdges, offset){		

		if (!this.facade.isExecutingCommands()){ return; }		

		var Command = ORYX.Core.Command.extend({
			construct: function(edges, node, offset, plugin){
				this.edges = edges;
				this.node = node;
				this.plugin = plugin;
				this.offset = offset;
				
				// Get the new absolute center
				var center = node.absoluteXY();
				this.ulo = {x: center.x - offset.x, y:center.y - offset.y};
				
				
			},
			execute: function(){
				
				if (this.changes){
					this.executeAgain();
					return;
				} else {
					this.changes = [];
					this.edges.each(function(edge){
						this.changes.push({
							edge: edge,
							oldDockerPositions: edge.dockers.map(function(r){ return r.bounds.center(); })
						});
					}.bind(this));
				}
				
				// Find all edges, which are related to the node and
				// have more than two dockers
				this.edges
					// Find all edges with more than two dockers
					.findAll(function(r){ return r.dockers.length > 2; }.bind(this))
					// For every edge, check second and one before last docker
					// if there are horizontal/vertical on the same level
					// and if so, align the the bounds 
					.each(function(edge){
						if (edge.dockers[0].getDockedShape() === this.node){
							var second = edge.dockers[1];
							if (this.align(second.bounds, edge.dockers[0])){ second.update(); }
						} else if (edge.dockers.last().getDockedShape() === this.node) {
							var beforeLast = edge.dockers[edge.dockers.length-2];
							if (this.align(beforeLast.bounds, edge.dockers.last())){ beforeLast.update(); }									
						}
						edge._update(true);
						edge.removeUnusedDockers();
						if (this.isBendPointIncluded(edge)){
							this.plugin.doLayout(edge);
							return;
						}
					}.bind(this));
				
				
				// Find all edges, which have only to dockers 
				// and is located horizontal/vertical.
				// Do layout with those edges
				this.edges
					// Find all edges with exactly two dockers
					.each(function(edge){
						if (edge.dockers.length == 2){
							var p1 = edge.dockers[0].getAbsoluteReferencePoint() || edge.dockers[0].bounds.center();
							var p2 = edge.dockers.last().getAbsoluteReferencePoint() || edge.dockers[0].bounds.center();
							// Find all horizontal/vertical edges
							if (Math.abs(-Math.abs(p1.x - p2.x) + Math.abs(this.offset.x)) < 2 || Math.abs(-Math.abs(p1.y - p2.y) + Math.abs(this.offset.y)) < 2){
								this.plugin.doLayout(edge);
							}
						}
					}.bind(this));
		
				this.edges.each(function(edge, i){
					this.changes[i].dockerPositions = edge.dockers.map(function(r){ return r.bounds.center(); });
				}.bind(this));
				
			},
			/**
			 * Align the bounds if the center is 
			 * the same than the old center
			 * @params {Object} bounds
			 * @params {Object} bounds2
			 */
			align: function(bounds, refDocker){
				
				var abRef = refDocker.getAbsoluteReferencePoint() || refDocker.bounds.center();
				
				var xdif = bounds.center().x-abRef.x;
				var ydif = bounds.center().y-abRef.y;
				if (Math.abs(-Math.abs(xdif) + Math.abs(this.offset.x)) < 3 && this.offset.xs === undefined){
					bounds.moveBy({x:-xdif, y:0});
				}
				if (Math.abs(-Math.abs(ydif) + Math.abs(this.offset.y)) < 3 && this.offset.ys === undefined){
					bounds.moveBy({y:-ydif, x:0});
				}
				
				if (this.offset.xs !== undefined || this.offset.ys !== undefined){
					var absPXY = refDocker.getDockedShape().absoluteXY();
					xdif = bounds.center().x-(absPXY.x+((abRef.x-absPXY.x)/this.offset.xs));
					ydif = bounds.center().y-(absPXY.y+((abRef.y-absPXY.y)/this.offset.ys));
					
					if (Math.abs(-Math.abs(xdif) + Math.abs(this.offset.x)) < 3){
						bounds.moveBy({x:-(bounds.center().x-abRef.x), y:0});
					}
					
					if (Math.abs(-Math.abs(ydif) + Math.abs(this.offset.y)) < 3){
						bounds.moveBy({y:-(bounds.center().y-abRef.y), x:0});
					}
				}
			},
			
			/**						
			 * Returns a TRUE if there are bend point which overlay the shape
			 */
			isBendPointIncluded: function(edge){
				// Get absolute bounds
				var ab = edge.dockers[0].getDockedShape();
				var bb = edge.dockers.last().getDockedShape();
				
				if (ab) {
					ab = ab.absoluteBounds();
					ab.widen(5);
				}
				
				if (bb) {
					bb = bb.absoluteBounds();
					bb.widen(20); // Wide with 20 because of the arrow from the edge
				}
				
				return edge.dockers
						.any(function(docker, i){ 
							var c = docker.bounds.center();
									// Dont count first and last
							return 	i != 0 && i != edge.dockers.length-1 && 
									// Check if the point is included to the absolute bounds
									((ab && ab.isIncluded(c)) || (bb && bb.isIncluded(c)));
						});
			},
			
			removeAllDocker: function(edge){
				edge.dockers.slice(1, edge.dockers.length-1).each(function(docker){
					edge.removeDocker(docker);
				});
			},
			executeAgain: function(){
				this.changes.each(function(change){
					// Reset the dockers
					this.removeAllDocker(change.edge);
					change.dockerPositions.each(function(pos, i){	
						if (i==0||i==change.dockerPositions.length-1){ return; }					
						var docker = change.edge.createDocker(undefined, pos);
						docker.bounds.centerMoveTo(pos);
						docker.update();
					}.bind(this));
					change.edge._update(true);
				}.bind(this));
			},
			rollback: function(){					
				this.changes.each(function(change){
					// Reset the dockers
					this.removeAllDocker(change.edge);
					change.oldDockerPositions.each(function(pos, i){	
						if (i==0||i==change.oldDockerPositions.length-1){ return; }					
						var docker = change.edge.createDocker(undefined, pos);
						docker.bounds.centerMoveTo(pos);
						docker.update();
					}.bind(this));
					change.edge._update(true);
				}.bind(this));
			}
		});
		
		this.facade.executeCommands([new Command(allEdges, node, offset, this)]);

	}
};
ORYX.Plugins.AbstractPlugin = Clazz.extend(ORYX.Plugins.AbstractPlugin);
