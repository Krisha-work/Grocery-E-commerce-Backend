import { Request, Response } from 'express';
import Cart from '../models/cart.model';
import CartItem from '../models/cartItem.model';
import Product from '../models/product.model';
import { handleResponse, HTTP_STATUS } from '../utils/responseHandler';
import { StatusCode } from '../config/statusCode';
import { Op } from 'sequelize';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find or create cart for user
    let cart = await Cart.findOne({
      where: { user_id: userId },
      include: [{
        model: CartItem,
        as: 'cartItems',
        include: [{
          model: Product,
          as: 'productDetails'
        }]
      }]
    });

    if (!cart) {
      cart = await Cart.create({
        user_id: userId,
        total_amount: 0
      });
    }

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Cart retrieved successfully',
      cart
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error retrieving cart'
    );
  }
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user!.id;

    if (!productId || !quantity) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Product ID and quantity are required'
      );
    }

    // Validate product exists and has sufficient stock
    const product = await Product.findByPk(productId);
    if (!product) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Product not found'
      );
    }

    if (product.stock < quantity) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Insufficient stock'
      );
    }

    // Find or create cart
    let cart = await Cart.findOne({ where: { user_id: userId } });
    if (!cart) {
      cart = await Cart.create({
        user_id: userId,
        total_amount: 0
      });
    }

    // Check if product already in cart
    let cartItem = await CartItem.findOne({
      where: {
        cart_id: cart.id,
        product_id: productId
      }
    });

    const itemPrice = Number(product.price) * quantity;

    if (cartItem) {
      // Update quantity and price
      const newQuantity = cartItem.quantity + quantity;
      await cartItem.update({
        quantity: newQuantity,
        price: Number(product.price) * newQuantity
      });
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        cart_id: cart.id,
        product_id: productId,
        quantity,
        price: itemPrice
      });
    }

    // Update cart total by summing all cart items
    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.id }
    });

    const totalAmount = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
    await cart.update({ total_amount: totalAmount });

    // Fetch updated cart item with product details
    const updatedCartItem = await CartItem.findByPk(cartItem.id, {
      include: [{
        model: Product,
        as: 'productDetails'
      }]
    });

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Item added to cart successfully',
      updatedCartItem
    );
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error adding item to cart'
    );
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user!.id;

    if(!quantity){
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Quantity is require'
      );
    }

    // Find cart item
    const cartItem = await CartItem.findByPk(cartItemId, {
      include: [{
        model: Cart,
        as: 'cartDetails',
        where: { user_id: userId }
      }]
    });

    if (!cartItem) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Cart item not found'
      );
    }

    // Validate product stock
    const product = await Product.findByPk(cartItem.product_id);
    if (!product || product.stock < quantity) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Insufficient stock'
      );
    }

    // Update cart item
    await cartItem.update({
      quantity,
      price: product.price
    });

    // Update cart total
    const cart = await Cart.findByPk(cartItem.cart_id);
    const totalAmount = await CartItem.sum('price', {
      where: { cart_id: cart!.id }
    });

    await cart!.update({ total_amount: totalAmount || 0 });

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Cart item updated successfully',
      cartItem
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error updating cart item'
    );
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user!.id;

    // Find cart item
    const cartItem = await CartItem.findByPk(cartItemId, {
      include: [{
        model: Cart,
        as: 'cartDetails',
        where: { user_id: userId }
      }]
    });

    if (!cartItem) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Cart item not found'
      );
    }

    // Delete cart item
    await cartItem.destroy();

    // Update cart total
    const cart = await Cart.findByPk(cartItem.cart_id);
    const totalAmount = await CartItem.sum('price', {
      where: { cart_id: cart!.id }
    });

    await cart!.update({ total_amount: totalAmount || 0 });

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Item removed from cart successfully'
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error removing item from cart'
    );
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find user's cart
    const cart = await Cart.findOne({ where: { user_id: userId } });
    if (!cart) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.NOT_FOUND,
        'Cart not found'
      );
    }

    // Delete all cart items
    await CartItem.destroy({ where: { cart_id: cart.id } });

    // Reset cart total
    await cart.update({ total_amount: 0 });

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Cart cleared successfully'
    );
  } catch (error) {
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Error clearing cart'
    );
  }
};

