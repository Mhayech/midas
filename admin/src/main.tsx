import React from 'react'
import ReactDOM from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ToastContainer } from 'react-toastify'

import { frFR as corefrFR, enUS as coreenUS, esES as coresES } from '@mui/material/locale'
import { frFR, enUS, esES } from '@mui/x-date-pickers/locales'
import { frFR as dataGridfrFR, enUS as dataGridenUS, esES as dataGridesEs } from '@mui/x-data-grid/locales'
import { disableDevTools } from ':disable-react-devtools'
import * as helper from '@/utils/helper'
import * as UserService from '@/services/UserService'
import { strings as commonStrings } from '@/lang/common'
import env from '@/config/env.config'
import App from '@/App'

import '@/assets/css/common.css'
import '@/assets/css/index.css'
import '@/assets/css/enhanced-theme.css'


if (import.meta.env.VITE_NODE_ENV === 'production') {
  disableDevTools()
}

let language = env.DEFAULT_LANGUAGE
const user = JSON.parse(localStorage.getItem('bc-be-user') ?? 'null')
let lang = UserService.getQueryLanguage()

if (lang) {
  if (!env.LANGUAGES.includes(lang)) {
    lang = localStorage.getItem('bc-be-language')

    if (lang && !env.LANGUAGES.includes(lang)) {
      lang = env.DEFAULT_LANGUAGE
    }
  }

  try {
    if (user) {
      language = user.language
      if (lang && lang.length === 2 && user.language !== lang) {
        const data = {
          id: user.id,
          language: lang,
        }

        const status = await UserService.validateAccessToken()

        if (status === 200) {
          const _status = await UserService.updateLanguage(data)
          if (_status !== 200) {
            helper.error(null, commonStrings.CHANGE_LANGUAGE_ERROR)
          }
        }

        language = lang
      }
    } else if (lang) {
      language = lang
    }
    UserService.setLanguage(language)
    commonStrings.setLanguage(language)
  } catch (err) {
    helper.error(err, commonStrings.CHANGE_LANGUAGE_ERROR)
  }
}

language = UserService.getLanguage()
const isFr = language === 'fr'
const isEs = language === 'es'

const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#2F5233',
        light: '#4A7C4E',
        dark: '#1E3522',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#D4AF37',
        light: '#E8D085',
        dark: '#B8941F',
        contrastText: '#000000',
      },
      background: {
        default: '#f5f7fa',
        paper: '#ffffff',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 0 0 1px rgba(0,0,0,.05),0 2px 4px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 4px 8px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 8px 16px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 16px 32px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 24px 48px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 32px 64px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 40px 80px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 48px 96px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 56px 112px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 64px 128px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 72px 144px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 80px 160px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 88px 176px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 96px 192px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 104px 208px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 112px 224px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 120px 240px rgba(0,0,0,.1)',
      '0 0 0 1px rgba(0,0,0,.05),0 128px 256px rgba(0,0,0,.1)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#f5f7fa',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px',
            padding: '10px 24px',
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
          },
          elevation1: {
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          },
          elevation2: {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
          elevation3: {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
  },
  isFr ? frFR : isEs ? esES : enUS,
  isFr ? dataGridfrFR : isEs ? dataGridesEs : dataGridenUS,
  isFr ? corefrFR : isEs ? coresES : coreenUS,
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
    <CssBaseline>
      <App />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover
        theme="dark"
      />
    </CssBaseline>
  </ThemeProvider>,
)
