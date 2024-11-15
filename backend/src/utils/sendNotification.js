import { createTransport } from 'nodemailer';

// Set up nodemailer for email notifications
const transporter = createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

const sendNotification = (email, jobTitle, description, location, rate) => {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'New Job Alert',
        text: `A new job matching your skills has been posted!\n\nJob Title: ${jobTitle}\nDescription: ${description}\nLocation: ${location}\nRate: ${rate}\n`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

export default sendNotification;
