import * as React from 'react'

import { Modal, BaseModalProps } from './modal'
import { Drawer, DrawerProps } from './drawer'
import { ConfirmDialog, ConfirmDialogProps } from './dialog'
import { MenuDialog, MenuDialogProps } from './menu'
import { FormDialog } from './form'

export interface ModalsContextValue {
  open?: (options: OpenOptions) => ModalId
  drawer?: (options: ModalOptions) => ModalId
  alert?: (options: ModalOptions) => ModalId
  confirm?: (options: ModalOptions) => ModalId
  menu?: (options: ModalOptions) => ModalId
  form?: (options: ModalOptions) => ModalId
  close?: (id: ModalId) => void
  closeAll?: () => void
}

export const ModalsContext = React.createContext<ModalsContextValue>({})

interface ModalsProviderProps {
  children: React.ReactNode
  modals?: Record<string, React.FC<any>>
}

export type ModalId = string | number

interface ModalOptions
  extends Omit<
    (BaseModalProps & DrawerProps & ConfirmDialogProps) & {
      body?: React.ReactNode
    },
    'onClose' | 'isOpen' | 'children'
  > {
  onClose?: (args: { force?: boolean }) => Promise<boolean | undefined> | void
  children?: React.ReactNode
}

export interface OpenOptions extends ModalOptions {
  type?: ModalTypes | string
  scope?: ModalScopes
}

export type ModalScopes = 'modal' | 'alert'

export type ModalTypes = 'modal' | 'drawer' | 'alert' | 'confirm' | 'menu'

export interface ModalConfig {
  /**
   * The modal id, autogenerated when not set.
   * Can be used to close modals.
   */
  id?: ModalId | null
  /**
   * The modal props
   */
  props?: ModalOptions | null
  /**
   * The modal scope
   * Modals can only have one level per scope.
   * The default scopes are 'modal' and 'alert', alerts can be openend above modals.
   */
  scope?: ModalScopes | string
  /**
   * The modal type to open.
   * Build in types are 'modal', 'drawer', 'alert', 'confirm'
   *
   * Custom types can be configured using the `modals` prop of `ModalProvider`
   */
  type?: ModalTypes | string
}

const initialModalState: ModalConfig = {
  id: null,
  props: null,
  type: 'modal',
}

const defaultModals = {
  alert: ConfirmDialog,
  confirm: ConfirmDialog,
  drawer: Drawer,
  modal: Modal,
  menu: MenuDialog,
  form: FormDialog,
}

export function ModalsProvider({ children, modals }: ModalsProviderProps) {
  // Note that updating the Set doesn't trigger a re-render,
  // use in conjuction with setActiveModals
  const _instances = React.useMemo(() => new Set<ModalConfig>(), [])

  const [activeModals, setActiveModals] = React.useState<
    Record<string, ModalConfig>
  >({
    modal: initialModalState,
  })

  const getModalComponent = React.useMemo(() => {
    const _modals = {
      ...defaultModals,
      ...modals,
    }

    return (type = 'modal') => {
      const component = _modals[type] || _modals.modal

      return component
    }
  }, [modals])

  const setActiveModal = (modal: ModalConfig, scope?: string) => {
    if (!scope) {
      return setActiveModals({
        modal,
      })
    }
    setActiveModals((prevState) => ({
      ...prevState,
      [scope]: modal,
    }))
  }

  const open = (options: OpenOptions): ModalId => {
    const {
      id = _instances.size + 1,
      type = 'modal',
      scope = 'modal',
      ...props
    } = options

    const modal: ModalConfig = {
      id,
      props: {
        ...props,
        children: props.body || props.children,
      },
      type,
      scope,
    }

    _instances.add(modal)
    setActiveModal(modal, scope)

    return id
  }

  const drawer = (options: ModalOptions): ModalId => {
    return open({
      ...options,
      type: 'drawer',
    })
  }

  const alert = (options: ModalOptions): ModalId => {
    return open({
      ...options,
      scope: 'alert',
      type: 'alert',
      cancelProps: {
        display: 'none',
      },
      confirmProps: {
        label: 'OK',
      },
      leastDestructiveFocus: 'confirm',
    })
  }

  const confirm = (options: ModalOptions): ModalId => {
    return open({
      ...options,
      scope: 'alert',
      type: 'confirm',
    })
  }

  const menu = (options: ModalOptions): ModalId => {
    return open({
      ...options,
      type: 'menu',
    })
  }

  const form = (options: ModalOptions): ModalId => {
    return open({
      ...options,
      type: 'form',
    })
  }

  const close = async (id?: ModalId | null, force?: boolean) => {
    const modals = [..._instances]
    const modal = modals.filter((modal) => modal.id === id)[0]

    if (!modal) {
      return
    }

    const shouldClose = await modal.props?.onClose?.({ force })
    if (shouldClose === false) {
      return
    }

    _instances.delete(modal)

    const scoped = modals.filter(({ scope }) => scope === modal.scope)

    setActiveModal(
      scoped[scoped.length - 2] || {
        id: null,
        props: null,
        type: modal.type, // Keep type same as last modal type to make sure the animation isn't interrupted
      },
      modal.scope
    )
  }

  const closeAll = () => {
    _instances.forEach((modal) => modal.props?.onClose?.({ force: true }))
    _instances.clear()

    setActiveModal(initialModalState)
  }

  const context = {
    open,
    drawer,
    alert,
    confirm,
    menu,
    form,
    close,
    closeAll,
  }

  const content = Object.entries(activeModals).map(([scope, config]) => {
    const Component = getModalComponent(config.type)

    const { title, children, ...props } = config.props || {}

    return (
      <Component
        key={scope}
        title={title}
        children={children}
        {...props}
        isOpen={!!(config.id && _instances.size)}
        onClose={() => close(config.id)}
      />
    )
  })

  return (
    <ModalsContext.Provider value={context}>
      {content}
      {children}
    </ModalsContext.Provider>
  )
}

export const useModalsContext = (): ModalsContextValue =>
  React.useContext(ModalsContext)

export const useModals = () => {
  return useModalsContext()
}
