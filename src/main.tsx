import React from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeProvider,createTheme,CssBaseline} from '@mui/material';
import App from './App';
const theme=createTheme({palette:{primary:{main:'#cf1d2a',dark:'#aa1722'},secondary:{main:'#142d50'},background:{default:'#f3f5f8'},text:{primary:'#142d50',secondary:'#586980'},divider:'#e1e7ef'},typography:{fontFamily:'Inter, Segoe UI, sans-serif',h4:{fontWeight:800,letterSpacing:'-.8px'},h6:{fontWeight:700}},shape:{borderRadius:12},components:{MuiButton:{styleOverrides:{root:{textTransform:'none',fontWeight:650}}},MuiPaper:{defaultProps:{elevation:0},styleOverrides:{root:{border:'1px solid #e1e7ef',boxShadow:'0 3px 14px #142d5006'}}},MuiTableHead:{styleOverrides:{root:{background:'#f3f6fa'}}},MuiTableCell:{styleOverrides:{head:{fontWeight:750,color:'#142d50'}}}}});
createRoot(document.getElementById('root')!).render(<React.StrictMode><ThemeProvider theme={theme}><CssBaseline/><App/></ThemeProvider></React.StrictMode>);
