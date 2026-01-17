import { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  FormControlLabel,
  Switch,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  UnfoldMore as UnfoldMoreIcon,
  Calculate as CalculateIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ShoppingCart as ShoppingCartIcon,
  AutoFixHigh as AutoFixHighIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Inventory as InventoryIcon,
  LocalOffer as PromoIcon,
  NewReleases as LaunchIcon,
  Lock as FixedPriceIcon,
  Layers as BundleIcon
} from '@mui/icons-material'
import { leadsService, pricingService, productsService, promotionsService } from '../services/api'
import aiService from '../services/ai.service'
import { formatCurrency } from '../utils'
import ProductAutocomplete from './ProductAutocomplete'
import MakPrimeLogo from './MakPrimeLogo'
import EmptyState from './EmptyState'
import CartRecommendations from './CartRecommendations'
import ProductDetailModal from './ProductDetailModal'
import { useToast } from '../contexts/ToastContext'

// Arredonda centavos para cima (ex: 1853.10 -> 1854.00)
const roundCentsUp = (price) => {
  if (!price || isNaN(price)) return price
  const numPrice = parseFloat(price)
  // Se tem centavos (não é número inteiro), arredonda para cima
  return numPrice % 1 !== 0 ? Math.ceil(numPrice) : numPrice
}

