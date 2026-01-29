/**
 * AISuggestions Component
 * 
 * Componente para exibir e selecionar sugestões de mensagens geradas por IA
 * 
 * @version 1.0
 * @date 2026-01-24
 */

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Chip,
    Button,
    IconButton,
    Tooltip,
    CircularProgress,
    Collapse,
    Alert,
    Paper,
    Divider,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Skeleton
} from '@mui/material';
import {
    AutoAwesome as AIIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    ContentCopy as CopyIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Lightbulb as TipIcon
} from '@mui/icons-material';
import { useAISuggestions } from '../../hooks/useAISuggestions';

// Estilos
const styles = {
    container: {
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        backgroundColor: 'action.hover',
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: 'action.selected'
        }
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 1
    },
    content: {
        p: 2
    },
    intentSelector: {
        mb: 2,
        display: 'flex',
        gap: 0.5,
        flexWrap: 'wrap'
    },
    suggestionCard: {
        p: 1.5,
        mb: 1,
        borderRadius: 2,
        backgroundColor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: 'primary.light',
            borderColor: 'primary.main',
            transform: 'translateY(-1px)',
            boxShadow: 1
        },
        '&:last-child': {
            mb: 0
        }
    },
    suggestionText: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        color: 'text.primary',
        mb: 0.5
    },
    suggestionMeta: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mt: 1
    },
    confidenceBadge: {
        fontSize: '0.7rem',
        px: 1,
        py: 0.25,
        borderRadius: 1
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 4,
        gap: 2
    },
    emptyState: {
        textAlign: 'center',
        py: 3,
        color: 'text.secondary'
    },
    aiGradient: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    }
};

/**
 * Componente de sugestões de IA
 */
