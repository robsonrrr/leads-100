/**
 * Email Service
 * Serviço para envio de emails usando Nodemailer
 */
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

// Configuração do transporter
let transporter = null;

/**
 * Inicializa o transporter de email
 */
function getTransporter() {
    if (transporter) return transporter;

    // Configuração via ENV
    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    };

    // Se não tiver credenciais, usar ethereal (mock para testes)
    if (!config.auth.user || !config.auth.pass) {
        logger.warn('SMTP credentials not configured. Using Ethereal for testing.');

        // Criar account Ethereal para testes (não envia email real)
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'ethereal.user@ethereal.email',
                pass: 'ethereal.pass'
            }
        });

        transporter._isTest = true;
        return transporter;
    }

    transporter = nodemailer.createTransport(config);

    // Verificar conexão
    transporter.verify((error, success) => {
        if (error) {
            logger.error('SMTP connection error:', error.message);
        } else {
            logger.info('SMTP server is ready to send emails');
        }
    });

    return transporter;
}

/**
 * Envia um email
 * @param {Object} options - Opções do email
 * @returns {Promise<Object>} - Resultado do envio
 */
export async function sendEmail(options) {
    const {
        to,
        subject,
        text,
        html,
        cc = null,
        bcc = null,
        attachments = [],
        replyTo = null
    } = options;

    try {
        const transport = getTransporter();

        const fromName = process.env.SMTP_FROM_NAME || 'Leads Agent';
        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@leads.com';

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            text,
            html,
            attachments
        };

        if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
        if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
        if (replyTo) mailOptions.replyTo = replyTo;

        // Se estiver em modo teste, simular envio
        if (transport._isTest) {
            logger.info('Email simulated (test mode):', { to: mailOptions.to, subject });
            return {
                success: true,
                messageId: `test-${Date.now()}@ethereal.email`,
                testMode: true,
                preview: 'https://ethereal.email/message/' + Date.now()
            };
        }

        const info = await transport.sendMail(mailOptions);

        logger.info('Email sent successfully:', {
            messageId: info.messageId,
            to: mailOptions.to,
            subject
        });

        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
    } catch (error) {
        logger.error('Failed to send email:', {
            error: error.message,
            to,
            subject
        });

        throw error;
    }
}

/**
 * Envia cotação/lead por email
 * @param {Object} lead - Dados do lead
 * @param {string} recipientEmail - Email do destinatário
 * @param {Object} options - Opções adicionais
 */
export async function sendLeadQuotation(lead, recipientEmail, options = {}) {
    const {
        senderName = 'Equipe Comercial',
        customMessage = '',
        includeItems = true,
        ccEmails = []
    } = options;

    // Formatar tabela de itens
    let itemsTable = '';
    if (includeItems && lead.items && lead.items.length > 0) {
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value || 0);
        };

        itemsTable = `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #1976d2; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Produto</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Qtd</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Preço Unit.</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${lead.items.map((item, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#f9f9f9' : 'white'};">
              <td style="padding: 10px; border: 1px solid #ddd;">
                <strong>${item.productModel || item.model || '-'}</strong><br/>
                <small style="color: #666;">${item.productName || item.name || ''}</small>
              </td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity || 0}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formatCurrency(item.price)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">
                ${formatCurrency((item.quantity || 0) * (item.price || 0))}
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #e3f2fd; font-weight: bold;">
            <td colspan="3" style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total:</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-size: 1.1em; color: #1976d2;">
              ${formatCurrency(lead.totalGeral || lead.subtotal || lead.total_value || 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    `;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .info-box { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .button { display: inline-block; background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .highlight { color: #1976d2; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Cotação #${lead.id}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Proposta Comercial</p>
        </div>
        
        <div class="content">
          <p>Prezado(a) <strong>${lead.customerName || lead.customer?.nome || 'Cliente'}</strong>,</p>
          
          ${customMessage ? `<p>${customMessage}</p>` : `
            <p>É com satisfação que enviamos a cotação solicitada. Confira abaixo os detalhes da proposta:</p>
          `}
          
          <div class="info-box">
            <p><strong>📋 Detalhes da Cotação:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Número:</strong> #${lead.id}</li>
              <li><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
              <li><strong>Validade:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</li>
              <li><strong>Condições:</strong> ${lead.paymentTerms || 'A combinar'}</li>
            </ul>
          </div>
          
          ${itemsTable}
          
          <p>
            Esta cotação tem validade de <span class="highlight">7 dias</span>. 
            Para confirmar ou esclarecer dúvidas, entre em contato conosco.
          </p>
          
          <p>Atenciosamente,<br/><strong>${senderName}</strong></p>
        </div>
        
        <div class="footer">
          <p>Este email foi enviado automaticamente pelo sistema Leads Agent.</p>
          <p>Em caso de dúvidas, responda este email ou entre em contato.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    const textVersion = `
    Cotação #${lead.id}
    
    Prezado(a) ${lead.customerName || lead.customer?.nome || 'Cliente'},
    
    ${customMessage || 'É com satisfação que enviamos a cotação solicitada.'}
    
    Detalhes:
    - Número: #${lead.id}
    - Data: ${new Date().toLocaleDateString('pt-BR')}
    - Validade: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
    
    ${lead.items ? lead.items.map(item => `- ${item.productModel || item.model}: ${item.quantity}x`).join('\n') : ''}
    
    Total: R$ ${(lead.totalGeral || lead.subtotal || 0).toLocaleString('pt-BR')}
    
    Atenciosamente,
    ${senderName}
  `;

    return await sendEmail({
        to: recipientEmail,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        subject: `Cotação #${lead.id} - ${lead.customerName || 'Proposta Comercial'}`,
        text: textVersion,
        html
    });
}

/**
 * Envia notificação de lead convertido
 * @param {Object} lead - Dados do lead
 * @param {Object} order - Dados do pedido
 * @param {string} recipientEmail - Email do destinatário
 */
export async function sendOrderConfirmation(lead, order, recipientEmail) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .success-icon { font-size: 48px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1 style="margin: 0;">Pedido Confirmado!</h1>
          <p style="margin: 10px 0 0 0;">Lead #${lead.id} convertido em Pedido #${order.id || order.orderId}</p>
        </div>
        
        <div class="content">
          <p>O lead foi convertido com sucesso!</p>
          
          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td><strong>Lead:</strong></td>
              <td>#${lead.id}</td>
            </tr>
            <tr>
              <td><strong>Pedido:</strong></td>
              <td>#${order.id || order.orderId}</td>
            </tr>
            <tr>
              <td><strong>Cliente:</strong></td>
              <td>${lead.customerName || '-'}</td>
            </tr>
            <tr>
              <td><strong>Data:</strong></td>
              <td>${new Date().toLocaleString('pt-BR')}</td>
            </tr>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;

    return await sendEmail({
        to: recipientEmail,
        subject: `✅ Pedido #${order.id || order.orderId} Confirmado - Lead #${lead.id}`,
        text: `Lead #${lead.id} foi convertido em Pedido #${order.id || order.orderId}`,
        html
    });
}

export default {
    sendEmail,
    sendLeadQuotation,
    sendOrderConfirmation
};
