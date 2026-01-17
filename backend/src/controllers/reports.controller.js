/**
 * Reports Controller
 * Geração de relatórios PDF
 */
import { getDatabase } from '../config/database.js';
import PDFDocument from 'pdfkit';

const db = () => getDatabase();

/**
 * Verificar se é gerente
 */
function isManager(user) {
  return (user?.level || 0) > 4;
}

/**
 * Helper: Formatar moeda
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

/**
 * Helper: Formatar data
 */
function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

/**
 * Helper: Criar header do PDF
 */
function createHeader(doc, title, subtitle) {
  doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(subtitle, { align: 'center' });
  doc.moveDown(2);
}

/**
 * Helper: Criar tabela simples
 */
function createTable(doc, headers, rows, colWidths) {
  const startX = 50;
  let y = doc.y;
  const rowHeight = 20;
  const pageWidth = 500;

  // Header
  doc.font('Helvetica-Bold').fontSize(9);
  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x, y, { width: colWidths[i], align: 'left' });
    x += colWidths[i];
  });

  y += rowHeight;
  doc.moveTo(startX, y - 5).lineTo(startX + pageWidth, y - 5).stroke();

  // Rows
  doc.font('Helvetica').fontSize(8);
  rows.forEach(row => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    x = startX;
    row.forEach((cell, i) => {
      doc.text(String(cell || '-'), x, y, { width: colWidths[i], align: 'left' });
      x += colWidths[i];
    });
    y += rowHeight;
  });

  doc.y = y + 10;
}

/**
 * Relatório de Carteira de Clientes
 * GET /api/reports/portfolio
 */
export async function getPortfolioReport(req, res, next) {
  try {
    const userId = req.user.userId;
    const userLevel = req.user?.level || 0;

    let sellerId = userId;
    if (userLevel > 4 && req.query.sellerId) {
      sellerId = parseInt(req.query.sellerId);
    }

    // Buscar dados do vendedor
    const [sellerRows] = await db().execute(
      `SELECT COALESCE(nick, user) as name FROM rolemak_users WHERE id = ?`,
      [sellerId]
    );
    const sellerName = sellerRows[0]?.name || 'Vendedor';

    // Buscar clientes
    const query = `
      SELECT 
        c.id,
        c.razao as name,
        c.cnpj,
        c.city,
        c.ultimo_pedido as last_order,
        COALESCE(s.total_year, 0) as year_sales,
        COALESCE(s.order_count, 0) as order_count
      FROM mak.clientes c
      LEFT JOIN (
        SELECT idcli, SUM(valor) as total_year, COUNT(*) as order_count
        FROM mak.hoje
        WHERE YEAR(data) = YEAR(CURDATE())
          AND valor > 0
          AND nop IN (27, 28, 51, 76)
          AND vendedor = ?
        GROUP BY idcli
      ) s ON c.id = s.idcli
      WHERE c.vendedor = ?
      ORDER BY s.total_year DESC
      LIMIT 100
    `;

    const [customers] = await db().execute(query, [sellerId, sellerId]);

    // Criar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=carteira-${sellerName.replace(/\s/g, '_')}.pdf`);

    doc.pipe(res);

    createHeader(doc, 'Relatório de Carteira', `Vendedor: ${sellerName} | Data: ${formatDate(new Date())}`);

    // Resumo
    const totalSales = customers.reduce((sum, c) => sum + parseFloat(c.year_sales || 0), 0);
    const totalOrders = customers.reduce((sum, c) => sum + parseInt(c.order_count || 0), 0);

    doc.fontSize(11).font('Helvetica-Bold').text('Resumo');
    doc.fontSize(10).font('Helvetica')
      .text(`Total de Clientes: ${customers.length}`)
      .text(`Vendas no Ano: ${formatCurrency(totalSales)}`)
      .text(`Total de Pedidos: ${totalOrders}`);
    doc.moveDown(2);

    // Tabela de clientes
    doc.fontSize(11).font('Helvetica-Bold').text('Clientes');
    doc.moveDown(0.5);

    const headers = ['Cliente', 'CNPJ', 'Cidade', 'Último Pedido', 'Vendas Ano'];
    const colWidths = [150, 100, 80, 80, 90];
    const rows = customers.map(c => [
      (c.name || '').substring(0, 25),
      c.cnpj || '-',
      (c.city || '').substring(0, 12),
      formatDate(c.last_order),
      formatCurrency(c.year_sales)
    ]);

    createTable(doc, headers, rows, colWidths);

    doc.end();
  } catch (error) {
    console.error('[getPortfolioReport] Error:', error.message);
    next(error);
  }
}

/**
 * Relatório de Performance (Gerentes)
 * GET /api/reports/performance
 */
