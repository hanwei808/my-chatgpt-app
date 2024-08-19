import React, { useState, useEffect } from 'react'
import {
  Avatar,
  TextField,
  Button,
  List,
  ListItem,
  Paper,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ChatGPTIcon from '../assets/favicon.ico'
import LoadingIcon from '../assets/three-dots.svg'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState<string>('')
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [apiKey, setApiKey] = useState<string>('')
  const [openDialog, setOpenDialog] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey')
    if (storedApiKey) {
      setApiKey(storedApiKey)
    }
    setChatHistory([{ role: 'assistant', content: '有什么我可以帮你的吗？' }])
  }, [])

  const handleSaveApiKey = () => {
    localStorage.setItem('apiKey', apiKey)
    setOpenDialog(false)
  }

  const handleSendMessage = async () => {
    if (message.trim() === '') return

    const newMessage: Message = { role: 'user', content: message }
    setChatHistory([...chatHistory, newMessage])
    setMessage('')

    try {
      setLoading(true)
      await fetchAIResponse([...chatHistory, newMessage])
    } catch (error) {
      console.error('Error fetching AI response:', error)
      setError('请求失败，请稍后再试。')
    } finally {
      setLoading(false)
    }
  }

  const fetchAIResponse = async (messages: Message[]): Promise<void> => {
    if (!apiKey) {
      console.error('API key is required')
      return
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        stream: true
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = errorData.error?.message || '请求失败，请稍后再试。'
      const assistantMessage: Message = {
        role: 'assistant',
        content: errorMessage
      }
      setChatHistory((prevHistory) => [...prevHistory, assistantMessage])
      return
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder('utf-8')
    let done = false
    const assistantMessage: Message = { role: 'assistant', content: '' }
    setLoading(false)

    while (!done) {
      const { value, done: doneReading } = await reader!.read()
      done = doneReading
      const chunkValue = decoder.decode(value, { stream: true })

      const dataChunks = chunkValue
        .split('\n')
        .filter((line) => line.trim() !== '')
      for (const chunk of dataChunks) {
        if (chunk === 'data: [DONE]') continue

        const json = JSON.parse(chunk.slice(5))
        const deltaContent = json.choices[0].delta.content
        if (deltaContent) {
          assistantMessage.content += deltaContent
          setChatHistory((prevHistory) => {
            const newHistory = [...prevHistory]
            if (newHistory[newHistory.length - 1]?.role === 'assistant') {
              newHistory[newHistory.length - 1] = assistantMessage
            } else {
              newHistory.push(assistantMessage)
            }
            return newHistory
          })
        }
      }
    }
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="calc(100vh - 32px)"
      sx={{
        width: 'calc(100vw - 32px)',
        paddingLeft: '16px',
        paddingRight: '16px'
      }}
    >
      <Paper
        sx={{
          flex: 1,
          overflow: 'auto',
          mb: 2,
          p: 2
        }}
      >
        <List>
          {chatHistory.map((msg, index) => (
            <ListItem
              key={index}
              sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Avatar
                  sx={{
                    mr: 1,
                    bgcolor: msg.role === 'user' ? '#FE9900' : '#0fA37F'
                  }}
                >
                  {msg.role === 'user' ? (
                    'U'
                  ) : (
                    <img
                      src={ChatGPTIcon}
                      alt="favicon"
                      style={{ width: '60%', height: '60%' }}
                    />
                  )}
                </Avatar>
                <strong>{msg.role === 'user' ? 'You' : 'ChatGPT'}</strong>
              </Box>
              <Paper sx={{ p: 1, width: '100%' }} elevation={0}>
                {msg.content}
              </Paper>
            </ListItem>
          ))}
          {loading && (
            <ListItem
              sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Avatar sx={{ mr: 1, bgcolor: '#0fA37F' }}>
                  <img
                    src={ChatGPTIcon}
                    alt="favicon"
                    style={{ width: '60%', height: '60%' }}
                  />
                </Avatar>
              </Box>
              <Paper sx={{ p: 1, width: '100%' }} elevation={0}>
                <img
                  src={LoadingIcon}
                  alt="loading"
                  style={{ width: '24px', height: '24px' }}
                />
              </Paper>
            </ListItem>
          )}
        </List>
      </Paper>
      <Box display="flex" alignItems="center">
        <TextField
          label="Message ChatGPT"
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={loading}
          InputProps={{
            style: { borderRadius: 20 },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={loading || message.trim() === ''}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>输入 API Key</DialogTitle>
        <DialogContent>
          <DialogContentText>
            请输入您的 OpenAI API key 继续使用。
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="API Key"
            type="password"
            fullWidth
            variant="standard"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleSaveApiKey}
            color="primary"
            disabled={!apiKey.trim()}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ChatInterface
