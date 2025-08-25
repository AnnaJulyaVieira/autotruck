const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public')); // Continua servindo arquivos da pasta public

const ARQUIVO = path.join(__dirname, 'agendamentos.json');

// ===== Rota para entregar o confirma.html que está na raiz =====
app.get('/confirma.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'confirma.html'));
});

// ===== Rota para salvar agendamento =====
app.post('/salvar-agendamento', (req, res) => {
    const novoAgendamento = req.body;

    fs.readFile(ARQUIVO, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Erro ao ler arquivo' });

        let agendamentos = [];
        try {
            agendamentos = JSON.parse(data);
        } catch (e) {
            agendamentos = [];
        }

        agendamentos.push(novoAgendamento);

        fs.writeFile(ARQUIVO, JSON.stringify(agendamentos, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Erro ao salvar arquivo' });
            res.json({ success: true });
        });
    });
});

// Rota para dashboard
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});


// ===== Rota para ler agendamentos =====
app.get('/agendamentos', (req, res) => {
    fs.readFile(ARQUIVO, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Erro ao ler arquivo' });
        res.json(JSON.parse(data));
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

