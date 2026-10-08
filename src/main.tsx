import React from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeProvider,createTheme,CssBaseline} from '@mui/material';
import App from './App';
const theme=createTheme({palette:{primary:{main:'#173f36'},secondary:{main:'#b9e267'},background:{default:'#f4f5f0'}},typography:{fontFamily:'Inter, Segoe UI, sans-serif',h4:{fontWeight:750},h6:{fontWeight:700}},shape:{borderRadius:14},components:{MuiButton:{styleOverrides:{root:{textTransform:'none',fontWeight:650}}},MuiPaper:{defaultProps:{elevation:0}}}});
createRoot(document.getElementById('root')!).render(<React.StrictMode><ThemeProvider theme={theme}><CssBaseline/><App/></ThemeProvider></React.StrictMode>);
