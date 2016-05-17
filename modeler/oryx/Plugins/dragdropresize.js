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

ORYX.Plugins.DragDropResize = {

	/**
	 *	Constructor
	 *	@param {Object} Facade: The Facade of the Editor
	 */
	construct: function(facade) {
		this.facade = facade;

		// Initialize variables
		this.currentShapes 		= [];			// Current selected Shapes
		//this.pluginsData 		= [];			// Available Plugins
		this.toMoveShapes 		= [];			// Shapes there will be moved
		this.distPoints 		= [];			// Distance Points for Snap on Grid
		this.isResizing 		= false;		// Flag: If there was currently resized
		this.dragEnable 		= false;		// Flag: If Dragging is enabled
		this.dragIntialized 	= false;		// Flag: If the Dragging is initialized
		this.edgesMovable		= true;			// Flag: If an edge is docked it is not movable
		this.isAddingAllowed 	= false;		// flag, if adding current selected shapes to containmentParentNode is allowed
		this.isAttachingAllowed = false;		// flag, if attaching to the current shape is allowed
		
		this.callbackMouseMove	= this.handleMouseMove.bind(this);
		this.callbackMouseUp	= this.handleMouseUp.bind(this);
		
		// Create the Selected Rectangle in the SVG
		this.selectedRect = new ORYX.Plugins.SelectedRect();
		
		// Show grid line if enabled
		if (ORCHESTRATOR.CONFIG.SHOW_GRIDLINE) {
			this.vLine = new ORYX.Plugins.GridLine({
				eventHandlerCallback : this.facade.getEventHandler()
			}, 'ver');
			this.hLine = new ORYX.Plugins.GridLine({
				eventHandlerCallback : this.facade.getEventHandler()
			}, 'hor');
		}
		
		// Create the southeastern button for resizing
		this.resizerSE = new ORYX.Plugins.Resizer({
			eventHandlerCallback : this.facade.getEventHandler(),
			orientation: "southeast",
			facade: this.facade
		});
		this.resizerSE.registerOnResize(this.onResize.bind(this)); // register the resize callback
		this.resizerSE.registerOnResizeEnd(this.onResizeEnd.bind(this)); // register the resize end callback
		this.resizerSE.registerOnResizeStart(this.onResizeStart.bind(this)); // register the resize start callback
		
		// Create the northwestern button for resizing
		this.resizerNW = new ORYX.Plugins.Resizer({
			eventHandlerCallback : this.facade.getEventHandler(),
			orientation: "northwest",
			facade: this.facade
		});
		this.resizerNW.registerOnResize(this.onResize.bind(this)); // register the resize callback
		this.resizerNW.registerOnResizeEnd(this.onResizeEnd.bind(this)); // register the resize end callback
		this.resizerNW.registerOnResizeStart(this.onResizeStart.bind(this)); // register the resize start callback
		
		// For the Drag and Drop
		// Register on MouseDown-Event on a Shape
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN, this.handleMouseDown.bind(this));
	},
	
	redraw: function(paper) {
		this.selectedRect.redraw(paper);
		this.resizerSE.redraw(paper);
		this.resizerNW.redraw(paper);
		if (ORCHESTRATOR.CONFIG.SHOW_GRIDLINE) {
			this.vLine.redraw(paper);
			this.hLine.redraw(paper);
		}
	},

	/**
	 * On Mouse Down
	 *
	 */
	handleMouseDown: function(event, uiObj) {
		if(event.shiftKey) { return; }
		
		// If the selection Bounds not intialized and the uiObj is not member of current selection then return
		if(!this.dragBounds || !this.currentShapes.member(uiObj) || !this.toMoveShapes.length) {return;};
		
		// Start Dragging
		this.dragEnable = true;
		this.dragIntialized = true;
		this.edgesMovable = true;
		
		var center = this.dragBounds.center();
		this.offset = this.facade.eventCoordinates( event );
		this.offset.x -= center.x;
		this.offset.y -= center.y;
		
		var cx = this.dragBounds.width()/2;
		var cy = this.dragBounds.height()/2;
		this.ul = this.facade.getCanvas().bounds.upperLeft();
		this.ul.x += cx;
		this.ul.y += cy;
		this.lr = this.facade.getCanvas().bounds.lowerRight();
		this.lr.x -= cx;
		this.lr.y -= cy;

		// Register on Global Mouse-MOVE Event
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
		// Register on Global Mouse-UP Event
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
	},

	/**
	 * On Key Mouse Up
	 *
	 */
	handleMouseUp: function(event) {
		// UnRegister on Global Mouse-UP/-Move Event
		this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
		this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
		
		//disable containment highlighting
		this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"dragdropresize.contain"});

		this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"dragdropresize.attached"});

		// If Dragging is finished
		if(this.dragEnable) {
		
			// and update the current selection
			if(!this.dragIntialized) {
				
				// Do Method after Dragging
				this.afterDrag();	
				
				// Check if the Shape is allowed to dock to the other Shape						
				if ( 	this.isAttachingAllowed &&
						this.toMoveShapes.length == 1 && this.toMoveShapes[0] instanceof ORYX.Core.Node  &&
						this.toMoveShapes[0].dockers.length > 0) {
					
					// Get the position and the docker
					var position 	= this.facade.eventCoordinates( event );
					position.x -= this.offset.x;
					position.y -= this.offset.y;
					if(ORCHESTRATOR.CONFIG.GRID_ENABLED) {
						// Snap the current position to the nearest Snap-Point
						position = this.snapToGrid(position);
					}

					var docker 		= this.toMoveShapes[0].dockers[0];

					//Command-Pattern for dragging several Shapes
					var dockCommand = ORYX.Core.Command.extend({
						construct: function(docker, position, newDockedShape, facade){
							this.docker 		= docker;
							this.newPosition	= position;
							this.newDockedShape = newDockedShape;
							this.newParent 		= newDockedShape.parent || facade.getCanvas();
							this.oldPosition	= docker.parent.bounds.center();
							this.oldDockedShape	= docker.getDockedShape();
							this.oldParent 		= docker.parent.parent || facade.getCanvas();
							this.facade			= facade;
							
							if( this.oldDockedShape ){
								this.oldPosition = docker.parent.absoluteBounds().center();
							}
							
						},			
						execute: function(){
							this.dock( this.newDockedShape, this.newParent,  this.newPosition );
							
							// Raise Event for having the docked shape on top of the other shape
							this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.ARRANGEMENT_TOP, excludeCommand: true});							
						},
						rollback: function(){
							this.dock( this.oldDockedShape, this.oldParent, this.oldPosition );
						},
						dock:function( toDockShape, parent, pos ){
							// Add to the same parent Shape
							parent.add( this.docker.parent );
							
							// Set the Docker to the new Shape
							this.docker.setDockedShape( undefined );
							this.docker.bounds.centerMoveTo( pos );
							this.docker.setDockedShape( toDockShape );	
							//this.docker.update();
							
							this.facade.setSelection( [this.docker.parent] );	
							this.facade.getCanvas().update();
							this.facade.updateSelection();
						}
					});
			
					// Instanziate the dockCommand
					var commands = [new dockCommand(docker, position, this.containmentParentNode, this.facade)];
					this.facade.executeCommands(commands);	
				// Check if adding is allowed to the other Shape	
				} else if( this.isAddingAllowed ) {
					// Refresh all Shapes --> Set the new Bounds
					this.refreshSelectedShapes();
				}
				
				//this.currentShapes.each(function(shape) {shape.update()})
				// Raise Event: Dragging is finished
				this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.DRAGDROP_END});
			}
			
			this.facade.updateSelection();
			
			if (this.vLine)
				this.vLine.hide();
			if (this.hLine)
				this.hLine.hide();
		}
		
		// Disable
		this.dragEnable = false;
	},

	/**
	* On Key Mouse Move
	*
	*/
	handleMouseMove: function(event) {
		// If dragging is not enabled, go return
		if(!this.dragEnable) { return; };
		
		if(!ORYX.isLeftClick(event)) {
			return this.handleMouseUp(event);
		}
		
		// If Dragging is initialized
		if(this.dragIntialized) {
			// Raise Event: Drag will be started
			this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.DRAGDROP_START});
			this.dragIntialized = false;
			
			// And hide the resizers and the highlighting
			this.resizerSE.hide();
			this.resizerNW.hide();
			
			// if only edges are selected, containmentParentNode must be the canvas
			this._onlyEdges = this.currentShapes.all(function(currentShape) {
				return (currentShape instanceof ORYX.Core.Edge);
			});
			
			// Do method before Drag
			this.beforeDrag();
			
			this._currentUnderlyingNodes = [];
		}
		
		var position = this.facade.eventCoordinates(event);
		position.x -= this.offset.x;
		position.y -= this.offset.y;
		if(ORCHESTRATOR.CONFIG.GRID_ENABLED) {
			// Snap the current position to the nearest Snap-Point
			position = this.snapToGrid(position);
		} else {
			if (this.vLine)
				this.vLine.hide();
			if (this.hLine)
				this.hLine.hide();
		}

		// Set that the position is not lower than zero
		position.x = Math.max( this.ul.x , position.x);
		position.y = Math.max( this.ul.y , position.y);

		// Set that the position is not bigger than the canvas
		var lr = this.facade.getCanvas().bounds.lowerRight();
		position.x = Math.min( this.lr.x, position.x);
		position.y = Math.min( this.lr.y, position.y);

		// Drag this bounds
		this.dragBounds.centerMoveTo(position);

		// Update all selected shapes and the selection rectangle
		//this.refreshSelectedShapes();
		this.selectedRect.resize(this.dragBounds);

		this.isAttachingAllowed = false;

		//check, if a node can be added to the underlying node
		var underlyingNodes = PROTOTYPE.$A(this.facade.getCanvas().getAbstractShapesAtPosition(this.facade.eventCoordinates(event)));
		
		var checkIfAttachable = this.toMoveShapes.length == 1 && this.toMoveShapes[0] instanceof ORYX.Core.Node && this.toMoveShapes[0].dockers.length > 0;
		checkIfAttachable	= checkIfAttachable && underlyingNodes.length != 1;
		
			
		if(		!checkIfAttachable &&
				underlyingNodes.length === this._currentUnderlyingNodes.length  &&
				underlyingNodes.all(function(node, index){return this._currentUnderlyingNodes[index] === node;}.bind(this))) {
					
			return;
			
		} else if(this._onlyEdges) {
			
			this.isAddingAllowed = true;
			this.containmentParentNode = this.facade.getCanvas();
			
		} else {
		
			/* Check the containment and connection rules */
			var options = {
				event : event,
				underlyingNodes : underlyingNodes,
				checkIfAttachable : checkIfAttachable
			};
			this.checkRules(options);
							
		}
		
		this._currentUnderlyingNodes = underlyingNodes.reverse();
		
		//visualize the containment result
		if( this.isAttachingAllowed ) {
			this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW,
									highlightId: 	"dragdropresize.attached",
									elements: 		[this.containmentParentNode],
									style: 			ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,
									color: 			ORCHESTRATOR.CONFIG.SELECTION_VALID_COLOR
								});
		} else {
			this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"dragdropresize.attached"});
		}
		
		if( !this.isAttachingAllowed ){
			if( this.isAddingAllowed ) {
				this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW,
										highlightId:"dragdropresize.contain",
										elements:[this.containmentParentNode],
										color: ORCHESTRATOR.CONFIG.SELECTION_VALID_COLOR
									});
			} else {
				this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW,
										highlightId:"dragdropresize.contain",
										elements:[this.containmentParentNode],
										color: ORCHESTRATOR.CONFIG.SELECTION_INVALID_COLOR
									});
			}
		} else {
			this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE,
									highlightId:"dragdropresize.contain"
								});
		}	
	},
	
	/**
	 *  Checks the containment and connection rules for the selected shapes.
	 */
	checkRules : function(options) {
		var event = options.event;
		var underlyingNodes = options.underlyingNodes;
		var checkIfAttachable = options.checkIfAttachable;
		var noEdges = options.noEdges;
		
		//get underlying node that is not the same than one of the currently selected shapes or
		// a child of one of the selected shapes with the highest z Order.
		// The result is a shape or the canvas
		this.containmentParentNode = underlyingNodes.reverse().find((function(node) {
			return (node instanceof ORYX.Core.Canvas) || 
					(((node instanceof ORYX.Core.Node) || ((node instanceof ORYX.Core.Edge) && !noEdges)) 
					&& (!(this.currentShapes.member(node) || 
							this.currentShapes.any(function(shape) {
								return (shape.children.length > 0 && shape.getChildNodes(true).member(node));
							}))));
		}).bind(this));

		if( checkIfAttachable ){
				
			this.isAttachingAllowed	= this.facade.getRules().canConnect({
												sourceShape:	this.containmentParentNode, 
												edgeShape:		this.toMoveShapes[0], 
												targetShape:	this.toMoveShapes[0]
												});						
			
			if ( this.isAttachingAllowed	) {
				var point = this.facade.eventCoordinates(event);
				this.isAttachingAllowed	= this.containmentParentNode.isPointOverOffset( point.x, point.y );
			}						
		}
		
		if( !this.isAttachingAllowed ){
			//check all selected shapes, if they can be added to containmentParentNode
			this.isAddingAllowed = this.toMoveShapes.all((function(currentShape) {
				if(currentShape instanceof ORYX.Core.Edge ||
					currentShape instanceof ORYX.Core.Controls.Docker ||
					this.containmentParentNode === currentShape.parent) {
					return true;
				} else if(this.containmentParentNode !== currentShape) {
					
					if(!(this.containmentParentNode instanceof ORYX.Core.Edge) || !noEdges) {
					
						if(this.facade.getRules().canContain({containingShape:this.containmentParentNode,
															  containedShape:currentShape})) {	  	
							return true;
						}
					}
				}
				return false;
			}).bind(this));				
		}
		
		if(!this.isAttachingAllowed && !this.isAddingAllowed && 
				(this.containmentParentNode instanceof ORYX.Core.Edge)) {
			options.noEdges = true;
			options.underlyingNodes.reverse();
			this.checkRules(options);			
		}
	},
	
	/**
	 * Redraw the selected Shapes.
	 *
	 */
	refreshSelectedShapes: function() {
		// If the selection bounds not initialized, return
		if(!this.dragBounds) {return;}

		// Calculate the offset between the bounds and the old bounds
		var upL = this.dragBounds.upperLeft();
		var oldUpL = this.oldDragBounds.upperLeft();
		var offset = {
			x: upL.x - oldUpL.x,
			y: upL.y - oldUpL.y };

		// Instanciate the dragCommand
		var commands = [new ORYX.Core.Command.Move(this.toMoveShapes, offset, this.containmentParentNode, this.currentShapes, this)];
		// If the undocked edges command is setted, add this command
		if( this._undockedEdgesCommand instanceof ORYX.Core.Command ){
			commands.unshift( this._undockedEdgesCommand );
		}
		// Execute the commands			
		this.facade.executeCommands( commands );	

		// copy the bounds to the old bounds
		if( this.dragBounds )
			this.oldDragBounds = this.dragBounds.clone();

	},
	
	/**
	 * Callback for Resize
	 *
	 */
	onResize: function(bounds) {
		// If the selection bounds not initialized, return
		if(!this.dragBounds) {return;}
		
		this.dragBounds = bounds;
		this.isResizing = true;

		// Update the rectangle 
		this.selectedRect.resize(this.dragBounds);
	},
	
	onResizeStart: function() {
		this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.RESIZE_START});
	},

	onResizeEnd: function() {
		
		if (!(this.currentShapes instanceof Array)||this.currentShapes.length<=0) {
			return;
		}
		
		// If Resizing finished, the Shapes will be resize
		if(this.isResizing) {
			
			var commandClass = ORYX.Core.Command.extend({
				construct: function(shape, newBounds, plugin){
					this.shape = shape;
					this.oldBounds = shape.bounds.clone();
					this.newBounds = newBounds;
					this.plugin = plugin;
				},			
				execute: function(){
					this.shape.bounds.set(this.newBounds.a, this.newBounds.b);
					this.update(this.getOffset(this.oldBounds, this.newBounds));
					
				},
				rollback: function(){
					this.shape.bounds.set(this.oldBounds.a, this.oldBounds.b);
					this.update(this.getOffset(this.newBounds, this.oldBounds));
				},
				
				getOffset:function(b1, b2){
					return {
						x: b2.a.x - b1.a.x,
						y: b2.a.y - b1.a.y,
						xs: b2.width()/b1.width(),
						ys: b2.height()/b1.height()
					};
				},
				update:function(offset){
					this.shape.getLabels().each(function(label) {
						label.changed();
					});
					
					var allEdges = [].concat(this.shape.getIncomingShapes())
						.concat(this.shape.getOutgoingShapes())
						// Remove all edges which are included in the selection from the list
						.findAll(function(r){ return r instanceof ORYX.Core.Edge; }.bind(this));
												
					this.plugin.layoutEdges(this.shape, allEdges, offset);

					this.plugin.facade.setSelection([this.shape]);
					this.plugin.facade.getCanvas().update();
					this.plugin.facade.updateSelection();
				}
			});
			
			var bounds = this.dragBounds.clone();
			var shape = this.currentShapes[0];
			
			if(shape.parent) {
				var parentPosition = shape.parent.absoluteXY();
				bounds.moveBy(-parentPosition.x, -parentPosition.y);
			}
				
			var command = new commandClass(shape, bounds, this);
			
			this.facade.executeCommands([command]);
			
			this.isResizing = false;
			
			this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.RESIZE_END});
		}
	},
	

	/**
	 * Prepare the Dragging
	 *
	 */
	beforeDrag: function(){

		var undockEdgeCommand = ORYX.Core.Command.extend({
			construct: function(moveShapes){
				this.dockers = moveShapes.collect(function(shape){ return shape instanceof ORYX.Core.Controls.Docker ? {docker:shape, dockedShape:shape.getDockedShape(), refPoint:shape.referencePoint} : undefined; }).compact();
			},			
			execute: function(){
				this.dockers.each(function(el){
					el.docker.setDockedShape(undefined);
				});
			},
			rollback: function(){
				this.dockers.each(function(el){
					el.docker.setDockedShape(el.dockedShape);
					el.docker.setReferencePoint(el.refPoint);
					//el.docker.update();
				});
			}
		});
		
		this._undockedEdgesCommand = new undockEdgeCommand( this.toMoveShapes );
		this._undockedEdgesCommand.execute();	
		
	},

	hideAllLabels: function(shape) {
			
			// Hide all labels from the shape
			shape.getLabels().each(function(label) {
				label.hide();
			});
			// Hide all labels from docked shapes
			shape.getAllDockedShapes().each(function(dockedShape) {
				var labels = dockedShape.getLabels();
				if(labels.length > 0) {
					labels.each(function(label) {
						label.hide();
					});
				}
			});

			// Do this recursive for all child shapes
			// EXP-NICO use getShapes
			shape.getChildren().each((function(value) {
				if(value instanceof ORYX.Core.Shape)
					this.hideAllLabels(value);
			}).bind(this));
	},

	/**
	 * Finished the Dragging
	 *
	 */
	afterDrag: function(){
	},

	/**
	 * Show all Labels at these shape
	 * 
	 */
	showAllLabels: function(shape) {

			// Show the label of these shape
			//shape.getLabels().each(function(label) {
			for(var i=0; i<shape.length ;i++){
				var label = shape[i];
				label.show();
			}//);
			// Show all labels at docked shapes
			//shape.getAllDockedShapes().each(function(dockedShape) {
			var allDockedShapes = shape.getAllDockedShapes();
			for(var i=0; i<allDockedShapes.length ;i++){
				var dockedShape = allDockedShapes[i];				
				var labels = dockedShape.getLabels();
				if(labels.length > 0) {
					labels.each(function(label) {
						label.show();
					});
				}
			}//);

			// Do this recursive
			//shape.children.each((function(value) {
			for(var i=0; i<shape.children.length ;i++){
				var value = shape.children[i];	
				if(value instanceof ORYX.Core.Shape)
					this.showAllLabels(value);
			}//).bind(this));
	},

	/**
	 * Intialize Method, if there are new Plugins
	 *
	 */
	/*registryChanged: function(pluginsData) {
		// Save all new Plugin, sorted by group and index
		this.pluginsData = pluginsData.sortBy( function(value) {
			return (value.group + "" + value.index);
		});
	},*/

	/**
	 * On the Selection-Changed
	 *
	 */
	onSelectionChanged: function(event) {
		var elements = event.elements;
		
		// Reset the drag-variables
		this.dragEnable = false;
		this.dragIntialized = false;
		this.resizerSE.hide();
		this.resizerNW.hide();

		// If there is no elements
		if(!elements || elements.length == 0) {
			// Hide all things and reset all variables
			this.selectedRect.hide();
			this.currentShapes = [];
			this.toMoveShapes = [];
			this.dragBounds = undefined;
			this.oldDragBounds = undefined;
		} else {

			// Set the current Shapes
			this.currentShapes = elements;

			// Get all shapes with the highest parent in object hierarchy (canvas is the top most parent)
			var topLevelElements = this.facade.getCanvas().getShapesWithSharedParent(elements);
			this.toMoveShapes = topLevelElements;
			
			this.toMoveShapes = this.toMoveShapes.findAll( function(shape) { return shape instanceof ORYX.Core.Node && 
																			(shape.dockers.length === 0 || !elements.member(shape.dockers[0].getDockedShape()));});		
																			
			elements.each((function(shape){
				if(!(shape instanceof ORYX.Core.Edge)) {return;}
				
				var dks = shape.getDockers() ;
								
				var hasF = elements.member(dks[0].getDockedShape());
				var hasL = elements.member(dks.last().getDockedShape());	
						
//				if(!hasL) {
//					this.toMoveShapes.push(dks.last());
//				}
//				if(!hasF){
//					this.toMoveShapes.push(dks[0])
//				} 
				/* Enable movement of undocked edges */
				if(!hasF && !hasL) {
					var isUndocked = !dks[0].getDockedShape() && !dks.last().getDockedShape();
					if(isUndocked) {
						this.toMoveShapes = this.toMoveShapes.concat(dks);
					}
				}
				
				if( shape.dockers.length > 2 && hasF && hasL){
					this.toMoveShapes = this.toMoveShapes.concat(dks.findAll(function(el,index){ return index > 0 && index < dks.length-1;}));
				}
				
			}).bind(this));
			
			// Calculate the new area-bounds of the selection
			var newBounds = undefined;
			this.toMoveShapes.each(function(value) {
				var shape = value;
				if(value instanceof ORYX.Core.Controls.Docker) {
					/* Get the Shape */
					shape = value.parent;
				}
				
				if(!newBounds){
					newBounds = shape.absoluteBounds();
				}
				else {
					newBounds.include(shape.absoluteBounds());
				}
			}.bind(this));
			
			if(!newBounds){
				elements.each(function(value){
					if(!newBounds) {
						newBounds = value.absoluteBounds();
					} else {
						newBounds.include(value.absoluteBounds());
					}
				});
			}
			
			// Set the new bounds
			this.dragBounds = newBounds;
			this.oldDragBounds = newBounds.clone();

			// Update and show the rectangle
			this.selectedRect.resize(newBounds);
			this.selectedRect.show();
			
			// Show the resize button, if there is only one element and this is resizeable
			if(elements.length == 1 && elements[0].isResizable) {
				var aspectRatio = elements[0].getStencil().fixedAspectRatio() ? elements[0].bounds.width() / elements[0].bounds.height() : undefined;
				this.resizerSE.setBounds(this.dragBounds, elements[0].minimumSize, elements[0].maximumSize, aspectRatio);
				this.resizerSE.show();
				this.resizerNW.setBounds(this.dragBounds, elements[0].minimumSize, elements[0].maximumSize, aspectRatio);
				this.resizerNW.show();
			} else {
				this.resizerSE.setBounds(undefined);
				this.resizerNW.setBounds(undefined);
			}

			// If Snap-To-Grid is enabled, the Snap-Point will be calculate
			if(ORCHESTRATOR.CONFIG.GRID_ENABLED) {

				// Reset all points
				this.distPoints = [];

				if (this.distPointTimeout)
					window.clearTimeout(this.distPointTimeout);
				
				this.distPointTimeout = window.setTimeout(function(){
					// Get all the shapes, there will consider at snapping
					// Consider only those elements who shares the same parent element
					var distShapes = this.facade.getCanvas().getChildShapes(true).findAll(function(value){
						var parentShape = value.parent;
						while(parentShape){
							if(elements.member(parentShape)) return false;
							parentShape = parentShape.parent;
						}
						return true;
					});
					
					// The current selection will delete from this array
					//elements.each(function(shape) {
					//	distShapes = distShapes.without(shape);
					//});

					// For all these shapes
					distShapes.each((function(value) {
						if(!(value instanceof ORYX.Core.Edge)) {
							var ul = value.absoluteXY();
							var width = value.bounds.width();
							var height = value.bounds.height();

							// Add the upperLeft, center and lowerRight - Point to the distancePoints
							this.distPoints.push({
								ul: {
									x: ul.x,
									y: ul.y
								},
								c: {
									x: ul.x + (width / 2),
									y: ul.y + (height / 2)
								},
								lr: {
									x: ul.x + width,
									y: ul.y + height
								}
							});
						}
					}).bind(this));
					
				}.bind(this), 10);


			}
		}
	},

	/**
	 * Adjust an Point to the Snap Points
	 *
	 */
	snapToGrid: function(position) {
		var cThres = 10;
		
		var c = { x: position.x, y: position.y};

		var offsetX, offsetY;
		var gridX, gridY;
		
		// For each distant point
		this.distPoints.each(function(value) {

			var x, y, gx, gy;
			if (Math.abs(value.c.x-c.x) < cThres){
				x = value.c.x-c.x;
				gx = value.c.x;
			}

			if (Math.abs(value.c.y-c.y) < cThres){
				y = value.c.y-c.y;
				gy = value.c.y;
			}

			if (x !== undefined) {
				offsetX = offsetX === undefined ? x : (Math.abs(x) < Math.abs(offsetX) ? x : offsetX);
				if (offsetX === x)
					gridX = gx;
			}

			if (y !== undefined) {
				offsetY = offsetY === undefined ? y : (Math.abs(y) < Math.abs(offsetY) ? y : offsetY);
				if (offsetY === y)
					gridY = gy;
			}
		});
		
		if (offsetX !== undefined) {
			c.x += offsetX;
			if (this.vLine&&gridX)
				this.vLine.update(gridX);
		} else {
			c.x = (position.x - (position.x % (ORCHESTRATOR.CONFIG.GRID_DISTANCE/2)));
			if (this.vLine)
				this.vLine.hide();
		}
		
		if (offsetY !== undefined) {	
			c.y += offsetY;
			if (this.hLine&&gridY)
				this.hLine.update(gridY);
		} else {
			c.y = (position.y - (position.y % (ORCHESTRATOR.CONFIG.GRID_DISTANCE/2)));
			if (this.hLine)
				this.hLine.hide();
		}
		
		return c;
	}
};
ORYX.Plugins.DragDropResize = ORYX.Plugins.AbstractPlugin.extend(ORYX.Plugins.DragDropResize);

