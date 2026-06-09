"use client"

import { useState } from 'react'
import { AuthModal } from './AuthModal'

export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const AuthModalComponent = () => (
    <AuthModal isOpen={isOpen} onClose={closeModal} />
  )

  return {
    openModal,
    closeModal,
    AuthModalComponent,
    isOpen
  }
}
