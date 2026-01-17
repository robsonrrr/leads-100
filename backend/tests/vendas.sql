CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`robsonrr`@`%` SQL SECURITY DEFINER VIEW `Vendas_Historia` AS
SELECT
  `c`.`nome` AS `ClienteNome`,
  `c`.`cgc` AS `ClienteCGC`,
  `c`.`cnpj` AS `ClienteCNPJ`,
  `c`.`bairro` AS `Bairro`,
  `c`.`cep` AS `CEP`,
  `c`.`id` AS `ClienteID`,
  `e`.`regiao` AS `RegiaoGeografica`,
  `e`.`uf` AS `EstadoSigla`,
  `m`.`NomeUF` AS `EstadoNome`,
  `e`.`codigo_ibge` AS `EstadoCodigoIBGE`,
  `m`.`Meso` AS `MesoRegiao`,
  `m`.`NomeMeso` AS `MesoRegiaoNome`,
  `m`.`Micro` AS `MicroRegiao`,
  `m`.`NomeMicro` AS `MicroRegiaoNome`,
  `m`.`Munic` AS `MunicipioCodigo`,
  `m`.`NomeMunic` AS `MunicipioNome`,
  `g`.`lat` AS `Latitude`,
  `g`.`lng` AS `Longitude`,
  `h`.`vendedor` AS `VendedorID`,
  `u`.`nick` AS `VendedorApelido`,
  `inv`.`id` AS `ProdutoISBN`,
  `inv`.`modelo` AS `ProdutoModelo`,
  `inv`.`marca` AS `ProdutoMarca`,
  `p`.`segmento` AS `ProdutoSegmento`,
  `inv`.`fob` AS `ProdutoFOB_USD`,
  `h`.`id` AS `PedidoID`,
  `h`.`data` AS `DataVenda`,
  `hist`.`quant` AS `Quantidade`,
  `hist`.`valor_base` AS `ValorUnitario`,
  (`hist`.`valor_base` * `hist`.`quant`) AS `ValorBase`,
  (
    CASE
      WHEN (`hist`.`vProduct` IS NULL OR `hist`.`vProduct` <= 0) THEN NULL
      ELSE ROUND((1 - (`hist`.`valor_base` / `hist`.`vProduct`)), 6)
    END
  ) AS `DescontoPct`,
  (
    CASE
      WHEN (`hist`.`vProduct` IS NULL OR `hist`.`vProduct` <= 0) THEN NULL
      ELSE ROUND(((`hist`.`vProduct` - `hist`.`valor_base`) * `hist`.`quant`), 2)
    END
  ) AS `DescontoValor`,
  ROUND(((`inv`.`fob` * (CASE WHEN (`p`.`segmento` = 'machines') THEN 1.20 ELSE 1.45 END)) * `v`.`dolar`), 6) AS `CustoUnitario`,
  ROUND((((`hist`.`quant` * `inv`.`fob`) * (CASE WHEN (`p`.`segmento` = 'machines') THEN 1.20 ELSE 1.45 END)) * `v`.`dolar`), 2) AS `CustoTotal`
FROM `hoje` `h`
LEFT JOIN `clientes` `c` ON (`c`.`id` = `h`.`idcli`)
LEFT JOIN `estados` `e` ON (`e`.`uf` = `c`.`estado`)
LEFT JOIN `estatisticas`.`vTAB_MUNICIPIOS` `m` ON ((`m`.`UF` = `e`.`codigo_ibge`) AND (`m`.`NomeMunic` = `c`.`cidade`))
LEFT JOIN `hist` ON (`hist`.`pedido` = `h`.`id`)
LEFT JOIN `inv` ON (`inv`.`id` = `hist`.`isbn`)
LEFT JOIN `produtos` `p` ON (`p`.`id` = `inv`.`idcf`)
LEFT JOIN `rolemak_users` `u` ON (`u`.`id` = `h`.`vendedor`)
LEFT JOIN `google_markers` `g` ON (`g`.`idcli` = `c`.`id`)
LEFT JOIN (
  SELECT CAST(`Vars`.`Dolar` AS DECIMAL(18, 6)) AS `dolar`
  FROM `Vars`
  ORDER BY CAST(`Vars`.`Dolar` AS DECIMAL(18, 6)) DESC
  LIMIT 1
) `v` ON (1 = 1)
WHERE
  (`h`.`id` > 1300000)
  AND (`hist`.`valor_base` > 0)
  AND (`h`.`nop` IN (27, 28, 51, 76))
ORDER BY `h`.`data` DESC;
