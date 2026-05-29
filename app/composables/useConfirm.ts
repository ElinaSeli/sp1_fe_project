import ConfirmDialog from '~/components/app/ConfirmDialog.vue'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: 'error' | 'primary' | 'neutral' | 'warning' | 'success'
  icon?: string
}

export function useConfirm() {
  const overlay = useOverlay()

  return async (opts: ConfirmOptions): Promise<boolean> => {
    const modal = overlay.create(ConfirmDialog, { props: opts })
    const instance = modal.open()
    const result = await instance.result
    return result === true
  }
}
