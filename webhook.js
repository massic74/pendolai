const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));


const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'PendolariConIlBOTtino') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});

const request = require('request');
function sendMessage(event) {


  let numeroTreno = event.message.text;
  var risposta = 'Forse non ho capito, mi scuso per il disagio';
  if(numeroTreno.toLowerCase().indexOf('ciao') != -1){
      reply(event,'ciao anche a te, sono il primo ChatBot per treni sviluppato interamente a bordo di un treno :)) Puoi chiedermi a che punto sta il tuo treno semplicemente chattandomi il numero del treno! Enjoy ;)')
  }else if (numeroTreno.toLowerCase().indexOf('trenitalia') != -1) {
        reply(event,'Non nominare Trenitalia invano :D')
  }  else{
    request({ uri: 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/' + numeroTreno }, function(err, response, body){
              if(body.toString() === ''){
                risposta = 'Sei sicuro di aver inserito un numero di treno valido?? Ricorda che puoi chiedermi a che punto sta il tuo treno semplicemente chattandomi il numero del treno! Enjoy ;)';
                    reply(event,risposta);
              } else{
                  stazione = body.toString();
                  var arr = stazione.split('-');
                  stazione = arr[2].toString().replace(/\r?\n|\r/g, "");
                  request({ uri: 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/' + stazione + '/' + numeroTreno }, function(err, response, body){
                        console.log('URLO2', 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/' + stazione + '/' + numeroTreno);
                        var bodyJSON = JSON.parse(body);
                        var ritardo = '';
                        ritardo = bodyJSON.compRitardo[0];
                        var doveSiTrovaAdesso = bodyJSON.stazioneUltimoRilevamento;
                        console.log('ritardo ......', response);
                        var messaggio = 'Ciao la situazione del tuo treno: ' + numeroTreno + ' è :' + ritardo + ' L\' ultima volta è stato avvistato alla stazione di ' + doveSiTrovaAdesso;
                        reply(event,messaggio);
                  })
              }


    });
  }


}

function reply(evento,messaggio){
    let sender = evento.sender.id;
  request({
    url: 'https://graph.facebook.com/v2.12/me/messages',
    qs: {access_token: 'EAAWxRHZAv8CkBAEYRZBg2Jm8DM7HgMsZCN3kCPXsCDlKCYsiLZCjTwF6QCGZAS7f5Sd3vgpGoU33GxL6YIc3i6jeIuzUTcCDCyZBQl5l5KtIwEkGR6RjWnMO1uHq7EySSP2xXgxQqJw54ZCDZB8jLUAIoHRmMkjRAUgd1vQLvhLgYQZDZD'},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: {text: messaggio}
    }
  }, function (error, response) {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
}
