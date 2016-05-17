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

ORYX.Plugins.AddDocker = {
	/**
	 *	Constructor
	 *	@param {Object} Facade: The Facade of the Editor
	 */
	construct: function(facade) {
		this.facade = facade;

		this.callbackMouseDown = this.handleMouseDown.bind(this);
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.DBLCLICK, this.callbackMouseDown);
	},
	
	enableReadOnlyMode: function(){
		this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.DBLCLICK, this.callbackMouseDown);
	},
	
	disableReadOnlyMode: function(){
		this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.DBLCLICK, this.callbackMouseDown);
	},
	
	/**
	 * MouseDown Handler
	 *
	 */	
	handleMouseDown: function(event, uiObj) {
		if(uiObj instanceof ORYX.Core.Controls.Docker && uiObj.parent instanceof ORYX.Core.Edge) {
			this.newDockerCommand({
				adding: false,
				edge: uiObj.parent,
				docker: uiObj
			});
		} else if (uiObj instanceof ORYX.Core.Edge) {
            this.newDockerCommand({
            	adding: true,
                edge: uiObj,
                position: this.facade.eventCoordinates(event)
            });
		}
	},
    
    // Options: edge (required), position (required if add), docker (required if delete)
    newDockerCommand: function(options){
        if(!options.edge)
            return;

        var commandClass = ORYX.Core.Command.extend({
            construct: function(addEnabled, deleteEnabled, edge, docker, pos, facade){
                this.addEnabled = addEnabled;
                this.deleteEnabled = deleteEnabled;
                this.edge = edge;
                this.docker = docker;
                this.pos = pos;
                this.facade = facade;
				//this.index = docker.parent.dockers.indexOf(docker);
            },
            execute: function(){
                if (this.addEnabled) {
					if (!this.docker){
                    	this.docker = this.edge.addDocker(this.pos);
						this.index = this.edge.dockers.indexOf(this.docker);
					} else {
                    	this.edge.add(this.docker, this.index);
					}
                }
                else if (this.deleteEnabled) {
					this.index = this.edge.dockers.indexOf(this.docker);
                    this.pos = this.docker.bounds.center();
                    this.edge.removeDocker(this.docker);
                }
                this.edge.getLabels().invoke("show");
                this.facade.getCanvas().update();
                this.facade.updateSelection();
                if(this.addEnabled) {
                	this.docker.show();
                }
            },
            rollback: function(){
                if (this.addEnabled) {
                    if (this.docker instanceof ORYX.Core.Controls.Docker) {
                        this.edge.removeDocker(this.docker);
                    }
                }
                else if (this.deleteEnabled) {
                    this.edge.add(this.docker, this.index);
                }
                this.edge.getLabels().invoke("show");
                this.facade.getCanvas().update();
                this.facade.updateSelection();
            }
        });
        
        var command = new commandClass(options.adding, !options.adding, options.edge, options.docker, options.position, this.facade);
        
        try {
        	this.facade.executeCommands([command]);
        } catch(e) {
        	ORYX.Log.exception(e);
        }
    }
};
ORYX.Plugins.AddDocker = Clazz.extend(ORYX.Plugins.AddDocker);
