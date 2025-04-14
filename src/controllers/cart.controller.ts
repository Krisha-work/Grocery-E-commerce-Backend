import { Request, Response } from 'express';
import Cart from '../models/cart.model';
import CartItem from '../models/cartItem.model';
import Product from '../models/product.model';
import { handleResponse, HTTP_STATUS } from '../utils/responseHandler';
import { StatusCode } from '../config/statusCode';
import { Op } from 'sequelize';

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

    if (cartItem) {
      // Update quantity and price
      await cartItem.update({
        quantity: cartItem.quantity + quantity,
        price: product.price
      });
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        cart_id: cart.id,
        product_id: productId,
        quantity,
        price: product.price
      });
    }

    // Update cart total
    const totalAmount = await CartItem.sum('price', {
      where: { cart_id: cart.id }
    });

    await cart.update({ total_amount: totalAmount || 0 });

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.OK,
      'Item added to cart successfully',
      cartItem
    );
  } catch (error) {
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