ORYX.Plugins.SelectedRect = {
	construct: function() {
	},
	redraw: function(paper) {
		this.raphael = paper.rect(0, 0, 0, 0).attr({stroke : '#777777', fill : 'none', 'stroke-dasharray' : '-'});
		this.hide();
	},
	hide: function() {
		this.raphael.node.style.display = 'none';
	},
	show: function() {
		this.raphael.node.style.display = '';
		this.raphael.toFront();
	},
	resize: function(bounds) {
		var upL = bounds.upperLeft();
		this.raphael.attr({width:bounds.width()+8, height:bounds.height()+8});
		this.raphael.transform('t' + (upL.x - 4) +", "+ (upL.y - 4));
	}
};
ORYX.Plugins.SelectedRect = Clazz.extend(ORYX.Plugins.SelectedRect);

ORYX.Plugins.GridLine = {
	construct: function(options, direction) {
		if ('hor' !== direction && 'ver' !== direction) {
			direction = 'hor';
		}
		this.direction = direction;
		arguments.callee.$.construct.apply(this, arguments);
	},
	redraw: function(paper) {
		this.raphael = paper.set().push(paper.path().attr({stroke : 'silver', fill : 'none', 'stroke-dasharray' : '- '}));
		this.raphael.forEach((function(el) {this.addEventHandlers(el.node);}).bind(this));
		this.hide();
	},
	toString: function() { return "GridLine " + this.id; },
	update: function(pos) {
		if (this.direction === 'hor') {
			var y = pos instanceof Object ? pos.y : pos;
			var cWidth = Element.getWidth(this.raphael.paper.canvas);
			this.raphael.attr('path', 'M 0 '+y+ ' L '+cWidth+' '+y);
		} else {
			var x = pos instanceof Object ? pos.x : pos;
			var cHeight = Element.getHeight(this.raphael.paper.canvas);
			this.raphael.attr('path', 'M'+x+ ' 0 L '+x+' '+cHeight);
		}
		this.show();
	}
};
ORYX.Plugins.GridLine = ORYX.Core.UIObject.extend(ORYX.Plugins.GridLine);

