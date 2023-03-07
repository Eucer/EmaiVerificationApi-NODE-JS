const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const redis = require('redis');

const app = express();
const client = redis.createClient();

app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'grover.padberg@ethereal.email', // generated ethereal user
    pass: 'u1Jf8rPZ99w6RnZ8hG', // generated ethereal password
  },
});

transporter.verify().then(() => {
  console.log('readiy gmails');
});

app.post('/verify-account', (req, res) => {
  const { email } = req.body;
  const verificationCode = crypto.randomBytes(4).toString('hex');

  const mailOptions = {
    from: 'noreply@example.com', // sender address
    to: email, // list of receivers
    subject: 'Verificación de cuenta', // Subject line
    text: `Su código de verificación es: ${verificationCode}`,
    html: `Su código de verificación es: ${verificationCode}`, // plain text body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res
        .status(500)
        .send('Error al enviar el correo electrónico de verificación');
    } else {
      console.log('Correo electrónico enviado: ' + info.response);
      client.set(email, verificationCode);
      client.expire(email, 3600); // Expira en 1 hora
      res
        .status(200)
        .send('Se ha enviado un correo electrónico de verificación');
    }
  });
});

app.post('/verify-code', (req, res) => {
  const email = req.body.email;
  const code = req.body.code;

  client.get(email, (error, result) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error al verificar el código');
    } else if (!result) {
      res.status(404).send('No se ha encontrado el código de verificación');
    } else if (code !== result) {
      res.status(401).send('Código de verificación incorrecto');
    } else {
      // Código de verificación correcto
      client.del(email);
      res.status(200).send('Cuenta verificada correctamente');
    }
  });
});
const PORT = process.env.PORT || 7629;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});
