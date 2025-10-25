// ==UserScript==
// @name         人工智能网页宽屏拉满（支持DeepSeek、豆包、Copilot）
// @namespace    http://tampermonkey.net/
// @version      2025-10-25
// @description  为DeepSeek、DouBao和Microsoft Copilot等AI聊天网站提供宽屏适配，移除宽度限制
// @author       Xianglos
// @match        https://chat.deepseek.com/*
// @match        https://www.doubao.com/chat/*
// @match        https://copilot.microsoft.com/chats
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
        },
        'copilot.microsoft.com': {
            name: 'Microsoft Copilot',
            actions: [
                {
                    type: 'modify-css-rule',
                    rules: [
                        {
                            selector: '.max-w-chat',
                            modifications: { 'max-width': '100%' }
                        },
                        {
                            selector: '.items-center',
                            modifications: { 'align-items': '' }
                        },
                        {
                            selector: '.w-expanded-composer',
                            modifications: { 'width': '' }
                        }
                    ]
                },
                {
                    type: 'inject-style',
                    css: `
                        .max-w-chat {
                            max-width: 100% !important;
                        }
                        .items-center {
                            align-items: unset !important;
                        }
                        .w-expanded-composer {
                            width: auto !important;
                            min-width: 100% !important;
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

    // 修改CSS规则
    function modifyCSSRuleAction(action) {
        const styleSheets = document.styleSheets;
        let modifiedCount = 0;
        
        for (let sheet of styleSheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                for (let rule of rules) {
                    if (rule.selectorText) {
                        action.rules.forEach(targetRule => {
                            if (rule.selectorText.includes(targetRule.selector)) {
                                Object.keys(targetRule.modifications).forEach(property => {
                                    if (rule.style[property] !== undefined) {
                                        rule.style[property] = targetRule.modifications[property];
                                        modifiedCount++;
                                        console.log(`已修改 ${targetRule.selector} 的 ${property} 为: ${targetRule.modifications[property]}`);
                                    }
                                });
                            }
                        });
                    }
                }
            } catch (e) {
                // 忽略跨域限制错误
            }
        }
        
        if (modifiedCount === 0) {
            console.log('未找到需要修改的CSS规则，将使用注入样式方式');
        }
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
                case 'modify-css-rule':
                    modifyCSSRuleAction(action);
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

        // 特别为Copilot监听样式表加载
        if (config.name === 'Microsoft Copilot') {
            const styleObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeName === 'LINK' && node.rel === 'stylesheet') {
                                console.log('检测到新样式表加载，重新应用Copilot适配');
                                setTimeout(applySiteAdaptation, 300);
                            }
                        });
                    }
                });
            });

            styleObserver.observe(document.head, {
                childList: true,
                subtree: false
            });
        }

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
