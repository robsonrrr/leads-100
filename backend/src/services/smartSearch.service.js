import { getDatabase } from '../config/database.js';

const db = () => getDatabase();

/**
 * Serviço de Busca Inteligente
 * Implementa sugestões, sinônimos e tolerância a erros
 */
class SmartSearchService {

    // Mapa de sinônimos comuns para produtos
    static SYNONYMS = {
        'rolamento': ['rol', 'bearing', 'rolam'],
        'retentor': ['ret', 'seal', 'vedador', 'vedação'],
        'correia': ['belt', 'correya'],
        'tensor': ['tensionador', 'esticador'],
        'bomba': ['pump', 'bba'],
        'motor': ['engine', 'mtr'],
        'alternador': ['alt', 'gerador'],
        'compressor': ['comp', 'compr'],
        'embreagem': ['clutch', 'embr'],
        'freio': ['brake', 'frenagem'],
        'amortecedor': ['amort', 'shock'],
        'mancal': ['bearing housing', 'suporte'],
        'polia': ['pulley', 'roldana'],
        'eixo': ['shaft', 'axis'],
        'engrenagem': ['gear', 'engr'],
    };

    /**
     * Expande termo de busca com sinônimos
     */
    static expandWithSynonyms(searchTerm) {
        const terms = [searchTerm.toLowerCase()];
        const lowerTerm = searchTerm.toLowerCase();

        // Verificar se o termo é um sinônimo
        for (const [main, synonyms] of Object.entries(this.SYNONYMS)) {
            if (main === lowerTerm || synonyms.includes(lowerTerm)) {
                // Adicionar o termo principal e todos os sinônimos
                terms.push(main);
                terms.push(...synonyms);
                break;
            }
        }

        // Remover duplicatas
        return [...new Set(terms)];
    }

    /**
     * Busca sugestões "Did you mean?" baseada em histórico e produtos populares
     */
    static async getSuggestions(searchTerm, limit = 5) {
        try {
            // Buscar termos similares do histórico de buscas
            const [historySuggestions] = await db().execute(`
        SELECT search_term, COUNT(*) as count
        FROM seller_search_history
        WHERE search_term LIKE ?
          AND search_term != ?
        GROUP BY search_term
        ORDER BY count DESC
        LIMIT ?
      `, [`%${searchTerm}%`, searchTerm, limit]);

            // Buscar modelos de produtos similares
            const [productSuggestions] = await db().execute(`
        SELECT DISTINCT modelo as suggestion
        FROM mak.inv
        WHERE modelo LIKE ?
          AND revenda > 0
        ORDER BY modelo
        LIMIT ?
      `, [`${searchTerm}%`, limit]);

            // Combinar sugestões
            const suggestions = [
                ...historySuggestions.map(h => ({ term: h.search_term, source: 'history', count: h.count })),
                ...productSuggestions.map(p => ({ term: p.suggestion, source: 'products', count: 0 }))
            ];

            // Remover duplicatas e limitar
            const uniqueSuggestions = [];
            const seen = new Set();
            for (const s of suggestions) {
                const lower = s.term.toLowerCase();
                if (!seen.has(lower)) {
                    seen.add(lower);
                    uniqueSuggestions.push(s);
                }
            }

            return uniqueSuggestions.slice(0, limit);
        } catch (error) {
            console.error('Erro getSuggestions:', error);
            return [];
        }
    }

    /**
     * Busca com tolerância a erros usando SOUNDEX (MySQL)
     * SOUNDEX codifica palavras por som, permitindo encontrar "rolamento" quando digitou "rolametno"
     */
    static async searchWithFuzzyMatch(searchTerm, limit = 10) {
        try {
            // Buscar usando SOUNDEX para tolerância fonética
            const [results] = await db().execute(`
        SELECT DISTINCT 
          i.id, i.modelo, i.nome, i.revenda as price,
          SOUNDEX(i.modelo) as modelo_soundex,
          SOUNDEX(?) as search_soundex
        FROM mak.inv i
        WHERE (
          SOUNDEX(i.modelo) = SOUNDEX(?)
          OR SOUNDEX(i.nome) = SOUNDEX(?)
          OR i.modelo LIKE ?
        )
        AND i.revenda > 0
        ORDER BY 
          CASE 
            WHEN i.modelo LIKE ? THEN 0  -- Exato primeiro
            WHEN SOUNDEX(i.modelo) = SOUNDEX(?) THEN 1  -- SOUNDEX segundo
            ELSE 2
          END,
          i.revenda DESC
        LIMIT ?
      `, [searchTerm, searchTerm, searchTerm, `%${searchTerm}%`, `${searchTerm}%`, searchTerm, limit]);

            return results;
        } catch (error) {
            console.error('Erro searchWithFuzzyMatch:', error);
            return [];
        }
    }

    /**
     * Calcula distância de Levenshtein simplificada (para validação client-side)
     */
    static levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                }
            }
        }
        return dp[m][n];
    }

    /**
     * Encontra o termo mais próximo de uma lista
     */
    static findClosestMatch(searchTerm, candidates, maxDistance = 2) {
        let closest = null;
        let minDistance = Infinity;

        const searchLower = searchTerm.toLowerCase();
        for (const candidate of candidates) {
            const distance = this.levenshteinDistance(searchLower, candidate.toLowerCase());
            if (distance < minDistance && distance <= maxDistance) {
                minDistance = distance;
                closest = candidate;
            }
        }

        return closest ? { term: closest, distance: minDistance } : null;
    }
}

export default SmartSearchService;
