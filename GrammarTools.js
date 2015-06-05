/**
 * Created by jemenake on 5/4/15.
 */

function assert(bool, msg) {
    if( ! bool ) {
        console.log("ASSERT FAILURE: " + msg);
    }
}

Function.prototype.inheritsFrom = function( parentClassOrObject ){
    if ( parentClassOrObject.constructor == Function ) {
        //Normal Inheritance
        this.prototype = new parentClassOrObject();
        this.prototype.constructor = this;
        this.prototype.parent = parentClassOrObject.prototype;
    } else {
        //Pure Virtual Inheritance
        this.prototype = parentClassOrObject;
        this.prototype.constructor = this;
        this.prototype.parent = parentClassOrObject;
    }
    return this;
};


// alphabet is an array of terminal symbols (*can* be strings of any length, but you
// should probably restrict them to single lowercase letters
function StringGenerator(alphabet) {
    this.alphabet = alphabet;
    this.counter = 0; // For an alphabet of {a,b}, 0 = "", 1 = "a", 2 = "b", 3 = "aa", 4 = "ab", 5 = "ba", 6 = "bb", 7 = "aaa", etc.

    this.next = function() {
        var base = this.alphabet.length;
        // To generate a string from the counter:
        // - Strings of length L will begin at a count of 2^L - 1. Call this beginning index "offset"
        // - This means that, for a given counter value, L = floor(log(counter + 1)/log(base))
        var L = Math.floor(Math.log(this.counter + 1) / Math.log(base));
        var offset = Math.pow(2, L) - 1;
        // counter - offset is how far into the L-length strings we are. Call it "index"
        var index = this.counter - offset;
        // Now figure out each "digit". To do that:
        //  - decrement L
        //  - divide index by base^L. That gives you the index of the element in this.alphabet to use
        //  - replace index with index mod base^L
        //  - repeat *though* L=0
        var the_string = "";
        for( L--; L >= 0; L-- ) {
            the_string += this.alphabet[ Math.floor(index / Math.pow(base, L))];
            index = index % Math.pow(base, L);
        }
        this.counter++;
        return the_string;
    }
}

// Union 2 arrays
function union(array1, array2) {
    var obj = {};
    for(var element of array1.concat(array2)) {
        obj[element] = 1;
    }
    return Object.keys(obj);
}

// Stolen from williammalone.com
function drawEllipse(centerX, centerY, width, height) {

    context.beginPath();

    context.moveTo(centerX, centerY - height/2); // A1

    context.bezierCurveTo(
        centerX + width/2, centerY - height/2, // C1
        centerX + width/2, centerY + height/2, // C2
        centerX, centerY + height/2); // A2

    context.bezierCurveTo(
        centerX - width/2, centerY + height/2, // C3
        centerX - width/2, centerY - height/2, // C4
        centerX, centerY - height/2); // A1

    context.fillStyle = "red";
    context.fill();
    context.closePath();
}

//region Grammars
//////////////////////////////////
// CLASS: Grammar
//////////////////////////////////
//region Grammar
function Grammar(name) {
    if (! (this instanceof Grammar)) {
        throw "Grammar was instantiated without 'new'";
    }
    this.name = name;
    this.starting_state = 'S';
    this.clearRules();
    this.lambda_char = "λ";
    this.arrow = "→";

}

Grammar.prototype.constructor = function(name) {
    this.name = name;
    this.starting_state = 'S';
    this.clearRules();

};

Grammar.prototype.clearRules = function() {
    this.rules = { };
    this.rules[this.starting_state] = [];
};

Grammar.prototype.addRule = function (variable, result)  {
    if (!(variable in this.rules)) {
        this.rules[variable] = [];
    }
    this.rules[variable].push(result);
};

Grammar.prototype.getAcceptedStrings = function(maxlength)  {
    return this.generateStringsFromState(maxlength, this.starting_state, []);
};

Grammar.prototype.breakAtFirstVariable = function(string) {
    var result = string.match(/[A-Z]/);
    if( result == null ) {
        return [ string, "", "" ];
    }
    var before = string.substr(0, result.index);
    var variable = string.substr(result.index, 1);
    var after = string.substr(result.index+1);
    return [ before, variable, after ];
};

Grammar.prototype.hasVariables = function(string) {
    // Is there something returned for the first variable?
    return this.breakAtFirstVariable(string)[1].length > 0;
};

Grammar.prototype.getAllSubsequentStrings = function(string) {
    var strings = [];
    var pieces = this.breakAtFirstVariable(string);
    // pieces[0] should now contain something before the first variable
    // pieces[1] should contain the first variable
    // pieces[2] should now contain everything after
    //console.log("Pieces are");
    //for(var j = 0; j < pieces.length; j++) {
    //    console.log(pieces[j]);
    //}
    // Now... split off the variable, and substitute every rule we have for that variable
    for( var rule of this.rules[pieces[1]] ) {
        strings.push(pieces[0] + rule + pieces[2]);
    }
    return strings;
};

