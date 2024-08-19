import React from 'react'
import ChatInterface from './components/ChatInterface'
import { Container } from '@mui/material'

const App: React.FC = () => {
  return (
    <Container disableGutters>
      <ChatInterface />
    </Container>
  )
}

export default App
