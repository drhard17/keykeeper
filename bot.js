const fs = require('fs')
const path = require('path')
const Iconv = require('iconv-lite')
const { Telegraf } = require('telegraf')
const axios = require('axios')
const { G4F } = require("g4f")

const bot = new Telegraf(process.env.BOT_TOKEN)
const buttons = [
    [ { text: '🔑 Взял ключ' }, { text: '🗝 Ключ взяла' } ],
    [ { text: '🔧 Ключ у меня' } ],
]
const keyTaken = buttons.flat().map((key) => key.text)

bot.start((ctx) => ctx.reply('Привет, я ключник'))
bot.help((ctx) => ctx.reply('Позови меня и нажми на кнопку'))
bot.command('key', (ctx) => {
    ctx.sendMessage('Привет', { 
        reply_markup: {
            keyboard: buttons
        }
    })
})
bot.hears(keyTaken, (ctx) => actions[betAction()](ctx))

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

const sendAnimalPic = async(ctx) => {
    const imageUrl = await getAnimalURL()
    try {
        const response = await axios.get(imageUrl, { responseType: 'stream' })
        const filePath = path.join(__dirname, 'animal.jpg')
        console.log(filePath)
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
    const g4f = new G4F()
    const name = ctx.message.from.first_name
    const messages = [
        { role: 'user', content: `Сочини стишок про то, как ${name} взял ключ` }
    ]
    try {
        const answer = await g4f.chatCompletion(messages)
        ctx.reply(answer)
    } catch (error) {
        ctx.reply(`Ошибка OpenAI: ${error.message}`)        
    }
}

const actions = new Array(9).fill(() => {})
actions[0] = sendQuotation
actions[1] = sendAnekdot
actions[2] = sendAnimalPic
actions[3] = sendAIpoem

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

const getAnimalURL = async() => {
    const animal = Math.random() < 0.5 ? 'cat' : 'dog'
    const catAPIkey = 'live_JTS2ybskFIq3bmFB8VtWWJ11pUwbCOqiWqv0d6vTjwdtFjNSOJRPNYAR0uK1amGm'
    const catAPIurl = `https://api.the${animal}api.com/v1/images/search?api_key=${catAPIkey}`
    try {
        const response = await axios.get(catAPIurl)
        return response.data[0].url
    } catch (error) {
        return `Ошибка Animal API: ${error.message}`        
    }
}

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))