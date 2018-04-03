
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
var chatbase = require('@google/chatbase');
const app = express();
const TeleBot = require('telebot');

const token = process.env.bot_token;
const PORT = process.env.PORT || 5000
let Parser = require('rss-parser');
var emoji = require('node-emoji')

const bot = new TeleBot({
    token: token
});
var firebase = require('firebase');
var config = {
  apiKey: process.env.firebase_key,
  authDomain: 'pendolarichefannoilbot.firebaseapp.com',
  databaseURL: 'https://pendolarichefannoilbot.firebaseio.com',
  serviceAccount: process.env.firebase_credentials
};
firebase.initializeApp(config);
app.listen(PORT, () => console.log('Listening on ${ PORT }'));

app.post('/webook/telegram_', function (req, res) {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

//bot.on('text', msg => bot.sendMessage(msg.from.id, msg.text + 'bomber'));
bot.start();


bot.on(['/start'], msg => {

    let replyMarkup = bot.keyboard([
        ['/italian', '/english']
    ], {resize: true});

    return bot.sendMessage(msg.from.id, 'Welcome to @pendolarichefannoilbot: set your language preferences | Benvenuto in @pendolarichefannoilbot scegli la tua lingua', {replyMarkup});

});

bot.on('/italian', msg => {
    return saveLanguagePreference(msg, 'ita');

});
bot.on('/english', msg => {
    return bot.sendMessage(
      return saveLanguagePreference(msg, 'eng');
    
});

bot.on('text', msg => {
    let numeroTreno = msg.text;

    let promise;
    console.log(`messaggio dall'utente: ${ numeroTreno }`);
    var risposta = 'Forse non ho capito, o ci sono dei problemi con il numero del treno che mi hai chiesto :(( Mi scuso per il disagio';
    const answers = bot.answerList(msg.id, {cacheTime: 60});

    if(numeroTreno.toLowerCase().indexOf('ciao') != -1){
            var testo = 'Ciao anche a te, sono il primo ChatBot per treni sviluppato interamente a bordo di un treno :)) \n ' +
            'Puoi chiedermi a che punto sta il tuo treno semplicemente chattandomi il numero del treno! \n' +
            'Oppure digita help per avere una lista di comandi che sono in grado di eseguire! Enjoy ;)';

            bot.sendMessage(msg.from.id,testo );
          //  sendAnalytics(msg.chat.id,testo, 'agent', 'handled');

    }else if (numeroTreno.toLowerCase().indexOf('trenitalia') != -1) {
              bot.sendMessage(msg.from.id, 'Non nominare Trenitalia invano :D');
          //      sendAnalytics(msg.chat.id,'Non nominare Trenitalia invano :D', 'agent', 'handled');
    }else if (numeroTreno.toLowerCase().indexOf('avvisi') != -1) {
              displayFeedRSS(msg.from.id)
    }else if (numeroTreno.toLowerCase().indexOf('help') != -1) {
              var testo = 'Allora le cose che mi puoi chiedere sono le seguenti: \n  - Chi sei? \n  - Come ti chiami? \n - Help \n - scrivimi il numero del tuo treno \n - Avvisi'
              bot.sendMessage(msg.from.id, testo );
        //      sendAnalytics(msg.chat.id,testo, 'agent', 'handled');
    }else if (numeroTreno.toLowerCase().indexOf('chi sei') != -1) {
              bot.sendMessage(msg.from.id, 'Massic -> https://twitter.com/massic');
        //      sendAnalytics(msg.chat.id,'Massic -> https://twitter.com/massic', 'agent', 'handled');
    }else if (numeroTreno.toLowerCase().indexOf('come ti chiami') != -1) {
              bot.sendMessage(msg.from.id, 'Massic ');
        //      sendAnalytics(msg.chat.id,'Massic ', 'agent', 'handled');
    }else{
      var uri1 = 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/' + numeroTreno;
    //  console.log('URLO1: ', uri1);

            request({ uri: uri1 }, function(err, response, body){
                      if(body.toString() === ''){
                        risposta = 'Sei sicuro di aver inserito un numero di treno valido?? \n' +
                                  ' Ricorda che puoi chiedermi a che punto sta il tuo treno semplicemente chattandomi il numero del treno! \n' +
                                  ' Digita help per sapere altre cosucce che puoi chiedermi! Enjoy ;)';
                                                bot.sendMessage(msg.from.id, risposta);
                                          //      sendAnalytics(msg.chat.id,risposta, 'agent', 'handled');
                      } else{
                      try{
                          stazione = body.toString();
                          var arr = stazione.split('-');
                          stazione = arr[2].toString().replace(/\r?\n|\r/g, '').replace(' ','');
                        //  console.log('STAZIOnE: ', stazione);
                          request({ uri: 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/' + stazione + '/' + numeroTreno }, function(err, response, body){
                              //  console.log('URLO2', 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/' + stazione + '/' + numeroTreno);
                                  try {
                                          var bodyJSON = JSON.parse(body);
                                          var ritardo = '';
                                          ritardo = bodyJSON.compRitardo[0];
                                          //var gif = getGifByRitardo(ritardo);
                                          var messaggio = '';
                                          var doveSiTrovaAdesso = bodyJSON.stazioneUltimoRilevamento;
                                          if(ritardo.toLowerCase().indexOf('orario') != -1){
                                            messaggio = messaggio + emoji.emojify(':green_heart:');
                                          }else if (ritardo.toLowerCase().indexOf('ritardo') != -1) {
                                              messaggio = messaggio + emoji.emojify(':red_circle:');
                                          }else if (ritardo.toLowerCase().indexOf('anticipo') != -1) {
                                              messaggio = messaggio + emoji.emojify(':champagne:');
                                          }else{
                                              messaggio = messaggio;
                                          }
                                          messaggio = messaggio + ' Ciao la situazione del tuo treno: ' + numeroTreno + ' è :' + ritardo + ' L\' ultima volta è stato avvistato alla stazione di ' + doveSiTrovaAdesso;
                                          //red_circle
                                          //green_heart
                                          //bot.sendMessage(msg.from.id, 'Ciao non ti si vede dal: ' + lastSeen(msg));
                                          bot.sendMessage(msg.from.id, messaggio);
                                    //      sendAnalytics(msg.chat.id,messaggio, 'agent', 'handled');
                                          sendGifByRitardo(ritardo, msg.chat.id);
                                          saveMessage(msg,ritardo);
                                          // welcome message
                                          lastSeen(msg);
                                    } catch (e) {
                                       bot.sendMessage(msg.from.id, risposta);
                                //       sendAnalytics(msg.chat.id,messaggio, 'agent', 'not_handled');
                                    }

                          })
                        }catch (e){
                           console.error(err)
                           bot.sendMessage(msg.from.id, risposta);
                        }

                      }


            });


    }



});

function displayFeedRSS(msg_from_id){
  let parser = new Parser();
  (async () => {
    let feed = await parser.parseURL('http://www.fsnews.it/cms/v/index.jsp?vgnextoid=645968ae9d50a110VgnVCM10000080a3e90aRCRD');
    feed.items.forEach(item => {
       bot.sendMessage(msg_from_id, item.title + ':' + item.link);
    });
  })();
}

function lastSeen(msg){
try{
  var ref = firebase.app().database().ref('/ritardi/' + msg.from.id);
  if(ref){
    ref.orderByChild("timestamp").on("value", function(snapshot) {
       console.log(snapshot.key + " last seen on " + snapshot.val().when);
    });
  }
}catch(error){
  console.error("Error retrieving data");
}



}

function saveLanguagePreference(msg, lang){
  var langPref= '';
  if(lang === 'eng'){
    langPref = 'en';
  }else if(lang === 'ita'){
    langPref = 'it'
  }
  firebase.app().database().ref('/ritardi/').child(msg.from.id).set({
    userID: msg.from.id,
    lang: langPref;
  }).then(function() {
    console.log('Save language preference successful');
  }).catch(function(error) {
    console.log('Save language preference error');
  });
}

function saveMessage(msg,ritardo) {
  var timestamp = (new Date()).getTime();
  var d = new Date(timestamp);


  firebase.app().database().ref('/ritardi/').child(msg.from.id).set({
    userID: msg.from.id,
    trainID: msg.text,
    ritardo: ritardo,
    timestamp: timestamp,
    when: d.toString()
  }).then(function() {
    console.log('Save successful');
  }).catch(function(error) {
    console.log('Save error');
  });
}

function sendGifByRitardo(ritardo, chatid){
  var giphyKey = process.env.giphy_key;
  //let sender = event.sender.id;
  let tag = '';
  let uri_start = 'https://api.giphy.com/v1/gifs/random?api_key='+giphyKey+'&tag=';
  let uri_end = '&rating=G';

  if(ritardo.toLowerCase().indexOf('orario') != -1){
    tag = 'wow'
  }else if (ritardo.toLowerCase().indexOf('ritardo') != -1) {
    tag = 'sad';
  }else{
    tag = 'omg';
  }
  let uri = uri_start + tag + uri_end;
  request({ uri: uri}, function(err, response, body){
      var gifJSON = JSON.parse(body);
      var giff = gifJSON.data.images.original.url;
      var uricemia = 'https://api.telegram.org/bot'+ token +'/sendVideo?chat_id=' + chatid + '&video=' + giff;
      //console.log(uricemia);
      request({ uri: uricemia}, function(err, response, body){

      })
  })
}

/*
* NOT USED
*/
function sendAnalytics(conversationID,msg, from, msgType){
// MANDATORY FIELDS: api_key, type, user_id, time_stamp, platform, message
   	var newMsg = chatbase.newMessage(process.env.chatbase_key, conversationID)
    .setPlatform('Telegram')
    .setTimestamp(Date.now().toString())
    .setMessage(msg)
    if(msgType == 'handled'){
       newMsg.setAsHandled()
       console.log('set as handled');
    }else if (msgType === 'not_handled') {
        newMsg.setAsNotHandled()
        console.log('set as NOT handled');
    }
    if(from === 'user'){
       newMsg.setAsTypeUser()
       console.log('set as type user');
    }else if (from === 'agent') {
        newMsg.setAsTypeAgent()
        console.log('set as agent');
    }
    newMsg.send().catch(err => console.error(err));
}