export function AISuggestions({
    phone = null,
    leadId = null,
    customerId = null,
    onSelect = () => { },
    onCopy = () => { },
    autoLoad = false,
    showIntentFilter = true,
    compact = false,
    collapsible = true,
    defaultExpanded = true,
    maxSuggestions = 4
}) {
    // State local
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [copiedId, setCopiedId] = useState(null);

    // Hook de sugestões
    const {
        suggestions,
        loading,
        error,
        intent,
        intents,
        generateSuggestions,
        regenerateWithIntent,
        clearSuggestions,
        selectSuggestion,
        setIntent,
        hasSuggestions,
        hasContext
    } = useAISuggestions({
        phone,
        leadId,
        customerId,
        autoLoad
    });

    // Filtrar sugestões por limite
    const displaySuggestions = useMemo(() => {
        return suggestions.slice(0, maxSuggestions);
    }, [suggestions, maxSuggestions]);

    // Handlers
    const handleToggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handleSelectSuggestion = (suggestion) => {
        const text = selectSuggestion(suggestion);
        onSelect(text, suggestion);
    };

    const handleCopySuggestion = async (suggestion, e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(suggestion.text);
            setCopiedId(suggestion.id);
            onCopy(suggestion.text, suggestion);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleIntentChange = (event, newIntent) => {
        if (newIntent !== null) {
            regenerateWithIntent(newIntent);
        }
    };

    const handleRefresh = () => {
        generateSuggestions({ intent });
    };

    const handleGenerate = () => {
        generateSuggestions();
    };

    // Renderizar badge de confidence
    const renderConfidenceBadge = (confidence) => {
        const percent = Math.round(confidence * 100);
        const color = percent >= 80 ? 'success' : percent >= 60 ? 'warning' : 'default';
        return (
            <Chip
                label={`${percent}%`}
                size="small"
                color={color}
                variant="outlined"
                sx={styles.confidenceBadge}
            />
        );
    };

    // Renderizar header
    const renderHeader = () => (
        <Box
            sx={styles.header}
            onClick={collapsible ? handleToggleExpand : undefined}
        >
            <Box sx={styles.headerTitle}>
                <AIIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={600} sx={styles.aiGradient}>
                    Sugestões de IA
                </Typography>
                {hasSuggestions && (
                    <Chip
                        label={suggestions.length}
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {hasSuggestions && (
                    <Tooltip title="Atualizar sugestões">
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
                            disabled={loading}
                        >
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                {collapsible && (
                    <IconButton size="small">
                        {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                    </IconButton>
                )}
            </Box>
        </Box>
    );

    // Renderizar seletor de intent
    const renderIntentSelector = () => {
        if (!showIntentFilter || intents.length === 0) return null;

        return (
            <Box sx={styles.intentSelector}>
                <ToggleButtonGroup
                    value={intent}
                    exclusive
                    onChange={handleIntentChange}
                    size="small"
                    sx={{ flexWrap: 'wrap', gap: 0.5 }}
                >
                    {intents.map((i) => (
                        <ToggleButton
                            key={i.id}
                            value={i.id}
                            sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '16px !important',
                                border: '1px solid',
                                borderColor: 'divider',
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.light',
                                    borderColor: 'primary.main'
                                }
                            }}
                        >
                            <Tooltip title={i.description}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <span>{i.icon}</span>
                                    {!compact && (
                                        <Typography variant="caption">
                                            {i.label}
                                        </Typography>
                                    )}
                                </Box>
                            </Tooltip>
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>
        );
    };

    // Renderizar loading
    const renderLoading = () => (
        <Box sx={styles.loadingContainer}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
                Gerando sugestões inteligentes...
            </Typography>
            <Stack spacing={1} sx={{ width: '100%' }}>
                <Skeleton variant="rounded" height={60} />
                <Skeleton variant="rounded" height={60} />
            </Stack>
        </Box>
    );

    // Renderizar erro
    const renderError = () => (
        <Alert
            severity="warning"
            action={
                <Button color="inherit" size="small" onClick={handleGenerate}>
                    Tentar novamente
                </Button>
            }
            sx={{ mb: 2 }}
        >
            {error}
        </Alert>
    );

    // Renderizar estado vazio
    const renderEmpty = () => (
        <Box sx={styles.emptyState}>
            <TipIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {hasContext
                    ? 'Clique para gerar sugestões personalizadas'
                    : 'Selecione um lead ou cliente para gerar sugestões'}
            </Typography>
            {hasContext && (
                <Button
                    variant="contained"
                    startIcon={<AIIcon />}
                    onClick={handleGenerate}
                    sx={{ mt: 1 }}
                    size="small"
                >
                    Gerar Sugestões
                </Button>
            )}
        </Box>
    );

    // Renderizar sugestões
    const renderSuggestions = () => (
        <Stack spacing={1}>
            {displaySuggestions.map((suggestion) => (
                <Paper
                    key={suggestion.id}
                    sx={styles.suggestionCard}
                    elevation={0}
                    onClick={() => handleSelectSuggestion(suggestion)}
                >
                    <Typography sx={styles.suggestionText}>
                        {suggestion.text}
                    </Typography>
                    <Box sx={styles.suggestionMeta}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                label={suggestion.shortLabel || suggestion.intent}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            {renderConfidenceBadge(suggestion.confidence)}
                        </Box>
                        <Tooltip title={copiedId === suggestion.id ? 'Copiado!' : 'Copiar'}>
                            <IconButton
                                size="small"
                                onClick={(e) => handleCopySuggestion(suggestion, e)}
                            >
                                {copiedId === suggestion.id ? (
                                    <CheckIcon fontSize="small" color="success" />
                                ) : (
                                    <CopyIcon fontSize="small" />
                                )}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Paper>
            ))}
        </Stack>
    );

    // Renderizar conteúdo
    const renderContent = () => (
        <Box sx={styles.content}>
            {renderIntentSelector()}
            {error && renderError()}
            {loading && renderLoading()}
            {!loading && !error && !hasSuggestions && renderEmpty()}
            {!loading && hasSuggestions && renderSuggestions()}
        </Box>
    );

    return (
        <Box sx={styles.container}>
            {renderHeader()}
            {collapsible ? (
                <Collapse in={isExpanded}>
                    {renderContent()}
                </Collapse>
            ) : (
                renderContent()
            )}
        </Box>
    );
}

/**
 * Componente compacto para uso inline
 */
export function AISuggestionsInline({
    phone,
    leadId,
    customerId,
    onSelect,
    maxSuggestions = 3
}) {
    return (
        <AISuggestions
            phone={phone}
            leadId={leadId}
            customerId={customerId}
            onSelect={onSelect}
            compact
            collapsible={false}
            showIntentFilter={false}
            maxSuggestions={maxSuggestions}
        />
    );
}

/**
 * Botão de sugestões rápidas
 */
export function QuickSuggestionButton({
    phone,
    leadId,
    customerId,
    onSelect,
    children = 'Sugestões IA'
}) {
    const [open, setOpen] = useState(false);
    const { generateSuggestions, suggestions, loading } = useAISuggestions({
        phone,
        leadId,
        customerId
    });

    const handleClick = async () => {
        if (suggestions.length === 0) {
            await generateSuggestions();
        }
        setOpen(!open);
    };

    return (
        <Box sx={{ position: 'relative' }}>
            <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={16} /> : <AIIcon />}
                onClick={handleClick}
                disabled={loading}
                size="small"
            >
                {children}
            </Button>
            <Collapse in={open && suggestions.length > 0}>
                <Paper
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        p: 1,
                        zIndex: 1000,
                        maxHeight: 300,
                        overflow: 'auto'
                    }}
                >
                    {suggestions.slice(0, 3).map((s) => (
                        <Button
                            key={s.id}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', mb: 0.5 }}
                            onClick={() => {
                                onSelect(s.text, s);
                                setOpen(false);
                            }}
                        >
                            <Typography variant="caption" noWrap>
                                {s.shortLabel}
                            </Typography>
                        </Button>
                    ))}
                </Paper>
            </Collapse>
        </Box>
    );
}

export default AISuggestions;
