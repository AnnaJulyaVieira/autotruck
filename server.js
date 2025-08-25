const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

// Instalar: npm install twilio
const twilio = require('twilio');

const app = express();


// Configurações do Twilio - SUBSTITUA PELOS SEUS DADOS REAIS
const TWILIO_ACCOUNT_SID = 'ACb59aba2fb067d9c7a70a5b7ee3faa3b6'; // Ex: 'AC...'
const TWILIO_AUTH_TOKEN = '66131393e6416db70120066dc5e4fa2f';
const TWILIO_PHONE_NUMBER = '+17349845843'; // Ex: '+15551234567'

// Inicializa cliente Twilio
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// CORS - permite requisições de qualquer origem
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

// Middleware para parsing JSON
app.use(express.json());
app.use(bodyParser.json());

// Serve arquivos estáticos da pasta atual
app.use(express.static(__dirname));
app.use(express.static('.'));
app.use(express.static('public'));

// Rota principal - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// Log todas as requisições para debug
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

const ARQUIVO = path.join(__dirname, 'agendamentos.json');

// === Rota de teste ===
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!', timestamp: new Date().toISOString() });
});

// === Redirect para confirma.html ===
app.get('/confirma', (req, res) => {
    res.redirect('/confirma.html');
});

// === Listar todas as rotas ===
app.get('/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        }
    });
    res.json(routes);
});

// === Rota para salvar o agendamento ===
app.post('/salvar-agendamento', (req, res) => {
    console.log('Recebido POST /salvar-agendamento:', req.body);
    
    const novoAgendamento = req.body;

    // Validação básica
    if (!novoAgendamento || !novoAgendamento.nome || !novoAgendamento.cpf) {
        return res.status(400).json({ 
            success: false, 
            error: 'Dados obrigatórios não fornecidos' 
        });
    }

    // lê arquivo atual
    fs.readFile(ARQUIVO, 'utf8', (err, data) => {
        let agendamentos = [];
        
        // Se o arquivo não existir, cria um array vazio
        if (!err && data) {
            try {
                agendamentos = JSON.parse(data);
            } catch (parseErr) {
                console.error('Erro ao fazer parse do JSON:', parseErr);
                agendamentos = [];
            }
        }
        
        // adiciona o novo
        agendamentos.push(novoAgendamento);

        // grava de volta
        fs.writeFile(ARQUIVO, JSON.stringify(agendamentos, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Erro ao gravar arquivo:', writeErr);
                return res.status(500).json({ 
                    success: false, 
                    error: writeErr.message 
                });
            }
            
            console.log('Agendamento salvo com sucesso!');
            res.json({ success: true });
        });
    });
});

// Função para encurtar mensagem se necessário
function formatarMensagemSMS(mensagem, maxLength = 160) {
    if (mensagem.length <= maxLength) {
        return mensagem;
    }
    
    // Versão encurtada da mensagem
    const linhas = mensagem.split('\n');
    const nome = linhas[0].match(/Olá (.*?),/)?.[1] || 'Cliente';
    const carro = mensagem.match(/carro (.*?) foi/)?.[1] || '';
    const data = mensagem.match(/📅 Data: (.*)/)?.[1] || '';
    const horario = mensagem.match(/⏰ Horário: (.*)/)?.[1] || '';
    const servico = mensagem.match(/Serviço: (.*)/)?.[1] || '';
    const valor = mensagem.match(/Valor: (.*)/)?.[1] || '';
    
    // Mensagem compacta
    let mensagemCurta = `Olá ${nome}! Agendamento confirmado:\n`;
    if (carro) mensagemCurta += `🚗 ${carro}\n`;
    if (data) mensagemCurta += `📅 ${data}\n`;
    if (horario) mensagemCurta += `⏰ ${horario}\n`;
    if (servico) mensagemCurta += `${servico}`;
    if (valor) mensagemCurta += ` - ${valor}`;
    
    // Se ainda estiver muito longa, versão ultra compacta
    if (mensagemCurta.length > maxLength) {
        mensagemCurta = `${nome}, agendamento OK! ${data} às ${horario.split(' - ')[0]}. ${servico}: ${valor}`;
    }
    
    return mensagemCurta.substring(0, maxLength);
}

