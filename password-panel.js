'use strict'

const decodeAsciiPrintable = (n) => String.fromCharCode(n + 33)

const decodeAsciiAlphanumeric = (n) => {
    if (n < 26) return String.fromCharCode(n + 65)
    if (n < 52) return String.fromCharCode(n + 71)
    return String.fromCharCode(n - 4)
}

const pseudoLangConsonants = ['b','ch','d','f','h','j','k','l','m','p','r','s','t','w','z']
const pseudoLangVowels = ['a','e','i','o','u','ai','on']

const decodePseudoLang = (n) => pseudoLangConsonants[Math.trunc(n/7)] + pseudoLangVowels[n%7] + '.'

const randomUint16 = () => {
    const array = new Uint16Array(1)
    window.crypto.getRandomValues(array)
    return array[0]
}

const randomInt = (range) => {
    const limit = 0x10000 % range
    let u16 = randomUint16()
    while (u16 < limit) u16 = randomUint16()
    return u16 % range
}

const randomString = (decoder, range, length) => {
    let accumulator = ''
    for (let i = 0; i < length; i++) {
        accumulator += decoder(randomInt(range))
    }
    return accumulator
}

const insertBang = (baseString) => {
    const index = randomInt(baseString.length + 1)
    return baseString.slice(0, index) + '!' + baseString.slice(index)
}

const insertPseudoLangSpaces = (baseString) => {
    const parsed = baseString.split('.')
    let resultString = ''
    for (let i = 2; i < parsed.length; i += 3) {
        if (i !== 2) resultString += ' '
        resultString += parsed[i-2] + parsed[i-1] + parsed[i]
    }
    return resultString
}

const escapeStringForHtml = (string) => {
    let accumulator = ''
    for (let i = 0; i < string.length; i++) {
        accumulator += '&#' + string.charCodeAt(i) + ';'
    }
    return accumulator
}

const updateStringGenerator = (sharedValues, target, makeString) => {
    const inner = () => {
        const string = makeString()
        document.getElementById(target).innerHTML = escapeStringForHtml(string)
        sharedValues[target] = string
    }
    return inner
}

const updatePanelGenerator = (stringUpdaters) => {
    const inner = () => {
        for (let i = 0; i < stringUpdaters.length; i++) {
            stringUpdaters[i]()
        }
    }
    return inner
}

const addBr = () => {
    document.body.appendChild(document.createElement('br'))
}

const createFlipFlop = (leftElem, rightElem) => {
    let poppedDisplay = rightElem.style.display
    rightElem.style.display = 'none'
    let mode = 'left'
    const inner = (outcome) => {
        if (outcome === 'left' && mode === 'right') {
            leftElem.style.display = poppedDisplay
            poppedDisplay = rightElem.style.display
            rightElem.style.display = 'none'
            mode = 'left'
        }
        else if (outcome === 'right' && mode === 'left') {
            rightElem.style.display = poppedDisplay
            poppedDisplay = leftElem.style.display
            leftElem.style.display = 'none'
            mode = 'right'
        }
    }
    return inner
}

const addPasswordDisplay = (sharedValues, text, target, entropy) => {
    let div = document.createElement('div')
    document.body.appendChild(div)
    div.style.height = '50px'
    let span = document.createElement('span')
    div.appendChild(span)
    let button = document.createElement('button')
    span.appendChild(button)
    button.type = 'button'
    button.innerHTML = escapeStringForHtml(text)
    button.style.marginRight = '30px'
    button.style.marginBottom = '5px'
    let p = document.createElement('span')
    span.appendChild(p)
    p.id = target
    span.appendChild(document.createElement('br'))
    span.appendChild(document.createTextNode(entropy + " bits of entropy"))
    let copied = document.createElement('span')
    div.appendChild(copied)
    copied.innerHTML = 'Copied to Clipboard!'
    let flipFlop = createFlipFlop(span, copied)
    button.onclick = () => {
        navigator.clipboard.writeText(sharedValues[target]).then(() => {
            flipFlop('right')
            setTimeout(flipFlop, 1500, 'left')
        })
    }
}

