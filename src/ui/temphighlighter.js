"use strict";

var Range = require('xpath-range').Range;
var util = require('../util');

var $ = util.$;
var Promise = util.Promise;

function DataRange(range, field, dataNum) {
    this.range = range;
    this.field = field;
    this.dataNum = dataNum;
}



// highlightRange wraps the DOM Nodes within the provided range with a highlight
// element of the specified class and returns the highlight Elements.
//
// normedRange - A NormalizedRange to be highlighted.
// cssClass - A CSS class to use for the highlight (default: 'annotator-hl')
//
// Returns an array of highlight Elements.
function highlightRange(normedRange, cssClass, dataRange) {
    if (typeof cssClass === 'undefined' || cssClass === null) {
        cssClass = 'annotator-temphl';
    }
    var white = /^\s*$/;

    // Ignore text nodes that contain only whitespace characters. This prevents
    // spans being injected between elements that can only contain a restricted
    // subset of nodes such as table rows and lists. This does mean that there
    // may be the odd abandoned whitespace node in a paragraph that is skipped
    // but better than breaking table layouts.
    var nodes = normedRange.textNodes(),
        results = [];

    for (var i = 0, len = nodes.length; i < len; i++) {
        var node = nodes[i];
        if (!white.test(node.nodeValue)) {
            var mphl = global.document.createElement('span');
            mphl.className = cssClass;
            mphl.setAttribute("name", "annotator-currhl");
            // add data field and data num for mp highlights 
            mphl.setAttribute("fieldName", dataRange.field);
            mphl.setAttribute("dataNum", dataRange.dataNum);
            node.parentNode.replaceChild(mphl, node);
            mphl.appendChild(node);
            results.push(mphl);
        }
    }
    return results;
}


// reanchorRange will attempt to normalize a range, swallowing Range.RangeErrors
// for those ranges which are not reanchorable in the current document.
function reanchorRange(range, rootElement) {
    try {
        return Range.sniff(range).normalize(rootElement);
    } catch (e) {
        if (!(e instanceof Range.RangeError)) {
            // Oh Javascript, why you so crap? This will lose the traceback.
            throw(e);
        }
        // Otherwise, we simply swallow the error. Callers are responsible
        // for only trying to draw valid annotations.
        console.log(e);
    }

    console.log("[ERROR] mphighlighter - reanchorRange - return null");
    return null;
}


// Highlighter provides a simple way to draw highlighted <span> tags over
// annotated ranges within a document.
//
// element - The root Element on which to dereference annotation ranges and
//           draw highlights.
// options - An options Object containing configuration options for the plugin.
//           See `Highlighter.options` for available options.
//
var currHighlighter = exports.currHighlighter = function Highlighter(element, options) {
    this.element = element;
    this.options = $.extend(true, {}, Highlighter.options, options);
};

currHighlighter.prototype.destroy = function () {
    $(this.element)
        .find("." + this.options.highlightClass)
        .each(function (_, el) {
            $(el).contents().insertBefore(el);
            $(el).remove();
        });
};