Grammar.prototype.generateStringsFromState = function (maxlength, variable_name, vars_seen) {
    // Get the rules for this variable name
    var rules = this.rules[variable_name];
    if (rules.length == 0) {
        console.log("No rules for variable " + variable_name);
        return [];
    }
    var strings = [];

    var unprocessed_strings = [ "S" ];
    var processed_strings = {};
    while(unprocessed_strings.length > 0 ) {
        var next_string = unprocessed_strings.pop();
        // Add this state to the checked states
        processed_strings[next_string] = 1;

        // If this string has no variables, then it's done. Add it to the list of strings
        if( ! this.hasVariables(next_string) ) {
            strings.push(next_string);
        } else {
            // Otherwise, process all substitutions on the first variable
            var subsequent_strings = this.getAllSubsequentStrings(next_string);
            // If we haven't already checked it, then add it to our list of IMS's to check
            for( var subsequent of subsequent_strings ) {
                if( ! (subsequent in processed_strings) && subsequent.length <= maxlength) {
                    unprocessed_strings.push( subsequent );
                }
            }
        }
    }
    return strings;


    for (var rule of rules) {
        // We need to catch circular references to keep the grammar-generator from looping forever.
        // In order to do this, we keep an array of all of our immediate ancestors which haven't
        // added any terminal symbols to the string (i.e. there's no way for the maxlength to
        // stop the recursion). So...
        // IF this rule doesn't have any terminal symbols:
        // THEN...
        //    IF *any* of the variables listed in the rule are in vars_seen:
        //       abort processing this rule
        //    ELSE
        //       set a FLAG so that, when we process each variable in the rule,
        //       we add that variable to vars_seen
        // ELSE...
        //    set vars_seen to []
        //
        // TODO catch circular references

    }
};

Grammar.prototype.generateStringsFromSets = function (chunks) {
    // Each chunk can be one of two types: a string of letters or
};

Grammar.prototype.constructNFA = function() {
    if(! this.isRegular() ) {
        console.log("constructNFA() called for non-regular")
    }
};

Grammar.prototype.getRuleList = function() {
    var strings = [];
    for( var rule in this.rules ) {
        var pieces = [];
        for( var piece of this.rules[rule] ) {
            if( piece === "" ) {
                pieces.push(this.lambda_char);
            } else {
                pieces.push(piece);
            }
        }
        strings.push(rule + " " + this.arrow + " " + pieces.join(' | '));
    }
    return strings.join('\n');
};

Grammar.prototype.getName = function() {
    if(this.name === undefined) {
        return "Grammar";
    }
    return this.name;
};

Grammar.prototype.toString = function() {
    //return this.getRuleList();
    if( this.name == undefined ) {
        return "Grammar";
    }
    return this.name;
};
//endregion

//////////////////////////////////
// CLASS: ContextFreeGrammar
//////////////////////////////////
//region ContextFreeGrammar
// A context-free grammar is a grammar with the added limitation that
// the left side of the rule may only have a single variable name, and no other symbols
function ContextFreeGrammar(name) {
    if (! (this instanceof ContextFreeGrammar)) {
        throw "ContextFreeGrammar was instantiated without 'new'";
    }
    Grammar.constructor.call(this, name);
    //parent.call(this, name);
}
ContextFreeGrammar.inheritsFrom(Grammar);

ContextFreeGrammar.prototype.addRule = function (variable, result)  {
    // Make sure that the variable contains just a capital letter
    if(variable.match(/^[A-Z]$/) == null) {
        // "variable" side wasn't just a single captial letter
        throw "ContextFreeGrammar.addRule() was passed an illegal variable: '" + variable + "'";
    }
    parent.addRule(variable, result);
};
//endregion

//////////////////////////////////
// CLASS: RegularGrammar
//////////////////////////////////
//region RegularGrammar
// A regular grammar is a context-free grammar with the added constraint that the
// right side of every rule can only be either:
//  1) The empty string (lambda)
//  2) A single alphabet symbol optionally followed by a single variable (eg. 'a', 'b', 'aS', 'bA', etc)
function RegularGrammar(name) {
    if (! (this instanceof RegularGrammar)) {
        throw "RegularGrammar was instantiated without 'new'";
    }
    parent.constructor.call(this, name);
}

RegularGrammar.inheritsFrom(ContextFreeGrammar);

RegularGrammar.prototype.addRule = function (variable, result)  {
    // Make sure that result contains either the empty string or a single symbol and, optionally, one variable
    if(result.match(/^([a-z][A-Z]?)?$/) == null) {
        // "result" wasn't allowed
        throw "RegularGrammar.addRule() was passed an illegal result: '" + result + "'";
    }
    parent.addRule(variable, result);
};
//endregion
//endregion

