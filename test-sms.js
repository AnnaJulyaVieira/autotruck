require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

client.messages.create({
    body: 'Teste SMS via Twilio',
    from: process.env.TWILIO_FROM_NUMBER,
    to: '+5531992954968' // Seu número verificado
}).then(msg => console.log('SMS enviado:', msg.sid))
  .catch(err => console.error('Erro:', err));
