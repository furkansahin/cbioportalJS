/**
 * Created by sahinfurkan on 01/07/15.
 */
(function ($$) {"use strict";
    var CanvasRenderer = $$('renderer', 'canvas');
    var CRp = CanvasRenderer.prototype;

    //add showDetails property to css features
    $$.style.types.trueOrFalse = {enums: ['true', 'false']};
    $$.style.properties.push({name: 'show-details', type: $$.style.types.trueOrFalse});
    $$.style.properties['show-details'] = {name: 'show-details', type: $$.style.types.trueOrFalse};



    // Draw node
    CRp.drawNode = function(context, node, drawOverlayInstead) {

        if(node._private.style['show-details'] === true){
            node.css('opacity', 1.0);
            node.css('background-opacity', 1.0);
        }

        var r = this;
        var nodeWidth, nodeHeight;
        var style = node._private.style;
        var rs = node._private.rscratch;
        var _p = node._private;

        var usePaths = CanvasRenderer.usePaths();
        var canvasContext = context;
        var path;
        var pathCacheHit = false;

        var overlayPadding = style['overlay-padding'].pxValue;
        var overlayOpacity = style['overlay-opacity'].value;
        var overlayColor = style['overlay-color'].value;

        if (drawOverlayInstead && overlayOpacity === 0) { // exit early if drawing overlay but none to draw
            return;
        }

        var parentOpacity = node.effectiveOpacity();
        if (parentOpacity === 0) {
            return;
        }

        nodeWidth = this.getNodeWidth(node);
        nodeHeight = this.getNodeHeight(node);

        context.lineWidth = style['border-width'].pxValue;

        if (drawOverlayInstead === undefined || !drawOverlayInstead) {

            var url = style['background-image'].value[2] ||
                style['background-image'].value[1];
            var image;

            if (url !== undefined) {

                // get image, and if not loaded then ask to redraw when later loaded
                image = this.getCachedImage(url, function () {
                    r.data.canvasNeedsRedraw[CanvasRenderer.NODE] = true;
                    r.data.canvasNeedsRedraw[CanvasRenderer.DRAG] = true;

                    r.drawingImage = true;

                    r.redraw();
                });

                var prevBging = _p.backgrounding;
                _p.backgrounding = !image.complete;

                if (prevBging !== _p.backgrounding) { // update style b/c :backgrounding state changed
                    node.updateStyle(false);
                }
            }

            // Node color & opacity

            var bgColor = style['background-color'].value;
            var borderColor = style['border-color'].value;
            var borderStyle = style['border-style'].value;

            this.fillStyle(context, bgColor[0], bgColor[1], bgColor[2], style['background-opacity'].value * style['opacity'].value * parentOpacity);

            this.strokeStyle(context, borderColor[0], borderColor[1], borderColor[2], style['border-opacity'].value * style['opacity'].value * parentOpacity);

            var shadowBlur = style['shadow-blur'].pxValue;
            var shadowOpacity = style['shadow-opacity'].value;
            var shadowColor = style['shadow-color'].value;
            var shadowOffsetX = style['shadow-offset-x'].pxValue;
            var shadowOffsetY = style['shadow-offset-y'].pxValue;

            this.shadowStyle(context, shadowColor, shadowOpacity, shadowBlur, shadowOffsetX, shadowOffsetY);

            context.lineJoin = 'miter'; // so borders are square with the node shape

            if (context.setLineDash) { // for very outofdate browsers
                switch (borderStyle) {
                    case 'dotted':
                        context.setLineDash([1, 1]);
                        break;

                    case 'dashed':
                        context.setLineDash([4, 2]);
                        break;

                    case 'solid':
                    case 'double':
                        context.setLineDash([]);
                        break;
                }
            }


            var styleShape = style['shape'].strValue;

            var pos = node._private.position;

            if (usePaths) {
                var pathCacheKey = styleShape + '$' + nodeWidth + '$' + nodeHeight;

                context.translate(pos.x, pos.y);

                if (rs.pathCacheKey === pathCacheKey) {
                    path = context = rs.pathCache;
                    pathCacheHit = true;
                } else {
                    path = context = new Path2D();
                    rs.pathCacheKey = pathCacheKey;
                    rs.pathCache = path;
                }
            }

            if (!pathCacheHit) {

                var npos = pos;

                if (usePaths) {
                    npos = {
                        x: 0,
                        y: 0
                    };
                }

                CanvasRenderer.nodeShapes[this.getNodeShape(node)].drawPath(
                    context,
                    npos.x,
                    npos.y,
                    nodeWidth,
                    nodeHeight);
            }

            context = canvasContext;

            if (usePaths) {
                context.fill(path);
            } else {
                context.fill();
            }

            this.shadowStyle(context, 'transparent', 0); // reset for next guy

            if (url !== undefined) {
                if (image.complete) {
                    this.drawInscribedImage(context, image, node);
                }
            }

            var darkness = style['background-blacken'].value;
            var borderWidth = style['border-width'].pxValue;

            if (this.hasPie(node)) {
                this.drawPie(context, node);

                // redraw path for blacken and border
                if (darkness !== 0 || borderWidth !== 0) {

                    if (!usePaths) {
                        CanvasRenderer.nodeShapes[this.getNodeShape(node)].drawPath(
                            context,
                            pos.x,
                            pos.y,
                            nodeWidth,
                            nodeHeight);
                    }
                }
            }

            if (darkness > 0) {
                this.fillStyle(context, 0, 0, 0, darkness);

                if (usePaths) {
                    context.fill(path);
                } else {
                    context.fill();
                }

            } else if (darkness < 0) {
                this.fillStyle(context, 255, 255, 255, -darkness);

                if (usePaths) {
                    context.fill(path);
                } else {
                    context.fill();
                }
            }

            // Border width, draw border
            if (borderWidth > 0) {

                if (usePaths) {
                    context.stroke(path);
                } else {
                    context.stroke();
                }

                if (borderStyle === 'double') {
                    context.lineWidth = style['border-width'].pxValue / 3;

                    var gco = context.globalCompositeOperation;
                    context.globalCompositeOperation = 'destination-out';

                    if (usePaths) {
                        context.stroke(path);
                    } else {
                        context.stroke();
                    }

                    context.globalCompositeOperation = gco;
                }

            }

            if (usePaths) {
                context.translate(-pos.x, -pos.y);
            }

            // reset in case we changed the border style
            if (context.setLineDash) { // for very outofdate browsers
                context.setLineDash([]);
            }

            // draw the overlay
        } else {

            if (overlayOpacity > 0) {
                this.fillStyle(context, overlayColor[0], overlayColor[1], overlayColor[2], overlayOpacity);

                CanvasRenderer.nodeShapes['roundrectangle'].drawPath(
                    context,
                    node._private.position.x,
                    node._private.position.y,
                    nodeWidth + overlayPadding * 2,
                    nodeHeight + overlayPadding * 2
                );

                context.fill();
            }
        }
        if (node._private.style['show-details'] === true)
        {
            context.fillStyle = "#FF0000";
            context.shadowColor = "grey";
            context.shadowBlur = 0;
            context.beginPath();

            context.arc(node._private.position['x'],node._private.position['y'],node._private.style['width'].value + 10,
                0,2 * Math.PI/6-0.175, 0);
            context.strokeStyle = "rgba(255,255,255,0)";
            context.lineTo(node._private.position['x'],
                node._private.position['y']);
            context.fillStyle = "rgb(0,0,255)";
            context.fill();
            context.closePath();
            context.stroke();
            context.beginPath();
            context.strokeStyle = "black"
            context.shadowBlur = 10;
            context.lineWidth = 1;
            context.arc(node._private.position['x'],node._private.position['y'],node._private.style['width'].value + 10,
                0,2 * Math.PI/3-0.175, 0);
            context.lineTo(node._private.position['x'],
                node._private.position['y']);

            context.arc(node._private.position['x'],node._private.position['y'],node._private.style['width'].value + 10,
                2 * Math.PI/3,4 * Math.PI/3-0.175, 0);
            context.lineTo(node._private.position['x'],
                node._private.position['y']);
            context.arc(node._private.position['x'],node._private.position['y'],node._private.style['width'].value + 10,
                4 * Math.PI/3,2 * Math.PI-0.175, 0);
            context.lineTo(node._private.position['x'],
                node._private.position['y']);
            context.lineTo(node._private.position['x'] + node._private.style['width'].value + 10,
                node._private.position['y']);
            context.closePath();
            //     context.moveTo(-this.getNodeWidth(node) / 2, -this.getNodeHeight(node) / 2 + 5);

            /*
             context.ellipse(node._private.position['x'],node._private.position['y'],node._private.style['width'].value + 10,
             node._private.style['height'].value + 10,0,2 * Math.PI/3,4 * Math.PI/3);

             context.ellipse(node._private.position['x'],node._private.position['y'],node._private.style['width'].value + 10,
             node._private.style['height'].value + 10,0,4 * Math.PI/3,2 * Math.PI);
             */
            context.stroke();
        }



    }
})(cytoscape);