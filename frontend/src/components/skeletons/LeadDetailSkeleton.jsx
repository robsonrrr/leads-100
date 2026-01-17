import {
  Box,
  Paper,
  Skeleton,
  Grid,
  Divider
} from '@mui/material'

/**
 * Skeleton loader para a página de Detalhes do Lead
 * Mostra um preview da estrutura enquanto os dados carregam
 */
function LeadDetailSkeleton() {
  return (
    <Box>
      {/* Header com botões */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={150} height={20} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={100} height={36} />
          <Skeleton variant="rounded" width={100} height={36} />
          <Skeleton variant="rounded" width={100} height={36} />
          <Skeleton variant="rounded" width={100} height={36} />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Informações do Cliente */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={6} key={i}>
                  <Skeleton variant="text" width={80} height={16} />
                  <Skeleton variant="text" width="90%" height={24} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Informações do Lead */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={6} key={i}>
                  <Skeleton variant="text" width={80} height={16} />
                  <Skeleton variant="text" width="90%" height={24} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Carrinho */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="text" width={200} height={28} />
              <Skeleton variant="rounded" width={150} height={36} />
            </Box>
            
            {/* Itens do carrinho */}
            {[1, 2, 3].map((i) => (
              <Box key={i}>
                <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
                  <Skeleton variant="rounded" width={80} height={80} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={20} />
                    <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                      <Skeleton variant="text" width={80} />
                      <Skeleton variant="text" width={80} />
                      <Skeleton variant="text" width={100} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                </Box>
                {i < 3 && <Divider />}
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Totais */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width={100} height={28} sx={{ mb: 2 }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Skeleton variant="text" width={120} />
                <Skeleton variant="text" width={100} />
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton variant="text" width={80} height={32} />
              <Skeleton variant="text" width={120} height={32} />
            </Box>
          </Paper>
        </Grid>

        {/* Impostos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="text" width={140} height={28} />
              <Skeleton variant="rounded" width={150} height={36} />
            </Box>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={80} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default LeadDetailSkeleton
