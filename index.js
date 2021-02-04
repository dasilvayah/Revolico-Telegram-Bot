require('dotenv').config();

const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const token = '1569542090:AAFZ-F5kTge8Xy1e1BvVSgvG6xDdWRjWDHE'; //test bot
// const token = '1505514141:AAFTz2hmr047MV3MqERJZg58mOiazDHZLLM'; //client's bot
const bot = new TelegramBot(token, { polling: true });

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => console.log(`Database connected successfully`))
    .catch(err => console.log(err));
mongoose.Promise = global.Promise;

const Member = require('./models/member');

bot.on("polling_error", (err) => console.log(err));

bot.on('message', function (message) {

    console.log(message);

    //Member adding
    if (message.new_chat_members != undefined
        && !message.new_chat_member.is_bot
    ) {
        //Member joined by itself
        if (message.from.id == message.new_chat_member.id) {
            Member.findOne({ id: message.new_chat_member.id })
                .then(res => {
                    if (res == null) {
                        Member.create({
                            id: message.new_chat_member.id,
                            first_name: message.new_chat_member.first_name,
                            last_name: message.new_chat_member.last_name,
                            username: message.new_chat_member.username,
                            added_members_count: 0,
                        }).then(res => {
                            if (res.username != undefined) {
                                console.log("LOG: " + res.username + " joined group");
                            } else {
                                console.log("LOG: " + res.first_name + " " + res.last_name + " joined group");
                            }
                        });
                    }
                })
        }

        //Member joined by add members
        else {
            Member.findOne({ id: message.from.id })
                .then(res => {
                    if (res == null) {
                        Member.create({
                            id: message.from.id,
                            first_name: message.from.first_name,
                            last_name: message.from.last_name,
                            username: message.from.username,
                            added_members_count: message.new_chat_members.length,
                        }).then(adder => {
                            for (let i = 0; i < message.new_chat_members.length; i++) {
                                Member.create({
                                    id: message.new_chat_members[i].id,
                                    first_name: message.new_chat_members[i].first_name,
                                    last_name: message.new_chat_members[i].last_name,
                                    username: message.new_chat_members[i].username,
                                    added_members_count: 0,
                                }).then(addee => {
                                    if (adder.username != undefined) {
                                        if (addee.username != undefined) {
                                            console.log("LOG: " + adder.username + " added " + addee.username);
                                        } else {
                                            console.log("LOG: " + adder.username + " added " + addee.first_name + " " + addee.last_name);
                                        }
                                    } else {
                                        if (addee.username != undefined) {
                                            console.log("LOG: " + adder.first_name + " " + adder.last_name + " added " + addee.username);
                                        } else {
                                            console.log("LOG: " + adder.first_name + " " + adder.last_name + " added " + addee.first_name + " " + addee.last_name);
                                        }
                                    }
                                });

                            }
                        });
                    } else {
                        Member.findOneAndUpdate({ id: message.from.id }, { added_members_count: res.added_members_count + message.new_chat_members.length })
                            .then(adder => {
                                for (let i = 0; i < message.new_chat_members.length; i++) {
                                    Member.create({
                                        id: message.new_chat_members[i].id,
                                        first_name: message.new_chat_members[i].first_name,
                                        last_name: message.new_chat_members[i].last_name,
                                        username: message.new_chat_members[i].username,
                                        added_members_count: 0,
                                    }).then(addee => {
                                        if (adder.username != undefined) {
                                            if (addee.username != undefined) {
                                                console.log("LOG: " + adder.username + " added " + addee.username);
                                            } else {
                                                console.log("LOG: " + adder.username + " added " + addee.first_name + " " + addee.last_name);
                                            }
                                        } else {
                                            if (addee.username != undefined) {
                                                console.log("LOG: " + adder.first_name + " " + adder.last_name + " added " + addee.username);
                                            } else {
                                                console.log("LOG: " + adder.first_name + " " + adder.last_name + " added " + addee.first_name + " " + addee.last_name);
                                            }
                                        }
                                    });
                                }
                            })

                    }
                })

            //delete added message from Telegram created 
            setTimeout(function () {
                bot.deleteMessage(message.chat.id, message.message_id);
                console.log("LOG: Bot deleted msg from Telegram.")
            }, 10000);
        }
    }

    //Member leaving
    else if (message.left_chat_member != undefined
        && !message.from.is_bot
    ) {
        Member.findOneAndDelete({ id: message.left_chat_member.id })
            .then(res => {
                if (res != null) {
                    if (res.username != undefined) {
                        console.log("LOG: " + res.username + " left group");
                    } else {
                        console.log("LOG: " + res.first_name + " " + res.last_name + " left group");
                    }
                }
            });
    }

    //Member posting
    else if (message.new_chat_members == undefined
        && message.left_chat_member == undefined
        && message.from != undefined
        && !message.from.is_bot
    ) {
        Member.findOne({ id: message.from.id })
            .then(res => {
                if (res == null) {
                    Member.create({
                        id: message.from.id,
                        first_name: message.from.first_name,
                        last_name: message.from.last_name,
                        username: message.from.username,
                        added_members_count: 0,
                    });

                    if (message.from.username != undefined) {
                        console.log("LOG: " + message.from.username + "'s post was deleted!");
                    } else {
                        console.log("LOG: " + message.from.first_name + " " + message.from.last_name + "'s post was deleted!");
                    }

                    removeAdsAndSendNotification(message.chat.id, message.message_id, 0);
                } else {
                    if (res.added_members_count < 5) {

                        if (message.from.username != undefined) {
                            console.log("LOG: " + message.from.username + "'s post was deleted!");
                        } else {
                            console.log("LOG: " + message.from.first_name + " " + message.from.last_name + "'s post was deleted!");
                        }

                        removeAdsAndSendNotification(message.chat.id, message.message_id, res.added_members_count);
                    }
                }
            })
    }
});

function removeAdsAndSendNotification(chatId, msgId, count) {
    bot.deleteMessage(chatId, msgId)
        .then(ads => {
            var options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: 'Descargar Perolata', url: 'https://play.google.com/store/apps/details?id=com.perolata.perolata' }]
                    ]
                })
            };
            bot.sendMessage(chatId, "Â¡Debe agregar al menos 5 miembros a este grupo antes de publicar anuncios! Solo agregaste " + count + " miembros en este grupo..", options)
                .then(botmsg => {
                    setTimeout(function () {
                        bot.deleteMessage(chatId, botmsg.message_id);
                        console.log("LOG: Bot notification was deleted.")
                    }, 30000);
                })
        })
        .catch(err => {
            console.log("Notification: Please give the bot admin permission.")
        })
}
