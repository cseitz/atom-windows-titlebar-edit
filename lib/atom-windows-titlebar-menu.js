'use babel'

export default class AtomWindowsTitlebarMenu {

  constructor(parent) {
    // Build The Menus
    this.parent = parent;
    this.buildSubMenuHTML = this.parent.atomWindowsTitlebarTitle.buildSubMenuHTML;
    this.parent.atomWindowsTitlebarTitle.filterMenus = this.filterMenus;
    this.packages = [];
    let this_ = this;
    let tmout;
    let refresher = function(n = 1000) {
      if (tmout) {
        clearTimeout(tmout);
      }
      tmout = setTimeout(function() {
        tmout = false;
        this_.refresh();
      }, n)
    }
    atom.config.onDidChange('atom-windows-titlebar-edit.packages', ({ newValue, oldValue }) => {
      refresher();
    })
    atom.config.onDidChange('atom-windows-titlebar-edit.packages2', ({ newValue, oldValue }) => {
      refresher();
    })
    atom.config.onDidChange('atom-windows-titlebar-edit.hides', ({ newValue, oldValue }) => {
      refresher();
    })
    //console.log("PACKAGES:", atom.config.get('atom-windows-titlebar-edit.packages').split(',').map(o => o.trim()))
    //this.buildTheMenuHTML()
    // Listen for events
    //setTimeout(() => { this.listenForMenuEvents() }, 0)
    //this.altkeyoverride()
    //this.activate();
    setTimeout(function() {
      this_.activate();
      atom.packages.onDidLoadPackage(function() {
        refresher(200);
      })
    }, 200)
    /*let this_ = this;
    setInterval(function() {
      this_.deactivate();
    }, 5000)
    setInterval(function() {
      this_.activate();
    }, 10000)*/
  }
  altkeyoverride() {
    // This is going to get a bit dangerous. Watch for key up/down. Bluring Resets
    // On keyup check for alt key and make sure the sequence isnt a multi
    var keysDown = { count: 0, multi: false }
    document.body.addEventListener('keydown', (e) => {
      if (keysDown.count) keysDown.multi = true
      if (!e.repeat) keysDown.count++
    })
    document.body.addEventListener('keyup', (e) => {
      if (e.key == 'Alt' && !keysDown.multi) this.toggleMenu()
      keysDown.count--
      if (!keysDown.count) keysDown.multi = false
    })
    window.addEventListener('blur', () => {
      keysDown = { count: 0, multi: false }
    })
  }
  // Add the menubar
  buildTheMenuHTML() {
    this.clearMenuBar()
    this.container = document.createElement('div')
    this.container.setAttribute('class', 'atom-windows-titlebar-menu-container app-menu')
    //document.querySelector('.workspace').prepend(this.container)
    document.querySelector('.atom-windows-titlebar-title-container').insertBefore(this.container, document.querySelector('.atom-windows-titlebar-title-container .title')) //.children[1])
    this.buildMenus()
  }

  clearMenuBar() {
    if (this.container) (this.container.parentElement).removeChild(this.container);
    delete this.container
  }

  listenForMenuEvents() {
    var menuItems = document.querySelector('.atom-windows-titlebar-menu-container').querySelectorAll('.menu, .submenu-item')
    for (var i = 0; i < menuItems.length; i++) {
      menuItems[i].addEventListener('mousedown', function(evt) {
        //var target = atom.views.getView(atom.workspace.getActiveTextEditor())
        //console.log(this);
        var command = this.getAttribute('data-command')
        var targets = [
          atom.workspace.getActivePane(),
          atom.workspace.getActivePaneItem(),
        ].filter(o => o);
        //console.log({ command, targets, })
        let res = null;
        while (res === null && targets.length > 0) {
          //console.log(command);
          res = atom.commands.dispatch(atom.views.getView(targets.pop()), command)
        }
        //console.log(res);
        evt.preventDefault();

      })
    }
  }

  filterMenus(menus) {
    let list = atom.config.get('atom-windows-titlebar-edit.hides').split(',').map(o => o.trim())
    //console.log(list);
    let menus2 = menus.filter(o => {
      //console.log(o.label, !list.includes(o.label));
      return !list.includes(o.label);
    })
    for (let x of menus2) {
      if ('submenu' in x) {
        x.submenu = this.filterMenus(x.submenu);
      }
    }
    return menus2;
  }

  // Build the menu and submenus
  buildMenus() {
    this.container.innerHTML += this.parent.atomWindowsTitlebarTitle.buildIcon();
    for (var menu of this.filterMenus(this.menus))
      this.container.innerHTML += this.buildMenu(menu)
  }

  buildMenu(menu) {
    let submenuHTML = menu.submenu ? this.buildSubMenuHTML(menu.submenu) : ''
    let cmd = ('command' in menu) ? `data-command="${menu.command}"` : '';
    return `
         <div class='menu' ${cmd}>
            <label>${menu.label.split('&').join('')}</label>
            ${submenuHTML}
         </div>`
  }

  oldbuildSubMenuHTML(submenu) {
    var html = ''
    for (var item of submenu) {
      if (item.type == 'separator') { html += `<hr>`; continue }
      html += `
            <div class='submenu-item ${item.submenu ? 'has-submenu' : ''}' data-command="${item.command}">
               <span class="label">${item.label.split('&').join('')}</span>
               ${this.getCommandKeyBind(item.command)}
               ${item.submenu ? this.buildSubMenuHTML(item.submenu) : ''}
            </div>`
    }
    return `<div class='submenu'>${html}</div>`
  }

  getCommandKeyBind(command) {
    var keys = atom.menu.packageManager.menuManager.keymapManager.keyBindings
    var keymap = ''
    for (var key of keys) {
      if (command && key.keystrokeArray.length == 1 && key.command == command) {
        // Return 'cmd-shift-i' as 'Cmd-Shift-I'
        keymap = key.keystrokeArray[0].split('-').map(function(e) {
          return e.slice(0, 1).toUpperCase() + e.slice(1, e.length).toLowerCase()
        }).join('-')
      }
    }

    return keymap == '' ? keymap : `<span class="keymap">${keymap}</span>`
  }

  toggleMenu() {
    this.container.classList.toggle('show')
  }
  activate() {
    this.menus = [...atom.menu.packageManager.menuManager.template]
    let packageNames = atom.config.get('atom-windows-titlebar-edit.packages').split(',').map(o => o.trim());
    //console.log(this.menus)
    let packages = this.menus.find(o => o.label == '&Packages').submenu;
    //console.log(packages);
    for (let name of packageNames) {
      let package = packages.find(o => o.label == name);
      if (package) {
        //console.log(name, package)
        this.menus.push(this.parent.atomWindowsTitlebarTitle.simplifyMenu([{
          label: '&' + package.label,
          submenu: package.submenu,
        }])[0])
      }
    }
    this.buildTheMenuHTML()
    // Listen for events
    let this_ = this;
    setTimeout(() => { this_.listenForMenuEvents() }, 0)
    this.altkeyoverride()
  }
  deactivate() {
    this.clearMenuBar()
  }
  refresh() {
    //this.deactivate()
    this.activate()
  }
}
