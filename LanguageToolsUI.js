/**
 * Created by jemenake on 6/4/15.
 */

///////////////////////////////////////////////////
/////////// onClick target functions //////////////
///////////////////////////////////////////////////
function showStringsForSandbox(source) {
    var container = $( source).parent();
    var name = container.data('sandbox').engine.toString();
    alert("Strings for sandbox " + name);
}

function compareSandbox(source) {
    alert("Comparing sandboxes");
}

function unionSandbox(source) {
    alert("Unioning sandboxes");
}

function intersectSandbox(source) {
    alert("Intersecting sandboxes");
}

function editSandbox(source) {
    alert("Editing sandbox");
}

function generateDFA(source) {

}

function generateNFA(source) {
    var column = 0;
    sandbox_columns[column].push(new AutomataSandbox(getEngineFromSource(source).constructNFA()));
    renderSandboxes();
}

function generateRegExp(source) {
    var column = 0;
    sandbox_columns[column].push(new RegExpSandbox(getEngineFromSource(source).constructRegExp()));
    renderSandboxes();
}

function generateGrammar(source) {
    var column = 0;
    sandbox_columns[column].push(new GrammarSandbox(getEngineFromSource(source).constructGrammar()));
    renderSandboxes();
}

function removeSandbox(source) {
    // This is ugly. Get the Sandbox object and then find the item in the sandbox_columns which matches it
    var sandbox = getContainingSandboxDiv(source).data('sandbox');
    for(var col=0; col<sandbox_columns.length; col++) {
        for(var row=0; row<sandbox_columns[col].length; row++) {
            if(sandbox_columns[col][row] === sandbox) {
                // Delete this sandbox from the array
                sandbox_columns[col].splice(row, 1);
                row--; // We shouldn't find any other matches, but just in case
            }
        }
    }
    renderSandboxes();
}

///////////////// Sandbox class ///////////////////
//region Sandbox
function Sandbox() {
    if (! (this instanceof Sandbox)) {
        throw "Sandbox was instantiated without 'new'";
    }
    this.div = undefined;
    this.engine = undefined;
}

Sandbox.prototype.generateSingleSandboxDiv = function() {
    this.div = createFullWidthDiv();
    $(this.div).addClass('sandbox');
    $(this.div).data('sandbox',this);
    var titlebar = createFullWidthDiv(this.engine.getName());
    $(titlebar).addClass('text-center sandboxtitle');
    this.div.appendChild(titlebar);
    this.div.appendChild(this.renderContents());
    this.div.appendChild(createButton("Strings","showStringsForSandbox(this)","See a list of strings accepted by this object"));
    this.div.appendChild(createButton("Compare","compareSandbox(this)","Compare this object with any other"));
    this.div.appendChild(createButton("Union","unionSandbox(this)","Union this object's language with another's"));
    this.div.appendChild(createButton("Intersect","intersectSandbox(this)","Intersect this object's language with another's"));
    this.div.appendChild(createButton("Edit","editSandbox(this)","Edit this item"));
    this.div.appendChild(createButton("Delete","removeSandbox(this)","Delete this object"));
    $(this.div).children("#Union").prop("disabled",true);
    $(this.div).children("#Intersect").prop("disabled",true);
    $(this.div).children("#Edit").prop("disabled",true);
    for(var button of this.getExtraButtons()) {
        this.div.appendChild(button);
    }
    return this.div;
};

Sandbox.prototype.getExtraButtons = function() {
    return [];
};

Sandbox.prototype.renderContents = function() {
    console.log("renderContents needs to be overridden");
    return createFullWidthDiv("renderContents needs to be overridden");
};
//endregion

