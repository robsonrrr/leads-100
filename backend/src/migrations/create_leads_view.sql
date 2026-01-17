-- View para otimizar a listagem de leads na home/dashboard
-- Esta view pré-calcula o total de cada lead e junta com informações do cliente
-- Filtra apenas leads dos últimos 7 dias para melhor performance

DROP VIEW IF EXISTS staging.staging_queries;

CREATE VIEW staging.staging_queries AS
SELECT 
  s.cSCart,
  s.dCart,
  s.cSegment,
  s.cNatOp,
  s.cCustomer,
  s.cUser,
  s.cSeller,
  s.cCC,
  s.cPaymentType,
  s.vPaymentTerms,
  s.cPaymentTerms,
  s.cTransporter,
  s.vFreight,
  s.vFreightType,
  s.cEmitUnity,
  s.cLogUnity,
  s.cUpdated,
  s.dDelivery,
  s.xRemarksFinance,
  s.xRemarksLogistic,
  s.xRemarksNFE,
  s.xRemarksOBS,
  s.xRemarksManager,
  s.cOrderWeb,
  s.cType,
  s.xBuyer,
  s.cPurchaseOrder,
  s.cAuthorized,
  s.cSource,
  s.vComission,
  c.nome as customer_nome,
  COALESCE(
    (SELECT 
      SUM(i.qProduct * i.vProduct) + 
      SUM(i.vIPI) + 
      SUM(i.vCST)
    FROM mak.icart i
    WHERE i.cSCart = s.cSCart), 
    0
  ) + COALESCE(s.vFreight, 0) as total_value
FROM mak.sCart s
LEFT JOIN mak.clientes c ON s.cCustomer = c.id
WHERE s.dCart >= DATE_SUB(NOW(), INTERVAL 7 DAY);

