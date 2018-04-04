
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

bot.on('text', msg => {
  if(msg.text != '/start' && msg.text != '/english' && msg.text != '/italian' && msg.text != '/whois' && msg.text != '/news' && msg.text != '/treno' && msg.text != '/panorama' ){
    return getRitardo(msg);
  }

});

bot.on(['/start'], msg => {

    let replyMarkup = bot.keyboard([
        ['/italian', '/english', '/treno', '/whois', '/news', '/panorama']
    ], {resize: true});
    //default language italian
    saveLanguagePreference(msg, 'ita');
    return bot.sendMessage(msg.from.id, 'Benvenuto in @pendolarichefannoilbot: sotto trovi i comandi che al momento sono in grado di eseguire. Lingua di default impostata a italiano', {replyMarkup});

});

bot.on('/italian', msg => {
     saveLanguagePreference(msg, 'ita');
     return bot.sendMessage(msg.from.id,'Grazie, le tue preferenze di linguaggio sono state salvate!');

});
bot.on('/english', msg => {

      saveLanguagePreference(msg, 'eng');
      return bot.sendMessage(msg.from.id,'Thanx your languages settings have been saved successfully ;)');
});

bot.on('/treno', msg => {
    if(getLanguagePref(msg) === 'it'){
      return bot.sendMessage(msg.from.id, 'Digita il numero del tuo treno. (es: 2285)');
    }else if(getLanguagePref(msg) === 'en'){
      return bot.sendMessage(msg.from.id, 'Type your train number. (e.g. 2285)');
    }
});

bot.on('/panorama', msg => {
    if(getLanguagePref(msg) === 'it'){
      return bot.sendMessage(msg.from.id, 'In treno è fermo in mezzo alla campagna come al solito? Approfittane almeno per scattare una foto del paesaggio e mandala al chatbot. Le più belle verranno pubblicate sulla pagina Facebook ufficiale!');
    }else if(getLanguagePref(msg) === 'en'){
      return bot.sendMessage(msg.from.id, 'Your train is stuck in the middle of nowhere? Take a shot a send the pic to the chatbot. The best pictured will be published on the official Facebook page. ');
    }
});

bot.on('photo', msg => {
    var picFile = '';
    console.log('Foto: ' + msg.photo[0].file_id)
    var fotoGetPath = 'https://api.telegram.org/bot'+ token +'/getFile?file_id=' + msg.photo[0].file_id;
    //console.log(uricemia);
    request({ uri: fotoGetPath}, function(err, response, body){
        var bodyJSON = JSON.parse(body);
        var filePath = bodyJSON.result.file_path;
        picFile = 'https://api.telegram.org/file/bot'+token + /photos/ + filePath;
        var username = msg.from.username;
        var firstName = msg.from.first_name;
        var lastName = msg.from.last_name;

        bot.sendMessage('355288686', picFile + ' dall\' utente ' + username + ' - ' + firstName + ' ' + lastName);
    })
    if(getLanguagePref(msg) === 'it'){
        return bot.sendMessage(msg.from.id, 'Grazie per la foto, verrà valutata e la migliore sarà pubblicata sulla pagina Facebook ufficiale!');
    }else if(getLanguagePref(msg) === 'en'){
        return bot.sendMessage(msg.from.id, 'Thanx for the pic, will be reviewed and the best ones will be pubished on the official chatbot\'s Facebook page');
    }


});

bot.on('/whois', msg => {

      return bot.sendMessage(msg.from.id, 'Massic -> https://twitter.com/massic');

});
bot.on('/news', msg => {

      return displayFeedRSS(msg.from.id);

});

function getRitardo(msg){
  let numeroTreno = msg.text;
  numeroTreno = numeroTreno.replace('/treno ','');
  let promise;
  //console.log(`messaggio dall'utente: ${ numeroTreno }`);
  var risposta = 'Forse non ho capito, o ci sono dei problemi con il numero del treno che mi hai chiesto :(( Mi scuso per il disagio';
  const answers = bot.answerList(msg.id, {cacheTime: 60});

  var uri1 = 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/' + numeroTreno;
  //  console.log('URLO1: ', uri1);

          request({ uri: uri1 }, function(err, response, body){
                    if(body.toString() === ''){
                      risposta = 'Sei sicuro di aver inserito un numero di treno valido?? \n' +
                                ' Ricorda che puoi chiedermi a che punto sta il tuo treno semplicemente chattandomi il numero del treno! \n' +
                                ' Digita help per sapere altre cosucce che puoi chiedermi! Enjoy ;)';
                      if(getLanguagePref(msg) === 'en'){
                        risposta = 'Are you sure that you typed a valid train ID?'
                      }
                      bot.sendMessage(msg.from.id, risposta);
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
                                        if(getLanguagePref(msg) === 'en'){
                                              ritardo = bodyJSON.compRitardo[1];
                                        }else if(getLanguagePref(msg) === 'it'){
                                              ritardo = bodyJSON.compRitardo[0];
                                        }

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
                                        if(getLanguagePref(msg) === 'en'){
                                              messaggio = messaggio + ' Hello, this is your train status: ' + numeroTreno + ' is :' + ritardo + ' Last time was seen at:  ' + doveSiTrovaAdesso;
                                        }else if(getLanguagePref(msg) === 'it'){
                                              messaggio = messaggio + ' Ciao la situazione del tuo treno: ' + numeroTreno + ' è :' + ritardo + ' L\' ultima volta è stato avvistato alla stazione di ' + doveSiTrovaAdesso;
                                        }
                                        bot.sendMessage(msg.from.id, messaggio);
                                        sendGifByRitardo(ritardo, msg.chat.id);
                                        saveMessage(msg,ritardo);
                                  } catch (e) {
                                     bot.sendMessage(msg.from.id, risposta);

                                  }

                        })
                      }catch (e){
                         console.error(err)
                         bot.sendMessage(msg.from.id, risposta);
                      }

                    }

          });

}



function displayFeedRSS(msg_from_id){
  let parser = new Parser();
  (async () => {
    let feed = await parser.parseURL('http://www.fsnews.it/cms/v/index.jsp?vgnextoid=645968ae9d50a110VgnVCM10000080a3e90aRCRD');
    feed.items.forEach(item => {
       bot.sendMessage(msg_from_id, item.title + ':' + item.link);
    });
  })();
}

//it or en
function getLanguagePref(msg){
    var language = 'it';
    try{
      var ref = firebase.app().database().ref('/ritardi/' + msg.from.id);
      if(ref){
        ref.orderByChild("timestamp").on("value", function(snapshot) {
          // console.log(snapshot.key + " last seen on " + snapshot.val().lang);
          language = snapshot.val().lang;
        });
      }
    }catch(error){
      console.error("Error retrieving data");
    }
    return language;
}

function saveLanguagePreference(msg, lang){
  var feedback = 'Lingua di default settata a italiano!';
  var langPref= '';
  if(lang === 'eng'){
    langPref = 'en';
  }else if(lang === 'ita'){
    langPref = 'it'
  }
  firebase.app().database().ref('/ritardi/').child(msg.from.id).update({
    userID: msg.from.id,
    lang: langPref
  }).then(function() {
    console.log('Save language preference successful');
  }).catch(function(error) {
    console.log('Save language preference error');
  });

}

function saveMessage(msg,ritardo) {
  var timestamp = (new Date()).getTime();
  var d = new Date(timestamp);
/*
  firebase.app().database().ref('/ritardi/').on('child_added', function (snap) {
     bot.sendMessage('355288686', 'Nuovo utente!');
  });
*/
  firebase.app().database().ref('/ritardi/').child(msg.from.id).update({
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
