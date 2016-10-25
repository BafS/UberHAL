#!/usr/bin/env node

const fs = require('fs')
const uh = require('./uberhal')

const args = process.argv.slice(2)
if (args.length > 0) {
    if (args[0] === 'clear') {
        uh.clear()
        uh.save()
    }
    else if (args[0] === 'learn' && args.length > 1) {
        let data = fs.readFileSync(args[1], 'utf8')

        if (args[2]) {
            data = require('./parsers/' + args[2])(data)
        }
        uh.learn(data)
        uh.save()
    }
    else if (args[0] === 'speak') {
        console.log(
            uh.speak()
        )
    }
    else if (args[0] === 'answer') {
        console.log(
            uh.answer(args[1])
        )
    }
} else {
    console.log(
        uh.speak()
    )
}