// Public: Draw highlights for the MP annotation.
// Including: claim, [{data, method, material}, {..}]
// annotation - An annotation Object for which to draw highlights.
//
// Returns an Array of drawn highlight elements.
currHighlighter.prototype.draw = function (annotation, inputType) {

    //console.log('currhighlighter - draw anntype');
    if(annotation.annotationType!=undefined) {
        if (annotation.annotationType != "MP")
            return null;
    }
    var dataRangesL = [];

    try {
        if(currFormType == "claim"||inputType == "add") {
            // draw MP claim
            for (var i = 0, ilen = annotation.argues.ranges.length; i < ilen; i++) {
                var r = reanchorRange(annotation.argues.ranges[i], this.element);
                if (r !== null) {
                    dataRangesL.push(new DataRange(r, "claim", 0));
                } else {
                    console.log("[ERROR] range failed to reanchor");
                    console.log(r);
                }
            }
        }else {
            // draw MP data
            if (annotation.argues.supportsBy.length != 0) {
                
                var dataL = annotation.argues.supportsBy;
                var data = dataL[currDataNum];
                console.log("TESTING2 " + currFormType);

                
                if (currFormType == "auc") {
                    for (var i = 0, ilen = data.auc.ranges.length; i < ilen; i++) {
                        var r = reanchorRange(data.auc.ranges[i], this.element);
                        if (r !== null) dataRangesL.push(new DataRange(r, "auc", currDataNum));
                    }
                }

                if (currFormType == "cmax") {
                    for (var i = 0, ilen = data.cmax.ranges.length; i < ilen; i++) {
                        var r = reanchorRange(data.cmax.ranges[i], this.element);
                        if (r !== null) dataRangesL.push(new DataRange(r, "cmax", currDataNum));
                    }
                }

                if (currFormType == "clearance") {
                    for (var i = 0, ilen = data.clearance.ranges.length; i < ilen; i++) {
                        var r = reanchorRange(data.clearance.ranges[i], this.element);
                        if (r !== null) dataRangesL.push(new DataRange(r, "clearance", currDataNum));
                    }
                }

                if (currFormType == "halflife") {
                    for (var i = 0, ilen = data.halflife.ranges.length; i < ilen; i++) {
                        var r = reanchorRange(data.halflife.ranges[i], this.element);
                        if (r !== null) dataRangesL.push(new DataRange(r, "halflife", currDataNum));
                    }
                }

                // draw MP Material
                var material = data.supportsBy.supportsBy;
                if (material != null) {

                    if (currFormType == "participants") {
                        for (var i = 0, ilen = material.participants.ranges.length; i < ilen; i++) {
                            var r = reanchorRange(material.participants.ranges[i], this.element);
                            //if (r !== null) normedRanges.push(r);
                            if (r !== null) dataRangesL.push(new DataRange(r, "participants", currDataNum));
                        }
                    }

                    if (currFormType == "dose1") {
                        for (var i = 0, ilen = material.drug1Dose.ranges.length; i < ilen; i++) {
                            var r = reanchorRange(material.drug1Dose.ranges[i], this.element);
                            if (r !== null) dataRangesL.push(new DataRange(r, "dose1", currDataNum));
                        }
                    }
                    if (currFormType == "dose2") {
                        for (var i = 0, ilen = material.drug2Dose.ranges.length; i < ilen; i++) {
                            var r = reanchorRange(material.drug2Dose.ranges[i], this.element);
                            if (r !== null) dataRangesL.push(new DataRange(r, "dose2", currDataNum));
                        }
                    }

                }

            }
        }
    } catch (err) {
        console.log(err);
    }


    for (var j = 0, jlen = dataRangesL.length; j < jlen; j++) {
        var dataNormed = dataRangesL[j];

        highlightRange(dataNormed.range, this.options.highlightClass, dataNormed);
    }

    //deselect browser's highlight
    if ( document.selection ) {
        document.selection.empty();
    } else if ( window.getSelection ) {
        window.getSelection().removeAllRanges();
    }

};

// Public: Remove the drawn highlights for the given MP annotation.
// annotation - An annotation Object for which to purge highlights.
// if local highlights is null, find all span by annotaiton id, then replace with child Nodes
currHighlighter.prototype.undraw = function (annotation) {
    console.log("currhighlighter - undraw");

    var hasHighlights = (typeof annotation._local !== 'undefined' && annotation._local !== null && typeof annotation._local.highlights !== 'undefined' && annotation._local.highlights !== null);

    // when add mp data, annotation._local.highlights is null
    // find highlights of MP annotation, clean span 
    if (!hasHighlights) {
        var localhighlights = $('span[id^="'+annotation.id+'"]');
        for (i = 0; i < localhighlights.length; i++){
            var mpSpan = localhighlights[i];
            if (mpSpan.parentNode !== null)
                $(mpSpan).replaceWith(mpSpan.childNodes);
        }
    } else {
        for (var i = 0, len = annotation._local.highlights.length; i < len; i++)
        {
            var h = annotation._local.highlights[i];
            if (h.parentNode !== null) {
                $(h).replaceWith(h.childNodes);
            }
        }
        delete annotation._local.highlights;
    }
};

currHighlighter.options = {
    // The CSS class to apply to drawn mp
    highlightClass: 'annotator-currhl',
    // Number of annotations to draw at once
    chunkSize: 200,
    // Time (in ms) to pause between drawing chunks of annotations
    chunkDelay: 1
};


// standalone is a module that uses the Highlighter to draw/undraw highlights
// automatically when annotations are created and removed.
exports.standalone = function standalone(element, options) {
    var widget = exports.Highlighter(element, options);

    return {
        destroy: function () { widget.destroy(); },
        annotationCreated: function (ann) { widget.draw(ann); },
        annotationDeleted: function (ann) { widget.undraw(ann); }
    };

};

