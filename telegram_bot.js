/*


https://api.telegram.org/bot589794421:AAFjVnpgpmNrCXLzjCIhf_XB4dD0ODGJOoo/setWebhook?url=https://79cc3fc8.ngrok.io/webhook/telegram_589794421:AAFjVnpgpmNrCXLzjCIhf_XB4dD0ODGJOoo
https://api.telegram.org/bot589794421:AAFjVnpgpmNrCXLzjCIhf_XB4dD0ODGJOoo/setWebhook?url=https://pendolai.herokuapp.com/webhook/telegram_589794421:AAFjVnpgpmNrCXLzjCIhf_XB4dD0ODGJOoo
 https://t.me/pendolarichefannoilbot
*/
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const app = express();
const TeleBot = require('telebot');
//const bot = new TeleBot('589794421:AAFjVnpgpmNrCXLzjCIhf_XB4dD0ODGJOoo');
const token = '589794421:AAFjVnpgpmNrCXLzjCIhf_XB4dD0ODGJOoo';

const bot = new TeleBot({
    token: token
});
var firebase = require("firebase");
var config = {
  apiKey: "AIzaSyBAeV-Rvuqd1vIyG-Ct2_3NLHfg1FABdv0",
  authDomain: "pendolarichefannoilbot.firebaseapp.com",
  databaseURL: "https://pendolarichefannoilbot.firebaseio.com",
  serviceAccount: "pendolarichefannoilbot-firebase-adminsdk-x5aji-a3b1d8982e.json"
};
firebase.initializeApp(config);

app.post('/webook/telegram_', function (req, res) {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

//bot.on('text', msg => bot.sendMessage(msg.from.id, msg.text + 'bomber'));
bot.start();


/* ########### */

bot.on('text', msg => {
    let numeroTreno = msg.text;
    let promise;
    console.log(`messaggio dall'utente: ${ numeroTreno }`);
    var risposta = 'Forse non ho capito, mi scuso per il disagio';
    const answers = bot.answerList(msg.id, {cacheTime: 60});

    if(numeroTreno.toLowerCase().indexOf('ciao') != -1){
            bot.sendMessage(msg.from.id, 'Ciao anche a te, sono il primo ChatBot per treni sviluppato interamente a bordo di un treno :)) \n ' +
            'Puoi chiedermi a che punto sta il tuo treno semplicemente chattandomi il numero del treno! \n' +
            'Oppure digita help per avere una lista di comandi che sono in grado di eseguire! Enjoy ;)');

    }else if (numeroTreno.toLowerCase().indexOf('trenitalia') != -1) {
              bot.sendMessage(msg.from.id, 'Non nominare Trenitalia invano :D');

    }else if (numeroTreno.toLowerCase().indexOf('help') != -1) {
              bot.sendMessage(msg.from.id, 'Allora le cose che mi puoi chiedere sono le seguenti: \n  - Chi sei? \n  - Come ti chiami? \n - Help \n - scrivimi il numero del tuo treno');

    }else if (numeroTreno.toLowerCase().indexOf('chi sei') != -1) {
              bot.sendMessage(msg.from.id, 'Massic -> https://twitter.com/massic');

    }else if (numeroTreno.toLowerCase().indexOf('come ti chiami') != -1) {
              bot.sendMessage(msg.from.id, 'Massic ');

    }else{
      request({ uri: 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/' + numeroTreno }, function(err, response, body){
                if(body.toString() === ''){
                  risposta = 'Sei sicuro di aver inserito un numero di treno valido?? \n' +
                            ' Ricorda che puoi chiedermi a che punto sta il tuo treno semplicemente chattandomi il numero del treno! \n' +
                            ' Digita help per sapere altre cosucce che puoi chiedermi! Enjoy ;)';
                                          bot.sendMessage(msg.from.id, risposta);
                } else{
                    stazione = body.toString();
                    var arr = stazione.split('-');
                    stazione = arr[2].toString().replace(/\r?\n|\r/g, "");
                    request({ uri: 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/' + stazione + '/' + numeroTreno }, function(err, response, body){
                          //console.log('URLO2', 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/' + stazione + '/' + numeroTreno);
                          var bodyJSON = JSON.parse(body);
                          var ritardo = '';
                          ritardo = bodyJSON.compRitardo[0];
                          //var gif = getGifByRitardo(ritardo);
                          var doveSiTrovaAdesso = bodyJSON.stazioneUltimoRilevamento;
                        //  console.log('ritardo ......', response);
                          var messaggio = 'Ciao la situazione del tuo treno: ' + numeroTreno + ' è :' + ritardo + ' L\' ultima volta è stato avvistato alla stazione di ' + doveSiTrovaAdesso;

                          //bot.sendMessage(msg.from.id, 'Ciao non ti si vede dal: ' + lastSeen(msg));
                          bot.sendMessage(msg.from.id, messaggio);
                          sendGifByRitardo(ritardo, msg.chat.id);
                          saveMessage(msg,ritardo);

                    })

                }


      });
    }



});

function lastSeen(msg){
  var ref = firebase.app().database().ref();
  var usersRef = ref.child('ritardi/' + msg.id);
  usersRef.orderByKey().on('value', function(snap) {
     console.log( snap.val());
     return snap.val();
  });
}


function saveMessage(msg,ritardo) {
  var timestamp = (new Date()).getTime();

  firebase.app().database().ref('/ritardi/').child(msg.from.id).push({
    userID: msg.from.id,
    trainID: msg.text,
    ritardo: ritardo,
    timestamp: timestamp
  }).then(function() {
    console.log('Save successful');
  }).catch(function(error) {
    console.log('Save error');
  });;
}

function sendGifByRitardo(ritardo, chatid){
  var giphyKey = 'smOdpn7EVry49DPEISunsibhUFGdb05p';
  //let sender = event.sender.id;
  let tag = '';
  let uri_start = 'https://api.giphy.com/v1/gifs/random?api_key=smOdpn7EVry49DPEISunsibhUFGdb05p&tag=';
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
