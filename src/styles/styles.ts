export const colors = {
  primary: '#4f46e5',
  secondary: '#0ea5e9',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  dark: '#0f172a',
  gray: '#64748b',
  lightGray: '#e2e8f0',
  surface: 'rgba(255, 255, 255, 0.72)',
  surfaceSoft: 'rgba(255, 255, 255, 0.58)',
  border: 'rgba(255, 255, 255, 0.35)'
}

export const styles = {
  container: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top left, rgba(79, 70, 229, 0.18), transparent 24%), radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 20%), #f8fafc',
    padding: '28px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: colors.dark
  } as React.CSSProperties,
  
  card: {
    background: colors.surface,
    borderRadius: '28px',
    padding: '24px',
    boxShadow: '0 35px 80px rgba(15, 23, 42, 0.08)',
    marginBottom: '18px',
    border: `1px solid ${colors.border}`,
    backdropFilter: 'blur(18px)'
  } as React.CSSProperties,
  
  buttonPrimary: {
    background: 'linear-gradient(90deg, #4f46e5 0%, #0ea5e9 100%)',
    border: 'none',
    padding: '14px 22px',
    borderRadius: '16px',
    color: 'white',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 16px 32px rgba(79, 70, 229, 0.2)'
  } as React.CSSProperties,
  
  buttonSuccess: {
    background: colors.success,
    border: 'none',
    padding: '14px 22px',
    borderRadius: '16px',
    color: 'white',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 12px 24px rgba(16, 185, 129, 0.2)'
  } as React.CSSProperties,
  
  input: {
    width: '100%',
    padding: '14px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    background: 'rgba(255, 255, 255, 0.82)',
    fontSize: '15px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    color: colors.dark,
    backdropFilter: 'blur(10px)'
  } as React.CSSProperties,
  
  label: {
    display: 'block',
    marginBottom: '10px',
    color: colors.dark,
    fontWeight: 600,
    fontSize: '13px'
  } as React.CSSProperties,
  
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: colors.dark,
    marginBottom: '18px'
  } as React.CSSProperties,
  
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '999px',
    background: 'rgba(79, 70, 229, 0.16)',
    outline: 'none',
    WebkitAppearance: 'none' as const
  } as React.CSSProperties,
  
  tab: {
    padding: '14px 18px',
    borderRadius: '999px',
    border: `1px solid rgba(255, 255, 255, 0.4)`,
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(12px)'
  } as React.CSSProperties,
  
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  } as React.CSSProperties,
  
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  } as React.CSSProperties
}