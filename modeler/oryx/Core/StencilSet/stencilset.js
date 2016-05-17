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

if (!ORYX) { var ORYX = {}; }
if (!ORYX.Core) { ORYX.Core = {}; }
if (!ORYX.Core.StencilSet) { ORYX.Core.StencilSet = {}; }

/**
 * This class represents a stencil set. It offers methods for accessing
 *  the attributes of the stencil set description JSON file and the stencil set's
 *  stencils.
 */
ORYX.Core.StencilSet.StencilSet = {

    /**
     * Constructor
     * @param source {URL} A reference to the stencil set specification.
     *
     */
    construct: function(){
        arguments.callee.$.construct.apply(this, arguments);
        
		this._extensions = new ORYX.Hash();
        
        this._jsonObject = {};
        
        this._stencils = new ORYX.Hash();
		this._availableStencils = new ORYX.Hash();
        
	    this._init();
    },
    
    /**
     * @param {ORYX.Core.StencilSet.StencilSet} stencilSet
     * @return {Boolean} True, if stencil set has the same namespace.
     */
    equals: function(stencilSet){
        return (this.namespace() === stencilSet.namespace());
    },
    
	/**
	 * 
	 * @param {Oryx.Core.StencilSet.Stencil} rootStencil If rootStencil is defined, it only returns stencils
	 * 			that could be (in)direct child of that stencil.
	 */
    stencils: function(rootStencil, rules, sortByGroup){
		if(rootStencil && rules) {
			var stencils = this._availableStencils.values();
			var containers = [rootStencil];
			var checkedContainers = [];
			
			var result = [];
			
			while (containers.size() > 0) {
				var container = containers.pop();
				checkedContainers.push(container);
				var children = stencils.findAll(function(stencil){
					var args = {
						containingStencil: container,
						containedStencil: stencil
					};
					return rules.canContain(args);
				});
				for(var i = 0; i < children.size(); i++) {
					if (!checkedContainers.member(children[i])) {
						containers.push(children[i]);
					}
				}
				result = result.concat(children).uniq();
			}
			
			// Sort the result to the origin order
			result = result.sortBy(function(stencil) {
				return stencils.indexOf(stencil);
			});
			
			
			if(sortByGroup) {
				result = result.sortBy(function(stencil) {
					return stencil.groups()[0];
				});
			}
			
			var edges = stencils.findAll(function(stencil) {
				return stencil.type() == "edge";
			});
			result = result.concat(edges);
			
			return result;
			
		} else {
        	if(sortByGroup) {
				return this._availableStencils.values().sortBy(function(stencil) {
					return stencil.groups()[0];
				});
			} else {
				return this._availableStencils.values();
			}
		}
    },
    
    nodes: function(){
        return this._availableStencils.values().findAll(function(stencil){
            return (stencil.type() === 'node');
        });
    },
    
    edges: function(){
        return this._availableStencils.values().findAll(function(stencil){
            return (stencil.type() === 'edge');
        });
    },
    
    stencil: function(id){
        return this._stencils.get(this.namespace() + id);
    },
    
    title: function(){
        return this._jsonObject.title;
    },
    
    description: function(){
        return this._jsonObject.description;
    },
    
    namespace: function(){
        return this._jsonObject ? this._jsonObject.namespace : null;
    },
    
    jsonRules: function(){
        return this._jsonObject ? this._jsonObject.rules : null;
    },
    
    source: function(){
        return this._source;
    },
	
	extensions: function() {
		return this._extensions;
	},
	
    __handleStencilset: function(){
        this._jsonObject = ORCHESTRATOR.model;
        
        // assert it was parsed.
        if (!this._jsonObject) {
            throw "Error evaluating stencilset. It may be corrupt.";
        }
        
            // assert there is a namespace.
            if (!this._jsonObject.namespace || this._jsonObject.namespace === "") 
                throw "Namespace definition missing in stencilset.";
            
            if (!(this._jsonObject.stencils instanceof Array)) 
                throw "Stencilset corrupt.";
            
            // assert namespace ends with '#'.
            if (!this._jsonObject.namespace.endsWith("#")) 
            	this._jsonObject.namespace = this._jsonObject.namespace + "#";
            
            // assert title and description are strings.
            if (!this._jsonObject.title) 
            	this._jsonObject.title = "";
            if (!this._jsonObject.description) 
            	this._jsonObject.description = "";
    },
    
    /**
     * This method is called when the HTTP request to get the requested stencil
     * set succeeds. The response is supposed to be a JSON representation
     * according to the stencil set specification.
     * @param {Object} response The JSON representation according to the
     * 			stencil set specification.
     */
    _init: function(){
    
        // init and check consistency.
        this.__handleStencilset();
		
		var pps = new ORYX.Hash();
		
		// init property packages
		if(this._jsonObject.propertyPackages) {
			PROTOTYPE.$A(this._jsonObject.propertyPackages).each((function(pp) {
				pps.set(pp.name, pp.properties);
			}).bind(this));
		}
		
		var defaultPosition = 0;
		
        // init each stencil
		PROTOTYPE.$A(this._jsonObject.stencils).each((function(stencil){
        	defaultPosition++;
        	
            // instantiate normally.
            var oStencil = new ORYX.Core.StencilSet.Stencil(stencil, this.namespace(), this._baseUrl, this, pps, defaultPosition);      
			this._stencils.set(this.namespace() + oStencil.id(), oStencil);
			this._availableStencils.set(oStencil.id(), oStencil);
            
        }).bind(this));
    },
    
    _cancelInit: function(response){
        this.errornous = true;
    },
    
    toString: function(){
        return "StencilSet " + this.title() + " (" + this.namespace() + ")";
    }
};
ORYX.Core.StencilSet.StencilSet = Clazz.extend(ORYX.Core.StencilSet.StencilSet);
