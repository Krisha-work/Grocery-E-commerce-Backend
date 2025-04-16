import { Request, Response } from 'express';
import Order from '../models/order.model';
import OrderItem from '../models/orderItem.model';
import Product from '../models/product.model';
import { stripe } from '../config/stripe';
import { sendOrderConfirmationEmail } from '../config/email';
import { Op, WhereOptions } from 'sequelize';
import crypto from 'crypto';
import { handleResponse, HTTP_STATUS } from '../utils/responseHandler';
import { StatusCode } from '../config/statusCode';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user!.id;

    if (!shippingAddress) {
      console.log("-------",res,"--------");
      
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Shipping address is required'
      );
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return handleResponse(
          res,
          HTTP_STATUS.ERROR_STATUS,
          StatusCode.NOT_FOUND,
          `Product ${item.productId} not found`
        );
      }
      if (product.stock < item.quantity) {
        return handleResponse(
          res,
          HTTP_STATUS.ERROR_STATUS,
          StatusCode.BAD_REQUEST,
          `Insufficient stock for product ${product.name}`
        );
      }
      totalAmount += product.price * item.quantity;
    }

    // Generate tracking ID
    const trackingId = crypto.randomBytes(8).toString('hex');

    // Create order
    const order = await Order.create({
      user_id: userId,
      total_amount: totalAmount,
      status: 'pending' as OrderStatus,
      tracking_id: trackingId,
      shipping_address: shippingAddress,
      payment_status: 'pending' as PaymentStatus,
      payment_id: ''
    });

    // Create order items and update stock
    for (const item of items) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: (await Product.findByPk(item.productId))!.price  
      });

      await Product.decrement('stock', {
        by: item.quantity,
        where: { id: item.productId }
      });
    }

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.CREATED,
      'Order created successfully',
      order
    );
  } catch (error) {
    console.log(error);
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error creating order'
    );
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const order = await Order.findOne({
      where: { id, user_id: userId },
      include: [{
        model: OrderItem,
        as: 'orderDetails',
        include: [{model: Product, as: 'productDetails'}],
      }],
    });

    if (!order) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Order not found'
      );
    }

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Order retrieved successfully',
      order
    );
  } catch (error :any) {
    console.log(error);
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error.message ||'Error fetching order'
    );
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const orders = await Order.findAndCountAll({
      where: { user_id: userId },
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: OrderItem,
        as: 'orderDetails',
        include: [{model: Product, as: 'productDetails'}],
      }],
    });

    res.json({
      orders: orders.rows,
      total: orders.count,
      totalPages: Math.ceil(orders.count / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error: any) {
    console.log(error);
    
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Error fetching user orders'
    );
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const where: WhereOptions<any> = {};
    if (status && typeof status === 'string' && isValidOrderStatus(status)) {
      where.status = status;
    }
    
    const orders = await Order.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: OrderItem,
        as: 'orderDetails',
        include: [{model :Product, as:'productDetails'}],
      }],
    });

    const pagination = {
      page: Number(page),
      limit: Number(limit),
      totalItems: orders.count,
      totalPages: Math.ceil(orders.count / Number(limit))
    };

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Orders retrieved successfully',
      orders.rows,
      pagination
    );
  } catch (error: any) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Error fetching orders'
    );
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidOrderStatus(status)) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Invalid order status'
      );
    }

    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'orderDetails', include: [{model: Product, as: 'productDetails'}] }]
    });

    if (!order) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Order not found'
      );
    }

    await order.update({ status });

    if (status === 'delivered') {
      await sendOrderConfirmationEmail(order.user_id.toString(), order.tracking_id);
    }

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Order status updated successfully',
      order
    );
  } catch (error: any) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Error updating order status'
    );
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'orderDetails', include: [{model: Product, as: 'productDetails'}] }]
    });

    if (!order) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Order not found'
      );
    }

    if (order.status !== 'pending') {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Only pending orders can be cancelled'
      );
    }

    // Restore product stock
    for (const item of order.OrderItems || []) {
      await Product.increment('stock', {
        by: item.quantity,
        where: { id: item.product_id }
      });
    }

    await order.update({ status: 'cancelled' as OrderStatus });
    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Order cancelled successfully',
      order
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error cancelling order'
    );
  }
};

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'orderDetails', include: [{model: Product, as: 'productDetails'}] }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total_amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id.toString()
      }
    });

    await order.update({ payment_status: 'pending' as PaymentStatus });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error : any) {
    console.error('Process payment error:', error);
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Error processing payment'
    );
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Missing stripe signature'
      );
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const orderId = paymentIntent.metadata.orderId;

      const order = await Order.findByPk(orderId);
      if (order) {
        await order.update({ 
          status: 'processing' as OrderStatus,
          payment_status: 'paid' as PaymentStatus,
          payment_id: paymentIntent.id
        });
      }
    }

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Webhook processed successfully',
      { received: true }
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.BAD_REQUEST,
      'Webhook error'
    );
  }
};

function isValidOrderStatus(status: string): status is OrderStatus {
  return ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status);
} 