//region RegularExpressions
//////////////////////////////////
// CLASS: GenericRegExp
//////////////////////////////////
//region GenericRegExp
function GenericRegExp() {
    if (! (this instanceof GenericRegExp)) {
        throw "GenericRegExp was instantiated without 'new'";
    }
    this.pieces = []; // All of the chunks get unioned together.
    this.star = false; // Whether this GenericRegExp is Kleene-starred.
    this.join_char_html = undefined; // What character do we use for joining pieces for HTML output?
    this.join_char_regexp = undefined; // What character do we use for joining pieces for regexp parsers?
    this.lambda_char = "λ";
}

// A factory for creating RegExp objects from a string
GenericRegExp.createRegExp = function(string) {
    // First, if there are any parentheses, then process *those*
    var match = string.match(/^([^(]*)\((.*)\)(\*?)([^)]*)$/);
    if( match != null ) {
        // We string matches: something1(something2)*?something3
        // First, see if we've got something1 and something3 are trying to
        // both concatenate, union, or if they're a mix.
        var something1 = match[1];
        var something2 = match[2];
        var star = match[3];
        var something3 = match[4];
        // Is the "before" string using union or concatenation? Is it empty?
        var union1 = false;
        var empty1 = false;
        if( something1.length = 0 ) {
            empty1 = true;
        } else {
            empty1 = false;
            if( something1.substr(-1) == "|" ) {
                union1 = true;
                something1 = something1.substr(0, something1.length - 1);
            } else {
                union1 = false;
            }
        }
        // Is the "after" string using union or concatenation? Is it empty?
        var union3 = false;
        var empty3 = false;
        if( something3.length = 0 ) {
            empty3 = true;
        } else {
            empty3 = false;
            if( something3.substr(0,1) == "|" ) {
                union3 = true;
                something3 = something3.substr(1);
            } else {
                union3 = false;
            }
        }
        var regexp1 = this.createRegExp(something1);
        var regexp2 = this.createRegExp(something2);
        regexp2.setStar((star == "*"));
        var regexp3 = this.createRegExp(something3);
        // From here, we *may* need to use a ConcatRegExp *and* a UnionRegExp. If both
        // something1 and something3 are non-empty and one is using union and the other is
        // not, then we need to use both, and the build the Concat and put it inside of the
        // Union one because Concat precedes Union.
        var the_regexp;
        if( ! empty1 && ! empty3 && union1 != union3 ) {
            // We need both kinds...
            if(union1) {
                // something1 is the union
                var temp_regexp = new ConcatRegExp();
                temp_regexp.addPiece(regexp2);
                temp_regexp.addPiece(regexp3);
                the_regexp = new UnionRegexp();
                the_regexp.addPiece(regexp1);
                the_regexp.addPiece(temp_regexp);
            } else {
                // something3 is the union
                var temp_regexp = new ConcatRegExp();
                temp_regexp.addPiece(regexp1);
                temp_regexp.addPiece(regexp2);
                the_regexp = new UnionRegexp();
                the_regexp.addPiece(temp_regexp);
                the_regexp.addPiece(regexp3);
            }
        } else {
            // Either their both union, both concat, or one or both are empty
            // Whatever it is, we only need one regexp type
            if( union1 || union3 ) {
                // Either both union or one or both are empty. So, the_regexp is a Union
                the_regexp = new UnionRegExp();
            } else {
                // Both are either concat or empty, so Concat will do
                the_regexp = new ConcatRegExp();
            }
            if( ! empty1 ) {
                the_regexp.addPiece(regexp1);
            }
            the_regexp.addPiece(regexp2);
            if( ! empty3 ) {
                the_regexp.addPiece(regexp3);
            }
        }
        return the_regexp;
    } else {
        // No parentheses were found.
        var the_regexp;
        // What about union operators?
        match = string.match(/^(.+)\|(.+)$/);
        if( match != null ) {
            // There was a union operator
            the_regexp = new UnionRegExp();
            the_regexp.addPiece(this.createRegExp(match[1]));
            the_regexp.addPiece(this.createRegExp(match[2]));
        } else {
            // There was no union operator, so it's all concat
            the_regexp = new ConcatRegExp();
            the_regexp.addPiece(string);
        }
        return the_regexp;
    }
};

GenericRegExp.prototype.addPiece = function (string_or_regexp, starred) {
    if( starred == true ) {
        // If it's a string, we need to turn it into a regexp so that we may set the star flag
        if( typeof string_or_regexp == "string" ) {
            var string = string_or_regexp
            string_or_regexp = new ConcatRegExp();
            string_or_regexp.addPiece(string);
        }
        string_or_regexp.setStar(starred);
    }
    this.pieces.push(string_or_regexp);
};

GenericRegExp.prototype.setStar = function (starred) {
    this.star = starred;
};

// Get accepted strings
// Returns the strings accepted by this regexp
GenericRegExp.prototype.getAcceptedStrings = function(maxlength) {
    var the_strings = [];
    var regexp = new RegExp("^" + this.toRegexp() + "$");
    var generator = new StringGenerator(this._getAlphabet());
    for( var the_string = generator.next(); the_string.length <= maxlength; the_string = generator.next()) {
        if(regexp.test(the_string)) {
            the_strings.push(the_string);
        }
    }
    return the_strings;
};

