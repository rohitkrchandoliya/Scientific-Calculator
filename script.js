const display = document.getElementById("display");

function appendCharacter(character) {
    display.value += character;
}

function clearDisplay() {
    display.value = "";
}

// Parse only calculator syntax. Do not execute user-controlled text with eval().
function evaluateExpression(source) {
    const tokens = [];
    const tokenPattern = /\s*(?:(\d+(?:\.\d*)?|\.\d+)|([A-Za-z]+(?:\.[A-Za-z]+)?)|([()+\-*/%^]))/gy;
    let position = 0;

    while (position < source.length) {
        tokenPattern.lastIndex = position;
        const match = tokenPattern.exec(source);
        if (!match) {
            if (/^\s*$/.test(source.slice(position))) break;
            throw new Error("Invalid character in expression.");
        }
        tokens.push(match[1] ?? match[2] ?? match[3]);
        position = tokenPattern.lastIndex;
    }

    if (tokens.length === 0) throw new Error("Enter an expression.");
    let index = 0;
    const peek = () => tokens[index];
    const consume = () => tokens[index++];

    function primary() {
        const token = consume();
        if (token === undefined) throw new Error("Incomplete expression.");

        if (token === "(") {
            const value = expression();
            if (consume() !== ")") throw new Error("Missing closing parenthesis.");
            return value;
        }

        if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) return Number(token);
        if (token === "Math.PI") return Math.PI;
        if (token === "Math.E") return Math.E;

        const functions = {
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan,
            "Math.sqrt": Math.sqrt,
            "Math.log": Math.log
        };
        if (Object.prototype.hasOwnProperty.call(functions, token)) {
            if (consume() !== "(") throw new Error(token + " requires parentheses.");
            const argument = expression();
            if (consume() !== ")") throw new Error("Missing closing parenthesis for " + token + ".");
            if (token === "Math.sqrt" && argument < 0) throw new Error("Square root requires a non-negative value.");
            if (token === "Math.log" && argument <= 0) throw new Error("Logarithm requires a positive value.");
            return functions[token](argument);
        }

        throw new Error("Unsupported value or function: " + token);
    }

    function power() {
        const left = primary();
        if (peek() === "^") {
            consume();
            return left ** unary();
        }
        return left;
    }

    function unary() {
        if (peek() === "+") {
            consume();
            return unary();
        }
        if (peek() === "-") {
            consume();
            return -unary();
        }
        return power();
    }

    function term() {
        let value = unary();
        while (["*", "/", "%"].includes(peek())) {
            const operator = consume();
            const right = unary();
            if ((operator === "/" || operator === "%") && right === 0) {
                throw new Error("Cannot divide by zero.");
            }
            if (operator === "*") value *= right;
            else if (operator === "/") value /= right;
            else value %= right;
        }
        return value;
    }

    function expression() {
        let value = term();
        while (peek() === "+" || peek() === "-") {
            const operator = consume();
            const right = term();
            value = operator === "+" ? value + right : value - right;
        }
        return value;
    }

    const result = expression();
    if (index !== tokens.length) throw new Error("Unexpected token: " + peek());
    if (!Number.isFinite(result)) throw new Error("Result is outside the supported numeric range.");
    return result;
}

function calculateResult() {
    try {
        display.value = String(evaluateExpression(display.value));
    } catch (error) {
        display.value = error instanceof Error ? error.message : "Invalid expression.";
    }
}
