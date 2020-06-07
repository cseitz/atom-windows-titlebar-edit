'use babel'

import AtomWindowsTitlebarMenu from './atom-windows-titlebar-menu'
import AtomWindowsTitlebarTitle from './atom-windows-titlebar-title'
import AtomWindowsTitlebarFrame from './atom-windows-titlebar-frame'
import { CompositeDisposable } from 'atom'

export default {
  subscriptions: null,

  activate(state) {
    this.atomWindowsTitlebarTitle = new AtomWindowsTitlebarTitle()
    this.atomWindowsTitlebarMenu = new AtomWindowsTitlebarMenu()
    this.atomWindowsTitleBarFrame = new AtomWindowsTitlebarFrame()
  },

  deactivate() {
    this.atomWindowsTitlebarMenu.deactivate()
    this.atomWindowsTitlebarTitle.deactivate()
    this.atomWindowsTitleBarFrame.deactivate()
  }
}
