import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Theme = 'light' | 'dark' | 'auto'

interface UIStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void
  
  shareSheetHadithId: string | null
  openShareSheet: (hadithId: string) => void
  closeShareSheet: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'auto',
      setTheme: (theme) => set({ theme }),
      
      activeModal: null,
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
      
      shareSheetHadithId: null,
      openShareSheet: (hadithId) => set({ shareSheetHadithId: hadithId }),
      closeShareSheet: () => set({ shareSheetHadithId: null }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    }
  )
)
