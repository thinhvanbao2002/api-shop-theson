import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPass = this.configService.get<string>('MAIL_PASSWORD');
    const mailHost = this.configService.get<string>('MAIL_HOST');
    const mailPort = this.configService.get<number>('MAIL_PORT');
    const mailSecure = this.configService.get<string>('MAIL_SECURE') === 'true';

    const transportConfig: nodemailer.TransportOptions = {
      host: mailHost,
      port: mailPort,
      secure: mailSecure,
      ...(mailUser ? { auth: { user: mailUser, pass: mailPass } } : {}),
    } as any;

    this.transporter = nodemailer.createTransport(transportConfig);

    console.log(`EmailService initialized -> ${mailHost}:${mailPort} (secure=${mailSecure})`);
  }

  private escapeHtml(value: any) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private displayValue(value: any, fallback = 'Không có') {
    const text = String(value ?? '').trim();
    return text ? this.escapeHtml(text) : fallback;
  }

  private formatCurrency(value: any) {
    return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
  }

  private getOrderStatus(status: string) {
    const statuses = {
      '1': 'Chờ xác nhận',
      '2': 'Đang xử lý',
      '3': 'Chờ thanh toán',
      '4': 'Đã thanh toán',
      '5': 'Đã hủy',
    };

    return statuses[String(status)] || this.displayValue(status, 'Không xác định');
  }

  private getPaymentMethod(method: string) {
    const methods = {
      cod: 'Thanh toán khi nhận hàng',
      bank_transfer: 'Chuyển khoản ngân hàng',
    };

    return methods[String(method)] || this.displayValue(method, 'Không có');
  }

  private getPayType(payType: string) {
    return payType === 'pay' ? 'Đã thanh toán' : 'Chưa thanh toán';
  }

  private buildFullAddress(orderData: any) {
    return [orderData.address, orderData.ward, orderData.district, orderData.city]
      .map(value => String(value ?? '').trim())
      .filter(Boolean)
      .join(', ');
  }

  async sendOrderConfirmation(to: string, orderData: any) {
    console.log('EmailService ~ sendOrderConfirmation ~ to:', to);

    const fullAddress = this.buildFullAddress(orderData);

    const mailOptions = {
      from: this.configService.get('MAIL_FROM'),
      to,
      subject: 'Xác nhận đơn hàng thành công',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #333;">
          <h2 style="color: #333;">Xác nhận đơn hàng thành công</h2>
          <p>Xin chào ${this.displayValue(orderData.customerName, 'quý khách')},</p>
          <p>Cảm ơn bạn đã đặt hàng tại cửa hàng của chúng tôi. Dưới đây là thông tin chi tiết đơn hàng của bạn:</p>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #444; margin-top: 0;">Thông tin đơn hàng</h3>
            <p><strong>Mã đơn hàng:</strong> ${this.displayValue(orderData.orderCode)}</p>
            <p><strong>Ngày đặt:</strong> ${new Date(orderData.createdAt).toLocaleDateString('vi-VN')}</p>
            <p><strong>Tổng tiền:</strong> ${this.formatCurrency(orderData.totalAmount)}</p>
            <p><strong>Trạng thái đơn hàng:</strong> ${this.getOrderStatus(orderData.status)}</p>
            <p><strong>Phương thức thanh toán:</strong> ${this.getPaymentMethod(orderData.paymentMethod)}</p>
            <p><strong>Trạng thái thanh toán:</strong> ${this.getPayType(orderData.payType)}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #444; margin-top: 0;">Thông tin người đặt hàng</h3>
            <p><strong>Họ và tên:</strong> ${this.displayValue(orderData.customerName)}</p>
            <p><strong>Email:</strong> ${this.displayValue(orderData.customerEmail)}</p>
            <p><strong>Số điện thoại:</strong> ${this.displayValue(orderData.phone)}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #444; margin-top: 0;">Thông tin giao hàng</h3>
            <p><strong>Địa chỉ chi tiết:</strong> ${this.displayValue(orderData.address)}</p>
            <p><strong>Phường / Xã:</strong> ${this.displayValue(orderData.ward)}</p>
            <p><strong>Quận / Huyện:</strong> ${this.displayValue(orderData.district)}</p>
            <p><strong>Tỉnh / Thành phố:</strong> ${this.displayValue(orderData.city)}</p>
            <p><strong>Địa chỉ đầy đủ:</strong> ${this.displayValue(fullAddress)}</p>
            <p><strong>Ghi chú:</strong> ${this.displayValue(orderData.note)}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #444; margin-top: 0;">Chi tiết sản phẩm</h3>
            ${(orderData.orderDetails || []).map(detail => `
              <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee;">
                <p><strong>${this.displayValue(detail.product?.name, 'Sản phẩm')}</strong></p>
                <p>Số lượng: ${this.displayValue(detail.quantity)}</p>
                <p>Size: ${this.displayValue(detail.size)}</p>
                <p>Đơn giá: ${this.formatCurrency(detail.product?.price || detail.price)}</p>
                <p>Thành tiền: ${this.formatCurrency(detail.price)}</p>
              </div>
            `).join('')}
          </div>

          <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email hoặc số điện thoại hỗ trợ.</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
