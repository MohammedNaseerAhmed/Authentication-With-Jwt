import nodemailer from "nodemailer"
import dotenv from'dotenv'
dotenv.config();
const transporter =nodemailer.createTransport({
    // host: process.env.SMTP_HOST,
    // port: process.env.SMTP_PORT,
    // secure: false, // use true if you switch to port 465
    // auth: {
    //   user: process.env.SMTP_USER,
    //   pass: process.env.SMTP_PASS,
    // },
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    },
})

export default transporter