///////////////// AutomataSandbox //////////////////
//region AutomataSandbox
AutomataSandbox.prototype = new Sandbox();
function AutomataSandbox(engine) {
    if (! (this instanceof AutomataSandbox)) {
        throw "AutomataSandbox was instantiated without 'new'";
    }
    if(engine === undefined) {
        // Create automata to accept (ab)*
        this.engine = new FiniteAutomata();
        this.engine.addTransition('q0', 'a', 'q1');
        this.engine.addTransition('q1', 'b', 'q0');
        this.engine.setAccepting('q0');
    } else {
        if(engine instanceof FiniteAutomata) {
            this.engine = engine;
        } else {
            throw "Can't create an AutomataSandbox from a " + (typeof engine);
        }
    }
}
AutomataSandbox.prototype.getExtraButtons = function() {
    return [
        createButton("Generate DFA","generateDFA(this)","Generate an equivalent DFA from this Automata"),
        createButton("Reduce","reduceNFA(this)","Generate a minimized NFA from this Automata"),
        createButton("Generate Grammar","generateGrammar(this)","Generate an equivalent DFA from this Automata"),
        createButton("Generate RegExp","generateRegExp(this)","Generate an equivalent DFA from this Automata")
    ]
};
AutomataSandbox.prototype.renderContents = function() {
    // An Automata sandbox will have a canvas for letting the engine draw the state diagram to it
    this.canvas = createFullWidthCanvas("someID");
    this.canvas.setAttribute("class","col-sm-12");
    var context = this.canvas.getContext("2d");
    this.engine.drawStateDiagram(context);
    return this.canvas;
};
//endregion

///////////////// GrammarSandbox //////////////////
//region GrammarSandbox
GrammarSandbox.prototype = new Sandbox();
function GrammarSandbox(engine) {
    if (! (this instanceof GrammarSandbox)) {
        throw "GrammarSandbox was instantiated without 'new'";
    }
    // If they didn't give us a Grammar
    if(engine === undefined) {
        // Create (ab)* grammar
        this.engine = new Grammar();
//    this.engine.addRule("S","abS");
//    this.engine.addRule("S","");
        this.engine.addRule("S","aA");
        this.engine.addRule("A","bB");
        this.engine.addRule("A","b");
        this.engine.addRule("B","aA");
        this.engine.addRule("S","");
    } else {
        if(engine instanceof Grammar) {
            this.engine = engine;
        } else {
            throw "Can't create a GrammarSandbox from a " + (typeof engine);
        }
    }
}
GrammarSandbox.prototype.getExtraButtons = function() {
    return [
        createButton("Generate Automata","generateNFA(this)","Generate an equivalent NFA from this Grammar"),
        createButton("Generate RegExp","generateRegExp(this)","Generate an equivalent DFA from this Automata")
    ]
};
GrammarSandbox.prototype.renderContents = function() {
//    alert(this.engine.getRuleListAsString());
    var div = createFullWidthDiv(this.engine.getRuleListAsString());
    $(div).addClass('text-center sandboxbody');
    return div;
};
//endregion

function setResizeHandler(callback, timeout) {
    var timer_id = undefined;
    window.addEventListener("resize", function() {
        if(timer_id != undefined) {
            clearTimeout(timer_id);
            timer_id = undefined;
        }
        timer_id = setTimeout(function() {
            timer_id = undefined;
            callback();
        }, timeout);
    });
}

function callback() {
    alert("Got called!");
}


//window.addEventListener("resize",function(){
//    if(doCheck){
//        check();
//        doCheck = false;
//        setTimeout(function(){
//            doCheck = true;
//            check();
//        },500)
//    }
//});


(function(){
    //var doCheck = true;
    //var check = function(){
    //    //do the check here and call some external event function or something.
    //};
    //window.addEventListener("resize",function(){
    //    if(doCheck){
    //        check();
    //        doCheck = false;
    //        setTimeout(function(){
    //            doCheck = true;
    //            check();
    //        },500)
    //    }
    //});
})();

///////////////// RegExpSandbox //////////////////
//region RegExpSandbox
RegExpSandbox.prototype = new Sandbox();
function RegExpSandbox(engine) {
    if (! (this instanceof RegExpSandbox)) {
        throw "RegExpSandbox was instantiated without 'new'";
    }
    // If they didn't give us a Grammar
    if(engine === undefined) {
        // Create (ab)* regexp
        this.engine = new ConcatRegExp();
        this.engine.addPiece("ab");
        this.engine.setStar(true);
    } else {
        if(engine instanceof GenericRegExp) {
            this.engine = engine;
        } else {
            throw "Can't create a RegExpSandbox from a " + (typeof engine);
        }
    }
}
RegExpSandbox.prototype.getExtraButtons = function() {
    return [
        createButton("Generate Automata","generateNFA(this)","Generate an equivalent NFA from this RegExp"),
        createButton("Generate Grammar","generateGrammar(this)","Generate an equivalent Grammar to this RegExp")
    ]
};
RegExpSandbox.prototype.renderContents = function() {
    var div = createFullWidthDiv(this.engine.toString());
    $(div).addClass('text-center sandboxbody');
    return div;
};
//endregion

