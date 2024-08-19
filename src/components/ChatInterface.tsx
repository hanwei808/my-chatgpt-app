import React, { useState, useEffect, useCallback } from 'react'
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

// 定义消息的接口，包含角色和内容
interface Message {
  role: 'user' | 'assistant'
  content: string
}

const ChatInterface: React.FC = () => {
  // 定义组件状态
  const [message, setMessage] = useState('') // 当前消息
  const [chatHistory, setChatHistory] = useState<Message[]>([]) // 聊天记录
  const [loading, setLoading] = useState(false) // 加载状态
  const [apiKey, setApiKey] = useState('') // API Key
  const [openDialog, setOpenDialog] = useState(true) // 控制API Key输入对话框的显示
  const [error, setError] = useState<string | null>(null) // 错误信息

  useEffect(() => {
    // 从localStorage中获取API Key
    const storedApiKey = localStorage.getItem('apiKey')
    if (storedApiKey) {
      setApiKey(storedApiKey)
    }
    // 初始化聊天记录
    setChatHistory([{ role: 'assistant', content: '有什么我可以帮你的吗？' }])
  }, [])

  // 保存API Key到localStorage并关闭对话框
  const handleSaveApiKey = useCallback(() => {
    localStorage.setItem('apiKey', apiKey)
    setOpenDialog(false)
  }, [apiKey])

  // 发送消息的处理函数
  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return

    const newMessage: Message = { role: 'user', content: message }
    // 更新聊天记录
    setChatHistory((prev) => [...prev, newMessage])
    setMessage('')

    try {
      setLoading(true)
      await fetchAIResponse([...chatHistory, newMessage])
    } catch (error) {
      console.error('Error fetching AI response:', error)
      setError('请求失败，请稍后再试。')
    } finally {
      setLoading(false) // 加载完成
    }
  }, [message, chatHistory])

  // 获取OpenAI的回复
  const fetchAIResponse = useCallback(
    async (messages: Message[]) => {
      if (!apiKey) {
        console.error('API key is required')
        return
      }

      // 发送请求到OpenAI的API, 使用stream模式
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
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
        }
      )

      // 处理错误响应
      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage =
          errorData.error?.message || '请求失败，请稍后再试。'
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { role: 'assistant', content: errorMessage }
        ])
        return
      }

      // 从响应中读取数据
      const reader = response.body?.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false
      const assistantMessage: Message = { role: 'assistant', content: '' }
      setLoading(false)

      while (!done) {
        const { value, done: doneReading } = await reader!.read()
        done = doneReading
        const chunkValue = decoder.decode(value, { stream: true })

        // 将数据分块处理
        const dataChunks = chunkValue
          .split('\n')
          .filter((line) => line.trim() !== '')
        for (const chunk of dataChunks) {
          if (chunk === 'data: [DONE]') continue

          const json = JSON.parse(chunk.slice(5))
          const deltaContent = json.choices[0].delta.content
          if (deltaContent) {
            // 更新助手消息
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
    },
    [apiKey]
  )

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
      <Paper sx={{ flex: 1, overflow: 'auto', mb: 2, p: 2 }}>
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
                <strong>ChatGPT</strong>
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
                  disabled={loading || !message.trim()}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      <Dialog open={openDialog} onClose={() => {}}>
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
