const nodemailer = require(`nodemailer`);
const pug = require(`pug`);
const htmlToText = require(`html-to-text`);

// new Email(user, url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(` `)[0];
    this.url = url;
    this.from = `Cara Lagumen <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === `production`) {
      //SENDGRID
      return nodemailer.createTransport({
        service: `SendGrid`,
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST, //service: `Gmail`,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
      //ACTIVATE IN GMAIL 'LESS SECURE APP' OPTION
    });
  }

  async send(template, subject) {
    //SEND THE ACTUAL EMAIL
    //1. RENDER HTML BASED ON PUG TEMPLATE
    const html = pug.renderFile(`/../views/email/${template}.pug`, {
      //${__dirname}/../views/email/${template}.pug
      firstName: this.firstName,
      url: this.url,
      subject
    });
    //2. DEFINE EMAIL OPTIONS
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };
    //3. CREATE A TRANSPORT AND SEND EMAIL
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send(`Welcome`, `Welcome to the Natours family.`);
  }

  async sendPasswordReset() {
    await this.send(
      `passwordReset`,
      `Your password reset token (valid for only 10 minutes)`
    );
  }
};

//TESTING
// const sendEmail = async options => {
//   // 1. CREATE A TRANSPORTER
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST, //service: `Gmail`,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD
//     }
//     //ACTIVATE IN GMAIL 'LESS SECURE APP' OPTION
//   });
//   //2. DEFINE THE EMAIL OPTIONS
//   const mailOptions = {
//     from: `Cara Lagumen <${process.env.EMAIL_FROM}>`,
//     to: options.email,
//     subject: options.subject,
//     text: options.message
//   };
//   //3. ACTUALLY SEND THE EMAIL
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
