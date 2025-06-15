import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: true,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendOrderConfirmation(to: string, orderData: any) {
    const mailOptions = {
      from: this.configService.get('MAIL_FROM'),
      to,
      subject: 'Xác nhận đơn hàng thành công',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Xác nhận đơn hàng thành công</h2>
          <p>Xin chào ${orderData.customerName},</p>
          <p>Cảm ơn bạn đã đặt hàng tại cửa hàng của chúng tôi. Dưới đây là thông tin chi tiết đơn hàng của bạn:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #444;">Thông tin đơn hàng</h3>
            <p><strong>Mã đơn hàng:</strong> ${orderData.orderCode}</p>
            <p><strong>Ngày đặt:</strong> ${new Date(orderData.createdAt).toLocaleDateString('vi-VN')}</p>
            <p><strong>Tổng tiền:</strong> ${orderData.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
            <p><strong>Trạng thái:</strong> ${orderData.status}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #444;">Thông tin giao hàng</h3>
            <p><strong>Địa chỉ:</strong> ${orderData.address}</p>
            <p><strong>Số điện thoại:</strong> ${orderData.phone}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #444;">Chi tiết sản phẩm</h3>
            ${orderData.orderDetails.map(detail => `
              <div style="margin-bottom: 10px;">
                <p><strong>${detail.product.name}</strong></p>
                <p>Số lượng: ${detail.quantity}</p>
                <p>Đơn giá: ${detail.price.toLocaleString('vi-VN')} VNĐ</p>
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