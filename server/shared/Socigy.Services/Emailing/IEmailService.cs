using MimeKit;
using Socigy.Structures;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Org.BouncyCastle.Crypto.Engines.SM2Engine;
using static Socigy.Services.Emailing.ZohoSMTPMailService;

namespace Socigy.Services.Emailing
{
    public interface IEmailService
    {
        Task SendEmailAsync(MimeMessage messageToSend, params string[] parameters);
        Task<bool> VerifyEmailExists(string emailAddress);

        EmailBuilder BuildEmail();
    }
}