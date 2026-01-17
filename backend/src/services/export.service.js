/**
 * Export Service
 * Serviço para exportação de dados em Excel e PDF
 */
import ExcelJS from 'exceljs';

/**
 * Exporta leads para Excel
 * @param {Array} leads - Array de objetos lead
 * @param {Object} options - Opções de exportação
 * @returns {Buffer} - Buffer do arquivo Excel
 */
export async function exportLeadsToExcel(leads, options = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Leads Agent';
    workbook.created = new Date();

    // Criar worksheet principal
    const worksheet = workbook.addWorksheet('Leads', {
        properties: { tabColor: { argb: '1976D2' } }
    });

    // Definir colunas
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Data', key: 'date', width: 12 },
        { header: 'Cliente', key: 'customer', width: 35 },
        { header: 'CNPJ', key: 'cnpj', width: 18 },
        { header: 'Cidade/UF', key: 'city', width: 20 },
        { header: 'Vendedor', key: 'seller', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Itens', key: 'items', width: 8 },
        { header: 'Subtotal', key: 'subtotal', width: 15 },
        { header: 'IPI', key: 'ipi', width: 12 },
        { header: 'ST', key: 'st', width: 12 },
        { header: 'Frete', key: 'freight', width: 12 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Segmento', key: 'segment', width: 15 },
        { header: 'NOP', key: 'nop', width: 10 },
        { header: 'Pagamento', key: 'payment', width: 15 },
        { header: 'Data Entrega', key: 'deliveryDate', width: 12 }
    ];

    // Estilizar cabeçalho
    worksheet.getRow(1).eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '1976D2' }
        };
        cell.font = {
            color: { argb: 'FFFFFF' },
            bold: true,
            size: 11
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    worksheet.getRow(1).height = 25;

    // Adicionar dados
    leads.forEach((lead, index) => {
        const statusMap = {
            1: 'Em Aberto',
            2: 'Convertido',
            3: 'Cancelado'
        };

        const row = worksheet.addRow({
            id: lead.id || lead.cCart,
            date: formatDate(lead.dCart || lead.createdAt),
            customer: lead.customerName || lead.customer?.name || '-',
            cnpj: formatCnpj(lead.customerCnpj || lead.customer?.cnpj) || '-',
            city: lead.customerCity ? `${lead.customerCity}/${lead.customerState}` : '-',
            seller: lead.sellerName || lead.seller?.name || '-',
            status: statusMap[lead.cType] || 'Desconhecido',
            items: lead.itemsCount || lead.items?.length || 0,
            subtotal: lead.subtotal || lead.total_value || 0,
            ipi: lead.totalIPI || lead.ipi || 0,
            st: lead.totalST || lead.st || 0,
            freight: lead.freight || lead.cFreight || 0,
            total: lead.totalGeral || (lead.subtotal || 0) + (lead.totalIPI || 0) + (lead.totalST || 0) + (lead.freight || 0),
            segment: lead.cSegment || lead.segment || '-',
            nop: lead.nopCode || lead.cNatOp || '-',
            payment: lead.paymentTypeName || '-',
            deliveryDate: formatDate(lead.deliveryDate || lead.dDelivery)
        });

        // Estilizar linhas alternadas
        if (index % 2 === 1) {
            row.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F5F5F5' }
                };
            });
        }

        // Formatar células de moeda
        ['subtotal', 'ipi', 'st', 'freight', 'total'].forEach(key => {
            const cell = row.getCell(key);
            cell.numFmt = 'R$ #,##0.00';
        });

        // Colorir status
        const statusCell = row.getCell('status');
        if (lead.cType === 1) {
            statusCell.font = { color: { argb: 'FF9800' }, bold: true };
        } else if (lead.cType === 2) {
            statusCell.font = { color: { argb: '2E7D32' }, bold: true };
        } else if (lead.cType === 3) {
            statusCell.font = { color: { argb: 'D32F2F' }, bold: true };
        }
    });

    // Adicionar linha de totais
    if (leads.length > 0) {
        const totalsRow = worksheet.addRow({
            id: '',
            date: '',
            customer: 'TOTAL',
            cnpj: '',
            city: '',
            seller: '',
            status: `${leads.length} leads`,
            items: leads.reduce((sum, l) => sum + (l.itemsCount || l.items?.length || 0), 0),
            subtotal: leads.reduce((sum, l) => sum + (l.subtotal || l.total_value || 0), 0),
            ipi: leads.reduce((sum, l) => sum + (l.totalIPI || l.ipi || 0), 0),
            st: leads.reduce((sum, l) => sum + (l.totalST || l.st || 0), 0),
            freight: leads.reduce((sum, l) => sum + (l.freight || l.cFreight || 0), 0),
            total: leads.reduce((sum, l) => sum + (l.totalGeral || 0), 0),
            segment: '',
            nop: '',
            payment: '',
            deliveryDate: ''
        });

        totalsRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'E3F2FD' }
            };
            cell.font = { bold: true };
            cell.border = {
                top: { style: 'medium' },
                bottom: { style: 'medium' }
            };
        });

        ['subtotal', 'ipi', 'st', 'freight', 'total'].forEach(key => {
            totalsRow.getCell(key).numFmt = 'R$ #,##0.00';
        });
    }

    // Fixar primeira linha
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Auto-filter
    worksheet.autoFilter = {
        from: 'A1',
        to: `Q${leads.length + 1}`
    };

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

