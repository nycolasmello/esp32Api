const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const bcrypt = require('bcrypt');


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
let clients = [];

const pool = new Pool({
  user: 'postgres',
  host: 'junction.proxy.rlwy.net',
  database: 'railway',
  password: 'clHyahvXXtujBGXGqmCZbNunPaNXDrUz',
  port: 52114, // Porta padrão do PostgreSQL
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro adquirindo cliente do pool', err.stack);
  }
  console.log('Conectado ao banco de dados PostgreSQL');
  release();
});

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
  // Endpoint de login
  app.post('/login', async (req, res) => {
    const { login, password } = req.body;
    console.log('Dados recebidos:', { login, password });
  
    try {
      // Consulta ao banco de dados
      const query = 'SELECT * FROM tb_users WHERE login = $1';
      const values = [login];
  
      const result = await pool.query(query, values);
      console.log('Resultado da consulta:', result.rows);
  
      if (result.rows.length === 0) {
        // Usuário não encontrado
        return res.status(401).json({ error: 'Usuário ou senha incorretos' });
      }
  
      const user = result.rows[0];
      console.log('Usuário encontrado:', user);
  
      // Verificar a senha
      const match = await bcrypt.compare(password, user.senha);
      console.log('Resultado da comparação de senha:', match);
  
      if (match) {
        // Senha correta
        return res.json({ success: true });
      } else {
        // Senha incorreta
        return res.status(401).json({ error: 'Usuário ou senha incorretos' });
      }
    } catch (err) {
      console.error('Erro ao consultar o banco de dados', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  

  
  app.get('/event/:event', sendEvent);
  app.get('/',function(req,res){res.sendFile(path.join(__dirname+'/index.html'))});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
});