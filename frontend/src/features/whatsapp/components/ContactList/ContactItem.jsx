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
    Tooltip,
} from '@mui/material'
import {
    Person as PersonIcon,
    Link as LinkIcon,
    Store as StoreIcon,
    Facebook as FacebookIcon,
} from '@mui/icons-material'
import { formatRelativeTime, truncateText } from '../../utils/formatters'
import { whatsappApi } from '../../services/whatsapp.api'

/**
 * Item de contato na lista (memoizado para performance)
 */
const ContactItem = memo(({
    contact,
    selected = false,
    onClick,
}) => {
    const hasLinked = contact.has_linked_customer || contact.linked_customer_id
    // Usar phone_number (da view) ou phone como fallback
    const phoneNumber = contact.phone_number || contact.phone || contact.contact_phone
    const displayName = contact.name || contact.push_name || phoneNumber
    const hasName = contact.name || contact.push_name
    const lastMessage = contact.last_message || contact.last_message_text

    // Detectar se é um Linked ID (LID) - vem de anúncios Facebook/Instagram
    const isLid = whatsappApi.isLinkedId(phoneNumber)

    // Telefone real mapeado (vindo do backend se o LID foi mapeado)
    const mappedPhone = contact.mapped_phone || contact.real_phone || null

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

                {/* Telefone (se tiver nome, mostrar o telefone abaixo) */}
                {hasName && phoneNumber && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        {/* Se for LID com telefone mapeado, mostrar o telefone real */}
                        {isLid && mappedPhone ? (
                            <Tooltip title={`ID original: ${phoneNumber}`} arrow placement="top">
                                <Typography
                                    variant="caption"
                                    color="success.main"
                                    noWrap
                                    sx={{ fontWeight: 500 }}
                                >
                                    📱 {mappedPhone}
                                </Typography>
                            </Tooltip>
                        ) : (
                            <Typography
                                variant="caption"
                                color={isLid ? 'warning.main' : 'text.secondary'}
                                noWrap
                            >
                                📱 {phoneNumber}
                            </Typography>
                        )}
                        {/* Badge LID - indica que veio de anúncio FB/IG */}
                        {isLid && (
                            <Tooltip
                                title={mappedPhone
                                    ? "Contato veio de anúncios FB/IG. Telefone real identificado!"
                                    : "Este contato iniciou a conversa através de anúncios do Facebook/Instagram. O número exibido é um ID temporário."
                                }
                                arrow
                                placement="top"
                            >
                                <Chip
                                    size="small"
                                    icon={<FacebookIcon sx={{ fontSize: '12px !important' }} />}
                                    label={mappedPhone ? "Ads ✓" : "Ads"}
                                    sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        bgcolor: mappedPhone ? '#25D366' : '#1877F2',
                                        color: '#fff',
                                        cursor: 'help',
                                        '& .MuiChip-icon': { color: '#fff' },
                                    }}
                                />
                            </Tooltip>
                        )}
                    </Box>
                )}

                {/* Total de mensagens */}
                {contact.total_messages > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{ flex: 1 }}
                        >
                            {contact.total_messages} msgs • {contact.incoming_messages || 0} ⬇️ • {contact.outgoing_messages || 0} ⬆️
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
                )}

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
