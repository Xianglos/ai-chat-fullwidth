// ==UserScript==
// @name         人工智能网页宽屏拉满（支持DeepSeek、豆包）
// @namespace    http://tampermonkey.net/
// @version      2025-10-26
// @description  在宽屏显示器，或者高分辨率显示器上，网页版左右留白非常丑陋。本脚本旨在删除这些丑陋的留白
// @author       Xianglos
// @match        https://www.doubao.com/chat*
// @match        https://chat.deepseek.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    function douBaoFix() {
        const styleSheets = document.styleSheets;
        for (let sheet of styleSheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                for (let rule of rules) {
                    if (rule.style && rule.style.getPropertyValue('--center-content-max-width')) {
                        rule.style.removeProperty('--center-content-max-width');
                    }
                }
            } catch (e) {}
        }

        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            if (element.style.getPropertyValue('--center-content-max-width')) {
                element.style.removeProperty('--center-content-max-width');
            }
        });

        const style = document.createElement('style');
        style.textContent = `
            * {
                --center-content-max-width: none !important;
            }
            .center-content {
                max-width: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    function deepSeekFix() {
        const targetClass = '_0f72b0b ds-scroll-area';
        const elements = document.querySelectorAll(`.${targetClass.split(' ').join('.')}`);
        elements.forEach(element => {
            element.style.padding = '0';
        });
    }

    function handleMutation() {
        if (window.location.host.includes('doubao.com')) {
            douBaoFix();
        } else if (window.location.host.includes('deepseek.com')) {
            deepSeekFix();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            handleMutation();
            const observer = new MutationObserver(handleMutation);
            observer.observe(document.body, {childList: true, subtree: true});
            let currentURL = window.location.href;
            setInterval(() => {
                if (window.location.href !== currentURL) {
                    currentURL = window.location.href;
                    setTimeout(handleMutation, 1000);
                }
            }, 500);
        });
    } else {
        handleMutation();
        const observer = new MutationObserver(handleMutation);
        observer.observe(document.body, {childList: true, subtree: true});
        let currentURL = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentURL) {
                currentURL = window.location.href;
                setTimeout(handleMutation, 1000);
            }
        }, 500);
    }
})();
