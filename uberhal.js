const fs = require('fs')

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Chains {
    constructor(data) {
        if (!data) {
            data = {}
        }
        this.data = data
    }

    /**
     * Increment the incident weight of the adjacent tokens
     */
    addInput(current, previous, next) {
        // Create the structure if needed
        if (!this.data[current]) {
            this.data[current] = [{}, {}] // [previousTokens, nextTokens]
        }

        // Update next token weight
        if (next) {
            if (this.data[current][1][next]) {
                ++this.data[current][1][next]
            } else {
                this.data[current][1][next] = 1
            }
        }

        // Update previous token weight
        if (previous) {
            if (this.data[current][0][previous]) {
                ++this.data[current][0][previous]
            } else {
                this.data[current][0][previous] = 1
            }
        }
    }

    /**
     * Get a random token in the previous adjacent list given the current one
     * @arg string
     * @return string
     */
    getPrevious(current) {
        return this.get(current, 'previous')
    }

    /**
     * Get a random token in the next adjacent list given the current one
     * @arg string
     * @return string
     */
    getNext(current) {
        return this.get(current, 'next')
    }

    get(current, direction) {
        const adj = this.getAdjacent(current, direction)
        if (adj) {
            const ran = getRandomInt(1, this.sumToken(adj))
            return this.sumToken(adj, sum => sum >= ran)
        }

        return false
    }

    getAdjacent(current, direction) {
        if (this.data[current]) {
            if (direction === 0 || direction === 'previous') {
                direction = 0
            } else {
                direction = 1
            }
            return this.data[current][direction]
        }

        return false
    }

    /**
     * Sum the weight of all the adjacent tokens
     * @arg string Current token
     * @arg function Return the current token when the callback is true
     */
    sumToken(adjacency, cb) {
        let nodeSumWeigth = 0
        for (let token in adjacency) {
            const tokenWeight = adjacency[token]
            nodeSumWeigth += tokenWeight

            if (cb && cb(nodeSumWeigth, token)) {
                return token
            }
        }

        return nodeSumWeigth
    }
}

class UberHAL {

    constructor(databaseFile) {
        this.startToken = '#START#'
        this.endToken = '#END#'
        this.rules = {
            endSymbols: '.?!',
            replace: [
                [/\.{3}/g,   '…'],
                [/"/g,       ''],
                [/ \- /g,    ''],
                [/`/g,       "'"]
            ],
            // secure: [ TODO
                // 'M. '
            // ]
        }
        this.ignoreContext = [ // TODO
            // 'a', 'the', 'an', 'some', 'those', 'their', 'this', 'to'
            // 'le', 'la', 'les', 'l\'', 'des', 'ces', 'ceux', 'ses'
        ]
        this.beautifyRules = {
            replace: [
                [/ i /g,      ' I '],
                [/ (\.|:|;)/g,  '$1']
            ]
        }

        this.dbFile = './db.json'
        if (databaseFile) {
            this.dbFile = databaseFile
        }

        const raw = fs.readFileSync(this.dbFile, 'utf8')
        if (raw.length > 5) {
            this.chains = new Chains(JSON.parse(raw))
        } else {
            this.chains = new Chains
        }
    }

    /**
     * Transform full text to paragraphs
     * @arg string text
     * @return array
     */
    normalize(text) {
        text = text.replace("\n", ' ')

        // Replace some patterns
        this.rules.replace.forEach(replace => {
            text = text.replace(replace[0], replace[1])
        })

        for (let i = 0; i < this.rules.endSymbols.length; ++i) {
            const endSymbol = this.rules.endSymbols[i]
            const re = new RegExp('\\' + endSymbol, 'g');
            text = text.replace(re, ' ' + endSymbol.trim() + "\n")
        }

        text = text.toLowerCase().trim()

        // Return paragraphs
        return text.split("\n")
    }

    /**
     * Beautify a paragraph
     * @arg string paragraph
     * @return string
     */
    beautify(paragraph) {
        paragraph = paragraph.trim()

        this.beautifyRules.replace.forEach(replace => {
            paragraph = paragraph.replace(replace[0], replace[1])
        })

        return paragraph.charAt(0).toUpperCase() + paragraph.slice(1)
    }

    /**
     * Split a paragraph to tokens
     * @arg string
     * @return array Array of tokens
     */
    lexer(str) {
        let arr = str.split(/[ _]+/)

        // Remove useless spaces, remove empty strings
        return arr.map(w => w.trim()).filter(w => w !== '')
    }

    /**
     * Give UberHAL something to learn
     * @arg string text
     */
    learn(text) {
        let paragraphs = this.normalize(text)
        paragraphs.forEach(p => this.learnOneParagraph(p))
        // console.log(this.chains.data)
    }

    /**
     * Give UberHAL a paragraph to learn
     * @arg string A paragraph
     */
    learnOneParagraph(paragraph) {
        const tokens = this.lexer(paragraph)
        tokens.unshift(this.startToken)

        tokens.forEach((token, index) => {
            let tokenPrevious = null // start
            // let tokenPrevious = this.startToken // start
            let tokenNext = this.endToken // end
            if (tokens[index + 1]) {
                tokenNext = tokens[index + 1]
            }
            if (tokens[index - 1]) {
                tokenPrevious = tokens[index - 1]
            }

            this.chains.addInput(token, tokenPrevious, tokenNext)
        })
    }

    /**
     * Get a paragraph
     * @arg string
     * @return string
     */
    getParagraph(startToken) {
        let text = ''
        let next = startToken

        while (next !== false) {
            next = this.chains.getNext(next)
            if (next && next !== this.endToken) {
                text += ' ' + next
            }
        }

        return text
    }

    /**
     * Speaks
     * @return string A random paragraph
     */
    speak() {
        let text = this.getParagraph(this.startToken)

        return this.beautify(text)
    }

    answer(context) {
        const tokens = this.lexer(context)
        const ran = getRandomInt(0, tokens.length - 1)
        // const token = tokens[0]
        const token = tokens[ran].toLowerCase()

        let lastGood = token

        // console.log('SELECTED TOKEN: ' + token)

        let previous = token
        let reverseText = ''
        let firstPrevious
        while (previous !== false && previous !== this.startToken) {
            previous = this.chains.getPrevious(previous)

            if (!firstPrevious) {
                firstPrevious = previous
            }

            if (previous && firstPrevious && previous !== this.startToken) {
                lastGood = previous

                reverseText = previous + ' ' + reverseText
            }

            // console.log(' - ' + previous);
        }

        // console.log('LAST GOOD: ' + lastGood);
        // console.log('TOKEN: ' + token);
        // console.log('FIRST PREV: ' + firstPrevious);

        if (reverseText && reverseText.length > 1) {
            let endText = ''
            if (Math.random() > 0.5) {
                // Use a direct word from the context
                endText = ' ' + token + this.getParagraph(token)
            } else {
                // Use a correlated word from the context
                endText = this.getParagraph(firstPrevious)
            }

            return this.beautify(reverseText.trim() + endText)
        }

        return false
        // return this.speak()
    }

    /**
     * Clear database
     */
    clear() {
        this.chains = new Chains
    }

    /**
     * Save the database
     * @arg function Callback function
     */
    save(cb) {
        const ser = JSON.stringify(this.chains.data)
        fs.writeFile(this.dbFile, ser, err => {
            if (err) {
                cb(err)
                return console.error(err)
            }

            if (cb) {
                cb(null)
            }
        })
    }

    // TODO
    infos() {

    }
}

module.exports = new UberHAL
