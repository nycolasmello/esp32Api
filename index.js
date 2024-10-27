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
  app.post('/update_gate_state', async (req, res) => {
    const { state } = req.body;
    console.log('Estado do portão recebido:', state);
  
    // Validar o estado recebido
    const validStates = ['fechado', 'em movimento', 'aberto', 'desconhecido'];
    if (!validStates.includes(state)) {
      return res.status(400).json({ error: 'Estado inválido do portão' });
    }
  
    try {
      // Atualiza ou insere o estado do portão no banco de dados
      const result = await pool.query(
        'UPDATE gate_state SET state = $1, updated_at = NOW() WHERE id = 1',
        [state]
      );
  
      // Se nenhuma linha foi atualizada, insere um novo registro
      if (result.rowCount === 0) {
        await pool.query(
          'INSERT INTO gate_state (id, state, updated_at) VALUES (1, $1, NOW())',
          [state]
        );
      }
  
      res.json({ success: true });
    } catch (err) {
      console.error('Erro ao atualizar o estado do portão', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Rota GET /gate_state para obter o estado atual do portão
  app.get('/gate_state', async (req, res) => {
    try {
      const result = await pool.query('SELECT state FROM gate_state WHERE id = 1');
      if (result.rows.length > 0) {
        res.json({ state: result.rows[0].state });
      } else {
        res.json({ state: 'desconhecido' });
      }
    } catch (err) {
      console.error('Erro ao obter o estado do portão', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/slider', async (req, res) => {
    try {
      const result = await pool.query('SELECT value FROM slider_settings WHERE id = 1');
      if (result.rows.length > 0) {
        res.json({ value: result.rows[0].value });
      } else {
        res.json({ value: null });
      }
    } catch (err) {
      console.error('Erro ao obter o valor do slider', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Rota POST /slider para atualizar o valor do slider
  app.post('/slider', async (req, res) => {
    const { value } = req.body;
    console.log('Valor do slider recebido:', value);
  
    try {
      // Atualiza o valor do slider no registro com id = 1
      const result = await pool.query(
        'UPDATE slider_settings SET value = $1 WHERE id = 1',
        [value]
      );
  
      // Se nenhuma linha foi atualizada, insere um novo registro
      if (result.rowCount === 0) {
        await pool.query(
          'INSERT INTO slider_settings (id, value) VALUES (1, $1)',
          [value]
        );
      }
  
      res.json({ success: true });
    } catch (err) {
      console.error('Erro ao atualizar o valor do slider', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
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
      const match = await bcrypt.compare(password, user.password);
      console.log('Resultado da comparação de senha:', match);
  
      if (match) {
        // Recuperar dispositivos associados ao usuário
        const devicesQuery = 'SELECT device_identifier FROM devices WHERE user_id = $1';
        const devicesResult = await pool.query(devicesQuery, [user.id]);

        const devices = devicesResult.rows.map(row => row.device_identifier);

        // Incluir informações dos dispositivos na resposta
        return res.json({ success: true, devices });
    } else {
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