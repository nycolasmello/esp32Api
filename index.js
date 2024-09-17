const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
let clients = [];

app.get('/status', (request, response) => response.json({clients: clients.length,input}));

const PORT = 3000;
function eventsHandler(request, response, next) {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
  
    const data = `data:${'API SERVER conectado'}\n\n`;
  
    response.write(data);
  
    const clientId = Date.now();
  
    const newClient = {
      id: clientId,
      response
    };
  
    clients.push(newClient);
  
    request.on('close', () => {
      console.log(`${clientId} Connection closed`);
      clients = clients.filter(client => client.id !== clientId);
    });
  }
  
  app.get('/events', eventsHandler);

  function sendEventsToAll(newInput) {
    clients.forEach(client => client.response.write(`data:${newInput}\n\n`))
  }
  
  async function sendEvent(request, response, next) {
    sendEventsToAll(request.params.event);
    return response.json();
  }
  
  
  app.get('/event/:event', sendEvent);
  app.get('/',function(req,res){res.sendFile(path.join(__dirname+'/index.html'))});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
});