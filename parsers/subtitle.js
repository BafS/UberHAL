
module.exports = function(subtitle) {
    lines = subtitle
        .replace("\r", '')
        .split(/\n/)
        .map(line => line.trim().replace(/(<([^>]+)>)/ig, ''))
        .filter(line => {
            return line !== '' && !line.match(/^ *[0-9]+ *$/) && !line.match(/ --> /)
        })

    return lines.join(' ')
}