// Return the alphabet used by this regexp
GenericRegExp.prototype._getAlphabet = function() {
    var dict = {};
    for(var piece of this.pieces) {
        var subalph = this._getAlphabetFromPiece(piece);
        for(var char of subalph) {
            dict[char] = char;
        }
    }
    return Object.keys(dict);
};

// PRIVATE returns the alphabet used by a single piece
GenericRegExp.prototype._getAlphabetFromPiece = function(piece) {
    // If the piece is a string, just return a dictionary with keys for all of the chars
    if(typeof piece == "string") {
        var dict = {};
        for(var i=0; i<piece.length; i++) {
            dict[piece.substr(i,1)] = piece.substr(i,1);
        }
        return Object.keys(dict);
    } else {
        return piece._getAlphabet();
    }
};

GenericRegExp.prototype.getName = function() {
    if(this.name === undefined) {
        return "Regular Expression";
    }
    return this.name;
};

// Output to a string which looks pretty in HTML
GenericRegExp.prototype.toString = function () {
    var string_pieces = [];
    for(var i = 0; i < this.pieces.length; i++) {
        // If it's a string, append it. Otherwise, it's a GenericRegExp object, so recurse.
        if(typeof this.pieces[i] == "string") {
            string_pieces.push(this.pieces[i]);
        } else {
            string_pieces.push(this.pieces[i].toString());
        }
    }
    output = string_pieces.join(this.join_char_html);
    if(this.star) {
        output = "(" + output + ")*";
    }
    return output;
};

// Output to a string which works in most regexp parsers
GenericRegExp.prototype.toRegexp = function () {
    var string_pieces = [];
    //for(var i = 0; i < this.pieces.length; i++) {
    //    // If it's a string, append it. Otherwise, it's a GenericRegExp object, so recurse.
    //    if(typeof this.pieces[i] == "string") {
    //        string_pieces.push(this.pieces[i]);
    //    } else {
    //        string_pieces.push(this.pieces[i].toRegexp());
    //    }
    //}
    for(var piece of this.pieces) {
        // If it's a string, append it. Otherwise, it's a GenericRegExp object, so recurse.
        if(typeof piece == "string") {
            string_pieces.push(piece);
        } else {
            string_pieces.push(piece.toRegexp());
        }
    }
    var output = "(" + string_pieces.join(this.join_char_regexp) + ")";
    if(this.star) {
        output = output + "*";
    }
    return output;
};
//endregion

//////////////////////////////////
// CLASS: UnionRegExp
//////////////////////////////////
//region UnionRegExp
function UnionRegExp() {
    if (! (this instanceof UnionRegExp)) {
        throw "UnionRegExp was instantiated without 'new'";
    }
    GenericRegExp.call(this);
    this.join_char_html = "U";
    this.join_char_regexp = "|";
}
UnionRegExp.prototype = Object.create(GenericRegExp.prototype);
//endregion

//////////////////////////////////
// CLASS: ConcatRegExp
//////////////////////////////////
//region ConcatRegExp
function ConcatRegExp() {
    if (! (this instanceof ConcatRegExp)) {
        throw "ConcatRegExp was instantiated without 'new'";
    }
    GenericRegExp.call(this);
    this.join_char_html = "";
    this.join_char_regexp = "";
}
ConcatRegExp.prototype = Object.create(GenericRegExp.prototype);
//endregion
//endregion

//region Automata
///////////////////////////////////////
// CLASS: FiniteAutomataState
///////////////////////////////////////
//region FiniteAutomataState
function FiniteAutomataState(name) {
    if (! (this instanceof FiniteAutomataState)) {
        throw "FiniteAutomataState was instantiated without 'new'";
    }
    // transitions is a dictionary of lists. Example:
    // {
    //   'a' : [ "q0", "q2" ],
    //   'b' : [ "q1" ],
    //   ''  : [ "q0" ]
    // }
    //
    this.name = name;
    this.transitions = {};
    this.is_accepting = false;
}

////////////////// Factories ////////////////////
FiniteAutomataState.prototype.clone = function() {
    var that = new FiniteAutomataState(name);
    that.transitions = JSON.parse(JSON.stringify(this.transitions));
    that.is_accepting = this.is_accepting;
};

///////////////// Informational /////////////////////
FiniteAutomataState.prototype._getAlphabet = function() {
    return Object.keys(transitions);
};

FiniteAutomataState.prototype.hasLambdaTransitions = function() {
    return "" in this.transitions;
};

FiniteAutomataState.prototype.isDeterministicOverAlphabet = function(alphabet) {
    // If there's a lambda-transition, then false
    if (this.hasLambdaTransitions()) {
        return false;
    }
    var keys = Object.keys(this.transitions);
    keys.sort();
    if( keys.length != alphabet.length ) {
        return false;
    }
    for( var i = 0; i < keys.length; i++ ) {
        if( keys[i] != alphabet[i] ) {
            return false;
        }
    }
    return true;
};