function CartItems({ leadId, lead, readOnly = false, onStockIssuesChange }) {
  const { user } = useSelector((state) => state.auth)
  const toast = useToast()
  // Usuários nível <= 4 (vendedores) veem explicação simplificada sem Preço de Piso
  // Usuários nível > 4 (gerentes) veem explicação completa
  const isBasicUser = (user?.level || 0) <= 4
  const [items, setItems] = useState([])
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [hideZeroPrice, setHideZeroPrice] = useState(true) // Default: ocultar produtos com preço zero
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [pricingResults, setPricingResults] = useState({}) // Armazenar resultados de pricing por item
  const [v2Evaluation, setV2Evaluation] = useState(null)
  const [pricingExplanationOpen, setPricingExplanationOpen] = useState(false)
  const [selectedPricingExplanation, setSelectedPricingExplanation] = useState(null)
  const [calculatingPricing, setCalculatingPricing] = useState({}) // Rastrear quais itens estão calculando pricing
  const [calculatingPricingInDialog, setCalculatingPricingInDialog] = useState(false) // Rastrear se está calculando pricing no dialog
  const [calculatingAllPricing, setCalculatingAllPricing] = useState(false) // Rastrear se está calculando pricing de todos os itens
  const [applyingAllPricing, setApplyingAllPricing] = useState(false) // Rastrear se está aplicando pricing em todos os itens
  const [discountRecommendation, setDiscountRecommendation] = useState(null)
  const [loadingDiscountRec, setLoadingDiscountRec] = useState(false)
  const [inlineEdit, setInlineEdit] = useState({}) // { itemId: { field: 'quantity' | 'times', value: number } }
  const [savingInline, setSavingInline] = useState({}) // { itemId: boolean }
  const [productDetailModal, setProductDetailModal] = useState({ open: false, product: null }) // Modal de detalhes do produto
  const [favorites, setFavorites] = useState(new Set()) // Set de IDs de produtos favoritos
  const [loadingFavorite, setLoadingFavorite] = useState({}) // { productId: boolean }
  const [promotions, setPromotions] = useState([]) // Lista de promoções ativas
  const [quantityDiscounts, setQuantityDiscounts] = useState([]) // Lista de descontos por quantidade
  const [launchProducts, setLaunchProducts] = useState([]) // Lista de produtos em lançamento
  const [customerFixedPrices, setCustomerFixedPrices] = useState([]) // Preços fixos do cliente
  const [bundles, setBundles] = useState([]) // Lista de combos/bundles
  const [warehouseStock, setWarehouseStock] = useState({}) // { productId: { warehouses: [], loading: boolean } }

  // Mapa de promoções para lookup rápido
  const promotionMap = useMemo(() => {
    const map = new Map()
    if (Array.isArray(promotions)) {
      promotions.forEach(promo => {
        map.set(promo.sku, {
          promoPrice: promo.preco_promo,
          promoDiscount: promo.desconto
        })
      })
    }
    return map
  }, [promotions])

  // Mapa de produtos em lançamento para lookup rápido
  const launchProductMap = useMemo(() => {
    const map = new Map()
    if (Array.isArray(launchProducts)) {
      const now = new Date()
      launchProducts.forEach(lp => {
        // Verificar se está no período de lançamento
        const startDate = new Date(lp.launch_start)
        const endDate = new Date(lp.launch_end)
        if (lp.is_active && now >= startDate && now <= endDate) {
          map.set(lp.sku_id, {
            launchPrice: parseFloat(lp.launch_price),
            regularPrice: parseFloat(lp.regular_price),
            launchEnd: endDate,
            productName: lp.product_name,
            productModel: lp.product_model
          })
        }
      })
    }
    return map
  }, [launchProducts])

  // Mapa de preços fixos do cliente (SKU -> preço fixo)
  const fixedPriceMap = useMemo(() => {
    const map = new Map()
    if (Array.isArray(customerFixedPrices)) {
      customerFixedPrices.forEach(fp => {
        map.set(fp.sku_id, {
          fixedPrice: parseFloat(fp.fixed_price),
          originalPt: fp.original_pt_at_agreement ? parseFloat(fp.original_pt_at_agreement) : null,
          discountFromPt: fp.discount_from_pt ? parseFloat(fp.discount_from_pt) : null,
          validUntil: new Date(fp.valid_until),
          notes: fp.notes
        })
      })
    }
    return map
  }, [customerFixedPrices])

  // Mapa de produtos em combos/bundles (SKU ou família -> bundle info)
  const { bundleSkuMap, bundleFamilies } = useMemo(() => {
    const skuMap = new Map()
    const familyList = []

    if (Array.isArray(bundles)) {
      bundles.forEach(bundle => {
        if (bundle.items) {
          bundle.items.forEach(item => {
            const bundleInfo = {
              bundleId: bundle.id,
              bundleName: bundle.name,
              bundleDescription: bundle.description,
              discount: bundle.discount_pct,
              discountType: bundle.discount_type,
              minQty: item.min_quantity
            }

            if (item.sku_id) {
              skuMap.set(item.sku_id, bundleInfo)
            } else if (item.product_family) {
              familyList.push({
                family: item.product_family,
                ...bundleInfo
              })
            }
          })
        }
      })
    }

    return { bundleSkuMap: skuMap, bundleFamilies: familyList }
  }, [bundles])

  // Helper para verificar se produto está em um bundle
  const getProductBundle = (productId, productModel) => {
    // Primeiro verifica por SKU específico
    if (bundleSkuMap.has(productId)) {
      return bundleSkuMap.get(productId)
    }

    // Depois verifica por família (primeiros dígitos do modelo)
    if (productModel && bundleFamilies.length > 0) {
      const modelUpper = String(productModel).toUpperCase()

      const matchingBundle = bundleFamilies.find(bf =>
        modelUpper.startsWith(bf.family.toUpperCase())
      )

      if (matchingBundle) {
        return matchingBundle
      }
    }

    return null
  }

  // Mapa de descontos por quantidade - separado por SKU e família
  const { skuDiscountMap, familyDiscounts } = useMemo(() => {
    const skuMap = new Map()
    const familyList = []

    if (Array.isArray(quantityDiscounts)) {
      quantityDiscounts.forEach(qd => {
        const discountInfo = {
          minQty: qd.min_quantity,
          maxQty: qd.max_quantity,
          discount: qd.discount_pct,
          price: qd.price,
          description: qd.description
        }

        if (qd.sku_id) {
          // Desconto por SKU específico
          if (!skuMap.has(qd.sku_id)) {
            skuMap.set(qd.sku_id, [])
          }
          skuMap.get(qd.sku_id).push(discountInfo)
        } else if (qd.product_family) {
          // Desconto por família (ex: "B9000", "GT-700")
          familyList.push({
            family: qd.product_family,
            ...discountInfo
          })
        }
      })
    }

    return { skuDiscountMap: skuMap, familyDiscounts: familyList }
  }, [quantityDiscounts])

  // Helper para verificar se produto tem desconto por quantidade
  const getQuantityDiscounts = (productId, productModel) => {
    // Primeiro verifica por SKU específico
    if (skuDiscountMap.has(productId)) {
      return { type: 'sku', discounts: skuDiscountMap.get(productId) }
    }

    // Depois verifica por família (primeiros dígitos do modelo)
    if (productModel && familyDiscounts.length > 0) {
      const modelUpper = String(productModel).toUpperCase()

      // Encontrar descontos de família que correspondem ao modelo
      const matchingDiscounts = familyDiscounts.filter(fd =>
        modelUpper.startsWith(fd.family.toUpperCase())
      )

      if (matchingDiscounts.length > 0) {
        return { type: 'family', family: matchingDiscounts[0].family, discounts: matchingDiscounts }
      }
    }

    return null
  }

  const [formData, setFormData] = useState({
    product: null,
    quantity: 1,
    price: 0,
    consumerPrice: 0,
    originalPrice: 0,
    times: 5,
    ipi: 0,
    st: 0,
    ttd: 0,
    decisionId: null
  })

  useEffect(() => {
    if (leadId) {
      loadItems()
      loadTotals()
    }
  }, [leadId])

  // Carregar favoritos, promoções, descontos, lançamentos e bundles
  useEffect(() => {
    loadFavorites()
    loadPromotions()
    loadQuantityDiscounts()
    loadLaunchProducts()
    loadBundles()
  }, [])

  const loadFavorites = async () => {
    try {
      const response = await productsService.getFavorites()
      if (response.data.success) {
        const favoriteIds = new Set(response.data.data.map(p => p.id))
        setFavorites(favoriteIds)
      }
    } catch (err) {
      console.debug('Erro ao carregar favoritos:', err)
    }
  }

  const loadPromotions = async () => {
    try {
      const response = await promotionsService.getActive()
      if (response.data.success && response.data.data?.promotions) {
        setPromotions(response.data.data.promotions)
      }
    } catch (err) {
      console.debug('Erro ao carregar promoções:', err)
    }
  }

  const loadQuantityDiscounts = async () => {
    try {
      const response = await pricingService.getQuantityDiscounts()
      if (response.data.success) {
        setQuantityDiscounts(response.data.data || [])
      }
    } catch (err) {
      console.debug('Erro ao carregar descontos por quantidade:', err)
    }
  }

  const loadLaunchProducts = async () => {
    try {
      const response = await pricingService.getLaunchProducts()
      if (response.data.success) {
        setLaunchProducts(response.data.data || [])
      }
    } catch (err) {
      console.debug('Erro ao carregar produtos em lançamento:', err)
    }
  }

  const loadBundles = async () => {
    try {
      const response = await pricingService.getBundles()
      if (response.data.success) {
        setBundles(response.data.data || [])
      }
    } catch (err) {
      console.debug('Erro ao carregar bundles:', err)
    }
  }

  // Carregar estoque por unidade (sob demanda ao passar mouse)
  const loadWarehouseStock = async (productId) => {
    // Se já tem dados ou está carregando, não buscar novamente
    if (warehouseStock[productId]?.warehouses?.length > 0 || warehouseStock[productId]?.loading) {
      return
    }

    setWarehouseStock(prev => ({
      ...prev,
      [productId]: { warehouses: [], loading: true }
    }))

    try {
      const response = await productsService.getStockByWarehouse(productId)
      if (response.data.success) {
        setWarehouseStock(prev => ({
          ...prev,
          [productId]: {
            warehouses: response.data.data.warehouses || [],
            totalAvailable: response.data.data.totalAvailable || 0,
            loading: false
          }
        }))
      }
    } catch (err) {
      console.debug('Erro ao carregar estoque por unidade:', err)
      setWarehouseStock(prev => ({
        ...prev,
        [productId]: { warehouses: [], loading: false }
      }))
    }
  }
  // Carregar preços fixos do cliente quando o lead mudar
  useEffect(() => {
    const customerId = lead?.customerId || lead?.customer_id
    if (customerId) {
      loadCustomerFixedPrices(customerId)
    } else {
      setCustomerFixedPrices([])
    }
  }, [lead?.customerId, lead?.customer_id])

  const loadCustomerFixedPrices = async (customerId) => {
    try {
      const response = await pricingService.getCustomerFixedPrices(customerId)
      if (response.data.success) {
        setCustomerFixedPrices(response.data.data || [])
      }
    } catch (err) {
      console.debug('Erro ao carregar preços fixos do cliente:', err)
    }
  }

  // Mapeamento EmitentePOID -> unidade_id (da view produtos_estoque_por_unidades)
  const EMITENTE_TO_UNIT_MAP = {
    1: 109,   // mak_0109
    3: 370,   // mak_0370
    6: 613,   // mak_0613
    8: 885,   // mak_0885
    9: 966    // mak_0966
  }

  // Verifica estoque da unidade do lead vs quantidade dos itens
  useEffect(() => {
    if (!onStockIssuesChange || !items.length) {
      onStockIssuesChange?.([])
      return
    }

    const leadUnitId = lead?.cLogUnity
    if (!leadUnitId) {
      onStockIssuesChange([])
      return
    }

    // Pega o unidade_id correspondente
    const warehouseId = EMITENTE_TO_UNIT_MAP[leadUnitId]

    const issues = []
    items.forEach(item => {
      if (!item.productId) return

      const stock = warehouseStock[item.productId]
      if (!stock?.warehouses) return

      // Encontra o estoque na unidade do lead
      const unitStock = stock.warehouses.find(w => w.id === warehouseId || w.id === leadUnitId)
      const availableQty = unitStock?.available || 0

      if (item.quantity > availableQty) {
        issues.push({
          productId: item.productId,
          productModel: item.product?.model || item.cProduct,
          quantity: item.quantity,
          available: availableQty,
          warehouseName: unitStock?.name || `Unidade ${leadUnitId}`
        })
      }
    })

    onStockIssuesChange(issues)
  }, [items, warehouseStock, lead?.cLogUnity, onStockIssuesChange])

  const toggleFavorite = async (productId) => {
    if (!productId || loadingFavorite[productId]) return

    setLoadingFavorite(prev => ({ ...prev, [productId]: true }))

    try {
      const isFavorite = favorites.has(productId)

      if (isFavorite) {
        await productsService.removeFavorite(productId)
        setFavorites(prev => {
          const newSet = new Set(prev)
          newSet.delete(productId)
          return newSet
        })
        toast.info('Removido dos favoritos')
      } else {
        await productsService.addFavorite(productId)
        setFavorites(prev => new Set([...prev, productId]))
        toast.success('Adicionado aos favoritos ❤️')
      }
    } catch (err) {
      toast.error('Erro ao atualizar favoritos')
    } finally {
      setLoadingFavorite(prev => ({ ...prev, [productId]: false }))
    }
  }

  const loadItems = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await leadsService.getItems(leadId)
      if (response.data.success) {
        setItems(response.data.data)

        // Carregar estoques por unidade para todos os produtos
        const productIds = [...new Set(response.data.data.map(item => item.productId).filter(Boolean))]
        productIds.forEach(productId => {
          loadWarehouseStock(productId)
        })
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar itens')
    } finally {
      setLoading(false)
    }
  }

  const loadTotals = async () => {
    try {
      const response = await leadsService.calculateTotals(leadId)
      if (response.data.success) {
        setTotals(response.data.data)
        if (response.data.data.v2Evaluation) {
          setV2Evaluation(response.data.data.v2Evaluation)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar totais:', err)
    }
  }

  const handleAddItem = () => {
    if (readOnly) {
      return
    }
    setFormData({
      product: null,
      quantity: 1,
      price: 0,
      consumerPrice: 0,
      originalPrice: 0,
      times: 5,
      ipi: 0,
      st: 0,
      ttd: 0
    })
    setAddDialogOpen(true)
    setDiscountRecommendation(null)
  }

  const handleAddRecommendedProduct = (product) => {
    if (readOnly) return;
    setSelectedItem(null);
    setFormData({
      product: {
        id: product.id,
        codigo: product.codigo,
        descricao: product.descricao,
        preco_venda: product.preco_venda,
        ...product
      },
      quantity: 1,
      price: product.preco_venda || 0,
      consumerPrice: product.preco_venda || 0,
      originalPrice: product.preco_venda || 0,
      times: 5,
      ipi: 0,
      st: 0,
      ttd: 0,
      decisionId: product.decision_id || null
    });
    setAddDialogOpen(true);
    if (product.id) {
      loadDiscountRecommendation(product.id);
    } else {
      setDiscountRecommendation(null);
    }
  };

  const loadDiscountRecommendation = async (productId) => {
    if (!lead?.customerId || !productId) return;
    try {
      setLoadingDiscountRec(true);
      const res = await aiService.getDiscountRecommendation(lead.customerId, productId);
      if (res.success) {
        setDiscountRecommendation(res.data);
      }
    } catch (err) {
      console.error('Erro ao buscar recomendação de desconto:', err);
    } finally {
      setLoadingDiscountRec(false);
    }
  };

  const handleEditItem = (item) => {
    if (readOnly) {
      return
    }
    setSelectedItem(item)
    setFormData({
      product: item.product || { id: item.productId },
      quantity: item.quantity,
      price: item.price,
      consumerPrice: item.consumerPrice || item.price,
      originalPrice: item.originalPrice || item.price,
      times: item.times ?? 1,
      ipi: item.ipi || 0,
      st: item.st || 0,
      ttd: item.ttd || 0
    });
    setEditDialogOpen(true);
    if (item.product?.id || item.productId) {
      loadDiscountRecommendation(item.product?.id || item.productId);
    } else {
      setDiscountRecommendation(null);
    }
  };

  const handleCalculatePricing = async (item) => {
    try {
      // Marcar item como calculando
      setCalculatingPricing(prev => ({ ...prev, [item.id]: true }))

      // Montar payload com dados do produto e do lead
      // Valores padrão caso não existam

      // Filtrar itens com preço de tela > 0
      const validItems = items.filter(cartItem => {
        const precoTela = cartItem.originalPrice || cartItem.product?.price || 0
        return precoTela > 0
      })

      // Montar order_items apenas com itens válidos (preço tela > 0)
      const order_items = validItems.map(cartItem => ({
        sku_id: cartItem.productId || cartItem.product?.id || 0,
        quantity: cartItem.quantity || 1,
        model: cartItem.product?.model || ''
      }))

      // Calcular order_value como soma dos itens válidos (qty * preço tela)
      const order_value = validItems.reduce((sum, cartItem) => {
        const qty = cartItem.quantity || 1
        const precoTela = cartItem.originalPrice || cartItem.product?.price || 0
        return sum + (qty * precoTela)
      }, 0)

      const payload = {
        org_id: 1, // Valor padrão - pode ser ajustado conforme necessário
        brand_id: item.product?.brandId || 3755581063, // Usar brand_id do produto ou padrão
        customer_id: lead?.customerId || lead?.cCustomer || 701546, // ID do cliente do lead
        sku_id: item.productId || item.product?.id || 0, // ID do produto/SKU
        sku_qty: item.quantity || 1, // Quantidade do item
        order_value, // Soma dos itens válidos do carrinho (qty * preço tela)
        product_brand: item.product?.brand || 'ZOJE', // Marca do produto
        product_model: item.product?.model || item.product?.name || '', // Modelo do produto
        installments: item.times ?? 1, // Vezes de pagamento (tProduct) - afeta desconto adicional
        order_items // Itens válidos do carrinho (preço tela > 0)
      }

      console.log('📊 Payload enviado para Pricing API:', JSON.stringify(payload, null, 2))

      // Chamar serviço de pricing
      const response = await pricingService.calculate(payload)

      console.log('✅ Resposta da Pricing API:', JSON.stringify(response.data, null, 2))

      if (response.data.success) {
        const pricingRoot = response.data.data?.result?.result || response.data.data?.result
        const decision = pricingRoot?.decision
        const execution = pricingRoot?.execution
        const newPrice = execution?.actions?.[0]?.new_price
        const finalPrice = decision?.final_price
        const explanation = decision?.explanation
        const reason = decision?.reason
        const decisionType = decision?.decision_type

        // Extrair Total de Descontos Aplicados dos steps da explicação
        let totalDiscount = null
        if (explanation?.steps) {
          const lastStep = explanation.steps.find(step =>
            step.values && step.values["Total de Descontos Aplicados"]
          )
          if (lastStep) {
            const discountStr = lastStep.values["Total de Descontos Aplicados"]
            totalDiscount = parseFloat(discountStr.replace('%', '')) / 100
          }
        }
        // Fallback para discount_allowed se não encontrar o total
        if (!totalDiscount) {
          const discountAllowed = decision?.discount_allowed
          totalDiscount = discountAllowed !== undefined ? discountAllowed : null
        }
        if (totalDiscount === null || totalDiscount === undefined) {
          const discountFromPt = decision?.discount_from_pt
          if (discountFromPt !== undefined && discountFromPt !== null) {
            totalDiscount = parseFloat(discountFromPt) / 100
          }
        }

        // Salvar resultado do pricing para este item (arredondando centavos para cima)
        const pricingPrice = roundCentsUp(newPrice || finalPrice)
        setPricingResults(prev => ({
          ...prev,
          [item.id]: {
            new_price: pricingPrice,
            discount_allowed: decision?.discount_allowed,
            total_discount: totalDiscount, // Total de descontos aplicados (inclui pagamento)
            applied_mode: decision?.applied_mode,
            tier_code: decision?.tier_code,
            explanation: explanation,
            reason,
            decision_type: decisionType
          }
        }))

        console.log('💰 Resultado do Pricing:', {
          final_price: finalPrice,
          new_price: newPrice,
          discount_allowed: response.data.data?.result?.decision?.discount_allowed,
          applied_mode: response.data.data?.result?.decision?.applied_mode,
          tier_code: response.data.data?.result?.decision?.tier_code,
          full_response: response.data.data
        })
      } else {
        console.error('❌ Erro na Pricing API:', response.data.error)
        setError('Erro ao calcular pricing: ' + (response.data.error?.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Erro ao calcular pricing:', error)
      console.error('📋 Payload que causou o erro:', JSON.stringify({
        org_id: 1,
        brand_id: item.product?.brandId || 3755581063,
        customer_id: lead?.customerId || lead?.cCustomer || 701546,
        sku_id: item.productId || item.product?.id || 0,
        sku_qty: item.quantity || 1,
        order_value: item.subtotal || item.price || 0,
        product_brand: item.product?.brand || 'ZOJE',
        product_model: item.product?.model || item.product?.name || '',
        installments: item.times ?? 1
      }, null, 2))
      setError('Erro ao calcular pricing: ' + (error.response?.data?.error?.message || error.message || 'Erro desconhecido'))
    } finally {
      // Remover item da lista de calculando
      setCalculatingPricing(prev => {
        const newState = { ...prev }
        delete newState[item.id]
        return newState
      })
    }
  }

  // Calcular pricing de todos os itens do carrinho sequencialmente
  const handleCalculateAllPricing = async () => {
    if (items.length === 0) return

    setCalculatingAllPricing(true)
    setError('')

    // Filtrar itens visíveis (com preço > 0 se hideZeroPrice estiver ativo)
    const itemsToCalculate = hideZeroPrice
      ? items.filter(item => parseFloat(item.price) > 0)
      : items

    let successCount = 0
    let errorCount = 0

    for (const item of itemsToCalculate) {
      try {
        await handleCalculatePricing(item)
        successCount++
      } catch (err) {
        console.error(`Erro ao calcular pricing do item ${item.id}:`, err)
        errorCount++
      }
      // Pequeno delay entre requisições para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    setCalculatingAllPricing(false)

    if (errorCount > 0) {
      toast.warning(`Pricing calculado: ${successCount} sucesso, ${errorCount} erros`)
    } else {
      toast.success(`Pricing calculado para ${successCount} itens!`)
    }
  }

  // Aplicar preço pricing (candidato) em todos os itens do carrinho
  const handleApplyAllPricing = async () => {
    if (items.length === 0) return

    setApplyingAllPricing(true)
    setError('')

    // Filtrar itens com preço de tela > 0
    const validItems = items.filter(item => {
      const precoTela = item.originalPrice || item.product?.price || 0
      return precoTela > 0
    })

    // Montar order_items e order_value para o payload
    const order_items = validItems.map(cartItem => ({
      sku_id: cartItem.productId || cartItem.product?.id || 0,
      quantity: cartItem.quantity || 1,
      model: cartItem.product?.model || ''
    }))

    const order_value = validItems.reduce((sum, cartItem) => {
      const qty = cartItem.quantity || 1
      const precoTela = cartItem.originalPrice || cartItem.product?.price || 0
      return sum + (qty * precoTela)
    }, 0)

    let successCount = 0
    let errorCount = 0

    for (const item of validItems) {
      try {
        // Calcular pricing para este item
        const payload = {
          org_id: 1,
          brand_id: item.product?.brandId || 3755581063,
          customer_id: lead?.customerId || lead?.cCustomer || 701546,
          sku_id: item.productId || item.product?.id || 0,
          sku_qty: item.quantity || 1,
          order_value,
          product_brand: item.product?.brand || 'ZOJE',
          product_model: item.product?.model || item.product?.name || '',
          installments: item.times ?? 1,
          order_items
        }

        const response = await pricingService.calculate(payload)

        if (response.data.success) {
          const pricingRoot = response.data.data?.result?.result || response.data.data?.result
          const decision = pricingRoot?.decision
          const execution = pricingRoot?.execution
          const newPrice = execution?.actions?.[0]?.new_price || decision?.final_price
          // Arredondar centavos para cima
          const roundedPrice = roundCentsUp(newPrice)

          if (roundedPrice && roundedPrice > 0) {
            // Atualizar o item com o novo preço
            const itemData = {
              productId: item.productId,
              quantity: item.quantity,
              price: roundedPrice,
              consumerPrice: item.consumerPrice || roundedPrice,
              times: item.times ?? 1,
              ipi: item.ipi || 0,
              st: item.st || 0,
              ttd: item.ttd || 0
            }

            await leadsService.updateItem(leadId, item.id, itemData)
            successCount++

            // Atualizar pricingResults para exibição
            setPricingResults(prev => ({
              ...prev,
              [item.id]: {
                new_price: roundedPrice,
                discount_allowed: decision?.discount_allowed,
                applied_mode: decision?.applied_mode,
                tier_code: decision?.tier_code,
                explanation: decision?.explanation,
                reason: decision?.reason,
                decision_type: decision?.decision_type
              }
            }))
          }
        }
      } catch (err) {
        console.error(`Erro ao aplicar pricing do item ${item.id}:`, err)
        errorCount++
      }
      // Pequeno delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Recarregar itens e totais
    await loadItems()
    await loadTotals()

    setApplyingAllPricing(false)

    if (errorCount > 0) {
      toast.warning(`Preços aplicados: ${successCount} sucesso, ${errorCount} erros`)
    } else if (successCount > 0) {
      toast.success(`Preço pricing aplicado em ${successCount} itens!`)
    } else {
      toast.info('Nenhum preço pricing disponível para aplicar.')
    }
  }

  const handleCalculatePricingFromDialog = async () => {
    if (!formData.product) {
      setError('Selecione um produto antes de calcular o pricing')
      return
    }

    try {
      setCalculatingPricingInDialog(true)
      setError('')

      // Filtrar itens com preço de tela > 0
      const validItems = items.filter(cartItem => {
        const precoTela = cartItem.originalPrice || cartItem.product?.price || 0
        return precoTela > 0
      })

      // Montar order_items apenas com itens válidos (preço tela > 0)
      const order_items = validItems.map(cartItem => ({
        sku_id: cartItem.productId || cartItem.product?.id || 0,
        quantity: cartItem.quantity || 1,
        model: cartItem.product?.model || ''
      }))

      // Calcular order_value como soma dos itens válidos (qty * preço tela)
      const order_value = validItems.reduce((sum, cartItem) => {
        const qty = cartItem.quantity || 1
        const precoTela = cartItem.originalPrice || cartItem.product?.price || 0
        return sum + (qty * precoTela)
      }, 0)

      // Montar payload com dados do formulário
      const payload = {
        org_id: 1,
        brand_id: formData.product?.brandId || 3755581063,
        customer_id: lead?.customerId || lead?.cCustomer || 701546,
        sku_id: formData.product?.id || 0,
        sku_qty: parseFloat(formData.quantity) || 1,
        order_value, // Soma dos itens válidos do carrinho (qty * preço tela)
        product_brand: formData.product?.brand || 'ZOJE',
        product_model: formData.product?.model || formData.product?.name || '',
        installments: Number.isNaN(parseInt(formData.times)) ? 1 : parseInt(formData.times), // Vezes de pagamento (tProduct) - afeta desconto adicional
        order_items // Itens válidos do carrinho (preço tela > 0)
      }

      console.log('📊 Payload enviado para Pricing API (Dialog):', JSON.stringify(payload, null, 2))

      // Chamar serviço de pricing
      const response = await pricingService.calculate(payload)

      console.log('✅ Resposta da Pricing API (Dialog):', JSON.stringify(response.data, null, 2))

      if (response.data.success) {
        const pricingRoot = response.data.data?.result?.result || response.data.data?.result
        const decision = pricingRoot?.decision
        const execution = pricingRoot?.execution
        const newPrice = execution?.actions?.[0]?.new_price
        const finalPrice = decision?.final_price
        const explanation = decision?.explanation

        // Atualizar preço no formulário (arredondando centavos para cima)
        const roundedPrice = roundCentsUp(newPrice || finalPrice)
        if (roundedPrice) {
          setFormData(prev => ({
            ...prev,
            price: roundedPrice
          }))
        }

        console.log('💰 Pricing calculado com sucesso:', {
          final_price: finalPrice,
          new_price: newPrice
        })
      } else {
        console.error('❌ Erro na Pricing API:', response.data.error)
        setError('Erro ao calcular pricing: ' + (response.data.error?.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Erro ao calcular pricing:', error)
      setError('Erro ao calcular pricing: ' + (error.response?.data?.error?.message || error.message || 'Erro desconhecido'))
    } finally {
      setCalculatingPricingInDialog(false)
    }
  }

  const handleCalculateTaxes = async () => {
    try {
      setSaving(true)
      toast.info('Calculando impostos...')
      const response = await leadsService.calculateTaxes(leadId)
      if (response.data.success) {
        loadItems()
        loadTotals()
        toast.success('Impostos calculados com sucesso!')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Erro ao calcular impostos'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (readOnly) {
      return
    }
    if (!window.confirm('Tem certeza que deseja remover este item?')) {
      return
    }

    try {
      await leadsService.removeItem(leadId, itemId)
      loadItems()
      loadTotals()
      toast.success('Item removido com sucesso!')
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Erro ao remover item'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  // Função para iniciar edição inline
  const handleStartInlineEdit = (item, field) => {
    if (readOnly) return
    setInlineEdit({
      itemId: item.id,
      field,
      value: field === 'quantity' ? item.quantity : (item.times ?? 1)
    })
  }

  // Função para cancelar edição inline
  const handleCancelInlineEdit = () => {
    setInlineEdit({})
  }

  // Função para salvar edição inline via AJAX
  const handleSaveInlineEdit = async (item) => {
    if (!inlineEdit.itemId || savingInline[item.id]) return

    const newValue = parseFloat(inlineEdit.value)
    const oldValue = inlineEdit.field === 'quantity' ? item.quantity : (item.times ?? 1)

    // Se o valor não mudou, apenas fechar a edição
    if (newValue === oldValue) {
      setInlineEdit({})
      return
    }

    // Validar valor
    if (isNaN(newValue) || newValue < (inlineEdit.field === 'quantity' ? 1 : 0)) {
      toast.error(`Valor inválido para ${inlineEdit.field === 'quantity' ? 'quantidade' : 'vezes'}`)
      setInlineEdit({})
      return
    }

    try {
      setSavingInline(prev => ({ ...prev, [item.id]: true }))

      const itemData = {
        productId: item.productId,
        quantity: inlineEdit.field === 'quantity' ? newValue : item.quantity,
        price: item.price,
        consumerPrice: item.consumerPrice || item.price,
        times: inlineEdit.field === 'times' ? newValue : (item.times ?? 1),
        ipi: item.ipi || 0,
        st: item.st || 0,
        ttd: item.ttd || 0
      }

      await leadsService.updateItem(leadId, item.id, itemData)
      toast.success(`${inlineEdit.field === 'quantity' ? 'Quantidade' : 'Vezes'} atualizado!`)
      setInlineEdit({})
      loadItems()
      loadTotals()
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Erro ao atualizar item'
      toast.error(errorMsg)
    } finally {
      setSavingInline(prev => ({ ...prev, [item.id]: false }))
    }
  }

  // Função para lidar com tecla no input inline
  const handleInlineKeyDown = (e, item) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveInlineEdit(item)
    } else if (e.key === 'Escape') {
      handleCancelInlineEdit()
    }
  }

  const handleSaveItem = async () => {
    if (!formData.product) {
      setError('Selecione um produto')
      return
    }

    try {
      setSaving(true)
      setError('')

      const itemData = {
        productId: formData.product.id,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        consumerPrice: parseFloat(formData.consumerPrice) || parseFloat(formData.price),
        times: Number.isNaN(parseInt(formData.times)) ? 1 : parseInt(formData.times),
        ipi: parseFloat(formData.ipi) || 0,
        st: parseFloat(formData.st) || 0,
        ttd: parseInt(formData.ttd) || 0,
        decisionId: formData.decisionId || null
      }

      if (selectedItem) {
        await leadsService.updateItem(leadId, selectedItem.id, itemData)
        toast.success('Item atualizado com sucesso!')
      } else {
        await leadsService.addItem(leadId, itemData)
        toast.success('Item adicionado com sucesso!')
      }

      setAddDialogOpen(false)
      setEditDialogOpen(false)
      setSelectedItem(null)
      loadItems()
      loadTotals()
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Erro ao salvar item'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  // Função para ordenar itens
  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Função para obter itens filtrados e ordenados
  const getFilteredAndSortedItems = () => {
    let filtered = items

    // Filtrar produtos com preço zero se hideZeroPrice estiver ativo
    if (hideZeroPrice) {
      filtered = items.filter(item => parseFloat(item.price) > 0)
    }

    // Ordenar itens
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue

        switch (sortConfig.key) {
          case 'product':
            aValue = `${a.product?.model || ''} ${a.product?.name || ''}`.toLowerCase()
            bValue = `${b.product?.model || ''} ${b.product?.name || ''}`.toLowerCase()
            break
          case 'quantity':
            aValue = parseFloat(a.quantity) || 0
            bValue = parseFloat(b.quantity) || 0
            break
          case 'originalPrice':
            aValue = parseFloat(a.originalPrice || a.product?.price) || 0
            bValue = parseFloat(b.originalPrice || b.product?.price) || 0
            break
          case 'price':
            aValue = parseFloat(a.price) || 0
            bValue = parseFloat(b.price) || 0
            break
          case 'subtotal':
            aValue = parseFloat(a.subtotal) || 0
            bValue = parseFloat(b.subtotal) || 0
            break
          case 'ipi':
            aValue = parseFloat(a.ipi) || 0
            bValue = parseFloat(b.ipi) || 0
            break
          case 'st':
            aValue = parseFloat(a.st) || 0
            bValue = parseFloat(b.st) || 0
            break
          default:
            return 0
        }

        if (typeof aValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        } else {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
        }
      })
    }

    return filtered
  }

  // Componente para header de coluna ordenável
  const SortableHeader = ({ columnKey, children, align = 'left' }) => {
    const isActive = sortConfig.key === columnKey
    return (
      <TableCell
        align={align}
        sx={{
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { bgcolor: 'action.hover' }
        }}
        onClick={() => handleSort(columnKey)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', gap: 0.5 }}>
          {children}
          {isActive ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUpwardIcon fontSize="small" />
            ) : (
              <ArrowDownwardIcon fontSize="small" />
            )
          ) : (
            <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.3 }} />
          )}
        </Box>
      </TableCell>
    )
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Paper>
    )
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': { boxShadow: 4 }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCartIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Itens do Carrinho
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={hideZeroPrice}
                onChange={(e) => setHideZeroPrice(e.target.checked)}
                size="small"
              />
            }
            label={
              <Tooltip title="Ocultar produtos com preço unitário igual a zero">
                <Typography variant="body2">Ocultar preço zero</Typography>
              </Tooltip>
            }
          />
          <Button
            variant="outlined"
            startIcon={<CalculateIcon />}
            onClick={handleCalculateTaxes}
            disabled={readOnly || saving || items.length === 0}
            sx={{ mr: 1 }}
          >
            Calcular Impostos
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={calculatingAllPricing ? <CircularProgress size={16} /> : <CalculateIcon />}
            onClick={handleCalculateAllPricing}
            disabled={calculatingAllPricing || applyingAllPricing || items.length === 0}
            sx={{ mr: 1 }}
            title="Calcular pricing de todos os itens do carrinho"
          >
            {calculatingAllPricing ? 'Calculando...' : 'Calcular Todos Pricing'}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={applyingAllPricing ? <CircularProgress size={16} color="inherit" /> : <CalculateIcon />}
            onClick={handleApplyAllPricing}
            disabled={readOnly || applyingAllPricing || calculatingAllPricing || items.length === 0}
            sx={{ mr: 1 }}
            title="Aplicar preço pricing (candidato) em todos os itens do carrinho"
          >
            {applyingAllPricing ? 'Aplicando...' : 'Aplicar Pricing'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            disabled={readOnly}
            title={readOnly ? 'Este lead não pode ser editado pois já possui número de pedido' : 'Adicionar novo produto ao carrinho'}
          >
            Adicionar Produto
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {(() => {
        const filteredAndSortedItems = getFilteredAndSortedItems()
        const totalItems = items.length
        const visibleItems = filteredAndSortedItems.length
        const hiddenItems = totalItems - visibleItems

        if (items.length === 0) {
          return (
            <EmptyState
              icon="cart"
              title="Carrinho vazio"
              description="Adicione produtos ao carrinho para começar"
              actionLabel={readOnly ? undefined : "Adicionar Produto"}
              onAction={readOnly ? undefined : handleAddItem}
              size="medium"
            />
          )
        }

        if (filteredAndSortedItems.length === 0 && hideZeroPrice) {
          return (
            <EmptyState
              icon="search"
              title="Nenhum item visível"
              description="Todos os itens têm preço zero e estão ocultos. Desative o filtro para visualizá-los."
              size="small"
            />
          )
        }

        // Verificar se algum item é do segmento "machines" para ocultar IPI e ST
        const hasMachinesSegment = filteredAndSortedItems.some(item => {
          const productSegment = item.product?.segment?.code ||
            item.product?.segment ||
            item.product?.product_segment ||
            ''
          const segmentStr = typeof productSegment === 'string' ? productSegment : ''
          return segmentStr?.toLowerCase() === 'machines' ||
            segmentStr?.toLowerCase() === 'máquinas' ||
            segmentStr?.toLowerCase() === 'maquinas'
        })

        return (
          <>
            {hiddenItems > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {hiddenItems} {hiddenItems === 1 ? 'item oculto' : 'itens ocultos'} com preço zero
              </Alert>
            )}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <SortableHeader columnKey="product">Produto</SortableHeader>
                    <SortableHeader columnKey="quantity" align="right">Quantidade</SortableHeader>
                    <SortableHeader columnKey="times" align="center">Vezes</SortableHeader>
                    <SortableHeader columnKey="price" align="right">Preço Unit.</SortableHeader>
                    <SortableHeader columnKey="subtotal" align="right">Subtotal</SortableHeader>
                    <SortableHeader columnKey="originalPrice" align="right">Preço Tela</SortableHeader>
                    <TableCell align="right">Preço Pricing</TableCell>
                    {!hasMachinesSegment && (
                      <>
                        <SortableHeader columnKey="ipi" align="right">IPI</SortableHeader>
                        <SortableHeader columnKey="st" align="right">ST</SortableHeader>
                      </>
                    )}
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          {/* Imagem do produto - clicável para abrir detalhes */}
                          <Tooltip title="Clique para ver detalhes do produto" placement="top">
                            <Box
                              component="img"
                              src={`https://img.rolemak.com.br/id/h80/${item.productId || item.product?.id}.jpg?version=9.02`}
                              alt={item.product?.model || 'Produto'}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                              onClick={() => setProductDetailModal({
                                open: true,
                                product: {
                                  id: item.productId || item.product?.id,
                                  model: item.product?.model,
                                  name: item.product?.name,
                                  brand: item.product?.brand,
                                  segment: item.product?.segment,
                                  preco_venda: item.originalPrice || item.product?.price,
                                  stock: item.product?.stock,
                                  ncm: item.product?.ncm,
                                  ...item.product
                                }
                              })}
                              sx={{
                                width: 50,
                                height: 50,
                                objectFit: 'contain',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                                flexShrink: 0,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  boxShadow: 2,
                                  borderColor: 'primary.main'
                                }
                              }}
                            />
                          </Tooltip>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              {item.product?.model && (
                                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem', lineHeight: 1.5 }}>
                                  {item.product.model}
                                </Typography>
                              )}
                              {item.product?.brand && (
                                <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                  <MakPrimeLogo height={18} marca={item.product.brand} />
                                </Box>
                              )}
                            </Box>
                            {item.product?.brand && (
                              <Typography variant="caption" color="text.secondary">
                                Marca: {item.product.brand}
                              </Typography>
                            )}
                            <Typography variant="body2">
                              {item.product?.name || `Produto #${item.productId}`}
                            </Typography>
                            {/* Chips de promoção e estoque */}
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              {/* Badge de promoção */}
                              {promotionMap.has(item.productId || item.product?.id) && (
                                <Chip
                                  icon={<PromoIcon sx={{ fontSize: 14 }} />}
                                  label={`-${Math.round(promotionMap.get(item.productId || item.product?.id).promoDiscount)}%`}
                                  color="error"
                                  size="small"
                                  sx={{
                                    height: 20,
                                    '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem', fontWeight: 'bold' },
                                    '& .MuiChip-icon': { ml: 0.5 }
                                  }}
                                />
                              )}
                              {/* Badge de lançamento */}
                              {launchProductMap.has(item.productId || item.product?.id) && (
                                <Tooltip
                                  title={
                                    <Box>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>🚀 Produto em Lançamento</Typography>
                                      <Typography variant="caption" display="block">
                                        Preço Lançamento: {formatCurrency(launchProductMap.get(item.productId || item.product?.id).launchPrice)}
                                      </Typography>
                                      <Typography variant="caption" display="block">
                                        Preço Regular: {formatCurrency(launchProductMap.get(item.productId || item.product?.id).regularPrice)}
                                      </Typography>
                                      <Typography variant="caption" display="block">
                                        Até: {launchProductMap.get(item.productId || item.product?.id).launchEnd.toLocaleDateString('pt-BR')}
                                      </Typography>
                                    </Box>
                                  }
                                  arrow
                                >
                                  <Chip
                                    icon={<LaunchIcon sx={{ fontSize: 14 }} />}
                                    label="Lançamento"
                                    color="secondary"
                                    size="small"
                                    sx={{
                                      height: 20,
                                      '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem', fontWeight: 'bold' },
                                      '& .MuiChip-icon': { ml: 0.5 },
                                      cursor: 'help'
                                    }}
                                  />
                                </Tooltip>
                              )}
                              {/* Badge de preço fixo do cliente */}
                              {fixedPriceMap.has(item.productId || item.product?.id) && (
                                <Tooltip
                                  title={
                                    <Box>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>🔒 Preço Fixo Acordado</Typography>
                                      <Typography variant="caption" display="block">
                                        Preço: {formatCurrency(fixedPriceMap.get(item.productId || item.product?.id).fixedPrice)}
                                      </Typography>
                                      {fixedPriceMap.get(item.productId || item.product?.id).discountFromPt && (
                                        <Typography variant="caption" display="block">
                                          Desconto da Tabela: {fixedPriceMap.get(item.productId || item.product?.id).discountFromPt}%
                                        </Typography>
                                      )}
                                      <Typography variant="caption" display="block">
                                        Válido até: {fixedPriceMap.get(item.productId || item.product?.id).validUntil.toLocaleDateString('pt-BR')}
                                      </Typography>
                                      {fixedPriceMap.get(item.productId || item.product?.id).notes && (
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                          {fixedPriceMap.get(item.productId || item.product?.id).notes}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  arrow
                                >
                                  <Chip
                                    icon={<FixedPriceIcon sx={{ fontSize: 14 }} />}
                                    label="Preço Fixo"
                                    color="warning"
                                    size="small"
                                    sx={{
                                      height: 20,
                                      '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem', fontWeight: 'bold' },
                                      '& .MuiChip-icon': { ml: 0.5 },
                                      cursor: 'help'
                                    }}
                                  />
                                </Tooltip>
                              )}
                              {/* Badge de combo/bundle */}
                              {(() => {
                                const productId = item.productId || item.product?.id
                                const productModel = item.product?.model
                                const bundleInfo = getProductBundle(productId, productModel)

                                if (!bundleInfo) return null

                                return (
                                  <Tooltip
                                    title={
                                      <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>📦 Parte de Combo</Typography>
                                        <Typography variant="caption" display="block">
                                          {bundleInfo.bundleName}
                                        </Typography>
                                        {bundleInfo.bundleDescription && (
                                          <Typography variant="caption" display="block" sx={{ fontStyle: 'italic' }}>
                                            {bundleInfo.bundleDescription}
                                          </Typography>
                                        )}
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                          Desconto: {bundleInfo.discount}%
                                        </Typography>
                                        {bundleInfo.minQty > 1 && (
                                          <Typography variant="caption" display="block">
                                            Qtde mínima: {bundleInfo.minQty}
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                    arrow
                                  >
                                    <Chip
                                      icon={<BundleIcon sx={{ fontSize: 14 }} />}
                                      label="Combo"
                                      color="success"
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        height: 20,
                                        '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem', fontWeight: 'bold' },
                                        '& .MuiChip-icon': { ml: 0.5 },
                                        cursor: 'help'
                                      }}
                                    />
                                  </Tooltip>
                                )
                              })()}
                              {/* Badge de desconto por quantidade (SKU ou família) */}
                              {(() => {
                                const productId = item.productId || item.product?.id
                                const productModel = item.product?.model
                                const qtyDiscount = getQuantityDiscounts(productId, productModel)

                                if (!qtyDiscount) return null

                                return (
                                  <Tooltip
                                    title={
                                      <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                          {qtyDiscount.type === 'family'
                                            ? `Descontos Família ${qtyDiscount.family}:`
                                            : 'Descontos por Quantidade:'}
                                        </Typography>
                                        {qtyDiscount.discounts.map((qd, idx) => (
                                          <Typography key={idx} variant="caption" display="block">
                                            • {qd.minQty}+ un: {qd.discount ? `-${qd.discount}%` : formatCurrency(qd.price)}
                                          </Typography>
                                        ))}
                                      </Box>
                                    }
                                    arrow
                                  >
                                    <Chip
                                      icon={<CalculateIcon sx={{ fontSize: 14 }} />}
                                      label={qtyDiscount.type === 'family' ? `Fam. ${qtyDiscount.family}` : 'Desc. Qtde'}
                                      color="info"
                                      size="small"
                                      sx={{
                                        height: 20,
                                        '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' },
                                        '& .MuiChip-icon': { ml: 0.5 },
                                        cursor: 'help'
                                      }}
                                    />
                                  </Tooltip>
                                )
                              })()}
                              {/* Chip de estoque total */}
                              {item.product?.stock !== undefined && (
                                <Chip
                                  icon={<InventoryIcon sx={{ fontSize: 14 }} />}
                                  label={
                                    item.product.stock <= 0
                                      ? 'Sem estoque'
                                      : item.product.stock < 5
                                        ? `Baixo: ${item.product.stock} un.`
                                        : `${item.product.stock} un.`
                                  }
                                  color={
                                    item.product.stock <= 0
                                      ? 'error'
                                      : item.product.stock < 5
                                        ? 'warning'
                                        : 'success'
                                  }
                                  size="small"
                                  sx={{
                                    height: 20,
                                    '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' },
                                    '& .MuiChip-icon': { ml: 0.5 }
                                  }}
                                />
                              )}

                              {/* Estoques por unidade */}
                              {warehouseStock[item.productId]?.warehouses?.length > 0 && (() => {
                                const leadUnitId = lead?.cLogUnity
                                const warehouseId = EMITENTE_TO_UNIT_MAP[leadUnitId]

                                return (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {warehouseStock[item.productId].warehouses.map((wh, idx) => {
                                      const isLeadUnit = wh.id === warehouseId || wh.id === leadUnitId
                                      const hasInsufficientStock = isLeadUnit && item.quantity > wh.available

                                      return (
                                        <Tooltip
                                          key={idx}
                                          title={
                                            hasInsufficientStock
                                              ? `⚠️ Estoque insuficiente! Pedido: ${item.quantity}, Disponível: ${wh.available}`
                                              : isLeadUnit
                                                ? '✓ Unidade do pedido'
                                                : ''
                                          }
                                          arrow
                                        >
                                          <Chip
                                            label={`${wh.name}: ${wh.available}`}
                                            size="small"
                                            variant={isLeadUnit ? "filled" : "outlined"}
                                            color={hasInsufficientStock ? "error" : isLeadUnit ? "primary" : "default"}
                                            sx={{
                                              height: 18,
                                              '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' },
                                              borderColor: hasInsufficientStock ? 'error.main' : isLeadUnit ? 'primary.main' : 'divider',
                                              fontWeight: isLeadUnit ? 'bold' : 'normal',
                                              animation: hasInsufficientStock ? 'pulse 1.5s infinite' : 'none',
                                              '@keyframes pulse': {
                                                '0%, 100%': { opacity: 1 },
                                                '50%': { opacity: 0.6 }
                                              }
                                            }}
                                          />
                                        </Tooltip>
                                      )
                                    })}
                                  </Box>
                                )
                              })()}
                              {warehouseStock[item.productId]?.loading && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', ml: 0.5 }}>
                                  Carregando unidades...
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 80 }}>
                        {inlineEdit.itemId === item.id && inlineEdit.field === 'quantity' ? (
                          <TextField
                            autoFocus
                            type="number"
                            size="small"
                            value={inlineEdit.value}
                            onChange={(e) => setInlineEdit(prev => ({ ...prev, value: e.target.value }))}
                            onBlur={() => handleSaveInlineEdit(item)}
                            onKeyDown={(e) => handleInlineKeyDown(e, item)}
                            inputProps={{ min: 1, step: 1, style: { textAlign: 'right' } }}
                            disabled={savingInline[item.id]}
                            sx={{ width: 70 }}
                            InputProps={{
                              endAdornment: savingInline[item.id] ? (
                                <CircularProgress size={14} />
                              ) : null
                            }}
                          />
                        ) : (
                          <Tooltip title={readOnly ? '' : 'Clique para editar'} placement="top">
                            <Typography
                              variant="body2"
                              onClick={() => handleStartInlineEdit(item, 'quantity')}
                              sx={{
                                cursor: readOnly ? 'default' : 'pointer',
                                padding: '4px 8px',
                                borderRadius: 1,
                                display: 'inline-block',
                                transition: 'all 0.2s ease',
                                '&:hover': readOnly ? {} : {
                                  bgcolor: 'action.hover',
                                  boxShadow: 1
                                }
                              }}
                            >
                              {item.quantity}
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 70 }}>
                        {inlineEdit.itemId === item.id && inlineEdit.field === 'times' ? (
                          <TextField
                            autoFocus
                            type="number"
                            size="small"
                            value={inlineEdit.value}
                            onChange={(e) => setInlineEdit(prev => ({ ...prev, value: e.target.value }))}
                            onBlur={() => handleSaveInlineEdit(item)}
                            onKeyDown={(e) => handleInlineKeyDown(e, item)}
                            inputProps={{ min: 0, step: 1, style: { textAlign: 'center' } }}
                            disabled={savingInline[item.id]}
                            sx={{ width: 60 }}
                            InputProps={{
                              endAdornment: savingInline[item.id] ? (
                                <CircularProgress size={14} />
                              ) : null
                            }}
                          />
                        ) : (
                          <Tooltip title={readOnly ? '' : 'Clique para editar'} placement="top">
                            <Typography
                              variant="body2"
                              onClick={() => handleStartInlineEdit(item, 'times')}
                              sx={{
                                cursor: readOnly ? 'default' : 'pointer',
                                padding: '4px 8px',
                                borderRadius: 1,
                                display: 'inline-block',
                                transition: 'all 0.2s ease',
                                '&:hover': readOnly ? {} : {
                                  bgcolor: 'action.hover',
                                  boxShadow: 1
                                }
                              }}
                            >
                              {item.times ?? 1}
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>
                      {/* Preço Unit. */}
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2">{formatCurrency(item.price)}</Typography>
                          {(() => {
                            const precoTela = item.originalPrice || item.product?.price || 0
                            const precoUnit = item.price || 0
                            if (precoTela > 0 && precoUnit < precoTela) {
                              const desconto = ((precoTela - precoUnit) / precoTela) * 100
                              return (
                                <Typography variant="caption" color="error.main">
                                  -{desconto.toFixed(2)}%
                                </Typography>
                              )
                            }
                            return null
                          })()}
                        </Box>
                      </TableCell>
                      {/* Subtotal */}
                      <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                      {/* Preço Tela */}
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(item.originalPrice || item.product?.price || 0)}
                        </Typography>
                      </TableCell>
                      {/* Preço Pricing */}
                      <TableCell align="right">
                        {calculatingPricing[item.id] ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Calculando...
                            </Typography>
                          </Box>
                        ) : pricingResults[item.id]?.new_price ? (
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                {formatCurrency(pricingResults[item.id].new_price)}
                              </Typography>
                              {pricingResults[item.id].explanation && (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedPricingExplanation({
                                      itemId: item.id,
                                      explanation: pricingResults[item.id].explanation,
                                      productName: item.product?.model || item.product?.name || `Produto #${item.productId}`
                                    })
                                    setPricingExplanationOpen(true)
                                  }}
                                  sx={{ p: 0.5 }}
                                  title="Ver explicação do cálculo"
                                >
                                  <InfoIcon fontSize="small" color="primary" />
                                </IconButton>
                              )}
                            </Box>
                            {(() => {
                              const precoPricing = pricingResults[item.id].new_price
                              const precoTela = item.originalPrice || item.product?.price || 0
                              if (precoTela > 0 && precoPricing) {
                                const desconto = (1 - (precoPricing / precoTela)) * 100
                                return (
                                  <Typography variant="caption" color="text.secondary">
                                    {desconto.toFixed(2)}% desc
                                  </Typography>
                                )
                              }
                              return null
                            })()}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}

                        {/* V2: AI Recommendation (Q1 2026) */}
                        {(() => {
                          const v2Item = v2Evaluation?.pricing_result?.items?.find(it => it.product_id === item.productId);
                          if (v2Item?.ai_recommendation) {
                            return (
                              <Tooltip title={v2Item.ai_recommendation.reasoning}>
                                <Chip
                                  label={`IA: ${formatCurrency(v2Item.ai_recommendation.suggested_price)}`}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  sx={{ mt: 0.5, fontSize: '0.65rem', height: 20 }}
                                />
                              </Tooltip>
                            )
                          }
                          return null;
                        })()}
                      </TableCell>
                      {!hasMachinesSegment && (
                        <>
                          <TableCell align="right">{formatCurrency(item.ipi)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.st)}</TableCell>
                        </>
                      )}
                      <TableCell align="center">
                        {!isBasicUser && (
                          <IconButton
                            size="small"
                            onClick={() => handleCalculatePricing(item)}
                            title="Calcular Pricing"
                            color="primary"
                            disabled={calculatingPricing[item.id]}
                          >
                            {calculatingPricing[item.id] ? (
                              <CircularProgress size={16} />
                            ) : (
                              <CalculateIcon fontSize="small" />
                            )}
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleEditItem(item)}
                          title={readOnly ? 'Este lead não pode ser editado pois já possui número de pedido' : 'Editar'}
                          disabled={readOnly}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => toggleFavorite(item.productId || item.product?.id)}
                          title={favorites.has(item.productId || item.product?.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          disabled={loadingFavorite[item.productId || item.product?.id]}
                          sx={{
                            color: favorites.has(item.productId || item.product?.id) ? 'error.main' : 'action.active',
                            transition: 'color 0.2s ease'
                          }}
                        >
                          {loadingFavorite[item.productId || item.product?.id] ? (
                            <CircularProgress size={16} />
                          ) : favorites.has(item.productId || item.product?.id) ? (
                            <FavoriteIcon fontSize="small" />
                          ) : (
                            <FavoriteBorderIcon fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteItem(item.id)}
                          title={readOnly ? 'Este lead não pode ser editado pois já possui número de pedido' : 'Excluir'}
                          disabled={readOnly}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totals && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(totals.subtotal)}
                    </Typography>
                  </Grid>
                  {!hasMachinesSegment && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          IPI
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(totals.totalIPI)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          ST
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(totals.totalST)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Frete
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(totals.freight || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ borderTop: 1, borderColor: 'divider', my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        Total
                      </Typography>
                      <Chip
                        label={formatCurrency(totals.grandTotal || totals.total)}
                        color="primary"
                        sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {!readOnly && items.length > 0 && (
              <CartRecommendations
                items={items}
                onAddProduct={handleAddRecommendedProduct}
              />
            )}
          </>
        )
      })()}

      {/* Dialog para Adicionar/Editar Item */}
      <Dialog
        open={addDialogOpen || editDialogOpen}
        onClose={() => {
          setAddDialogOpen(false)
          setEditDialogOpen(false)
          setSelectedItem(null)
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedItem ? 'Editar Item' : 'Adicionar Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <ProductAutocomplete
                value={formData.product}
                customerFixedPrices={customerFixedPrices}
                onChange={(value) => {
                  if (import.meta.env.DEV && value) {
                    console.log('ProductAutocomplete - Produto selecionado:', value)
                    console.log('ProductAutocomplete - Segmento:', value.segment || value.product_segment)
                  }
                  if (value?.id) {
                    loadDiscountRecommendation(value.id)
                  } else {
                    setDiscountRecommendation(null)
                  }
                  // Usar preço fixo se disponível, senão preço normal
                  const selectedPrice = value?.hasFixedPrice ? value.fixedPrice : (value?.price || formData.price)
                  setFormData(prev => ({
                    ...prev,
                    product: value,
                    price: selectedPrice
                  }))
                }}
              />
            </Grid>

            {discountRecommendation && (
              <Grid item xs={12}>
                <Alert
                  severity="info"
                  icon={<AutoFixHighIcon />}
                  sx={{
                    '& .MuiAlert-message': { width: '100%' },
                    animation: 'fadeIn 0.5s ease-in'
                  }}
                  action={
                    <Button
                      color="primary"
                      size="small"
                      variant="contained"
                      onClick={() => {
                        const original = formData.product?.preco_venda || parseFloat(formData.price) || 0;
                        const discount = discountRecommendation.suggested_discount;
                        const newPrice = original * (1 - discount / 100);
                        setFormData(prev => ({ ...prev, price: newPrice.toFixed(2) }));
                      }}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Aplicar {discountRecommendation.suggested_discount}%
                    </Button>
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Sugestão IA: {discountRecommendation.suggested_discount}% de desconto
                  </Typography>
                  <Typography variant="caption" display="block">
                    {discountRecommendation.rationale}
                  </Typography>
                </Alert>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantidade"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                inputProps={{
                  min: 1,
                  step: 1
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Vezes (tProduct)"
                value={formData.times}
                onChange={(e) => setFormData(prev => ({ ...prev, times: e.target.value }))}
                inputProps={{ min: 0, step: 1 }}
                helperText="Número de parcelas/pagamentos (padrão: 5 para máquinas)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Preço Unitário"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                {!isBasicUser && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleCalculatePricingFromDialog}
                    disabled={!formData.product || calculatingPricingInDialog}
                    sx={{ minWidth: 48, height: 56 }}
                    title="Calcular Pricing"
                  >
                    {calculatingPricingInDialog ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CalculateIcon />
                    )}
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.light',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'primary.main'
                }}
              >
                <Typography variant="body2" color="white" sx={{ mb: 0.5 }}>
                  Subtotal
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                  {formatCurrency((parseFloat(formData.quantity) || 0) * (parseFloat(formData.price) || 0))}
                </Typography>
              </Box>
            </Grid>
            {(() => {
              // Ocultar IPI e ST se o segmento for "machines" (máquinas)
              // O segmento pode vir como string direta ou como objeto { code: string, id: number }
              const productSegment = formData.product?.segment?.code ||
                formData.product?.segment ||
                formData.product?.product_segment ||
                ''
              const segmentStr = typeof productSegment === 'string' ? productSegment : ''
              const isMachines = segmentStr?.toLowerCase() === 'machines' ||
                segmentStr?.toLowerCase() === 'máquinas' ||
                segmentStr?.toLowerCase() === 'maquinas'

              if (isMachines) {
                return null // Não renderizar IPI e ST para máquinas
              }

              return (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="IPI"
                      value={formData.ipi}
                      onChange={(e) => setFormData(prev => ({ ...prev, ipi: e.target.value }))}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="ST"
                      value={formData.st}
                      onChange={(e) => setFormData(prev => ({ ...prev, st: e.target.value }))}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                </>
              )
            })()}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddDialogOpen(false)
              setEditDialogOpen(false)
              setSelectedItem(null)
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Explicação do Pricing */}
      <Dialog
        open={pricingExplanationOpen}
        onClose={() => setPricingExplanationOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="h6">
              Explicação do Cálculo de Pricing
            </Typography>
          </Box>
          {selectedPricingExplanation && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Produto: {selectedPricingExplanation.productName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedPricingExplanation?.explanation?.steps ? (
            <Box>
              {/* Explicação simplificada para usuário nível 1 */}
              {isBasicUser ? (
                <Box>
                  {/* Resumo simples */}
                  <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Resumo do Desconto
                    </Typography>
                    <Typography variant="body2">
                      O preço foi calculado com base nas políticas comerciais vigentes,
                      considerando o perfil do cliente, quantidade e condições de pagamento.
                    </Typography>
                  </Paper>

                  {/* Mostrar apenas valores principais sem Preço de Piso */}
                  <List>
                    {selectedPricingExplanation.explanation.steps
                      .filter(step => !step.title?.toLowerCase().includes('piso'))
                      .map((step, index) => {
                        // Filtrar valores que contenham "piso"
                        const filteredValues = step.values
                          ? Object.entries(step.values).filter(([key]) =>
                            !key.toLowerCase().includes('piso')
                          )
                          : []

                        if (filteredValues.length === 0) return null

                        return (
                          <ListItem key={step.step || index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <ListItemText
                              primary={step.title}
                              primaryTypographyProps={{ fontWeight: 'bold', variant: 'subtitle2' }}
                            />
                            <Box sx={{ width: '100%', pl: 2 }}>
                              {filteredValues.map(([key, value]) => (
                                <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {key}:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {value}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </ListItem>
                        )
                      })}
                  </List>
                </Box>
              ) : (
                <>
                  {/* Fórmula geral - apenas para usuários avançados */}
                  {selectedPricingExplanation.explanation.formula && (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Fórmula Geral:
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.875rem'
                      }}>
                        {selectedPricingExplanation.explanation.formula}
                      </Typography>
                    </Paper>
                  )}

                  {/* Cálculo final */}
                  {selectedPricingExplanation.explanation.final_calculation && (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Cálculo Final:
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.875rem'
                      }}>
                        {selectedPricingExplanation.explanation.final_calculation}
                      </Typography>
                    </Paper>
                  )}

                  {/* Steps completos */}
                  <Stepper orientation="vertical">
                    {selectedPricingExplanation.explanation.steps.map((step, index) => (
                      <Step key={step.step || index} active={true} completed={true}>
                        <StepLabel>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {step.step}. {step.title}
                          </Typography>
                        </StepLabel>
                        <StepContent>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {step.description}
                            </Typography>

                            {/* Valores do step */}
                            {step.values && Object.keys(step.values).length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                {Object.entries(step.values).map(([key, value]) => (
                                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {key}:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                      {value}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}

                            {/* Fórmula do step */}
                            {step.formula && (
                              <Paper sx={{ p: 1.5, bgcolor: 'grey.50', mt: 1 }}>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                  Fórmula:
                                </Typography>
                                <Typography variant="body2" component="pre" sx={{
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  fontSize: '0.75rem',
                                  margin: 0
                                }}>
                                  {step.formula}
                                </Typography>
                              </Paper>
                            )}

                            {/* Nota do step */}
                            {step.note && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                <Typography variant="caption">
                                  {step.note}
                                </Typography>
                              </Alert>
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Nenhuma explicação disponível para este cálculo.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPricingExplanationOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalhes do Produto */}
      <ProductDetailModal
        open={productDetailModal.open}
        onClose={() => setProductDetailModal({ open: false, product: null })}
        product={productDetailModal.product}
      />
    </Paper>
  )
}

export default CartItems