ORYX.Plugins.Resizer = {
	construct: function(options) {
		arguments.callee.$.construct.apply(this, arguments);
		this.isMovable		= true;
		this.orientation	= options.orientation;
		this.facade			= options.facade;

		this.callbackMouseMove	= this.handleMouseMove.bind(this);
		this.callbackMouseUp	= this.handleMouseUp.bind(this);
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN, this.handleMouseDown.bind(this));

		this.dragEnable = false;
		this.offSetPosition = {x: 0, y: 0};
		this.bounds = undefined;

		this.canvasNode = this.facade.getCanvas();

		this.minSize = undefined;
		this.maxSize = undefined;
		
		this.aspectRatio = undefined;

		this.resizeCallbacks 		= [];
		this.resizeStartCallbacks 	= [];
		this.resizeEndCallbacks 	= [];
	},
	
	redraw: function(paper) {
		// Calculate the Offset
		this.scrollNode = this.facade.getRootNode();
		if(this.orientation==="northwest") {
			this.raphael = paper.set(paper.path('M10,5l-5,0l0,5').attr("stroke-width",2), paper.rect(0,0,10,10).attr({fill:'white',"opacity":0}));
		} else {
			this.raphael = paper.set(paper.path('M0,5l5,0l0,-5').attr("stroke-width",2), paper.rect(0,0,10,10).attr({fill:'white',"opacity":0}));
		}
		
		var me = this;
		this.raphael.forEach(function(el) {me.addEventHandlers(el.node);});
		this.hide();
	},

	handleMouseDown: function(event, uiObj) {
		if(uiObj instanceof ORYX.Plugins.Resizer && uiObj.orientation === this.orientation) {
			this.dragEnable = true;
	
			this.offsetScroll	= {x:this.scrollNode.scrollLeft,y:this.scrollNode.scrollTop};
			
			this.offSetPosition = {x:ORYX.pointerX(event)-this.position.x,y:ORYX.pointerY(event)-this.position.y};
			
			this.resizeStartCallbacks.each((function(value) {value(this.bounds);}).bind(this));

			this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
			this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
		}
	},

	handleMouseUp: function(event, uiObj) {
		this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
		this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
		if(this.dragEnable) {
			this.containmentParentNode = null;
			this.resizeEndCallbacks.each((function(value) {value(this.bounds);}).bind(this));
		}
		this.dragEnable = false;
	},

	handleMouseMove: function(event, uiObj) {
		if(!this.dragEnable) { return; }
		
		if(!ORYX.isLeftClick(event)) {
			return this.handleMouseUp(event);
		}

		if(event.shiftKey || event.ctrlKey) {
			this.aspectRatio = this.bounds.width() / this.bounds.height();
		} else {
			this.aspectRatio = undefined;
		}

		var position = {
			x: ORYX.pointerX(event) - this.offSetPosition.x,
			y: ORYX.pointerY(event) - this.offSetPosition.y};


		position.x 	-= this.offsetScroll.x - this.scrollNode.scrollLeft; 
		position.y 	-= this.offsetScroll.y - this.scrollNode.scrollTop;
		
		position.x  = Math.min( position.x, this.facade.getCanvas().bounds.width());
		position.y  = Math.min( position.y, this.facade.getCanvas().bounds.height());
		
		var offset = {
			x: position.x - this.position.x,
			y: position.y - this.position.y
		};
		
		if(this.aspectRatio) {
			// fixed aspect ratio
			newAspectRatio = (this.bounds.width()+offset.x) / (this.bounds.height()+offset.y);
			if(newAspectRatio>this.aspectRatio) {
				offset.x = this.aspectRatio * (this.bounds.height()+offset.y) - this.bounds.width();
			} else if(newAspectRatio<this.aspectRatio) {
				offset.y = (this.bounds.width()+offset.x) / this.aspectRatio - this.bounds.height();
			}
		}
		
		// respect minimum and maximum sizes of stencil
		if(this.orientation==="northwest") {
			if(this.bounds.width()-offset.x > this.maxSize.width) {
				offset.x = -(this.maxSize.width - this.bounds.width());
				if(this.aspectRatio)
					offset.y = this.aspectRatio * offset.x;
			}
			if(this.bounds.width()-offset.x < this.minSize.width) {
				offset.x = -(this.minSize.width - this.bounds.width());
				if(this.aspectRatio)
					offset.y = this.aspectRatio * offset.x;
			}
			if(this.bounds.height()-offset.y > this.maxSize.height) {
				offset.y = -(this.maxSize.height - this.bounds.height());
				if(this.aspectRatio)
					offset.x = offset.y / this.aspectRatio;
			}
			if(this.bounds.height()-offset.y < this.minSize.height) {
				offset.y = -(this.minSize.height - this.bounds.height());
				if(this.aspectRatio)
					offset.x = offset.y / this.aspectRatio;
			}
		} else { // defaults to southeast
			if(this.bounds.width()+offset.x > this.maxSize.width) {
				offset.x = this.maxSize.width - this.bounds.width();
				if(this.aspectRatio)
					offset.y = this.aspectRatio * offset.x;
			}
			if(this.bounds.width()+offset.x < this.minSize.width) {
				offset.x = this.minSize.width - this.bounds.width();
				if(this.aspectRatio)
					offset.y = this.aspectRatio * offset.x;
			}
			if(this.bounds.height()+offset.y > this.maxSize.height) {
				offset.y = this.maxSize.height - this.bounds.height();
				if(this.aspectRatio)
					offset.x = offset.y / this.aspectRatio;
			}
			if(this.bounds.height()+offset.y < this.minSize.height) {
				offset.y = this.minSize.height - this.bounds.height();
				if(this.aspectRatio)
					offset.x = offset.y / this.aspectRatio;
			}
		}

		if(this.orientation==="northwest") {
			var oldLR = {x: this.bounds.lowerRight().x, y: this.bounds.lowerRight().y};
			this.bounds.extend({x:-offset.x, y:-offset.y});
			this.bounds.moveBy(offset);
		} else { // defaults to southeast
			this.bounds.extend(offset);
		}

		this.update();

		this.resizeCallbacks.each((function(value) {
			value(this.bounds);
		}).bind(this));
	},
	
	registerOnResizeStart: function(callback) {
		if(!this.resizeStartCallbacks.member(callback)) {
			this.resizeStartCallbacks.push(callback);
		}
	},
	
	unregisterOnResizeStart: function(callback) {
		if(this.resizeStartCallbacks.member(callback)) {
			this.resizeStartCallbacks = this.resizeStartCallbacks.without(callback);
		}
	},

	registerOnResizeEnd: function(callback) {
		if(!this.resizeEndCallbacks.member(callback)) {
			this.resizeEndCallbacks.push(callback);
		}
	},
	
	unregisterOnResizeEnd: function(callback) {
		if(this.resizeEndCallbacks.member(callback)) {
			this.resizeEndCallbacks = this.resizeEndCallbacks.without(callback);
		}
	},
		
	registerOnResize: function(callback) {
		if(!this.resizeCallbacks.member(callback)) {
			this.resizeCallbacks.push(callback);
		}
	},

	unregisterOnResize: function(callback) {
		if(this.resizeCallbacks.member(callback)) {
			this.resizeCallbacks = this.resizeCallbacks.without(callback);
		}
	},

	hide: function() {
		this.raphael.forEach(function(obj) {
			obj.node.style.display = "none";
		});
	},

	show: function() {
		if(this.bounds) {
			this.raphael.forEach(function(obj) {
				obj.node.style.display = "";
				obj.toFront();
			});
		}
	},

	setBounds: function(bounds, min, max, aspectRatio) {
		this.bounds = bounds;

		if(!min)
			min = {width: ORCHESTRATOR.CONFIG.MINIMUM_SIZE, height: ORCHESTRATOR.CONFIG.MINIMUM_SIZE};

		if(!max)
			max = {width: ORCHESTRATOR.CONFIG.MAXIMUM_SIZE, height: ORCHESTRATOR.CONFIG.MAXIMUM_SIZE};

		this.minSize = min;
		this.maxSize = max;
		
		this.aspectRatio = aspectRatio;

		this.update();
	},
	toString: function() { return "Resizer " + this.id; },

	update: function() {
		if(!this.bounds) { return; }

		var upL = this.bounds.upperLeft();

		if(this.bounds.width() < this.minSize.width)	{ this.bounds.set(upL.x, upL.y, upL.x + this.minSize.width, upL.y + this.bounds.height());};
		if(this.bounds.height() < this.minSize.height)	{ this.bounds.set(upL.x, upL.y, upL.x + this.bounds.width(), upL.y + this.minSize.height);};
		if(this.bounds.width() > this.maxSize.width)	{ this.bounds.set(upL.x, upL.y, upL.x + this.maxSize.width, upL.y + this.bounds.height());};
		if(this.bounds.height() > this.maxSize.height)	{ this.bounds.set(upL.x, upL.y, upL.x + this.bounds.width(), upL.y + this.maxSize.height);};

		if(this.orientation==="northwest") {
			upL.x -= 13;
			upL.y -= 13;
		} else { // defaults to southeast
			upL.x +=  this.bounds.width() + 3 ;
			upL.y +=  this.bounds.height() + 3;
		}
		
		this.position = upL;

		this.raphael.forEach(function(obj) {
			obj.transform('t' + this.position.x + ',' + this.position.y);
		}.bind(this));
	}
};
ORYX.Plugins.Resizer = ORYX.Core.UIObject.extend(ORYX.Plugins.Resizer);

