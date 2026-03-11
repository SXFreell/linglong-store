import { createContext, useContext, useEffect, useRef } from 'react'

interface KeepAliveVisibilityContextValue {
  isVisible: boolean
  pathname: string | null
}

const defaultContextValue: KeepAliveVisibilityContextValue = {
  isVisible: true,
  pathname: null,
}

export const KeepAliveVisibilityContext = createContext<KeepAliveVisibilityContextValue>(
  defaultContextValue,
)

export const useKeepAliveVisibility = () => {
  const context = useContext(KeepAliveVisibilityContext)
  const isVisibleRef = useRef(context.isVisible)

  useEffect(() => {
    isVisibleRef.current = context.isVisible
  }, [context.isVisible])

  return {
    ...context,
    isVisibleRef,
  }
}