////////////////// Mutators ////////////////////
FiniteAutomataState.prototype.addTransition = function(symbol, state_name) {
    if (! (symbol in this.transitions)) {
        this.transitions[symbol] = [];
    }
    this.transitions[symbol].push(state_name);
};

FiniteAutomataState.prototype.renameStateInTransitions = function(old_name, new_name) {
    for( var symbol in this.transitions ) {
        for( var i=0; i<this.transitions[symbol].length; i++ ) {
            if( this.transitions[symbol][i] == old_name ) {
                this.transitions[symbol][i] = new_name;
            }
        }
    }
};
//endregion

///////////////////////////////////////
// CLASS: FiniteAutomataIMC
///////////////////////////////////////
//region FiniteAutomataIMC
// The instantaneous machine configuration for a DFA/NFA
// Includes the current state and the remaining string on the tape
function FiniteAutomataIMC(state_name, string) {
    if (! (this instanceof FiniteAutomataIMC)) {
        throw "FiniteAutomateIMC was instantiated without 'new'";
    }
    this.state_name = state_name;
    this.string = string;
}

FiniteAutomataIMC.prototype.getStateName = function() {
    return this.state_name;
};

FiniteAutomataIMC.prototype.getString = function() {
    return this.string;
};

FiniteAutomataIMC.prototype.toString = function() {
    return this.state_name + ":" + this.string;
};
//endregion

///////////////////////////////////////
// CLASS: FiniteAutomata
///////////////////////////////////////
//region FiniteAutomata
function FiniteAutomata(state_array) {
    if (! (this instanceof FiniteAutomata)) {
        throw "FiniteAutomata was instantiated without 'new'";
    }
    // states is a dictionary of FiniteAutomataState objects, with its name as the key
    this.states = {};
    this.starting_state = undefined;
    this.state_name_separator = ','; // For joining/splitting state names (eg. ["q0", "q1"] to/from "q0,q1"
    if (state_array != undefined) {
        for (state of state_array ) {
            this.addState(state);
        }
    }
}

FiniteAutomata.getStateSetAsString = function(array) {
    return array.join(this.state_name_separator);
};

FiniteAutomata.getStringAsStateSet = function(string) {
    return string.split(this.state_name_separator)
};

FiniteAutomata.prototype.isDeterministic = function() {
    var alphabet = this._getAlphabet();
    // Check every state
    for( var state of this.states ) {
        if( ! state.isDeterministicOverAlphabet(alphabet) ) {
            return false;
        }
    }
    return true;
};

FiniteAutomata.prototype.isLambda = function() {
    for( var state of this.states ) {
        if (state.hasLambdaTransitions()) {
            return true;
        }
    }
    return false;
};

FiniteAutomata.prototype.containsStateName = function(state_name) {
    return state_name in this.states;
}

FiniteAutomata.prototype.addState = function(state) {
    var state_name = state.name;
    if( state_name in this.states ) {
        console.log("We already have a state named " + state_name);
        return;
    }
    this.states[state_name] = state;
    if( this.starting_state == undefined ) {
        this.starting_state = state_name;
    }
};

FiniteAutomata.prototype.getOrCreateState = function(state_name) {
    var state = this.states[state_name];
    if( state == undefined ) {
        state = new FiniteAutomataState(state_name)
        this.addState(state);
    }
    return state;
};

FiniteAutomata.prototype.addTransition = function(from_state_name, symbol, to_state_name) {
    var from_state = this.getOrCreateState(from_state_name);
    this.getOrCreateState(to_state_name);
    from_state.addTransition(symbol, to_state_name);
};

FiniteAutomata.prototype.setAccepting = function(state_name) {
    var state = this.getOrCreateState(state_name);
    state.is_accepting = true;
};

FiniteAutomata.prototype.clone = function() {
    var that = new FiniteAutomata();
    for( state_name in this.states ) {
        that.states[state_name] = this.states[state_name].clone();
    }
    return that;
};

FiniteAutomata.prototype.getInverse = function() {
    var that = this.createDFA(); // Must start with a DFA, first.
    for( state of this.states ) {
        state.is_accepting = ! state.is_accepting;
    }
    return that;
};

FiniteAutomata.prototype._getAlphabet = function() {
    var dict = {};
    for( var state_name in this.states ) {
        var transitions = this.states[state_name].transitions;
        for( var key in transitions ) {
            dict[key] = key;
        }
    }
    return Object.keys(dict);
};

