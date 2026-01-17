import { PromotionRepository } from '../repositories/promotion.repository.js';

const promotionRepository = new PromotionRepository();

/**
 * Busca todas as promoções ativas
 */
export async function getActivePromotions(req, res, next) {
  try {
    // Obter filtro de segmento da query string
    const segment = req.query.segment || null;
    const promotions = await promotionRepository.findActivePromotions(segment);
    const waveInfo = await promotionRepository.getLastWaveInfo();

    return res.json({
      success: true,
      data: {
        promotions,
        waveInfo: waveInfo || {
          wave_id: null,
          last_updated: null,
          product_count: 0
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar promoções ativas:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Erro ao buscar promoções ativas'
      }
    });
  }
}
