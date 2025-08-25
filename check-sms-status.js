require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Verificar status de mensagens recentes
async function verificarStatusRecentes() {
    console.log('🔍 ================================');
    console.log('   VERIFICAÇÃO DE STATUS SMS');
    console.log('🔍 ================================\n');

    try {
        // Buscar as últimas 20 mensagens
        console.log('📋 Buscando mensagens recentes...\n');
        
        const messages = await client.messages.list({ limit: 20 });
        
        if (messages.length === 0) {
            console.log('❌ Nenhuma mensagem encontrada');
            return;
        }

        // Mostrar detalhes de cada mensagem
        messages.forEach((msg, index) => {
            console.log(`📱 MENSAGEM ${index + 1}:`);
            console.log(`   🆔 SID: ${msg.sid}`);
            console.log(`   📞 Para: ${msg.to}`);
            console.log(`   📤 De: ${msg.from}`);
            console.log(`   📊 Status: ${getStatusIcon(msg.status)} ${msg.status.toUpperCase()}`);
            console.log(`   📅 Criado: ${msg.dateCreated.toLocaleString('pt-BR')}`);
            console.log(`   📨 Enviado: ${msg.dateSent ? msg.dateSent.toLocaleString('pt-BR') : 'Não enviado'}`);
            console.log(`   📝 Atualizado: ${msg.dateUpdated.toLocaleString('pt-BR')}`);
            
            // Mostrar erros se houver
            if (msg.errorCode) {
                console.log(`   ❌ Erro: ${msg.errorCode} - ${msg.errorMessage}`);
            }
            
            // Mostrar preço se disponível
            if (msg.price) {
                console.log(`   💰 Preço: ${msg.price} ${msg.priceUnit}`);
            }
            
            // Mostrar primeiros caracteres da mensagem
            if (msg.body) {
                const preview = msg.body.length > 50 ? 
                    msg.body.substring(0, 50) + '...' : 
                    msg.body;
                console.log(`   💬 Mensagem: "${preview}"`);
            }
            
            console.log('   ' + '─'.repeat(50));
            console.log();
        });

        // Estatísticas gerais
        console.log('\n📊 ESTATÍSTICAS:');
        const stats = calcularEstatisticas(messages);
        
        console.log(`📤 Total enviadas: ${messages.length}`);
        console.log(`✅ Entregues: ${stats.delivered} (${stats.deliveredPercent}%)`);
        console.log(`❌ Falharam: ${stats.failed} (${stats.failedPercent}%)`);
        console.log(`⏳ Pendentes: ${stats.pending} (${stats.pendingPercent}%)`);
        console.log(`🔄 Em trânsito: ${stats.sent} (${stats.sentPercent}%)`);
        
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error.message);
    }
}

// Verificar status de um SMS específico pelo SID
async function verificarSMSEspecifico(sid) {
    console.log(`🔍 Verificando SMS específico: ${sid}\n`);
    
    try {
        const message = await client.messages(sid).fetch();
        
        console.log('📱 DETALHES COMPLETOS:');
        console.log(`   🆔 SID: ${message.sid}`);
        console.log(`   📞 Para: ${message.to}`);
        console.log(`   📤 De: ${message.from}`);
        console.log(`   📊 Status: ${getStatusIcon(message.status)} ${message.status.toUpperCase()}`);
        console.log(`   📅 Criado: ${message.dateCreated.toLocaleString('pt-BR')}`);
        console.log(`   📨 Enviado: ${message.dateSent ? message.dateSent.toLocaleString('pt-BR') : 'Não enviado'}`);
        console.log(`   📝 Atualizado: ${message.dateUpdated.toLocaleString('pt-BR')}`);
        console.log(`   📍 Direção: ${message.direction}`);
        console.log(`   🌍 Código país: ${message.to.substring(0, 3)}`);
        
        if (message.errorCode) {
            console.log(`   ❌ Código erro: ${message.errorCode}`);
            console.log(`   💬 Mensagem erro: ${message.errorMessage}`);
            console.log(`   📋 Explicação: ${getErrorExplanation(message.errorCode)}`);
        }
        
        if (message.price) {
            console.log(`   💰 Preço: ${message.price} ${message.priceUnit}`);
        }
        
        console.log(`   💬 Mensagem completa:`);
        console.log(`   "${message.body}"`);
        
        // Dicas baseadas no status
        console.log(`\n💡 O QUE SIGNIFICA:`);
        console.log(`   ${getStatusExplanation(message.status)}`);
        
    } catch (error) {
        console.error('❌ Erro ao buscar SMS:', error.message);
    }
}

// Funções auxiliares
function getStatusIcon(status) {
    const icons = {
        'queued': '⏳',
        'sent': '📤',
        'delivered': '✅',
        'failed': '❌',
        'undelivered': '📵',
        'receiving': '📥',
        'received': '✅'
    };
    return icons[status] || '❓';
}

function getStatusExplanation(status) {
    const explanations = {
        'queued': 'SMS na fila do Twilio, será enviado em breve',
        'sent': 'SMS enviado para a operadora, aguardando entrega',
        'delivered': 'SMS entregue com sucesso no celular',
        'failed': 'SMS falhou - pode ser número inválido ou bloqueio da operadora',
        'undelivered': 'SMS não foi entregue - operadora rejeitou',
        'receiving': 'Recebendo SMS (para números de entrada)',
        'received': 'SMS recebido com sucesso'
    };
    return explanations[status] || 'Status desconhecido';
}

function getErrorExplanation(errorCode) {
    const errors = {
        '30007': 'Número de telefone não pode receber SMS',
        '21211': 'Número de telefone inválido',
        '21614': 'Número inválido para o país',
        '21608': 'Número não pode receber SMS (linha fixa ou inválida)',
        '30003': 'Mensagem não pôde ser entregue - número inexistente',
        '30005': 'Número de telefone desconhecido',
        '21610': 'Mensagem possui conteúdo proibido'
    };
    return errors[errorCode] || 'Consulte documentação Twilio para mais detalhes';
}

function calcularEstatisticas(messages) {
    const total = messages.length;
    const delivered = messages.filter(m => m.status === 'delivered').length;
    const failed = messages.filter(m => m.status === 'failed').length;
    const pending = messages.filter(m => m.status === 'queued').length;
    const sent = messages.filter(m => m.status === 'sent').length;
    
    return {
        delivered,
        failed,
        pending,
        sent,
        deliveredPercent: ((delivered/total)*100).toFixed(1),
        failedPercent: ((failed/total)*100).toFixed(1),
        pendingPercent: ((pending/total)*100).toFixed(1),
        sentPercent: ((sent/total)*100).toFixed(1)
    };
}

// Interface de linha de comando
const args = process.argv.slice(2);

if (args.length > 0) {
    // Verificar SMS específico pelo SID
    const sid = args[0];
    if (sid.startsWith('SM')) {
        verificarSMSEspecifico(sid);
    } else {
        console.log('❌ SID inválido. Deve começar com "SM"');
        console.log('💡 Exemplo: node check-sms-status.js SM1234567890abcdef1234567890abcdef');
    }
} else {
    // Mostrar mensagens recentes
    verificarStatusRecentes();
}

console.log('\n💡 COMO USAR:');
console.log('node check-sms-status.js                    -> Ver mensagens recentes');
console.log('node check-sms-status.js SM1234567890...    -> Ver SMS específico por SID');