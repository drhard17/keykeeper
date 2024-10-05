const { Telegraf } = require('telegraf')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const Iconv = require('iconv-lite')

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
    ctx.sendMessage(await formQuote(ctx.message.from.first_name))
}

const sendAnekdot = async(ctx) => {
    ctx.sendMessage(await getAnekdot())
}

const sendAnimalPic = async(ctx) => {
    const imageUrl = await getCatPictureURL()
    try {
        const response = await axios.get(imageUrl, { responseType: 'stream' })
        const filePath = path.join(__dirname, 'animal.jpg')
        const writer = fs.createWriteStream(filePath)
        response.data.pipe(writer)
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        });
        await ctx.replyWithPhoto({ source: filePath })
        fs.unlinkSync(filePath);
    } catch (error) {
        ctx.reply(`Ошибка загрузки зверька: ${error.message}`)
    }
}

const actions = new Array(9).fill(() => {})
actions[0] = sendQuotation
actions[1] = sendAnekdot
actions[2] = sendAnimalPic
actions[3] = sendAnimalPic

const getAnekdot = async () => {
    const anekUrl = 'https://www.anekdot.ru/rss/random.html'
    try {
        const { data } = await axios.get(anekUrl, { responseType: 'arraybuffer' })
        const siteCode = Iconv.decode(Buffer.from(data), 'Windows-1251')
        return siteCode
            .match(/\[\\"(.|\n)+\\"\]/)[0]
            .split(/\\",\\"/)[0]
            .replace(/^\[\\"/, '')
            .replace(/\\/gm, '')
            .replace(/<br>/gm, '\n')
    } catch (error) {
        return `Ошибка чтения анекдота: ${error.message}`
    }
}

const formQuote = async (userName) => {
    const quoteAPIurl = 'https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=ru'
    try {
        const response = await axios.get(quoteAPIurl)
        const quote = response.data.quoteText
        const trimedQuote = quote.replace(/[\s\n]+$/, '')
        const lastPunctMark = trimedQuote.slice(-1)
        const msgText = trimedQuote.slice(0, -1) + ', ' + userName + lastPunctMark
        return msgText
    } catch (error) {
        return `Ошибка при получении цитаты: ${error.message}`
    }
}

const getCatPictureURL = async() => {
    const animal = Math.random() < 0.5 ? 'cat' : 'dog'
    const catAPIkey = 'live_JTS2ybskFIq3bmFB8VtWWJ11pUwbCOqiWqv0d6vTjwdtFjNSOJRPNYAR0uK1amGm'
    const catAPIurl = `https://api.the${animal}api.com/v1/images/search?api_key=${catAPIkey}`
    try {
        const response = await axios.get(catAPIurl)
        return response.data[0].url
    } catch (error) {
        return `Ошибка CatAPI: ${error.message}`        
    }
}

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))