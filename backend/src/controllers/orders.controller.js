import { OrderRepository } from '../repositories/order.repository.js';

const orderRepository = new OrderRepository();

/**
 * Busca um pedido por ID
 * GET /api/orders/:id
 */
export async function getOrderById(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid order ID' }
      });
    }

    const order = await orderRepository.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' }
      });
    }

    const userLevel = req.user?.level || 0;
    const currentUserId = req.user?.userId;
    const isManager = userLevel > 4;

    if (!isManager) {
      const orderJson = order.toJSON();
      const sellerId = orderJson?.sellerId;
      const emitterId = orderJson?.userId;

      if (sellerId !== currentUserId && emitterId !== currentUserId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Sem permissão para acessar este pedido' }
        });
      }
    }

    res.json({
      success: true,
      data: order.toJSON()
    });
  } catch (error) {
    next(error);
  }
}
