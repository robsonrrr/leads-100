import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

export class PromotionRepository {
  /**
   * Busca todas as promoções ativas
   * @param {string} segment - Filtro opcional por segmento
   */
  async findActivePromotions(segment = null) {
    try {
      // Usar pap.* para pegar todas as colunas da view e fazer JOIN com inv e produtos para marca/modelo/segmento
      let query = `
        SELECT 
          pap.*,
          i.marca,
          i.modelo,
          i.revenda as preco_revenda,
          p.segmento,
          p.segmento_id
        FROM csuite_pricing.pricing_active_promotions pap
        LEFT JOIN inv i ON pap.sku_id = i.id
        LEFT JOIN produtos p ON i.idcf = p.id
        WHERE pap.status = 'active'
      `;
      
      const params = [];
      
      // Adicionar filtro de segmento se fornecido
      if (segment) {
        query += ` AND (p.segmento = ? OR p.segmento_id = ?)`;
        params.push(segment, segment);
      }
      
      query += ` ORDER BY pap.created_at DESC, pap.updated_at DESC`;
      
      const [results] = await db().execute(query, params);
      
      // Mapear os resultados para o formato esperado pelo frontend
      const mappedResults = results.map(row => {
        // Usar preço original da view, ou preço de revenda da tabela inv como fallback
        let precoOriginal = parseFloat(row.original_price || 0);
        if (precoOriginal === 0 && row.preco_revenda) {
          precoOriginal = parseFloat(row.preco_revenda || 0);
        }
        const precoPromo = parseFloat(row.promo_price || 0);
        
        // Calcular desconto se não vier do banco ou se for 0
        let desconto = parseFloat(row.discount_percent || row.discount || 0);
        if (desconto === 0 && precoOriginal > 0 && precoPromo < precoOriginal) {
          desconto = ((precoOriginal - precoPromo) / precoOriginal) * 100;
        }
        
        // Calcular tempo restante
        let tempo = row.time_remaining || null;
        
        // Sempre tentar calcular tempo se não vier da view
        if (!tempo) {
          // Tentar calcular baseado em expires_at ou end_date
          const expiresAt = row.expires_at || row.end_date || row.expiration_date;
          let targetDate = null;
          
          if (expiresAt) {
            targetDate = new Date(expiresAt);
          } else if (row.created_at) {
            // Se não houver data de expiração, assumir 7 dias a partir da criação
            const created = new Date(row.created_at);
            targetDate = new Date(created);
            targetDate.setDate(targetDate.getDate() + 7); // 7 dias
          } else if (row.updated_at) {
            // Se não houver created_at, usar updated_at
            const updated = new Date(row.updated_at);
            targetDate = new Date(updated);
            targetDate.setDate(targetDate.getDate() + 7); // 7 dias
          }
          
          if (targetDate) {
            const now = new Date();
            const diffMs = targetDate - now;
            if (diffMs > 0) {
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffDays = Math.floor(diffHours / 24);
              const remainingHours = diffHours % 24;
              
              if (diffDays > 0) {
                tempo = remainingHours > 0 ? `${diffDays}d ${remainingHours}h` : `${diffDays}d`;
              } else if (diffHours > 0) {
                tempo = `${diffHours}h`;
              } else {
                // Se for menos de 1 hora, mostrar minutos
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                if (diffMinutes > 0) {
                  tempo = `${diffMinutes}m`;
                }
              }
            }
          }
        }
        
        // Se ainda não tiver tempo, usar null (será exibido como "-" no frontend)
        if (!tempo) {
          tempo = null;
        }
        
        return {
          sku: row.sku_id,
          marca: row.marca || '',
          modelo: row.modelo || '',
          segmento: row.segmento || '',
          segmento_id: row.segmento_id || null,
          preco_original: precoOriginal,
          preco_promo: precoPromo,
          desconto: Math.round(desconto * 100) / 100, // Arredondar para 2 casas decimais
          estoque: row.stock_status || row.stock || null, // Deixar null para buscar depois
          tempo: tempo,
          wave_id: row.wave_id,
          last_updated: row.updated_at || row.created_at || null
        };
      });
      
      // Buscar estoque para TODOS os produtos (mesmo que já tenham estoque na view)
      const allProducts = mappedResults.filter(p => p.sku);
      
      if (allProducts.length > 0) {
        try {
          // Usar unidade padrão (1) para buscar estoque
          const [emitRows] = await db().execute(
            'SELECT CNPJ FROM mak.Emitentes WHERE EmitentePOID = ?',
            [1]
          );
          
          if (emitRows.length > 0) {
            const cnpj = emitRows[0].CNPJ;
            const suffix = cnpj.substring(10, 14);
            const stockTableNormal = `mak_${suffix}.Estoque`;
            const stockTableTTD = `mak_${suffix}.Estoque_TTD_1`;
            
            // Buscar estoque para todos os produtos de uma vez
            const skuIds = allProducts.map(p => p.sku).filter(Boolean);
            
            logger.debug('PromotionRepository: Buscando estoque', {
              productCount: skuIds.length,
              sampleSkus: skuIds.slice(0, 10),
              stockTableNormal,
              stockTableTTD
            });
            
            if (skuIds.length > 0) {
              const placeholders = skuIds.map(() => '?').join(',');
              
              // Buscar estoque normal
              const [stockRowsNormal] = await db().execute(
                `SELECT ProdutoPOID, EstoqueDisponivel FROM ${stockTableNormal} WHERE ProdutoPOID IN (${placeholders})`,
                skuIds
              );
              
              logger.debug('PromotionRepository: Estoque Normal', { count: stockRowsNormal.length });
              
              // Buscar estoque TTD
              const [stockRowsTTD] = await db().execute(
                `SELECT ProdutoPOID, EstoqueDisponivel FROM ${stockTableTTD} WHERE ProdutoPOID IN (${placeholders})`,
                skuIds
              );
              
              logger.debug('PromotionRepository: Estoque TTD', { count: stockRowsTTD.length });
              
              // Criar mapa de estoque (soma de normal + TTD)
              const stockMap = {};
              
              // Inicializar com estoque normal
              stockRowsNormal.forEach(row => {
                const stockValue = parseFloat(row.EstoqueDisponivel || 0);
                stockMap[row.ProdutoPOID] = stockValue;
              });
              
              // Adicionar estoque TTD
              stockRowsTTD.forEach(row => {
                const stockValue = parseFloat(row.EstoqueDisponivel || 0);
                const prodId = row.ProdutoPOID;
                if (stockMap[prodId] !== undefined) {
                  stockMap[prodId] += stockValue;
                } else {
                  stockMap[prodId] = stockValue;
                }
              });
              
              logger.debug('PromotionRepository: StockMap total', { productCount: Object.keys(stockMap).length });
              
              // Log de produtos sem estoque encontrado
              const skusWithoutStock = skuIds.filter(sku => stockMap[sku] === undefined);
              if (skusWithoutStock.length > 0) {
                logger.debug('PromotionRepository: SKUs sem estoque', { skus: skusWithoutStock });
              }
              
              // Atualizar estoque nos resultados (sempre atualizar se houver valor no banco)
              mappedResults.forEach(result => {
                // sku_id da view corresponde ao id da tabela inv, que é o ProdutoPOID na tabela de estoque
                const produtoPOID = result.sku;
                if (stockMap[produtoPOID] !== undefined) {
                  result.estoque = stockMap[produtoPOID].toString();
                } else {
                  // Se não encontrou no banco, pode ser que o produto não esteja na tabela de estoque
                  // ou realmente tenha estoque 0. Vamos manter o valor da view se existir, senão 0
                  if (!result.estoque || result.estoque === 'unknown' || result.estoque === null) {
                    logger.debug('PromotionRepository: SKU não encontrado na tabela de estoque', {
                      sku: produtoPOID,
                      segmento: result.segmento
                    });
                    result.estoque = '0';
                  }
                }
              });
            }
          }
        } catch (stockError) {
          logger.warn('PromotionRepository: Erro ao buscar estoque adicional', { error: stockError.message });
          // Se houver erro, definir estoque como 0 para todos os produtos que não têm estoque
          mappedResults.forEach(result => {
            if (!result.estoque || result.estoque === 'unknown' || result.estoque === null) {
              result.estoque = '0';
            }
          });
        }
      } else {
        // Se não houver produtos para buscar, garantir que todos tenham estoque definido
        mappedResults.forEach(result => {
          if (!result.estoque || result.estoque === 'unknown' || result.estoque === null) {
            result.estoque = '0';
          }
        });
      }
      
      // Garantir que todos os produtos tenham estoque e tempo definidos
      mappedResults.forEach(result => {
        // Garantir estoque
        if (!result.estoque || result.estoque === 'unknown' || result.estoque === null) {
          result.estoque = '0';
        }
        
        // Se ainda não tiver tempo e não foi calculado, tentar uma última vez
        if (!result.tempo) {
          // Se houver wave_id, pode ser que seja da mesma wave e tenha tempo similar
          // Por enquanto, deixar como null (será exibido como "-")
          result.tempo = null;
        }
      });
      
      return mappedResults;
    } catch (error) {
      logger.error('PromotionRepository: Erro ao buscar promoções ativas', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Busca informações da última onda de promoções
   */
  async getLastWaveInfo() {
    try {
      const query = `
        SELECT 
          wave_id,
          MAX(updated_at) as last_updated,
          MAX(created_at) as last_created,
          COUNT(*) as product_count
        FROM csuite_pricing.pricing_active_promotions pap
        WHERE pap.status = 'active'
        GROUP BY wave_id
        ORDER BY last_updated DESC, last_created DESC
        LIMIT 1
      `;
      
      const [results] = await db().execute(query);
      return results[0] || null;
    } catch (error) {
      logger.error('PromotionRepository: Erro ao buscar informações da última onda', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}
