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
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.Controls) {ORYX.Core.Controls = {};}


/**
 * @classDescription Represents a magnet that is part of another shape and can
 * be attached to dockers. Magnets are used for linking edge objects
 * to other Shape objects.
 * @extends {Control}
 */
ORYX.Core.Controls.Magnet = {
	construct: function() {
		arguments.callee.$.construct.apply(this, arguments);
		this.bounds.set(0, 0, 16, 16);
		this.raphael = this.paper.set().push(this.paper.circle(8,8,4)).attr({stroke:"none", fill:"red", "fill-opacity":"0.3"});
		this.hide();
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
		this.raphael.transform('t' + p.x + ', ' + p.y).toFront();
	},
	
	toString: function() {
		return "Magnet " + this.id;
	}
};
ORYX.Core.Controls.Magnet = ORYX.Core.Controls.Control.extend(ORYX.Core.Controls.Magnet);
