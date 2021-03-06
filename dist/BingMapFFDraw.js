/*! BingMapFFDraw - v0.0.1 - 2013-08-20
* https://github.com/dannyrscott/BingMapFreeFormDraw
* Copyright (c) 2013 Danny Scott; Licensed MIT */
/*! BingMapFFDraw - v0.0.1 - 2013-06-14
* https://github.com/dannyrscott/BingMapFreeFormDraw
* Copyright (c) 2013 Danny Scott; Licensed MIT */
(function(exports) {

  'use strict';

  var BingDrawFF = function(map, opts) {
	var _map = map, //The Bing Map itself
		_self = this, //holder for this
		MM = Microsoft.Maps, //shorthand for Microsoft Map object
		drawLayer = new MM.EntityCollection(), //Layer for drawing on
		previewLine = new MM.Polyline(), //Preview Polyline
		previewPoints = [], //Points in the polyline
		_shape, //Finished Polygon
		_drawEvent, //Mousemove draw event
		_endEvent, //Stop drawing "click" event
		_startEvent, //Start drawing "click" event
		_dragEvent, //Stops/starts the drag event
		_drawing = false, //Are we currently drawing
		_inDrawingMode = false, //Are we in drawing mode
		_drawMode = 'click', //Click or "hold"
		_startDrawEvent = 'click', //How do we "start drawing"
		_endDrawEvent = 'click';

	var options = opts || {};
	options.onDrawEnd = options.onDrawEnd || function() {};
	options.polygon = options.polygon || {};
	options.holdToDraw = options.holdToDraw || false;

	if (options.holdToDraw) {
		_startDrawEvent = 'mousedown';
		_endDrawEvent = 'mouseup';
	}

	_shape = new MM.Polygon(null,options.polygon);
	_map.entities.push(drawLayer);  //Push the drawing layer to the map
	drawLayer.push(previewLine); //Push the previewline to the drawing layer
	drawLayer.push(_shape); //Push the final shape to the drawing layer


	/*
	 * Stop Drag
	 */
	var _stopDrag = function() {
		_dragEvent = MM.Events.addHandler(_map,"mousemove",function(e){
			e.handled = true;
		});
	};
	/*
	 * start Drag
	 */
	var _startDrag = function() {
		MM.Events.removeHandler(_dragEvent);
	};
	/*
	 * _beginDraw function
	 * Starts us drawing.
	 */
	var _beginDraw = function() {
		opts = opts || {};

		var endCallback = opts.onDrawEnd || function() {}; //after drawing ends callback
		if (_drawing) {
			return; //Already drawing, do nothing
		}
		_drawing = true; //Start drawing;

		_shape.setLocations([]); //Empty the shape;

		_stopDrag();
		//Bind the drawing event to the mouse move.  Throttled to 100 ms
		_drawEvent = MM.Events.addThrottledHandler(_map,"mousemove",function(e){
			previewPoints = previewLine.getLocations() || []; //Get Current locations, or empty array if first location
			var point = new MM.Point(e.getX(),e.getY()); //Turn mouse location into a MM Point
			//Attempt to convert MM Point into MM.Location
			var loc;
			try {
				loc = e.target.tryPixelToLocation(point);
			} catch(err) {
				loc = false;
			}
			//We got a Location, add it to the preview;
			if (loc) {
				previewPoints.push(loc);
				previewLine.setLocations(previewPoints);
			}
		},100);

		//Drawing end event.
		_endEvent = MM.Events.addHandler(_map,_endDrawEvent,function(e){
			_endDraw(endCallback); //Stop drawing
			_startDrag(); //Enable dragging again
			MM.Events.removeHandler(_endEvent); //Remove the event
			_self.endDrawingMode();
		});
	};


	var _endDraw = function() {

		//Remove Drawing Events
		MM.Events.removeHandler(_drawEvent);
		var shapePoints = previewLine.getLocations();

		if (shapePoints.length) {
			shapePoints.push(shapePoints[0]); //Make the last point the same as the first point.  Finish the polygon.
		}
		previewLine.setLocations([]); //Empty out the preview line

		_shape.setLocations(shapePoints); //Set the points on the new shape
		_drawing = false; //No longer drawing
		options.onDrawEnd(_shape); //Run the Callback
	};

	/*
	 * Enter Drawing Mode
	 * Registers the beginDraw event to the click action of the map
	 */
	this.enterDrawingMode = function() {
		if (_inDrawingMode) {
			return; // already in this mode
		}
		_inDrawingMode = true;
		_startEvent = MM.Events.addHandler(_map,_startDrawEvent,function(e){
			MM.Events.removeHandler(_startEvent);
			_beginDraw();
		});
	};

	/*
	 * End drawing mode;
	 */
	this.endDrawingMode = function() {
		_inDrawingMode = false;
		MM.Events.removeHandler(_startEvent);
		if (_drawing) {
			_drawing = false;
			_endDraw();
		}
	};

	/*
	 * inDrawingMode
	 */
	this.inDrawingMode = function() {
		return _inDrawingMode;
	};

	/*
	 * isDrawing
	 */
	this.isDrawing = function() {
		return _drawing;
	};
	/*
	 * Get the shape
	 */
	this.getShape = function() {
		return _shape;
	};

	/*
	 * Get the drawLayer
	 */
	this.getLayer = function() {
		return drawLayer;
	};
  };

  exports.BingDrawFF = BingDrawFF;
}(typeof exports === 'object' && exports || this));