const setup = () => {
    let style = document.createElement('style')
    document.head.appendChild(style)
    style.innerHTML = 'body{font-family:monospace;font-size:16px}button{font-family:sans-serif;font-size:16px}'
    let sharedValues = {}
    const updatePanel = updatePanelGenerator([
        updateStringGenerator(sharedValues, 'pw-printable-30', () => randomString(decodeAsciiPrintable, 94, 30)),
        updateStringGenerator(sharedValues, 'pw-printable-20', () => randomString(decodeAsciiPrintable, 94, 20)),
        updateStringGenerator(sharedValues, 'pw-printable-10', () => randomString(decodeAsciiPrintable, 94, 10)),
        updateStringGenerator(sharedValues, 'pw-alphanumeric-30', () => randomString(decodeAsciiAlphanumeric, 62, 30)),
        updateStringGenerator(sharedValues, 'pw-alphanumeric-20', () => randomString(decodeAsciiAlphanumeric, 62, 20)),
        updateStringGenerator(sharedValues, 'pw-alphanumeric-10', () => randomString(decodeAsciiAlphanumeric, 62, 10)),
        updateStringGenerator(sharedValues, 'pw-alphanumeric-bang-30', () => insertBang(randomString(decodeAsciiAlphanumeric, 62, 29))),
        updateStringGenerator(sharedValues, 'pw-alphanumeric-bang-20', () => insertBang(randomString(decodeAsciiAlphanumeric, 62, 19))),
        updateStringGenerator(sharedValues, 'pw-alphanumeric-bang-10', () => insertBang(randomString(decodeAsciiAlphanumeric, 62, 9))),
        updateStringGenerator(sharedValues, 'readable', () => insertPseudoLangSpaces(randomString(decodePseudoLang, 105, 12))),
    ])
    let generateButton = document.createElement('button')
    document.body.appendChild(generateButton)
    generateButton.type = 'button'
    generateButton.innerHTML = 'Generate More'
    generateButton.onclick = updatePanel
    generateButton.style.marginBottom = '100px'
    addBr()
    addPasswordDisplay(sharedValues, '30 Printable', 'pw-printable-30', 196)
    addBr()
    addPasswordDisplay(sharedValues, '20 Printable', 'pw-printable-20', 131)
    addBr()
    addPasswordDisplay(sharedValues, '10 Printable', 'pw-printable-10', 65)
    addBr()
    addPasswordDisplay(sharedValues, '30 Alphanumeric', 'pw-alphanumeric-30', 178)
    addBr()
    addPasswordDisplay(sharedValues, '20 Alphanumeric', 'pw-alphanumeric-20', 119)
    addBr()
    addPasswordDisplay(sharedValues, '10 Alphanumeric', 'pw-alphanumeric-10', 59)
    addBr()
    addPasswordDisplay(sharedValues, '30 Alphanumeric with !', 'pw-alphanumeric-bang-30', 183)
    addBr()
    addPasswordDisplay(sharedValues, '20 Alphanumeric with !', 'pw-alphanumeric-bang-20', 123)
    addBr()
    addPasswordDisplay(sharedValues, '10 Alphanumeric with !', 'pw-alphanumeric-bang-10', 63)
    addBr()
    addPasswordDisplay(sharedValues, 'Readable', 'readable', 80)
    addBr()
    setTimeout(updatePanel, 0)
}

const launch = (launcher, iterationCount) => {
    if (document.readyState === 'complete') {
        setup()
    } else if (iterationCount < 2500) {
        setTimeout(launcher, 20, launcher, iterationCount + 1)
    } else {
        throw new Error('Failed to launch application due to timeout')
    }
}

launch(launch, 0)
