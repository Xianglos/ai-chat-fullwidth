// ==UserScript==
// @name         人工智能网页宽屏拉满（支持DeepSeek、豆包）
// @namespace    http://tampermonkey.net/
// @version      2025-10-25
// @description  为DeepSeek和DouBao等AI聊天网站提供宽屏适配，移除宽度限制
// @author       Xianglos
// @match        https://chat.deepseek.com/*
// @match        https://www.doubao.com/chat/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=deepseek.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 网站配置
    const siteConfig = {
        'deepseek.com': {
            name: 'DeepSeek',
            actions: [
                {
                    type: 'css',
                    selector: '._0f72b0b.ds-scroll-area',
                    styles: { padding: '0' }
                },
                {
                    type: 'css',
                    selector: 'body',
                    styles: { 'max-width': 'none' }
                }
            ]
        },
        'doubao.com': {
            name: 'DouBao',
            actions: [
                {
                    type: 'remove-property',
                    property: '--center-content-max-width'
                },
                {
                    type: 'css',
                    selector: '.center-content',
                    styles: { 'max-width': 'none !important' }
                },
                {
                    type: 'inject-style',
                    css: `
                        * {
                            --center-content-max-width: none !important;
                        }
                        .center-content {
                            max-width: none !important;
                        }
                    `
                }
            ]
        }
    };

    // 获取当前网站配置
    function getCurrentSiteConfig() {
        const hostname = window.location.hostname;
        for (const domain in siteConfig) {
            if (hostname.includes(domain)) {
                return siteConfig[domain];
            }
        }
        return null;
    }

    // 执行网站特定的适配操作
    function applySiteAdaptation() {
        const config = getCurrentSiteConfig();
        if (!config) return;

        console.log(`正在为${config.name}应用宽屏适配...`);

        config.actions.forEach(action => {
            switch (action.type) {
                case 'css':
                    applyCSSAction(action);
                    break;
                case 'remove-property':
                    removePropertyAction(action);
                    break;
                case 'inject-style':
                    injectStyleAction(action);
                    break;
            }
        });
    }

    // 应用CSS样式修改
    function applyCSSAction(action) {
        const elements = document.querySelectorAll(action.selector);
        if (elements.length > 0) {
            elements.forEach(element => {
                Object.keys(action.styles).forEach(property => {
                    element.style[property] = action.styles[property];
                });
            });
            console.log(`已为 ${action.selector} 应用样式:`, action.styles);
        }
    }

    // 移除CSS属性
    function removePropertyAction(action) {
        // 从样式表中移除属性
        const styleSheets = document.styleSheets;
        for (let sheet of styleSheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                for (let rule of rules) {
                    if (rule.style && rule.style.getPropertyValue(action.property)) {
                        rule.style.removeProperty(action.property);
                        console.log(`已从样式表删除 ${action.property} 属性`);
                    }
                }
            } catch (e) {
                // 忽略跨域限制错误
            }
        }

        // 从内联样式中移除属性
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            if (element.style.getPropertyValue(action.property)) {
                element.style.removeProperty(action.property);
            }
        });
    }

    // 注入全局样式
    function injectStyleAction(action) {
        const style = document.createElement('style');
        style.textContent = action.css;
        document.head.appendChild(style);
        console.log('已注入全局样式');
    }

    // 初始化函数
    function init() {
        const config = getCurrentSiteConfig();
        if (!config) {
            console.log('当前网站不在支持列表中');
            return;
        }

        // 立即执行一次
        applySiteAdaptation();

        // 页面加载完成后再次执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applySiteAdaptation);
        }

        // 使用MutationObserver监听动态内容
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    setTimeout(applySiteAdaptation, 100);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 监听URL变化（针对单页应用）
        let currentURL = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentURL) {
                currentURL = window.location.href;
                setTimeout(applySiteAdaptation, 1000);
            }
        }, 500);
    }

    // 启动脚本
    init();
})();
