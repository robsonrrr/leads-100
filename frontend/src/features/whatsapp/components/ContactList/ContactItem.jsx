/**
 * WhatsApp v2.0 - ContactItem Component
 * Item individual de contato na lista
 */

import React, { memo } from 'react'
import {
    Box,
    Avatar,
    Typography,
    Badge,
    Chip,
} from '@mui/material'
import {
    Person as PersonIcon,
    Link as LinkIcon,
    Store as StoreIcon,
} from '@mui/icons-material'
import { formatRelativeTime, truncateText } from '../../utils/formatters'

/**
 * Item de contato na lista (memoizado para performance)
 */
const ContactItem = memo(({
    contact,
    selected = false,
    onClick,
}) => {
    const hasLinked = contact.has_linked_customer || contact.linked_customer_id
    const displayName = contact.name || contact.push_name || contact.phone
    const lastMessage = contact.last_message || contact.last_message_text

    return (
        <Box
            onClick={() => onClick(contact)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                cursor: 'pointer',
                bgcolor: selected ? 'rgba(37, 211, 102, 0.1)' : 'transparent',
                borderLeft: selected ? '4px solid #25D366' : '4px solid transparent',
                borderBottom: '1px solid #f0f0f0',
                transition: 'all 0.15s ease',
                '&:hover': {
                    bgcolor: selected ? 'rgba(37, 211, 102, 0.15)' : 'rgba(0, 0, 0, 0.04)',
                },
            }}
        >
            {/* Avatar */}
            <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                    hasLinked ? (
                        <Box
                            sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                bgcolor: '#4CAF50',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #fff',
                            }}
                        >
                            <LinkIcon sx={{ fontSize: 8, color: '#fff' }} />
                        </Box>
                    ) : null
                }
            >
                <Avatar
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: hasLinked ? '#25D366' : '#bdbdbd',
                        fontSize: '1.1rem',
                    }}
                    src={contact.profile_picture || contact.avatar}
                >
                    {displayName?.charAt(0)?.toUpperCase() || <PersonIcon />}
                </Avatar>
            </Badge>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Nome e tempo */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                        variant="subtitle2"
                        fontWeight={selected ? 'bold' : 'medium'}
                        noWrap
                        sx={{ maxWidth: '70%' }}
                    >
                        {displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {formatRelativeTime(contact.last_contact_at || contact.last_message_at)}
                    </Typography>
                </Box>

                {/* Última mensagem ou telefone */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ flex: 1 }}
                    >
                        {lastMessage ? truncateText(lastMessage, 40) : contact.phone}
                    </Typography>

                    {/* Badge de mensagens não lidas */}
                    {contact.unread_count > 0 && (
                        <Chip
                            size="small"
                            label={contact.unread_count}
                            sx={{
                                height: 20,
                                minWidth: 20,
                                bgcolor: '#25D366',
                                color: '#fff',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                            }}
                        />
                    )}
                </Box>

                {/* Tags/Info adicional */}
                {(contact.company_name || contact.seller_name) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <StoreIcon sx={{ fontSize: 12, color: '#9e9e9e' }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {contact.company_name || contact.seller_name}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    )
})

ContactItem.displayName = 'ContactItem'

export default ContactItem
