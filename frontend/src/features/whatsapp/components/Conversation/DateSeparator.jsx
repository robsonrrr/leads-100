/**
 * WhatsApp v2.0 - DateSeparator Component
 * Separador de data entre mensagens
 */

import React, { memo } from 'react'
import { Box, Chip } from '@mui/material'
import { formatDateSeparator } from '../../utils/formatters'

/**
 * Separador de data no chat (memoizado)
 */
const DateSeparator = memo(({ date }) => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            my: 2,
        }}
    >
        <Chip
            size="small"
            label={formatDateSeparator(date)}
            sx={{
                bgcolor: 'rgba(225, 245, 254, 0.9)',
                fontWeight: 500,
                textTransform: 'capitalize',
                fontSize: '0.75rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
        />
    </Box>
))

DateSeparator.displayName = 'DateSeparator'

export default DateSeparator