/**
 * Exporta um único lead com seus itens para Excel
 * @param {Object} lead - Lead com itens
 * @returns {Buffer} - Buffer do arquivo Excel
 */
export async function exportLeadDetailToExcel(lead) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Leads Agent';
    workbook.created = new Date();

    // Worksheet de informações do lead
    const infoSheet = workbook.addWorksheet('Informações', {
        properties: { tabColor: { argb: '1976D2' } }
    });

    // Informações do lead
    const leadInfo = [
        ['COTAÇÃO / LEAD', `#${lead.id}`],
        [''],
        ['CLIENTE', lead.customerName || lead.customer?.name || '-'],
        ['CNPJ', formatCnpj(lead.customerCnpj || lead.customer?.cnpj) || '-'],
        ['CIDADE/UF', `${lead.customerCity || '-'}/${lead.customerState || '-'}`],
        [''],
        ['VENDEDOR', lead.sellerName || '-'],
        ['DATA', formatDate(lead.createdAt || lead.dCart)],
        ['STATUS', lead.cType === 1 ? 'Em Aberto' : lead.cType === 2 ? 'Convertido' : 'Cancelado'],
        [''],
        ['NATUREZA DE OPERAÇÃO', lead.nopDescription || lead.cNatOp || '-'],
        ['TIPO DE PAGAMENTO', lead.paymentTypeName || '-'],
        ['CONDIÇÕES DE PAGAMENTO', lead.paymentTerms || '-'],
        ['DATA DE ENTREGA', formatDate(lead.deliveryDate || lead.dDelivery)],
        [''],
        ['SUBTOTAL', formatCurrency(lead.subtotal || lead.total_value || 0)],
        ['IPI', formatCurrency(lead.totalIPI || 0)],
        ['ST', formatCurrency(lead.totalST || 0)],
        ['FRETE', formatCurrency(lead.freight || lead.cFreight || 0)],
        ['TOTAL', formatCurrency(lead.totalGeral || 0)]
    ];

    leadInfo.forEach((row, index) => {
        const excelRow = infoSheet.addRow(row);
        if (row[0]?.includes('COTAÇÃO') || row[0]?.includes('TOTAL')) {
            excelRow.eachCell((cell) => {
                cell.font = { bold: true, size: 14 };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'E3F2FD' }
                };
            });
        }
    });

    infoSheet.getColumn(1).width = 25;
    infoSheet.getColumn(2).width = 40;

    // Worksheet de itens
    if (lead.items && lead.items.length > 0) {
        const itemsSheet = workbook.addWorksheet('Itens', {
            properties: { tabColor: { argb: '4CAF50' } }
        });

        itemsSheet.columns = [
            { header: '#', key: 'index', width: 5 },
            { header: 'Modelo', key: 'model', width: 15 },
            { header: 'Marca', key: 'brand', width: 12 },
            { header: 'Produto', key: 'name', width: 40 },
            { header: 'Qtd', key: 'quantity', width: 8 },
            { header: 'Preço Unit.', key: 'price', width: 14 },
            { header: 'Subtotal', key: 'subtotal', width: 14 },
            { header: 'IPI', key: 'ipi', width: 12 },
            { header: 'ST', key: 'st', width: 12 },
            { header: 'Total', key: 'total', width: 14 }
        ];

        // Estilizar cabeçalho
        itemsSheet.getRow(1).eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '4CAF50' }
            };
            cell.font = { color: { argb: 'FFFFFF' }, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        itemsSheet.getRow(1).height = 25;

        lead.items.forEach((item, index) => {
            const subtotal = (item.quantity || 0) * (item.price || 0);
            const total = subtotal + (item.ipi || 0) + (item.st || 0);

            const row = itemsSheet.addRow({
                index: index + 1,
                model: item.model || item.productModel || '-',
                brand: item.brand || item.productBrand || '-',
                name: item.name || item.productName || '-',
                quantity: item.quantity || 0,
                price: item.price || 0,
                subtotal,
                ipi: item.ipi || 0,
                st: item.st || 0,
                total
            });

            // Formatar moeda
            ['price', 'subtotal', 'ipi', 'st', 'total'].forEach(key => {
                row.getCell(key).numFmt = 'R$ #,##0.00';
            });

            // Estilizar linhas alternadas
            if (index % 2 === 1) {
                row.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'F5F5F5' }
                    };
                });
            }
        });

        // Linha de totais
        const totalsRow = itemsSheet.addRow({
            index: '',
            model: '',
            brand: '',
            name: 'TOTAL',
            quantity: lead.items.reduce((sum, i) => sum + (i.quantity || 0), 0),
            price: '',
            subtotal: lead.items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0),
            ipi: lead.items.reduce((sum, i) => sum + (i.ipi || 0), 0),
            st: lead.items.reduce((sum, i) => sum + (i.st || 0), 0),
            total: lead.items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)) + (i.ipi || 0) + (i.st || 0), 0)
        });

        totalsRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'E8F5E9' }
            };
            cell.font = { bold: true };
        });

        ['subtotal', 'ipi', 'st', 'total'].forEach(key => {
            totalsRow.getCell(key).numFmt = 'R$ #,##0.00';
        });

        itemsSheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

// Helpers
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
}

function formatCnpj(cnpj) {
    if (!cnpj) return null;
    const cleaned = String(cnpj).replace(/\D/g, '');
    if (cleaned.length !== 14) return cnpj;
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatCurrency(value) {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}