export async function getPerformanceReport(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem gerar este relatório' }
      });
    }

    const segmento = req.query.segmento || null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // Buscar performance dos vendedores
    let query = `
      SELECT 
        u.id,
        COALESCE(u.nick, u.user) as name,
        u.segmento,
        COALESCE(SUM(CASE WHEN MONTH(h.data) = ? THEN h.valor ELSE 0 END), 0) as month_sales,
        COALESCE(COUNT(DISTINCT CASE WHEN MONTH(h.data) = ? THEN h.id ELSE NULL END), 0) as month_orders,
        COALESCE(SUM(h.valor), 0) as year_sales,
        (SELECT COUNT(*) FROM staging.staging_queries l WHERE l.cVendedor = u.id AND l.cType = 1) as open_leads,
        g.target_value as month_target
      FROM rolemak_users u
      LEFT JOIN mak.hoje h ON u.id = h.vendedor 
        AND YEAR(h.data) = ? 
        AND h.valor > 0 
        AND h.nop IN (27, 28, 51, 76)
      LEFT JOIN staging.seller_goals g ON u.id = g.seller_id AND g.year = ? AND g.month = ?
      WHERE u.depto = 'VENDAS' AND u.blocked = 0
    `;
    const params = [month, month, year, year, month];

    if (segmento) {
      query += ` AND u.segmento = ?`;
      params.push(segmento);
    }

    query += ` GROUP BY u.id, u.nick, u.user, u.segmento, g.target_value ORDER BY month_sales DESC`;

    const [sellers] = await db().execute(query, params);

    // Criar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=performance-${monthNames[month - 1]}-${year}.pdf`);

    doc.pipe(res);

    createHeader(doc, 'Relatório de Performance', `${monthNames[month - 1]} ${year}${segmento ? ` | Segmento: ${segmento}` : ''}`);

    // Resumo
    const totalMonthSales = sellers.reduce((sum, s) => sum + parseFloat(s.month_sales || 0), 0);
    const totalYearSales = sellers.reduce((sum, s) => sum + parseFloat(s.year_sales || 0), 0);
    const totalLeads = sellers.reduce((sum, s) => sum + parseInt(s.open_leads || 0), 0);

    doc.fontSize(11).font('Helvetica-Bold').text('Resumo Geral');
    doc.fontSize(10).font('Helvetica')
      .text(`Vendedores Ativos: ${sellers.length}`)
      .text(`Vendas do Mês: ${formatCurrency(totalMonthSales)}`)
      .text(`Vendas do Ano: ${formatCurrency(totalYearSales)}`)
      .text(`Leads Abertos: ${totalLeads}`);
    doc.moveDown(2);

    // Tabela
    doc.fontSize(11).font('Helvetica-Bold').text('Performance por Vendedor');
    doc.moveDown(0.5);

    const headers = ['Vendedor', 'Segmento', 'Vendas Mês', 'Meta', '% Meta', 'Pedidos', 'Vendas Ano', 'Leads'];
    const colWidths = [120, 80, 90, 90, 60, 60, 90, 50];
    const rows = sellers.map(s => {
      const target = parseFloat(s.month_target) || 0;
      const sales = parseFloat(s.month_sales) || 0;
      const pct = target > 0 ? Math.round((sales / target) * 100) : '-';
      return [
        (s.name || '').substring(0, 20),
        s.segmento || '-',
        formatCurrency(s.month_sales),
        target > 0 ? formatCurrency(target) : '-',
        pct !== '-' ? `${pct}%` : '-',
        s.month_orders,
        formatCurrency(s.year_sales),
        s.open_leads
      ];
    });

    createTable(doc, headers, rows, colWidths);

    doc.end();
  } catch (error) {
    console.error('[getPerformanceReport] Error:', error.message);
    next(error);
  }
}

/**
 * Relatório de Leads Abertos
 * GET /api/reports/leads
 */
export async function getLeadsReport(req, res, next) {
  try {
    const userId = req.user.userId;
    const userLevel = req.user?.level || 0;

    let whereClause = 'l.cVendedor = ?';
    let params = [userId];

    if (userLevel > 4 && req.query.sellerId) {
      params = [parseInt(req.query.sellerId)];
    } else if (userLevel > 4 && !req.query.sellerId) {
      whereClause = '1=1';
      params = [];
    }

    // Buscar leads abertos
    const query = `
      SELECT 
        l.cSCart as id,
        c.razao as customer_name,
        c.cnpj,
        l.total_value,
        l.dCart as created_at,
        COALESCE(u.nick, u.user) as seller_name
      FROM staging.staging_queries l
      LEFT JOIN mak.clientes c ON l.cCustomer = c.id
      LEFT JOIN rolemak_users u ON l.cVendedor = u.id
      WHERE ${whereClause} AND l.cType = 1
      ORDER BY l.total_value DESC
      LIMIT 200
    `;

    const [leads] = await db().execute(query, params);

    // Criar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=leads-abertos.pdf`);

    doc.pipe(res);

    createHeader(doc, 'Relatório de Leads Abertos', `Data: ${formatDate(new Date())}`);

    // Resumo
    const totalValue = leads.reduce((sum, l) => sum + parseFloat(l.total_value || 0), 0);

    doc.fontSize(11).font('Helvetica-Bold').text('Resumo');
    doc.fontSize(10).font('Helvetica')
      .text(`Total de Leads: ${leads.length}`)
      .text(`Valor Total: ${formatCurrency(totalValue)}`);
    doc.moveDown(2);

    // Tabela
    doc.fontSize(11).font('Helvetica-Bold').text('Leads');
    doc.moveDown(0.5);

    const headers = ['ID', 'Cliente', 'CNPJ', 'Valor', 'Data', 'Vendedor'];
    const colWidths = [50, 150, 100, 80, 60, 80];
    const rows = leads.map(l => [
      l.id,
      (l.customer_name || '').substring(0, 25),
      l.cnpj || '-',
      formatCurrency(l.total_value),
      formatDate(l.created_at),
      (l.seller_name || '').substring(0, 12)
    ]);

    createTable(doc, headers, rows, colWidths);

    doc.end();
  } catch (error) {
    console.error('[getLeadsReport] Error:', error.message);
    next(error);
  }
}

