/**
 * Created by sahinfurkan on 01/07/15.
 */
var getDegrees = function(node){
    var map = {};
    map['amplification-start'] = 3.75;
    map['amplification-end'] = 3.75 + 1.1 * node._private.style['amplification'].value * 100 * 2 * Math.PI / 360;
    map['homozygous-deletion-start'] = map['amplification-end'];
    map['homozygous-deletion-end'] = map['homozygous-deletion-start'] + 1.1 * node._private.style['homozygous-deletion'].value * 100 * 2 * Math.PI / 360;
    map['gain-start'] = map['homozygous-deletion-end'];
    map['gain-end'] = map['gain-start'] + 1.1 * node._private.style['gain'].value * 100 * 2 * Math.PI / 360;
    map['hemizygous-deletion-start'] = map['gain-end'];
    map['hemizygous-deletion-end'] = map['hemizygous-deletion-start'] + 1.1 * node._private.style['hemizygous-deletion'].value * 100 * 2 * Math.PI / 360;
    map['mutated-start'] = 5.85;
    map['mutated-end'] = map['mutated-start'] + node._private.style['mutated'].value * 100 * 2 * Math.PI / 360;
    map['up-regulated-start'] = 3.58;
    map['up-regulated-end'] = map['up-regulated-start'] - 1.1 * node._private.style['up-regulated'].value * 100 * 2 * Math.PI / 360;
    map['down-regulated-start'] = map['up-regulated-end'];
    map['down-regulated-end'] = map['down-regulated-start'] - 1.1 * node._private.style['down-regulated'].value * 100 * 2 * Math.PI / 360;
    return map;
};

var mutNames = ['amplification', 'homozygous-deletion', 'gain', 'hemizygous-deletion', 'mutated', 'up-regulated', 'down-regulated'];
var rgbs     = ['rgb(254,80,51)', 'rgb(53,91,255)', 'rgb(255,208,214)', 'rgb(158,223,224)', 'rgb(50,161,50)', 'rgb(250,185,182)', 'rgb(147,187,221)'];

(function ($$) {"use strict";
    var CanvasRenderer = $$('renderer', 'canvas');
    var CRp = CanvasRenderer.prototype;


    //add showDetails property to css features
    $$.style.types.trueOrFalse = {enums: ['true', 'false']};
    $$.style.properties.push({name: 'show-details', type: $$.style.types.trueOrFalse});
    $$.style.properties['show-details'] = {name: 'show-details', type: $$.style.types.trueOrFalse};

    $$.style.properties.push({name: 'amplification', type: $$.style.types.percent});
    $$.style.properties['amplification'] = {name: 'amplification', type: $$.style.types.percent};

    $$.style.properties.push({name: 'mutated', type: $$.style.types.percent});
    $$.style.properties['mutated'] = {name: 'mutated', type: $$.style.types.percent};

    $$.style.properties.push({name: 'homozygous-deletion', type: $$.style.types.percent});
    $$.style.properties['homozygous-deletion'] = {name: 'homozygous-deletion', type: $$.style.types.percent};

    $$.style.properties.push({name: 'gain', type: $$.style.types.percent});
    $$.style.properties['gain'] = {name: 'gain', type: $$.style.types.percent};

    $$.style.properties.push({name: 'hemizygous-deletion', type: $$.style.types.percent});
    $$.style.properties['hemizygous-deletion'] = {name: 'hemizygous-deletion', type: $$.style.types.percent};

    $$.style.properties.push({name: 'up-regulated', type: $$.style.types.percent});
    $$.style.properties['up-regulated'] = {name: 'up-regulated', type: $$.style.types.percent};

    $$.style.properties.push({name: 'down-regulated', type: $$.style.types.percent});
    $$.style.properties['down-regulated'] = {name: 'down-regulated', type: $$.style.types.percent};

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
            var degrees = getDegrees(node);
            if (node._private.style['amplification'].value + node._private.style['homozygous-deletion'].value  + node._private.style['gain'].value
                + node._private.style['hemizygous-deletion'].value  > 1 ||
                node._private.style['up-regulated'].value  + node._private.style['down-regulated'].value > 1 ||
                node._private.style['mutated'] > 1)
            {

                console.log("Inappropriate inputs!");
                return;
            }
            context.fillStyle = "#FF0000";
            context.shadowColor = "grey";
            context.shadowBlur = 0;

            for (var i = 0; i < 7; i++) {
                context.beginPath();
                if (i < 5)
                    context.arc(node._private.position['x'], node._private.position['y'], node._private.style['width'].value + 10,
                        degrees[mutNames[i] + '-start'], degrees[mutNames[i] + '-end'], 0);
                else{
                    context.arc(node._private.position['x'], node._private.position['y'], node._private.style['width'].value + 10,
                        degrees[mutNames[i] + '-start'], degrees[mutNames[i] + '-end'], 1);
                }
                context.strokeStyle = "rgba(255,255,255,0)";
                context.lineTo(node._private.position['x'],
                    node._private.position['y']);
                context.fillStyle = rgbs[i];
                context.fill();
                context.closePath();
                context.stroke();
            }

            

            context.beginPath();


            context.strokeStyle = "black";
            context.shadowBlur = 10;
            context.lineWidth = 1;
            context.arc(node._private.position['x'],node._private.position['y'],node._private.style['width'].value + 10,
                3.75,5.67, 0);
            context.lineTo(node._private.position['x'],
                node._private.position['y']);

            context.arc(node._private.position['x'],node._private.position['y'],node._private.style['width'].value + 10,
                5.85,7.76, 0);
            context.lineTo(node._private.position['x'],
                node._private.position['y']);
            context.arc(node._private.position['x'],node._private.position['y'],node._private.style['width'].value + 10,
                1.66, 3.58, 0);
            context.lineTo(node._private.position['x'],
                node._private.position['y']);

            context.closePath();
            context.stroke();
        }



    }
})(cytoscape);