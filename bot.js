const { Telegraf } = require('telegraf')
const axios = require('axios')

const bot = new Telegraf(process.env.BOT_TOKEN)
const quoteAPIurl = 'https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=ru'

bot.start((ctx) => ctx.reply('Привет, я ключник'))
bot.help((ctx) => ctx.reply('Позови меня и нажми на кнопку'))

bot.hears('🔧 Ключ у меня',async (ctx) => {
    ctx.sendMessage(await formQuote(ctx.message.from.first_name))
})

bot.command('key', (ctx) => {
    ctx.sendMessage('Привет', { 
        reply_markup: {
            keyboard: [
                [ { text: '🔑 Взял ключ' }, { text: '🗝 Ключ взяла' } ],
                [ { text: '🔧 Ключ у меня' } ],
            ]
        }
    });
});

const formQuote = async (userName) => {
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
};

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))