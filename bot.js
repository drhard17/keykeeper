const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Добро пожаловать'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.command('key', (ctx) => {
    ctx.sendMessage(`Привет, ${ctx.message.from.first_name}!`, { 
        reply_markup: {
            keyboard: [
                /* Inline buttons. 2 side-by-side */
                [ { text: 'Взял ключ', callback_data: "btn-1" }, { text: "Ключ взяла", callback_data: "btn-2" } ],

                /* One button */
                [ { text: 'Ключ у меня', callback_data: 'Взял' } ],
                
                /* Also, we can have URL buttons. */
                // [ { text: "Open in browser", url: "telegraf.js.org" } ]
            ]
        }
    });
});



bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))