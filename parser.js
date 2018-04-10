/*------------------------------------------------------------------------------
| SAPHIR DICE PARSER                                                           |
------------------------------------------------------------------------------*/

// Match something like 3d6h2
const subcommandRegex = /^(\+|-)([1-9]|[1-9]\d)(d)([1-9]\d{3}|[1-9]\d{2}|[1-9]\d|[1-9])((l|h)([1-9]|[1-9]\d))?$/;
const repeatRegex = /^([1-9]|[1-9]\d)$/;
const flatRegex = /^(\+|-)([1-9]\d{3}|[1-9]\d{2}|[1-9]\d|[1-9])$/;

const helpMessage = 'here is some help:\n\
!3d6 -> roll three six-sided die\n\
!3d6h2 -> roll three six-sided die and keep the two highest\n\
!3d6l2 -> roll three six-sided die and keep the two lowest\n\
!2#3d6 -> roll three six-sided die two times';

const errorMessage = 'this command is invalid';

/// Parse a Saphir dice expression and return the result.
/// The dice expression will look something like this, for example:
/// repeat#subcommand+subcommand-flat
/// Each of the elements of the dice expression will be validated using the 
/// corresponding regex
exports.parse = function parse(formula) {   
    var resultTotal;
    var resultString = '';

    // Strip the formula of any whitespace
    formula = stripWhitespace(formula);

    if (formula == 'help') {
        return helpMessage;
    }

    // Split the formula on '#'
    var splittedFormula = splitOnSharp(formula);
    var formulaRepeat = splittedFormula[0];
    var formulaCommand = splittedFormula[1];

    // The first character should be a '+' or a '-'
    formulaCommand = addPlusIfNecessary(formulaCommand);

    // Split the command into an array of subcommands
    var subcommands = splitIntoSubcommands(formulaCommand);

    // Validate the repeat and each subcommand
    var valid = true;
    if (!validateRepeat(formulaRepeat)) {
        valid = false;
    }
    subcommands.forEach(function(subcommand) {
        if (!validateSubcommand(subcommand)) {
            valid = false;
        }
    })
    if (!valid) {
        return(errorMessage);
    }

    // Evaluate each subcommand
    for (j = 0; j < formulaRepeat; j++) {
        resultTotal = 0;
        
        var tempString = '[';
        subcommands.forEach(function(subcommand) {
            evaluation = evaluateSubcommand(subcommand)
            resultTotal = resultTotal + evaluation[0];
            tempString = tempString + evaluation[1];
        })

        tempString = tempString.slice(0, -2);
        tempString = String(resultTotal) + ' ' + tempString + '] ';
        resultString = resultString + tempString;
    }
    
    resultString = formula + ': ' + resultString;
    // 'resultTotal' could also be returned in the future
    console.log(resultString);
    return resultString;
}

// Return true if the subcommand is valid
function validateSubcommand(subcommand) {
    return (subcommand.match(subcommandRegex) != null || subcommand.match(flatRegex) != null);
}

// Return true if the repeat is valid
function validateRepeat(repeat) {
    return repeat.match(repeatRegex);
}

// Strip a formula of any whitespace
function stripWhitespace(formula) {
    formula = formula.replace(/\s/g, '');
    return formula;
}

// Return the part before and after the '#' of a formula
function splitOnSharp(formula) {
    var sharpIndex = formula.indexOf('#');

    if (sharpIndex == -1) {
        return ['1', formula];
    }
    else {
        var formulaRepeat = formula.substring(0, sharpIndex);
        var formulaCommand = formula.substring(sharpIndex + 1, formula.lenght);
        return [formulaRepeat, formulaCommand];
    }
}

// Add a '+' at the start if the first character is not '+' nor '-'
function addPlusIfNecessary(command) {
    if (command[0] != '+' && command[0] != '-') {
        command = '+' + command;
    }

    return command;
}

// Return an array of subcommands
function splitIntoSubcommands(command) {
    var subcommands = [];

    // Kind of a hack to switch '3d6+1d20-2d10' to ['+3d6', '+1d20', '-2d10']
    var subcommands = command.split(/(?=(\+|-))/g);
    for (var i = 0; i < subcommands.length; i++) {
        subcommands.splice(i + 1, 1);
    }

    return subcommands;
}

// Evaluate a subcommand and return a result (a string to display) as well as a
// value (a number to add)
function evaluateSubcommand(subcommand) {
    var sign = ( subcommand[0] == '+' ? 1 : -1);
    var unsignedSubcommand = subcommand.substring(1, subcommand.lenght);
    
    // Case where the subcommand is a flat number
    if (unsignedSubcommand.indexOf('d') == -1) {
        return [Number(unsignedSubcommand)*sign, ''];
    }

    // At this point, the 'unsignedSubcommand' should looks like 3d6((h|l)2)
    numbers = unsignedSubcommand.split(/(d|h|l)/)
    
    var numberOfDices = numbers[0];
    var numberOfSides = numbers[2];
    var keepHighest = -1;
    var keepLowest = -1;
    
    if (unsignedSubcommand.indexOf('h') != -1) {
        keepHighest = numbers[4];
    }
    else if (unsignedSubcommand.indexOf('l') != -1) {
        keepLowest = numbers[4];
    }

    var results = rollXdY(numberOfDices, numberOfSides).sort(sortNumber);
    
    // Construct the string first
    var resultsAsString = unsignedSubcommand+'=';
    for(var i = 0; i < results.length; i++) {
        resultsAsString = resultsAsString + String(results[i])+',';
    }
    resultsAsString = resultsAsString.substring(0, resultsAsString.length-1)+'; ';
    
    // Trim results
   keepHighest = Math.min(keepHighest, results.length);
   keepLowest = Math.min(keepLowest, results.length);
    if (keepHighest != -1) {
        results = results.slice(results.length - keepHighest, results.length);
    }
    if (keepLowest !=-1) {
        results = results.slice(0, keepLowest);
    }

    // Calculate the total
    var total = 0;
    for(var i = 0; i < results.length; i++) {
        total = total + results[i];
    }

    return [total*sign, resultsAsString];
}

function rollXdY (x, y) {
    var results = [];
    for (i = 0; i<x; i++) {
        results.push(randomInt(1, y));
    }
    return results;
}

function randomInt (min, max) {
    return Math.floor((Math.random() * max) + min);
}

// Used to sort an array by numeric value instead of alphabetically
function sortNumber(a,b) {
    return a - b;
}
