'use babel'
const path = require('path');

const formatKeystroke = function(key) {
  return key.keystrokeArray[0].split('-').map(function(e) {
    return e.slice(0, 1).toUpperCase() + e.slice(1, e.length).toLowerCase()
  }).join('-')
}

export default class AtomWindowsTitlebarTitleBar {
  constructor() {
    this.buildTitleBar()
    setTimeout(() => { this.addEvents() }, 0)
  }
  addEvents() {
    this.browserWindow = atom.getCurrentWindow()
    this.controls = {
      minimize: this.titlebar.querySelector('.control-minimize'),
      maximize: this.titlebar.querySelector('.control-maximize'),
      close: this.titlebar.querySelector('.control-close')
    }

    this.controls.minimize.addEventListener('click', () => {
      this.browserWindow.minimize()
    })

    this.controls.maximize.addEventListener('click', () => {
      this.browserWindow.isMaximized()
        ? this.browserWindow.unmaximize()
        : this.browserWindow.maximize()
    })


    this.maxUnMaxIcon()
    window.addEventListener('resize', () => { this.maxUnMaxIcon() })

    this.controls.close.addEventListener('click', () => {
      this.browserWindow.close()
    })
  }

  maxUnMaxIcon() {
    this.browserWindow.isMaximized()
      ? this.controls.maximize.firstChild.classList.add('maximized')
      : this.controls.maximize.firstChild.classList.remove('maximized')
  }

  buildTitleBar() {
    this.titlebar = document.createElement('div')
    this.titlebar.setAttribute('class', 'atom-windows-titlebar-title-container')
    this.titlebar.innerHTML = this.assembleTitleBarParts()
    document.querySelector('.workspace').prepend(this.titlebar)
    //document.querySelector('atom-windows-titlebar-menu-container/')
    /*document.querySelector(".favicon").children[0].addEventListener('mousedown', function(){
      atom.commands.dispatch("atom-workspace", "command-palette:toggle")
    })*/
  }
  assembleTitleBarParts() {
    //return this.buildIcon() + this.buildTitle() + this.buildControls()
    return this.buildTitle() + this.buildControls()
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

    return keymap ? `<span class="keymap">${keymap}</span>` : ''
  }

  buildSubMenuHTML(submenu) {
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

  simplifyMenu(menu) {
    return menu.map(o => {
      if ('submenu' in o) {
        if (o.submenu.length == 1 && 'command' in o.submenu[0]) {
          let cmd = o.submenu[0].command;
          let found = atom.keymaps.keyBindings.find(o => o.command == cmd);
          let obj = {
            label: o.label,
            command: o.submenu[0].command,
            //keymap: '',
          };
          if (found) {
            obj.keymap = formatKeystroke(found)
          };
          return obj;
        }
      }
      return o
    })
  }

  buildIcon() {
    let this_ = this;
    //console.log('COMMANDS =', atom.menu.packageManager.menuManager.template.find(o => o.label == '&Packages'));
    //let dropdowns = [...atom.menu.packageManager.menuManager.template.find(o => o.label == '&Packages').submenu];
    let packageNames = atom.config.get('atom-windows-titlebar-edit.packages2').split(',').map(o => o.trim());
    let packages = [...atom.menu.packageManager.menuManager.template.find(o => o.label == '&Packages').submenu];
    let dropdowns = []
    //.filter(o => packageNames.includes(o.label));
    for (let name of packageNames) {
      let package = packages.find(o => o.label == name);
      if (package) {
        dropdowns.push(package);
      } else {
        if (name.indexOf('.') > 0 && name.indexOf(':') > 0) {
          let [path, title] = name.split(':');
          path = path.split('.');
          /*console.log({
            name,
            path,
            title,
          })*/
          let obj = [...packages];
          for (let x of path) {
            if (obj.submenu) {
              obj = obj.submenu;
            }
            //console.log('x =', x, obj)
            let found = obj.find(o => o.label == x);
            if (found) {
              //console.log('eeey', obj)
              obj = found;
            } else {
              //console.log('rip', obj, found)
              obj = false;
              break
            }
          }
          if (!obj) {
            continue;
          } else {
            if (typeof obj == 'array') {
              obj = obj.find(o => o.label == path[path.length - 1])
            } else {

            }
          }
          let obj2 = {
            label: title,

          };
          if (obj.submenu) {
            obj2.submenu = obj.submenu;
          } else {
            obj2.command = obj.command;
            let key = atom.keymaps.keyBindings.find(o => o.command == obj2.command);
            if (key) {
              obj2.keymap = formatKeystroke(key)
            }
          }
          console.log(path, title, obj, obj2)
          dropdowns.push(obj2)
        } else if (name.indexOf(';') > 0) {
          let [cmd, title] = name.split(';');
          let key = atom.keymaps.keyBindings.find(o => o.command == cmd.command);
          dropdowns.push({
            label: title,
            command: cmd,
            keymap: key ? formatKeystroke(key) : undefined,
          })
        }
      }
    }
    dropdowns = this.simplifyMenu(dropdowns).map(item => {
      let keymap = item.keymap;
      return `<div class='submenu-item ${item.submenu ? 'has-submenu' : ''}' data-command="${item.command}">
         <span class="label">${item.label.split('&').join('')}</span>
         ${keymap ? '<span class="keymap">' + keymap + '</span>' : ''}
         ${item.submenu ? this_.buildSubMenuHTML(item.submenu) : ''}
      </div>`;
      //${item.submenu ? this.buildSubMenuHTML(item.submenu) : ''}
    }).join('')
    /*
    <div class="submenu-item" data-command="command-palette:toggle">
      <span class="label">Command Pallet</span>
      <span class="keymap">${formatKeystroke(atom.keymaps.keyBindings.find(o => o.command == "command-palette:toggle"))}</span>
    </div>
    */
    return `
         <div class="favicon menu">
            <img data-old-command="command-palette:toggle" src="${path.join(__dirname, '../atom.png')}"/>
            <div class="submenu" style="text-align: left;">
              ${dropdowns}
            </div>
         </div>`
  }

  buildControls() {
    return `
         <div class="controls">
            <div class="control control-minimize"><div class="control-icon-minimize"></div></div>
            <div class="control control-maximize"><div class="control-icon-maximize"></div></div>
            <div class="control control-close"><div class="control-icon-close"></div></div>
         </div>
      `
  }

  buildTitle() {
    return `<div class="title"></div>`
  }

  deactivate() {
    document.querySelector('.workspace').removeChild(this.titlebar)
  }
}