/**
 * Implements a Command to move shapes
 * 
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.Command) {ORYX.Core.Command = {};}

ORYX.Core.Command.Move = {
	construct: function(moveShapes, offset, parent, selectedShapes, plugin){
		this.moveShapes = moveShapes;
		this.selectedShapes = selectedShapes;
		this.offset 	= offset;
		this.plugin		= plugin;
		// Defines the old/new parents for the particular shape
		this.newParents	= moveShapes.collect(function(t){ return parent || t.parent; });
		this.oldParents	= moveShapes.collect(function(shape){ return shape.parent; });
		this.dockedNodes= moveShapes.findAll(function(shape){ return shape instanceof ORYX.Core.Node && shape.dockers.length == 1;}).collect(function(shape){ return {docker:shape.dockers[0], dockedShape:shape.dockers[0].getDockedShape(), refPoint:shape.dockers[0].referencePoint}; });
	},			
	execute: function(){
		this.dockAllShapes();
		// Moves by the offset
		this.move( this.offset);
		// Addes to the new parents
		this.addShapeToParent( this.newParents ); 
		// Set the selection to the current selection
		this.selectCurrentShapes();
		this.plugin.facade.getCanvas().update();
		this.plugin.facade.updateSelection();
	},
	rollback: function(){
		// Moves by the inverted offset
		var offset = { x:-this.offset.x, y:-this.offset.y };
		this.move( offset );
		// Addes to the old parents
		this.addShapeToParent( this.oldParents ); 
		this.dockAllShapes(true);
		
		// Set the selection to the current selection
		this.selectCurrentShapes();
		this.plugin.facade.getCanvas().update();
		this.plugin.facade.updateSelection();
		
	},
	move:function(offset, doLayout){
		
		// Move all Shapes by these offset
		for(var i=0; i<this.moveShapes.length ;i++){
			var value = this.moveShapes[i];					
			value.bounds.moveBy(offset);
			
			if (value instanceof ORYX.Core.Node) {
				
				(value.dockers||[]).each(function(d){
					d.bounds.moveBy(offset);
				});
				
				// Update all Dockers of Child shapes
				var childShapesNodes = value.getChildShapes(true).findAll(function(shape){ return shape instanceof ORYX.Core.Node; });							
				var childDockedShapes = childShapesNodes.collect(function(shape){ return shape.getAllDockedShapes(); }).flatten().uniq();							
				var childDockedEdge = childDockedShapes.findAll(function(shape){ return shape instanceof ORYX.Core.Edge; });							
				childDockedEdge = childDockedEdge.findAll(function(shape){ return shape.getAllDockedShapes().all(function(dsh){ return childShapesNodes.include(dsh); }); });							
				var childDockedDockers = childDockedEdge.collect(function(shape){ return shape.dockers; }).flatten();
				
				for (var j = 0; j < childDockedDockers.length; j++) {
					var docker = childDockedDockers[j];
					if (!docker.getDockedShape() && !this.moveShapes.include(docker)) {
						docker.bounds.moveBy(offset);
						docker.update();
					}
				}
				
				var allEdges = [].concat(value.getIncomingShapes())
					.concat(value.getOutgoingShapes())
					// Remove all edges which are included in the selection from the list
					.findAll(function(r){ return	r instanceof ORYX.Core.Edge && !this.moveShapes.any(function(d){ return d == r || (d instanceof ORYX.Core.Controls.Docker && d.parent == r);}); }.bind(this))
					// Remove all edges which are between the node and a node contained in the selection from the list
					.findAll(function(r){ return 	(r.dockers[0].getDockedShape() == value || !this.moveShapes.include(r.dockers[0].getDockedShape())) &&  
													(r.dockers.last().getDockedShape() == value || !this.moveShapes.include(r.dockers.last().getDockedShape()));}.bind(this));
													
				// Layout all outgoing/incoming edges
				this.plugin.layoutEdges(value, allEdges, offset);
				
				
				var allSameEdges = [].concat(value.getIncomingShapes())
					.concat(value.getOutgoingShapes())
					// Remove all edges which are included in the selection from the list
					.findAll(function(r){ return r instanceof ORYX.Core.Edge && r.dockers[0].isDocked() && r.dockers.last().isDocked() && !this.moveShapes.include(r) && !this.moveShapes.any(function(d){ return d == r || (d instanceof ORYX.Core.Controls.Docker && d.parent == r);}); }.bind(this))
					// Remove all edges which are included in the selection from the list
					.findAll(function(r){ return this.moveShapes.indexOf(r.dockers[0].getDockedShape()) > i ||  this.moveShapes.indexOf(r.dockers.last().getDockedShape()) > i;}.bind(this));

				for (var j = 0; j < allSameEdges.length; j++) {
					for (var k = 1; k < allSameEdges[j].dockers.length-1; k++) {
						var docker = allSameEdges[j].dockers[k];
						if (!docker.getDockedShape() && !this.moveShapes.include(docker)) {
							docker.bounds.moveBy(offset);
						}
					}
				}	
				
				/*var i=-1;
				var nodes = value.getChildShapes(true);
				var allEdges = [];
				while(++i<nodes.length){
					var edges = [].concat(nodes[i].getIncomingShapes())
						.concat(nodes[i].getOutgoingShapes())
						// Remove all edges which are included in the selection from the list
						.findAll(function(r){ return r instanceof ORYX.Core.Edge && !allEdges.include(r) && r.dockers.any(function(d){ return !value.bounds.isIncluded(d.bounds.center)})})
					allEdges = allEdges.concat(edges);
					if (edges.length <= 0){ continue }
					//this.plugin.layoutEdges(nodes[i], edges, offset);
				}*/
			}
		}
										
	},
	dockAllShapes: function(shouldDocked){
		// Undock all Nodes
		for (var i = 0; i < this.dockedNodes.length; i++) {
			var docker = this.dockedNodes[i].docker;
			
			docker.setDockedShape( shouldDocked ? this.dockedNodes[i].dockedShape : undefined );
			if (docker.getDockedShape()) {
				docker.setReferencePoint(this.dockedNodes[i].refPoint);
				//docker.update();
			}
		}
	},
	
	addShapeToParent:function( parents ){
		
		// For every Shape, add this and reset the position		
		for(var i=0; i<this.moveShapes.length ;i++){
			var currentShape = this.moveShapes[i];
			if(currentShape instanceof ORYX.Core.Node &&
			   currentShape.parent !== parents[i]) {
				
				// Calc the new position
				var unul = parents[i].absoluteXY();
				var csul = currentShape.absoluteXY();
				var x = csul.x - unul.x;
				var y = csul.y - unul.y;

				// Add the shape to the new contained shape
				parents[i].add(currentShape);
				// Add all attached shapes as well
				currentShape.getOutgoingShapes((function(shape) {
					if(shape instanceof ORYX.Core.Node && !this.moveShapes.member(shape)) {
						parents[i].add(shape);
					}
				}).bind(this));

				// Set the new position
				if(currentShape instanceof ORYX.Core.Node && currentShape.dockers.length == 1){
					var b = currentShape.bounds;
					x += b.width()/2;y += b.height()/2;
					currentShape.dockers[0].bounds.centerMoveTo(x, y);
				} else {
					currentShape.bounds.moveTo(x, y);
				}
				
			} 
			
			// Update the shape
			//currentShape.update();
			
		}
	},
	selectCurrentShapes:function(){
		this.plugin.facade.setSelection( this.selectedShapes );
	}
};
ORYX.Core.Command.Move = ORYX.Core.Command.extend(ORYX.Core.Command.Move);