/**
 * Relatório de Metas
 * GET /api/reports/goals
 */
export async function getGoalsReport(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem gerar este relatório' }
      });
    }

    const year = parseInt(req.query.year) || new Date().getFullYear();
    const segmento = req.query.segmento || null;

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Buscar metas e vendas
    let query = `
      SELECT 
        u.id,
        COALESCE(u.nick, u.user) as name,
        u.segmento,
        COALESCE(ga.target_value, 0) as annual_target,
        COALESCE(SUM(h.valor), 0) as year_sales
      FROM rolemak_users u
      LEFT JOIN staging.seller_goals ga ON u.id = ga.seller_id AND ga.year = ? AND ga.month IS NULL
      LEFT JOIN mak.hoje h ON u.id = h.vendedor 
        AND YEAR(h.data) = ? 
        AND h.valor > 0 
        AND h.nop IN (27, 28, 51, 76)
      WHERE u.depto = 'VENDAS' AND u.blocked = 0
    `;
    const params = [year, year];

    if (segmento) {
      query += ` AND u.segmento = ?`;
      params.push(segmento);
    }

    query += ` GROUP BY u.id, u.nick, u.user, u.segmento, ga.target_value ORDER BY year_sales DESC`;

    const [sellers] = await db().execute(query, params);

    // Criar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=metas-${year}.pdf`);

    doc.pipe(res);

    createHeader(doc, 'Relatório de Metas Anuais', `Ano: ${year}${segmento ? ` | Segmento: ${segmento}` : ''}`);

    // Resumo
    const totalTarget = sellers.reduce((sum, s) => sum + parseFloat(s.annual_target || 0), 0);
    const totalSales = sellers.reduce((sum, s) => sum + parseFloat(s.year_sales || 0), 0);
    const overallPct = totalTarget > 0 ? Math.round((totalSales / totalTarget) * 100) : 0;

    doc.fontSize(11).font('Helvetica-Bold').text('Resumo Geral');
    doc.fontSize(10).font('Helvetica')
      .text(`Meta Total: ${formatCurrency(totalTarget)}`)
      .text(`Realizado: ${formatCurrency(totalSales)}`)
      .text(`Atingimento: ${overallPct}%`);
    doc.moveDown(2);

    // Tabela
    doc.fontSize(11).font('Helvetica-Bold').text('Metas por Vendedor');
    doc.moveDown(0.5);

    const headers = ['Vendedor', 'Segmento', 'Meta Anual', 'Realizado', '% Atingido', 'Status'];
    const colWidths = [130, 80, 100, 100, 60, 60];
    const rows = sellers.map(s => {
      const target = parseFloat(s.annual_target) || 0;
      const sales = parseFloat(s.year_sales) || 0;
      const pct = target > 0 ? Math.round((sales / target) * 100) : 0;
      let status = '-';
      if (target > 0) {
        status = pct >= 100 ? '✓' : pct >= 70 ? '~' : '✗';
      }
      return [
        (s.name || '').substring(0, 22),
        s.segmento || '-',
        target > 0 ? formatCurrency(target) : '-',
        formatCurrency(sales),
        target > 0 ? `${pct}%` : '-',
        status
      ];
    });

    createTable(doc, headers, rows, colWidths);

    doc.end();
  } catch (error) {
    console.error('[getGoalsReport] Error:', error.message);
    next(error);
  }
}

/**
 * Lista tipos de relatórios disponíveis
 * GET /api/reports
 */
export async function getReportTypes(req, res) {
  const userLevel = req.user?.level || 0;
  const isManager = userLevel > 4;

  const reports = [
    {
      id: 'portfolio',
      name: 'Carteira de Clientes',
      description: 'Lista completa dos clientes da carteira com vendas do ano',
      managerOnly: false
    },
    {
      id: 'leads',
      name: 'Leads Abertos',
      description: 'Todos os leads pendentes de fechamento',
      managerOnly: false
    },
    {
      id: 'performance',
      name: 'Performance da Equipe',
      description: 'Vendas e metas de todos os vendedores',
      managerOnly: true
    },
    {
      id: 'goals',
      name: 'Metas Anuais',
      description: 'Acompanhamento de metas por vendedor',
      managerOnly: true
    }
  ];

  res.json({
    success: true,
    data: reports.filter(r => !r.managerOnly || isManager)
  });
}
