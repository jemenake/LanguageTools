# LanguageTools

This is a set of Javascript classes and functions for manipulating/comparing
Finite State Automata, Context-Free Grammars, and Regular Expressions

Some of the things you can do with this tools set:

With a Finite State Automata:
 * Convert an NFA or NFA-lambda to a DFA
 * Reduce a DFA to its minimal form
 * Generate a Regular Expression which specifies the same language accepted by this FA
 * Generate a Regular Grammar which generates the same language accepted by this FA
 * Generate the state diagram of it
 * Trace the computation of any sample string
 * Check it for determinism (ie, detect if it's a NFA-lambda, an NFA, or a DFA)
With a Context-Free Grammar:
 * If it is a Regular Grammar, generate an NFA which accepts the same language
 * If it is a Regular Grammar, generate a regular expression which specifies the same language
With a Regular Expression:
 * Generate an NFA which accepts the same language
 * Generate a Regular Grammar which accepts the same language
 
With *all* of these, you can:
 * Generate a list of strings (up to some maximum length) which are accepted/specified by the FA/Grammar/RegExp
 * Compare it with any *other* FA/Grammar/RegExp and see which strings one accepts which the other does not
