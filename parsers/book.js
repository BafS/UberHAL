
module.exports = function(subtitle) {
    lines = subtitle
        .replace("\r", '')
        .split(/\n/)
        .map(line => {
            return line
                .trim()
                .replace(/(<([^>]+)>)/ig, '')
                .replace(/\([0-9]+\)/g, '')
                .replace(/«/g, '')
        })
        .filter(line => {
            return line !== '' && !line.match(/^ *[0-9]+ *$/)
        })

    return lines.join(' ')
}
