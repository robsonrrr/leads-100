/**
 * Pagination Helpers - Q3.1 Performance Optimization
 * 
 * Implementa paginação cursor-based para melhor performance em listas grandes
 */

/**
 * Gera cursor codificado em base64
 * @param {Object} data - Dados para codificar no cursor
 * @returns {string} Cursor codificado
 */
export function encodeCursor(data) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decodifica cursor de base64
 * @param {string} cursor - Cursor codificado
 * @returns {Object|null} Dados decodificados ou null se inválido
 */
export function decodeCursor(cursor) {
    try {
        return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    } catch (e) {
        return null;
    }
}

/**
 * Gera metadados de paginação cursor-based
 * @param {Array} items - Lista de itens
 * @param {number} limit - Limite de itens por página
 * @param {string} sortField - Campo de ordenação
 * @returns {Object} Metadados de paginação
 */
export function generateCursorPagination(items, limit, sortField = 'id') {
    const hasNextPage = items.length > limit;
    const edges = hasNextPage ? items.slice(0, limit) : items;

    const startCursor = edges.length > 0
        ? encodeCursor({ [sortField]: edges[0][sortField] })
        : null;

    const endCursor = edges.length > 0
        ? encodeCursor({ [sortField]: edges[edges.length - 1][sortField] })
        : null;

    return {
        edges,
        pageInfo: {
            hasNextPage,
            hasPreviousPage: false, // Definido pelo chamador
            startCursor,
            endCursor
        }
    };
}

/**
 * Constrói cláusula WHERE para paginação cursor-based
 * @param {string} cursor - Cursor codificado
 * @param {string} sortField - Campo de ordenação
 * @param {string} direction - 'ASC' ou 'DESC'
 * @returns {Object} { whereClause, params }
 */
export function buildCursorWhere(cursor, sortField = 'id', direction = 'DESC') {
    if (!cursor) {
        return { whereClause: '', params: [] };
    }

    const decoded = decodeCursor(cursor);
    if (!decoded || !decoded[sortField]) {
        return { whereClause: '', params: [] };
    }

    const operator = direction === 'DESC' ? '<' : '>';

    return {
        whereClause: `AND ${sortField} ${operator} ?`,
        params: [decoded[sortField]]
    };
}

/**
 * Paginação offset-based tradicional (para compatibilidade)
 * @param {number} page - Página atual (1-indexed)
 * @param {number} limit - Itens por página
 * @param {number} total - Total de itens
 * @returns {Object} Metadados de paginação
 */
export function generateOffsetPagination(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        offset: (page - 1) * limit
    };
}

/**
 * Parser de parâmetros de query para paginação
 * @param {Object} query - Query params do request
 * @param {Object} defaults - Valores padrão
 * @returns {Object} Parâmetros parseados
 */
export function parsePaginationParams(query, defaults = {}) {
    const {
        page: defaultPage = 1,
        limit: defaultLimit = 20,
        maxLimit = 100,
        sort: defaultSort = 'createdAt',
        order: defaultOrder = 'desc'
    } = defaults;

    let page = parseInt(query.page) || defaultPage;
    let limit = parseInt(query.limit) || defaultLimit;
    let cursor = query.cursor || null;
    let sort = query.sort || defaultSort;
    let order = (query.order || defaultOrder).toUpperCase();

    // Validações
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), maxLimit);
    order = ['ASC', 'DESC'].includes(order) ? order : 'DESC';

    return {
        page,
        limit,
        offset: (page - 1) * limit,
        cursor,
        sort,
        order,
        useCursor: !!cursor
    };
}

/**
 * Wrapper para queries paginadas com cache
 * @param {Function} queryFn - Função que executa a query
 * @param {Function} countFn - Função que conta o total
 * @param {Object} pagination - Parâmetros de paginação
 * @param {Function} cacheGet - Função para buscar do cache
 * @param {Function} cacheSet - Função para salvar no cache
 * @param {string} cacheKey - Chave do cache
 * @returns {Object} { items, pagination }
 */
export async function paginatedQuery({
    queryFn,
    countFn,
    pagination,
    cacheGet,
    cacheSet,
    cacheKey,
    cacheTTL = 60
}) {
    // Tentar buscar do cache
    if (cacheGet && cacheKey) {
        const cached = await cacheGet(cacheKey);
        if (cached) {
            return cached;
        }
    }

    // Executar queries
    const [items, total] = await Promise.all([
        queryFn(),
        countFn()
    ]);

    const result = {
        items,
        pagination: pagination.useCursor
            ? generateCursorPagination(items, pagination.limit, pagination.sort)
            : generateOffsetPagination(pagination.page, pagination.limit, total)
    };

    // Salvar no cache
    if (cacheSet && cacheKey) {
        await cacheSet(cacheKey, result, cacheTTL);
    }

    return result;
}

export default {
    encodeCursor,
    decodeCursor,
    generateCursorPagination,
    buildCursorWhere,
    generateOffsetPagination,
    parsePaginationParams,
    paginatedQuery
};
