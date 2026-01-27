require('dotenv').config()
const fs = require('fs')
const path = require('path')
const Iconv = require('iconv-lite')
const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')
const OpenAI = require('openai')

const token = process.env.BOT_TOKEN
const bot = new TelegramBot(token, { polling: true })

const buttons = [
    [ { text: '🔑 Взял ключ' }, { text: '🗝 Ключ взяла' } ],
    [ { text: '🔧 Ключ у меня' } ],
]
const keyTaken = buttons.flat().map((key) => key.text)

function createContext(msg) {
    return {
        message: msg,
        reply: (text) => bot.sendMessage(msg.chat.id, text),
        replyWithPhoto: (photo) => bot.sendPhoto(msg.chat.id, photo.source),
        sendMessage: (text, options) => bot.sendMessage(msg.chat.id, text, options)
    }
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Привет, я ключник')
})

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Позови меня и нажми на кнопку')
})

bot.onText(/\/key/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Привет', {
        reply_markup: {
            keyboard: buttons
        }
    })
})

bot.on('message', (msg) => {
    if (keyTaken.includes(msg.text)) {
        const ctx = createContext(msg)
        // actions[betAction()](ctx)
        actions[5](ctx)
    }
})

const betAction = () => {
    bet = Math.floor(Math.random() * 9)
    console.log('bet :>> ', bet)
    return bet
}

const sendQuotation = async(ctx) => {
    const quoteAPIurl = 'https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=ru'
    try {
        const response = await axios.get(quoteAPIurl)
        const { quoteText } = response.data
        const name = ctx.message.from.first_name
        const msg = formQuote(quoteText, name)
        ctx.reply(msg)
    } catch (error) {
        ctx.reply(`Ошибка при получении цитаты: ${error.message}`)
    }
}

const sendAnekdot = async(ctx) => {
    const anekUrl = 'https://www.anekdot.ru/rss/random.html'
    try {
        const { data } = await axios.get(anekUrl, { responseType: 'arraybuffer' })
        const siteCode = Iconv.decode(Buffer.from(data), 'Windows-1251')
        const anekdot = extractAnekdot(siteCode)
        ctx.reply(anekdot)
    } catch (error) {
        return `Ошибка чтения анекдота: ${error.message}`
    }
}

const sendAnimalPic = (animal) => async(ctx) => {
    const imageUrl = await getAnimalURL(animal)
    try {
        const response = await axios.get(imageUrl, { responseType: 'stream' })
        const filePath = path.join(__dirname, 'animal.jpg')
        const writer = fs.createWriteStream(filePath)
        response.data.pipe(writer)
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })
        await ctx.replyWithPhoto({ source: filePath })
        fs.unlinkSync(filePath)
    } catch (error) {
        ctx.reply(`Ошибка загрузки зверька: ${error.message}`)
    }
}

const sendAIpoem = async(ctx) => {
    const openai = new OpenAI()
    const name = ctx.message.from.first_name
    const messages = [
        { 
            role: 'user', 
            content: `${name} - инженер в самолетостроении. Напиши стихотворение с поздравлениями, что он (или она, если имя женское) пришел на работу, пожелай успехов и продуктивной работы. Стихотворение должно быть с четкими рифмами и одинаковым размером строк. Используй только русские имена.` 
        }
    ]
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-5",
            messages
        })
        ctx.reply(completion.choices[0].message.content)
    } catch (error) {
        ctx.reply(`Ошибка OpenAI: ${error.message}`)        
    }
}

const actions = new Array(9).fill(() => {})
actions[0] = sendQuotation
actions[1] = sendAnekdot
actions[2] = sendAnimalPic('cat')
actions[3] = sendAnimalPic('cat')
actions[4] = sendAnimalPic('dog')
actions[5] = sendAIpoem
actions[6] = sendAIpoem
actions[7] = sendAIpoem

const extractAnekdot = (siteCode) => {
    return siteCode
        .match(/\[\\"(.|\n)+\\"\]/)[0]
        .split(/\\",\\"/)[0]
        .replace(/^\[\\"/, '')
        .replace(/\\/gm, '')
        .replace(/<br>/gm, '\n')
}

const formQuote = (quoteText, name) => {
        const trimedQuote = quoteText.replace(/[\s\n]+$/, '')
        const lastPunctMark = trimedQuote.slice(-1)
        const msgText = trimedQuote.slice(0, -1) + ', ' + name + lastPunctMark
        return msgText
}

const getAnimalURL = async(animal = Math.random() < 0.5 ? 'cat' : 'dog') => {
    if (!(animal === 'cat' || animal === 'dog')) {
        throw new Error('Wrong animal provided')
    }
    const catAPIkey = 'live_JTS2ybskFIq3bmFB8VtWWJ11pUwbCOqiWqv0d6vTjwdtFjNSOJRPNYAR0uK1amGm'
    const catAPIurl = `https://api.the${animal}api.com/v1/images/search?api_key=${catAPIkey}`
    try {
        const response = await axios.get(catAPIurl)
        return response.data[0].url
    } catch (error) {
        return `Ошибка Animal API: ${error.message}`        
    }
}

process.once('SIGINT', () => {
    bot.stopPolling()
    process.exit()
})
process.once('SIGTERM', () => {
    bot.stopPolling()
    process.exit()
})