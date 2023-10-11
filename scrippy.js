/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
    Copyright (C) 2019-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock

    The scriptlets below are meant to be injected only into a
    web page context.
*/

// The lines below are skipped by the resource parser. Purpose is clean
// jshinting.
(function() {
// >>>> start of private namespace
'use strict';

export const builtinScriptlets = [];
    
/*******************************************************************************

    Helper functions
    
    These are meant to be used as dependencies to injectable scriptlets.

*******************************************************************************/

builtinScriptlets.push({
    name: 'safe-self.fn',
    fn: safeSelf,
});
function safeSelf() {
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const safe = {
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'log': console.log.bind(console),
        'uboLog': function(...args) {
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
        },
    };
    scriptletGlobals.set('safeSelf', safe);
    return safe;
}

/******************************************************************************/

builtinScriptlets.push({
    name: 'run-at.fn',
    fn: runAt,
    dependencies: [
        'safe-self.fn',
    ],
});
function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1,
            'interactive': 2, 'end': 2, '2': 2,
            'complete': 3, 'idle': 3, '3': 3,
        };
        const tokens = Array.isArray(state) ? state : [ state ];
        for ( const token of tokens ) {
            const prop = `${token}`;
            if ( targets.hasOwnProperty(prop) === false ) { continue; }
            return targets[prop];
        }
        return 0;
    };
    const runAt = intFromReadyState(when);
    if ( intFromReadyState(document.readyState) >= runAt ) {
        fn(); return;
    }
    const onStateChange = ( ) => {
        if ( intFromReadyState(document.readyState) < runAt ) { return; }
        fn();
        safe.removeEventListener.apply(document, args);
    };
    const safe = safeSelf();
    const args = [ 'readystatechange', onStateChange, { capture: true } ];
    safe.addEventListener.apply(document, args);
}

/******************************************************************************/


/*******************************************************************************
 * 
 * @scriptlet jb-fuk
 * 
 * @description
 * Jailbreak the FK out of the specified element hah

 * Reference: https://github.com/AdguardTeam/Scriptlets/blob/master/src/scriptlets/set-attr.js
 * 
 * ### Syntax
 * 
 * ```text
 * example.org##+js(jb-fuk, selector)
 * ```
 * 
 * - `selector`: CSS selector of DOM elements for which the attribute `attr`
 *   must be modified.
 * */

builtinScriptlets.push({
    name: 'jb-fuk.js',
    fn: jbFuk,
    world: 'ISOLATED',
    dependencies: [
        'run-at.fn',
    ],
});
function jbFuk(
    selector = ''
) {
    if ( typeof selector !== 'string' ) { return; }
    if ( selector === '' ) { return; }
    
    // let copyFrom = '';

    // if ( validValues.includes(value) === false ) {
    //     if ( /^\d+$/.test(value) ) {
    //         const n = parseInt(value, 10);
    //         if ( n >= 32768 ) { return; }
    //         value = `${n}`;
    //     } else if ( /^\[.+\]$/.test(value) ) {
    //         copyFrom = value.slice(1, -1);
    //     } else {
    //         return;
    //     }
    // }

    const extractValue = elem => {
        return 'exec(prompt("screw off"))';
    };

    const applySetAttr = ( ) => {
        const elems = [];
        try {
            elems.push(...document.querySelectorAll(selector));
        }
        catch(ex) {
            return false;
        }
        for ( const elem of elems ) {
            const before = elem.getAttribute('onclick');
            const after = extractValue(elem);
            if ( after === before ) { continue; }
            elem.setAttribute('onclick', after);
        }
        return true;
    };
    let observer, timer;
    const onDomChanged = mutations => {
        if ( timer !== undefined ) { return; }
        let shouldWork = false;
        for ( const mutation of mutations ) {
            if ( mutation.addedNodes.length === 0 ) { continue; }
            for ( const node of mutation.addedNodes ) {
                if ( node.nodeType !== 1 ) { continue; }
                shouldWork = true;
                break;
            }
            if ( shouldWork ) { break; }
        }
        if ( shouldWork === false ) { return; }
        timer = self.requestAnimationFrame(( ) => {
            timer = undefined;
            applySetAttr();
        });
    };
    const start = ( ) => {
        if ( applySetAttr() === false ) { return; }
        observer = new MutationObserver(onDomChanged);
        observer.observe(document.body, {
            subtree: true,
            childList: true,
        });
    };
    runAt(( ) => { start(); }, 'idle');
}

// These lines below are skipped by the resource parser.
// <<<< end of private namespace
})();
