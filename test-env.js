require('dotenv').config();

console.log('🔍 TESTE DE VARIÁVEIS DE AMBIENTE\n');

console.log('📋 Variáveis carregadas:');
console.log(`TWILIO_ACCOUNT_SID: "${process.env.TWILIO_ACCOUNT_SID}"`);
console.log(`TWILIO_AUTH_TOKEN: "${process.env.TWILIO_AUTH_TOKEN}"`);
console.log(`TWILIO_PHONE_NUMBER: "${process.env.TWILIO_PHONE_NUMBER}"`);

console.log('\n🔍 Análise:');
console.log(`Account SID válido: ${process.env.TWILIO_ACCOUNT_SID === 'ACb59aba2fb067d9c7a70a5b7ee3faa3b6' ? '✅' : '❌'}`);
console.log(`Auth Token válido: ${process.env.TWILIO_AUTH_TOKEN === '66131393e6416db70120066dc5e4fa2f' ? '✅' : '❌'}`);
console.log(`Phone Number válido: ${process.env.TWILIO_PHONE_NUMBER === '+17349845843' ? '✅' : '❌'}`);

// Teste rápido com as credenciais carregadas
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.log('\n🚀 Testando com as variáveis carregadas...');
    
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    client.messages.create({
        body: '✅ Teste via .env funcionou!',
        from: process.env.TWILIO_PHONE_NUMBER,
        to: '+5531992954968'
    })
    .then(message => {
        console.log('✅ SMS enviado com sucesso!');
        console.log(`📱 SID: ${message.sid}`);
    })
    .catch(error => {
        console.log('❌ Erro:', error.message);
        console.log('🔴 Código:', error.code);
    });
} else {
    console.log('\n❌ Variáveis não carregadas corretamente!');
}