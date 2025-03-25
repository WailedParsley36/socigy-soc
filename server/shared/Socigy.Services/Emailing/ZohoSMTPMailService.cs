using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace Socigy.Services.Emailing
{
    public class ZohoSMTPMailService : IEmailService
    {
        private readonly string _SMTPassword;
        protected readonly string _SMTPEmail;
        public ZohoSMTPMailService(IConfiguration config)
        {
            _SMTPassword = config.GetValue<string>("SMTP_SECRET_TOKEN") ?? throw new Exception("No credentials for emailing were provided");
            _SMTPEmail = config.GetValue<string>("SMTP_SECRET_EMAIL") ?? "no-reply@socigy.com";
        }

        private const string SMTPHost = "smtp.zoho.eu";

        private bool CheckSSL(object sender, X509Certificate? certificate, X509Chain? chain, SslPolicyErrors sslPolicyErrors)
        {
            return true;
        }
        private async Task<SmtpClient> GetSmtpClientAsync()
        {
            var client = new SmtpClient();
            client.ServerCertificateValidationCallback = CheckSSL;

#if DEBUG
            client.RequireTLS = true;
            client.ServerCertificateValidationCallback = CheckSSL;

            await client.ConnectAsync(SMTPHost, 587, MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_SMTPEmail, _SMTPassword);
#else
            await client.ConnectAsync(SMTPHost, 465, MailKit.Security.SecureSocketOptions.SslOnConnect);
            await client.AuthenticateAsync(_SMTPEmail, _SMTPassword);
#endif
            return client;
        }

        public async Task SendEmailAsync(MimeMessage messageToSend, params string[] parameters)
        {
            using var client = await GetSmtpClientAsync();

            await client.SendAsync(messageToSend);
            await client.DisconnectAsync(true);
        }

        public async Task<bool> VerifyEmailExists(string email)
        {
            using var client = await GetSmtpClientAsync();

            var result = await client.VerifyAsync(email);
            await client.DisconnectAsync(true);

            return result != null;
        }

        public EmailBuilder BuildEmail()
        {
            return new EmailBuilder(this);
        }

        public class EmailBuilder
        {
            private MimeMessage Message { get; set; }
            private readonly ZohoSMTPMailService _Mails;
            public EmailBuilder(ZohoSMTPMailService mailing)
            {
                _Mails = mailing;

                Message = new MimeMessage();
                Message.From.Add(new MailboxAddress("Socigy", mailing._SMTPEmail));
            }

            public EmailBuilder WithSubject(string subject)
            {
                Message.Subject = subject;
                return this;
            }

            public EmailBuilder WithBody(string body)
            {
                var builder = new BodyBuilder();
                builder.HtmlBody = body;

                Message.Body = builder.ToMessageBody();
                return this;
            }

            public EmailBuilder WithReceiver(string name, string email)
            {
                Message.To.Add(new MailboxAddress(name, email));
                return this;
            }

            public async Task SendAsync()
            {
                await _Mails.SendEmailAsync(Message);
            }
        }
    }
}