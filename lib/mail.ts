import nodemailer from 'nodemailer';
import { formatPrice } from './format';

export interface OrderEmailItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderConfirmationEmailData {
  to: string;
  customerName: string;
  orderId: number;
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  shippingMethod: string;
  shippingCost: number;
  total: number;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipPostalCode: string;
  shipCountry: string;
  items: OrderEmailItem[];
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<void> {
  const host = process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io';
  const port = Number(process.env.MAILTRAP_PORT || 2525);
  const user = process.env.MAILTRAP_USER;
  const pass = process.env.MAILTRAP_PASS;

  if (!user || !pass) {
    console.warn('[Mailtrap] Skipping order confirmation email: MAILTRAP_USER or MAILTRAP_PASS not configured.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
  });

  const itemLinesText = data.items
    .map((item) => `- ${item.productName} (x${item.quantity}): ${formatPrice(item.unitPrice * item.quantity)}`)
    .join('\n');

  const itemRowsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${item.productName} × ${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
            ${formatPrice(item.unitPrice * item.quantity)}
          </td>
        </tr>`
    )
    .join('');

  const discountLineText =
    data.discountCode && data.discountAmount > 0
      ? `Discount (${data.discountCode}): -${formatPrice(data.discountAmount)}\n`
      : '';

  const discountRowHtml =
    data.discountCode && data.discountAmount > 0
      ? `<tr>
          <td style="padding: 4px 0; color: #15803d;">Discount (${data.discountCode})</td>
          <td style="padding: 4px 0; text-align: right; color: #15803d;">-${formatPrice(data.discountAmount)}</td>
        </tr>`
      : '';

  const text = [
    `Hi ${data.customerName},`,
    '',
    `Thank you for your order at CaseCraft! Your payment has been confirmed.`,
    `Order number: #${data.orderId}`,
    '',
    'Items:',
    itemLinesText,
    '',
    `Subtotal: ${formatPrice(data.subtotal)}`,
    `${discountLineText}Shipping (${data.shippingMethod}): ${formatPrice(data.shippingCost)}`,
    `Total paid: ${formatPrice(data.total)}`,
    '',
    'Delivery address:',
    `${data.customerName}`,
    `${data.shipLine1}${data.shipLine2 ? `, ${data.shipLine2}` : ''}`,
    `${data.shipPostalCode} ${data.shipCity}, ${data.shipCountry}`,
    '',
    'CaseCraft Store',
  ].join('\n');

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #14181f;">
      <h2 style="margin-bottom: 4px;">Order Confirmed · #${data.orderId}</h2>
      <p style="color: #4b5563; margin-top: 0;">Hi ${data.customerName}, thank you for shopping at <strong>CaseCraft</strong>.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid #14181f;">Item</th>
            <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #14181f;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #4b5563;">Subtotal</td>
          <td style="padding: 4px 0; text-align: right;">${formatPrice(data.subtotal)}</td>
        </tr>
        ${discountRowHtml}
        <tr>
          <td style="padding: 4px 0; color: #4b5563;">Shipping (${data.shippingMethod})</td>
          <td style="padding: 4px 0; text-align: right;">${formatPrice(data.shippingCost)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0 0; font-size: 16px; font-weight: 700; border-top: 1px solid #e5e7eb;">Total Paid</td>
          <td style="padding: 10px 0 0; font-size: 16px; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb;">
            ${formatPrice(data.total)}
          </td>
        </tr>
      </table>

      <div style="margin-top: 24px; padding: 14px; background: #f3f4f6; border-radius: 10px; font-size: 13px;">
        <strong>Delivery address:</strong><br />
        ${data.customerName}<br />
        ${data.shipLine1}${data.shipLine2 ? `, ${data.shipLine2}` : ''}<br />
        ${data.shipPostalCode} ${data.shipCity}, ${data.shipCountry}
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.MAILTRAP_FROM || '"CaseCraft Store" <orders@casecraft.test>',
    to: data.to,
    subject: `CaseCraft · Order #${data.orderId} Confirmed`,
    text,
    html,
  });
}