// === Rota para enviar SMS com integração real do Twilio ===
app.post('/enviar-sms', async (req, res) => {
    console.log('Recebido POST /enviar-sms:', req.body);
    
    const { nome, telefone, mensagem } = req.body;

    // Validação dos dados recebidos
    if (!telefone || !mensagem) {
        return res.status(400).json({ 
            success: false, 
            error: 'Telefone e mensagem são obrigatórios' 
        });
    }

    // Formatar mensagem para SMS (máximo 160 caracteres para SMS simples)
    const mensagemFormatada = formatarMensagemSMS(mensagem, 160);
    
    console.log('Mensagem original:', mensagem.length, 'caracteres');
    console.log('Mensagem formatada:', mensagemFormatada.length, 'caracteres');
    console.log('Conteúdo:', mensagemFormatada);

    try {
        // Verifica se as credenciais do Twilio foram configuradas
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
            throw new Error('Credenciais do Twilio não configuradas');
        }

        // Envia SMS usando a API do Twilio
        const message = await twilioClient.messages.create({
            body: mensagemFormatada, // Usando mensagem formatada
            from: TWILIO_PHONE_NUMBER, // Seu número Twilio
            to: telefone // Número do destinatário
        });

        console.log('SMS enviado com sucesso! SID:', message.sid);
        console.log('Status:', message.status);
        
        res.json({ 
            success: true, 
            message: 'SMS enviado com sucesso!',
            messageId: message.sid,
            status: message.status,
            originalLength: mensagem.length,
            sentLength: mensagemFormatada.length,
            sentMessage: mensagemFormatada
        });

    } catch (error) {
        console.error('Erro ao enviar SMS:', error);
        
        // Trata diferentes tipos de erro
        let errorMessage = 'Erro interno do servidor';
        let statusCode = 500;

        if (error.code === 21614) {
            errorMessage = 'Número de telefone não é válido';
            statusCode = 400;
        } else if (error.code === 21408) {
            errorMessage = 'Permissão negada para enviar para este número';
            statusCode = 403;
        } else if (error.code === 20003) {
            errorMessage = 'Credenciais do Twilio inválidas';
            statusCode = 401;
        } else if (error.message.includes('Credenciais do Twilio não configuradas')) {
            errorMessage = 'Credenciais do Twilio não configuradas no servidor';
            statusCode = 500;
        }

        res.status(statusCode).json({ 
            success: false, 
            error: errorMessage,
            details: error.message
        });
    }
});

// === Rota para testar configuração do Twilio ===
app.get('/test-twilio', async (req, res) => {
    try {
        // Testa se as credenciais estão funcionando
        const account = await twilioClient.api.accounts(TWILIO_ACCOUNT_SID).fetch();
        
        res.json({
            success: true,
            message: 'Twilio configurado corretamente',
            accountStatus: account.status,
            accountSid: account.sid
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro na configuração do Twilio',
            details: error.message
        });
    }
});

// === Rota para testar formatação de mensagem ===
app.post('/test-mensagem', (req, res) => {
    const { mensagem } = req.body;
    
    if (!mensagem) {
        return res.status(400).json({ 
            success: false, 
            error: 'Mensagem é obrigatória' 
        });
    }

    const mensagemFormatada = formatarMensagemSMS(mensagem, 160);
    
    res.json({
        original: {
            content: mensagem,
            length: mensagem.length,
            exceedsLimit: mensagem.length > 160
        },
        formatted: {
            content: mensagemFormatada,
            length: mensagemFormatada.length,
            withinLimit: mensagemFormatada.length <= 160
        }
    });
});

// === Rota para enviar SMS de teste simples ===
app.post('/test-sms', async (req, res) => {
    const { telefone } = req.body;
    
    if (!telefone) {
        return res.status(400).json({ 
            success: false, 
            error: 'Telefone é obrigatório' 
        });
    }

    const mensagemTeste = "Teste do sistema de SMS! Funcionando corretamente.";
    
    try {
        const message = await twilioClient.messages.create({
            body: mensagemTeste,
            from: TWILIO_PHONE_NUMBER,
            to: telefone
        });

        res.json({ 
            success: true, 
            message: 'SMS de teste enviado!',
            messageId: message.sid,
            content: mensagemTeste,
            length: mensagemTeste.length
        });

    } catch (error) {
        console.error('Erro no SMS de teste:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao enviar SMS de teste',
            details: error.message
        });
    }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
    });
});

const PORT = process.env.PORT || 3000; // usa a porta do Render ou 3000 localmente

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Configuração do Twilio:');
    console.log('Account SID:', TWILIO_ACCOUNT_SID ? 'Configurado' : 'NÃO CONFIGURADO');
    console.log('Auth Token:', TWILIO_AUTH_TOKEN ? 'Configurado' : 'NÃO CONFIGURADO');
    console.log('Phone Number:', TWILIO_PHONE_NUMBER ? 'Configurado' : 'NÃO CONFIGURADO');
});
