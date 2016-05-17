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

ORYX.Plugins.ShapeRepository = {

	construct: function(facade) {
		this.facade = facade;
		this._canContain = undefined;
		this._canAttach  = undefined;
		
		facade.registerOnEvent(ORCHESTRATOR.EVENTS.DRAGDROP_OVER, this.over.bind(this));
		facade.registerOnEvent(ORCHESTRATOR.EVENTS.DRAGDROP_DROP, this.drop.bind(this));
	},
	
	drop: function(options) {
		this._lastOverElement = undefined;
		
		// Hide the highlighting
		this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:'shapeRepo.added'});
		this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:'shapeRepo.attached'});
		
		// Check if there is a current Parent
		if(!this._currentParent) { return; }
		
		var position = this.facade.eventCoordinates( options.event );
		var myoption = options.option;
		if(myoption.offset) {
			position.x -= myoption.offset.x;
			position.y -= myoption.offset.y;
		}

		// Set parent
		if( this._canAttach &&  this._currentParent instanceof ORYX.Core.Node ){
			myoption['parent'] = undefined;	
		} else {
			myoption['parent'] = this._currentParent;
		}
		myoption.paper = this.facade.getPaper();
		myoption.position = position;
		
		var commandClass = ORYX.Core.Command.extend({
			construct: function(option, currentParent, canAttach, position, facade){
				this.option = option;
				this.currentParent = currentParent;
				this.canAttach = canAttach;
				this.position = position;
				this.facade = facade;
				this.selection = this.facade.getSelection();
			},
			execute: function(){
				if (!this.shape) {
					this.shape 	= this.facade.createShape(this.option);
					this.parent = this.shape.parent;
				} else {
					this.parent.add(this.shape);
				}
				
				if( this.canAttach &&  this.currentParent instanceof ORYX.Core.Node && this.shape.dockers.length > 0){
					var docker = this.shape.dockers[0];
					if( this.currentParent.parent instanceof ORYX.Core.Node ) {
						this.currentParent.parent.add( docker.parent );
					}
					docker.bounds.centerMoveTo( this.position );
					docker.setDockedShape( this.currentParent );
				}
				
				this.facade.getCanvas().update();
				this.facade.updateSelection();
			},
			rollback: function(){
				this.facade.deleteShape(this.shape);
				this.facade.setSelection(this.selection.without(this.shape));
				this.facade.getCanvas().update();
				this.facade.updateSelection();
			}
		});

		var command = new commandClass(myoption, this._currentParent, this._canAttach, position, this.facade);
		
		this.facade.executeCommands([command]);
		
		this._currentParent = undefined;
	},

	over: function(options){

		var coord = this.facade.eventCoordinates(options.event);
		var myoption = options.option;
		if(myoption.offset) {
			coord.x -= myoption.offset.x;
			coord.y -= myoption.offset.y;
		}

		var aShapes = this.facade.getCanvas().getAbstractShapesAtPosition( coord );

		if(aShapes.length <= 0) {
			return false;
		}

		if(aShapes.length == 1 && aShapes[0] instanceof ORYX.Core.Canvas) {
			this._currentParent = this.facade.getCanvas();
			return false;
		}

		var stencilSet = this.facade.getStencilset();

		var stencil = stencilSet.stencil(myoption.type);

		if(stencil.type() === "node") {
			
			var parentCandidate = aShapes.reverse().find(function(candidate) {
				return (candidate instanceof ORYX.Core.Canvas 
						|| candidate instanceof ORYX.Core.Node
						|| candidate instanceof ORYX.Core.Edge);
			});
			
			if(  parentCandidate !== this._lastOverElement){
				this._canAttach  = undefined;
				this._canContain = undefined;
			}
			
			if( parentCandidate ) {
				//check containment rule					
				if (!(parentCandidate instanceof ORYX.Core.Canvas) && parentCandidate.isPointOverOffset(coord.x, coord.y) && this._canAttach == undefined) {
				
					this._canAttach = this.facade.getRules().canConnect({sourceShape:parentCandidate, edgeStencil:stencil, targetStencil:stencil});
					
					if( this._canAttach ){
						// Show Highlight
						this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW,
							highlightId: "shapeRepo.attached",
							elements: [parentCandidate],
							style: ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,
							color: ORCHESTRATOR.CONFIG.SELECTION_VALID_COLOR
						});
						
						this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"shapeRepo.added"});
						
						this._canContain = undefined;
					}
				}
				
				if(!(parentCandidate instanceof ORYX.Core.Canvas) && !parentCandidate.isPointOverOffset(coord.x, coord.y)){
					this._canAttach = this._canAttach == false ? this._canAttach : undefined;						
				}
				
				if( this._canContain == undefined && !this._canAttach) {
					this._canContain = this.facade.getRules().canContain({containingShape:parentCandidate, containedStencil:stencil});

					// Show Highlight
					this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW,
											highlightId:'shapeRepo.added',
											elements:	[parentCandidate],
											color:		this._canContain ? ORCHESTRATOR.CONFIG.SELECTION_VALID_COLOR : ORCHESTRATOR.CONFIG.SELECTION_INVALID_COLOR
										});	
					this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"shapeRepo.attached"});
				}

				this._currentParent = this._canContain || this._canAttach ? parentCandidate : undefined;
				this._lastOverElement = parentCandidate;
			} 
		} else { //Edge
			this._currentParent = this.facade.getCanvas();
		}		
		
		return false;
	}	
};
ORYX.Plugins.ShapeRepository = Clazz.extend(ORYX.Plugins.ShapeRepository);