///////////////////////////////////////////////////
//// Helper functions for the onClick functions ///
///////////////////////////////////////////////////
function getContainingSandboxDiv(source) {
    return $(source).closest(".sandbox");
}

function showStringsForSandbox(source) {
    var sandbox_div = getContainingSandboxDiv(source);
    var sandbox = sandbox_div.data('sandbox');
    alert(sandbox.engine.getAcceptedStrings(10).join("\n"));
}

// Given some DOM element which is inside of a div.sandbox,
// return the "engine" data object for it.
function getEngineFromSource(source) {
    var container = getContainingSandboxDiv(source);
    var a = container.data('sandbox');
    var b = a.engine;
    return getContainingSandboxDiv(source).data('sandbox').engine;
}

function compareSandboxes(sandbox_divs) {
    alert(compareAcceptedStrings(getEngineFromSource(sandbox_divs[0]), getEngineFromSource(sandbox_divs[1]), 10));
}

function compareSandbox(source) {
    var sandbox = getContainingSandboxDiv(source);
    toggleOrProcess(sandbox, "selecteddiv", 2, compareSandboxes);
}

// This is a little peculiar. It is for running a function on a certain number of
// items which have a certain CSS class. If adding this item
function toggleOrProcess(item, css_class, required_count, func) {
    item.toggleClass(css_class);
    var selected_divs = $("." + css_class);
    if(selected_divs.length === required_count) {
        func(selected_divs);
        selected_divs.removeClass(css_class);
    }
}

function getSandboxContainer() {
    return document.getElementById('container')
}

function clearSandboxContainer() {
    getSandboxContainer().innerHTML = "";
}

///////////////////////////////////////////////////
/////////////// Rendering methods /////////////////
////// i.e.  turning the model into the view //////
///////////////////////////////////////////////////
function renderSandboxes() {
    clearSandboxContainer();
    for(var column_index=0; column_index<sandbox_columns.length; column_index++) {
        var div = createSandboxDiv("BLAH");
        div.appendChild(createTopButtons(column_index));
        for(var row_index=0; row_index<sandbox_columns[column_index].length; row_index++) {
            div.appendChild(sandbox_columns[column_index][row_index].generateSingleSandboxDiv());
        }
        getSandboxContainer().appendChild(div);
    }
}

function createSandboxDiv(id) {
    var div = document.createElement("div");
    div.setAttribute('id', id);
    div.setAttribute('class', 'col-sm-5');
    return div
}

function createTopButtons(param) {
    var div = createFullWidthDiv();
    addTopButtons(div, param);
    return div;
}

function addTopButtons(div, parm) {
    div.appendChild(createButton("New RegExp","addRegExpSandbox("+parm+")","Create a new Regular Expression"));
    div.appendChild(createButton("New Grammar","addGrammarSandbox("+parm+")","Create a new Grammar"));
    div.appendChild(createButton("New Automata","addAutomataSandbox("+parm+")","Create a new Finite Automata"));
}

function addSandbox(sandbox, column) {
    sandbox_columns[column].push(sandbox);
    renderSandboxes();
}

function addRegExpSandbox(column) {
    addSandbox(new RegExpSandbox(), column);
}

function addGrammarSandbox(column) {
    addSandbox(new GrammarSandbox(), column);
}

function addAutomataSandbox(column) {
    addSandbox(new AutomataSandbox(), column);
}

///////////////////////////////////////////////////
///////// Basic rendering methods /////////////////
////////////////// i.e. non-model-aware ///////////
///////////////////////////////////////////////////
function createFullWidthDiv(text) {
    var div = document.createElement("div");
    div.setAttribute('class', 'col-sm-12');
    if(text != undefined) {
        div.appendChild(document.createTextNode(text));
    }
    return div;
}

function createButton(text, onclick, tooltip) {
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(text));
    button.setAttribute('class','btn btn-default col-sm-4');
    button.setAttribute('onclick',onclick + '; return false;');
    button.setAttribute('title',tooltip);
    button.setAttribute('id',text);
    $(button).tooltip({
        show: {
            delay: 2250,
            fade: 2250
        }
    });
    return button;
}

function createFullWidthCanvas(id) {
    var canv = document.createElement("canvas");
    canv.setAttribute('class', "col-sm-12 sandboxcanvas");
    canv.setAttribute('id', id);
    return canv;
}


