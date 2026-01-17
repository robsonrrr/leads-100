import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'

/**
 * Skeleton loader para a página de Dashboard
 * Mostra um preview da estrutura enquanto os dados carregam
 */
function DashboardSkeleton({ rows = 10 }) {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={120} height={40} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rounded" width={200} height={40} />
          <Skeleton variant="rounded" width={120} height={40} />
        </Box>
      </Box>

      {/* Promoções Skeleton */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'hidden' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton 
              key={i} 
              variant="rounded" 
              width={280} 
              height={80} 
              sx={{ flexShrink: 0 }}
            />
          ))}
        </Box>
      </Paper>

      {/* Tabela */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Skeleton variant="text" width={30} /></TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="text" width={60} /></TableCell>
                <TableCell><Skeleton variant="text" width={70} /></TableCell>
                <TableCell align="right"><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="text" width={60} /></TableCell>
                <TableCell align="right"><Skeleton variant="text" width={60} /></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: rows }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton variant="text" width={50} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rounded" width={60} height={24} />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton variant="text" width={90} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={60} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rounded" width={50} height={24} />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Paginação */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, gap: 2 }}>
          <Skeleton variant="text" width={120} />
          <Skeleton variant="rounded" width={100} height={32} />
          <Skeleton variant="text" width={80} />
        </Box>
      </Paper>
    </Box>
  )
}

export default DashboardSkeleton