// Figure the lambda-closure of a single state
FiniteAutomata.prototype._getLambdaClosureOf = function(state_name, seen_state_names) {
    if( seen_state_names == undefined ) {
        seen_state_names = [];
    }
    var closure = [];
    closure.push(state_name); // A state can always reach itself
    // Does the state have any lambda transitions?
    if( "" in this.states[state_name]) {
        // Go through all of the state_names to which we can transition
        for( var dest_state_name of this.states[state_name][""] ) {
            // This will prevent us from infinitely chasing lambda loops
            var new_seen_state_names = seen_state_names.concat([state_name]);
            // Add the lambda-closure of any states we can get to via lambda transitions
            closure = union(closure, this._getLambdaClosureOf(dest_state_name, new_seen_state_names));
        }
    }
    return closure;
};

FiniteAutomata.prototype._getLambdaClosures = function() {
    var closures = {};
    for( var state_name in this.states ) {
        closures[state_name] = this._getLambdaClosureOf(state_name);
    }
    return closures;
};

// Create a DFA from this automata
FiniteAutomata.prototype.createDFA = function() {
    var DFA = new FiniteAutomata();
    // Generate the lambda-closures for each state
    var lambda_closures = this._getLambdaClosures();
    var alphabet = this._getAlphabet();
    // Create the starting state of the new DFA
    var starting_state_set = lambda_closures[this.starting_state];
    var starting_state_name = this.getStateSetAsString(starting_state_set);
    var seen_state_names = {};
    var unprocessed_state_names = [starting_state_name];
    seen_state_names[starting_state_name] = 1;
    while( unprocessed_state_names.length > 0 ) {
        var next_state_name = unprocessed_state_names.pop();
        // For each of these states, figure out what each symbol gets us
        for( var symbol of alphabet ) {
            // We do this by starting with all of the individual states in the "combined" set of states we're considering
            var individual_states = this.getStringAsStateSet(next_state_name);
            var resulting_set = []; // So far, we can't get anywhere by scanning 'symbol'
            var is_accepting = false; // This isn't an accepting state, yet
            // Take each state in turn
            for( var individual_state of individual_states ) {
                // Find all of the states we can get to without scanning a symbol
                var first_lambda_set = lambda_closures[individual_state];
                // Go through each of those
                for( var step1 of first_lambda_set ) {
                    // Find all of the states we can reach by scanning 'symbol'
                    if( symbol in this.states[step1] ) {
                        for( var step2 of this.states[step1] ) {
                            // Now, find all of the states we can get to via lambda transitions from there
                            for( var step3 of lambda_closures[step2] ) {
                                // step3 should be a set, so union it with resulting_set
                                resulting_set = union(resulting_set, step3);
                                // If any of these states is an accepting state, then *this* state is accepting
                                for( var substate of step3 ) {
                                    if( this.states[substate].is_accepting ) {
                                        is_accepting = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // At this point, resulting_set contains all states reachable by zero or more lambda
            // transitions, scanning 'symbol', and then zero or more lambda transitions.
            // Turn that into a string to use as the state-name
            var resulting_set_name = this.getStateSetAsString(resulting_set);
            // If we haven't seen this state name before, then add it to our list of states to process
            if( ! (resulting_set_name in seen_state_names) ) {
                unprocessed_state_names.push(resulting_set_name);
                seen_state_names[resulting_set_name] = 1;
            }
            DFA.addTransition(next_state_name, symbol, resulting_set_name);
        }
    }
};

FiniteAutomata.prototype._stateExists = function(state_name) {
    return state_name in this.states;
};

FiniteAutomata.prototype._renameState = function(old_name, new_name) {
    if( this._stateExists(new_name) ) {
        throw "Cannot rename state '" + old_name + "' to '" + new_name + "'. Name exists!";
    }
    this.states[old_name].name = new_name;
    this.states[new_name] = this.states[old_name];
    delete this.states[old_name];
    if( this.starting_state == old_name ) {
        this.starting_state = new_name;
    }
    // Now, go through every state and update any transitions using that state
    for( var state_name in this.states ) {
        this.states[state_name].renameStateInTransitions(old_name, new_name);
    }
};

// Normalize state names. This will rename all of the states so that they
// are named: "q0", "q1", etc...
// Furthermore, it will try to order them so that lower-numbered states are encountered earlier
FiniteAutomata.prototype.normalizeStateNames = function() {
    var name_regexp = /^q[0-9]+$/;
    // First, change all 'q#' names to something else to avoid namespace collisions
    var names_to_change = [];
    for( var state_name in this.states ) {
        if( state_name.match(name_regexp) != null ) {
            names_to_change.push(state_name);
        }
    }
    for( var old_name of names_to_change ) {
        var counter = 0;
        var basename = "TEMPNAME";
        var new_name;
        // Keep incrementing counter until we find a state_name which isn't taken
        do {
            new_name = basename + str(counter++);
        } while( this._stateExists(new_name));
        this._renameState(old_name, new_name);
    }
    // At this point, none of the states should have names like 'q#'
    var counter = 0;
    var unprocessed_state_names = [ this.starting_state ];
    var processed_state_names = {};
    while( unprocessed_state_names.length > 0 ) {
        // To order them properly, we must take names from the front, not the back, of the list
        var old_name = unprocessed_state_names[0];
        unprocessed_state_names = unprocessed_state_names.slice(1);
        var new_name = 'q' + str(counter++);
        processed_state_names[new_name] = 1;
        this._renameState(current_state, new_name);
        // Now, check all of the transitions, and process all unprocessed states we find
        for( var symbol in this.states[new_name].transitions ) {
            for( var resulting_state of this.states[new_name].transitions[symbol] ) {
                if( ! (resulting_state in processed_state_names) ) {
                    unprocessed_state_names.push(resulting_state);
                }
            }
        }
    }
};

FiniteAutomata.prototype._getAllSubsequentIMSs = function(starting_imc, transitions) {
    var new_imcs = {};

    // First find all lambda transitions from here and conditionally add them
    if( "" in transitions ) {
        for( var result_state of transitions[""] ) {
            var new_imc = new FiniteAutomataIMC(result_state, starting_imc.getString());
            new_imcs[new_imc.toString()] = new_imc;
        }
    }
    // Now, if there are characters left, consume the next character in the string. If there are
    // no transitions for it, return false. Otherwise, conditionally add all of the resulting states
    if( starting_imc.getString().length > 0 ) {
        var next_char = starting_imc.getString().substr(0, 1);
        var remaining_string = starting_imc.getString().substr(1);
        if (next_char in transitions) {
            for( var result_state of transitions[next_char] ) {
                var new_imc = new FiniteAutomataIMC(result_state, remaining_string);
                new_imcs[new_imc.toString()] = new_imc;
            }
        }
    }
    var arry = [];
    for( var key in new_imcs) {
        arry.push(new_imcs[key]);
    }
    return arry;
};

// Is this machine configuration accepting? (i.e. is the input string empty and the state an accepting state?
FiniteAutomata.prototype._isAcceptingIMS = function(imc) {
    return imc.getString().length == 0 && this.states[imc.getStateName()].is_accepting;
};

FiniteAutomata.prototype._getStartingIMS = function(string) {
    return new FiniteAutomataIMC( this.starting_state, string );
};

// Returns boolean whether the string is accepted by the FA or not
FiniteAutomata.prototype.accepts = function(string) {
    // We approach this like a game AI searching for a winning sequence of moves.
    // We start with the starting state and string, and then find all resulting
    // machine states and push them onto unchecked_imcs. If we ever come across
    // a state which is a final state and the string is "", then return true;
    // Otherwise, keep going. If unchecked_elements ever runs out of elements,
    // then return false.
    var unchecked_imcs = [ this._getStartingIMS(string) ];
    var checked_imcs = {};
    while(unchecked_imcs.length > 0 ) {
        var next_imc = unchecked_imcs.pop();
//        var state_name = next_imc[0];
//        var state_string = next_imc[1];
        // Check to see if this state is accepting
        if( this._isAcceptingIMS(next_imc)) {
            return true;
        }
        // Add this state to the checked states
        var string_key = next_imc.toString();
        checked_imcs[string_key] = 1;
        // Now, process all transitions which are available to us.
        var transitions = this.states[next_imc.getStateName()].transitions;

        var subsequent_imcs = this._getAllSubsequentIMSs(next_imc, transitions);
        // If we haven't already checked it, then add it to our list of IMS's to check
        for( var subsequent of subsequent_imcs ) {
            if( ! (subsequent.toString() in checked_imcs) ) {
                unchecked_imcs.push( subsequent );
            }
        }

    }
    return false;
};

// Get accepted strings
// Returns the strings accepted by this regexp
FiniteAutomata.prototype.getAcceptedStrings = function(maxlength) {
    var the_strings = [];
    var generator = new StringGenerator(this._getAlphabet());
    for( var the_string = generator.next(); the_string.length <= maxlength; the_string = generator.next()) {
        if(this.accepts(the_string)) {
            the_strings.push(the_string);
        }
    }
    return the_strings;
};

FiniteAutomata.prototype.getName = function() {
    if(this.name === undefined) {
        return "Finite Automata";
    }
    return this.name;
};

FiniteAutomata.prototype.toString = function() {
    if( this.name == undefined ) {
        return "FiniteAutomata";
    }
    return this.name;
};

FiniteAutomata.prototype.drawStateDiagram = function(context) {
    var rows = 1;
    var columns = 1;
    var state_names = Object.keys(this.states);
    while( state_names.length > rows * columns ) {
        if( columns > rows ) {
            rows++;
        } else {
            columns++;
        }
    }
    console.log("rows = " + rows + "   columns = " + columns);
    //var VPADDING = 10;
    //var HPADDING = 10;
    var canvasWidth = context.canvas.clientWidth;
    var canvasHeight = context.canvas.clientHeight;
    canvasWidth=200;
    canvasHeight=150;
    var h_step = canvasWidth / ( columns + 1 );
    var v_step = canvasHeight / ( rows + 1 );

    context.font = '12pt Calibri';
    context.lineWidth = 1;
    for( var i = 0; i < state_names.length; i++ ) {
        var row = Math.floor(i / columns);
        var column = i % columns;
        circleWithText(context, (column+1)*h_step, (row+1)*v_step, state_names[i], this.states[state_names[i]].is_accepting);
    }
    //circleWithText(context, 75, 75, "{q0,q1,q3,q8}");
    //circleWithText(context, 175, 75, "q0", true);
};
//endregion

//region PushdownAutomata
///////////////////////////////////////
// CLASS: PushdownAutomataIMC
///////////////////////////////////////
// Instantaneous machine configuration for Pushdown Automata
//region PushdownAutomataIMC
function PushdownAutomataIMC() {
    if (! (this instanceof PushdownAutomataIMC)) {
        throw "PushdownAutomataIMC was instantiated without 'new'";
    }
    this.stack = [];
}
PushdownAutomataIMC.inheritsFrom(FiniteAutomataIMC);

PushdownAutomataIMC.prototype.getStack = function() {
    return this.stack;
};
//endregion

//region PushdownAutomata
function PushdownAutomata() {
    if (! (this instanceof PushdownAutomata)) {
        throw "PushdownAutomata was instantiated without 'new'";
    }


}
PushdownAutomata.inheritsFrom( FiniteAutomata );
//endregion
//endregion


function DFA(state_array) {
    if (! (this instanceof DFA)) {
        throw "DFA was instantiated without 'new'";
    }

}
DFA.inheritsFrom( FiniteAutomata );
//DFA.prototype.something = function() {
//}

function PDA(state_array) {
    this.stack = [];
}
PDA.inheritsFrom( FiniteAutomata );
// PDA.prototype.something = function() {
// }
//endregion

function reportAcceptedStrings(engine, maxlength) {
    console.log("Strings accepted by " + engine.toString() + " (up to a length of " + maxlength + "):");
    var strings = engine.getAcceptedStrings(maxlength);
    for( string of strings ) {
        console.log("'" + string + "'");
    }
    console.log("END");
}

function compareAcceptedStrings(engine1, engine2, maxlength) {
    var output = [];
    output.push("Comparing " + engine1.getName() + " with " + engine2.getName() + " (up to a length of " + maxlength + "):");
    var found_strings = {}; // Hashtable of bitmasks. key is a given string. Bit0 = accepted by engine1, Bit1 = accepted by engine2
    var strings = engine1.getAcceptedStrings(maxlength);
    for( var string of strings ) {
        found_strings[string] = 1;
    }
    var strings = engine2.getAcceptedStrings(maxlength);
    for( var string of strings ) {
        if( found_strings[string] == undefined ) {
            found_strings[string] = 0;
        }
        found_strings[string] += 2;
    }
    var only_in_1 = [];
    var only_in_2 = [];
    for( var string of Object.keys(found_strings) ) {
        if( found_strings[string] != 3 ) {
            if( found_strings[string] == 1) {
                only_in_1.push(string);
            } else {
                only_in_2.push(string);
            }
        }
    }
    if(only_in_1.length > 0) {
        output.push("Strings only accepted by " + engine1.toString());
        for( var string of only_in_1 ) {
            output.push("'" + string + "'");
        }
        output.push("END");
    }
    if(only_in_2.length > 0) {
        output.push("Strings only accepted by " + engine2.toString());
        for( var string of only_in_2 ) {
            output.push("'" + string + "'");
        }
        output.push("END");
    }
    if(only_in_1.length + only_in_2.length == 0) {
        output.push("No differences found (for this maximum length");
    }
    return output.join("\n");
}



//region Drawing Functions
// Stolen from williammalone.com
function drawEllipse(context, centerX, centerY, width, height) {

    context.beginPath();

    context.moveTo(centerX, centerY - height/2); // A1

    context.bezierCurveTo(
        centerX + width/2, centerY - height/2, // C1
        centerX + width/2, centerY + height/2, // C2
        centerX, centerY + height/2); // A2

    context.bezierCurveTo(
        centerX - width/2, centerY + height/2, // C3
        centerX - width/2, centerY - height/2, // C4
        centerX, centerY - height/2); // A1
    context.closePath();
    context.stroke();
}

function getWidthOfText(context, text) {
    return context.measureText(text).width;
}

function getHeightOfText(context) {
    return 8;
}

function getWidthOfOval(context, text) {
    return 1.5 * getWidthOfText(context, text) + 20;
}

function getHeightOfOval(context) {
    return 4 * getHeightOfText(context);
}

function circleWithText(context, x, y, text, bold) {
    if( bold == true) {
        context.lineWidth = 3;
    } else {
        context.lineWidth = 1;
    }
    // By trial-and-error, I decided on these dimensions for the ovals
    drawEllipse(context, x, y, getWidthOfOval(context, text), getHeightOfOval(context));
    context.stroke();
    context.lineWidth = 1;
    context.strokeText(text, x - getWidthOfText(context, text)/2, y + getHeightOfText(context)/2);
}
//endregion
