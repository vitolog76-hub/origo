export const colors = {
  primary: '#007aff',
  success: '#34c759',
  danger: '#ff3b30',
  warning: '#ff9500',
  dark: '#1c1c1e',
  gray: '#8e8e93',
  lightGray: '#f5f5f7',
  border: '#d2d2d6'
}

export const styles = {
  container: {
    minHeight: '100vh',
    background: colors.lightGray,
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  } as React.CSSProperties,
  
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginBottom: '16px'
  } as React.CSSProperties,
  
  buttonPrimary: {
    background: colors.primary,
    border: 'none',
    padding: '12px 20px',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    width: '100%'
  } as React.CSSProperties,
  
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    background: 'white',
    fontSize: '15px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const
  } as React.CSSProperties,
  
  label: {
    display: 'block',
    marginBottom: '8px',
    color: colors.dark,
    fontWeight: '500',
    fontSize: '13px'
  } as React.CSSProperties,
  
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: colors.dark,
    marginBottom: '16px'
  } as React.CSSProperties,
  
  slider: {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: colors.border,
    outline: 'none',
    WebkitAppearance: 'none' as const
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