export const paymentProcess = async (req: Request, res: Response) => {
  try {
    const { paymentMethodId, customerId } = req.body;
    const userId = req.user!.id;

    if (!paymentMethodId) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Payment method ID is required'
      );
    }

    // Find user's cart with items
    const cart = await Cart.findOne({
      where: { user_id: userId },
      include: [{
        model: CartItem,
        as: 'cartItems',
        include: [{
          model: Product,
          as: 'productDetails'
        }]
      }]
    });

    const cartItems = cart?.get('cartItems') as CartItem[] | undefined;
    if (!cart || !cartItems || cartItems.length === 0) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Cart is empty'
      );
    }

    // Validate stock availability before processing payment
    for (const item of cartItems) {
      const product = item.productDetails;
      if (!product || product.stock < item.quantity) {
        return handleResponse(
          res,
          HTTP_STATUS.ERROR_STATUS,
          StatusCode.BAD_REQUEST,
          `Insufficient stock for product: ${product?.name || 'Unknown product'}`
        );
      }
    }

    const amount = Math.round(Number(cart.dataValues.total_amount) * 100);
    if (amount <= 0) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Invalid payment amount'
      );
    }

    // Handle customer creation/validation
    let customer = customerId;
    try {
      if (!customer) {
        const newCustomer = await stripe.customers.create();
        customer = newCustomer.id;
        console.log('✅ Created new customer:', customer);
      } else {
        try {
          await stripe.customers.retrieve(customer);
        } catch (err) {
          console.warn('⚠️ Provided customer ID is invalid. Creating new one...');
          const newCustomer = await stripe.customers.create();
          customer = newCustomer.id;
          console.log('✅ Created new customer:', customer);
        }
      }

      // Create payment intent with improved configuration
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'inr',
        customer,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        metadata: {
          userId: userId.toString(),
          cartId: cart.id.toString()
        },
        description: `Payment for order by user ${userId}`,
        setup_future_usage: 'off_session'
      });

      if (!paymentIntent.client_secret) {
        console.error('❌ Stripe did not return a client_secret');
        return handleResponse(
          res,
          HTTP_STATUS.ERROR_STATUS,
          StatusCode.INTERNAL_SERVER_ERROR,
          'Stripe did not return a client secret'
        );
      }

      // Handle different payment intent statuses
      switch (paymentIntent.status) {
        case 'succeeded':
          // Update product inventory
          await Promise.all(cartItems.map(async (item) => {
            const product = item.productDetails;
            if (product) {
              await Product.update(
                { stock: product.stock - item.quantity },
                { where: { id: product.id } }
              );
            }
          }));

          // Clear the cart directly instead of using clearCart function
          await CartItem.destroy({ where: { cart_id: cart.id } });
          await cart.update({ total_amount: 0 });

          console.log(res,"----------------");


          return handleResponse(
            res,
            HTTP_STATUS.SUCCESS_STATUS,
            StatusCode.OK,
            'Payment processed successfully',
            {
              paymentIntentId: paymentIntent.id,
              clientSecret: paymentIntent.client_secret,
              customerId: customer,
              status: paymentIntent.status,
              amount: cart.total_amount
            }
          );

        case 'requires_action':
        case 'requires_confirmation':
          return handleResponse(
            res,
            HTTP_STATUS.SUCCESS_STATUS,
            StatusCode.OK,
            'Payment requires additional authentication',
            {
              paymentIntentId: paymentIntent.id,
              clientSecret: paymentIntent.client_secret,
              customerId: customer,
              status: paymentIntent.status,
              amount: cart.total_amount
            }
          );

        default:
          throw new Error(`Unexpected payment intent status: ${paymentIntent.status}`);
      }
    } catch (stripeError: any) {
      // Handle specific Stripe errors
      if (stripeError.type === 'StripeCardError') {
        return handleResponse(
          res,
          HTTP_STATUS.ERROR_STATUS,
          StatusCode.BAD_REQUEST,
          stripeError.message || 'Card payment failed'
        );
      }

      if (stripeError.type === 'StripeInvalidRequestError') {
        return handleResponse(
          res,
          HTTP_STATUS.ERROR_STATUS,
          StatusCode.BAD_REQUEST,
          'Invalid payment request. Please check your payment details.'
        );
      }

      throw stripeError; // Re-throw unexpected errors
    }
  } catch (error) {
    console.error('❌ Payment processing error:', error);
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Error processing payment'
    );
  }
};