// ==UserScript==
// @name         微信文章网页宽屏拉满
// @namespace    http://tampermonkey.net/
// @version      2025-10-26
// @description  在宽屏显示器，或者高分辨率显示器上，网页版左右留白非常丑陋。本脚本旨在删除这些丑陋的留白
// @author       Xianglos
// @match        https://mp.weixin.qq.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 删除 p 标签的 text-align:center 样式
    function removeParagraphCenterAlign() {
        const contentDiv = document.querySelector('.rich_media_content.js_underline_content');
        if (contentDiv) {
            const paragraphs = contentDiv.querySelectorAll('p');
            paragraphs.forEach(p => {
                if (p.style.textAlign === 'center') {
                    p.style.textAlign = '';
                }
            });
        }
    }

    // 等待页面加载完成
    window.addEventListener('load', function() {
        // 删除 rich_media_area_primary_inner 的样式
        const primaryInner = document.querySelector('.rich_media_area_primary_inner');
        if (primaryInner) {
            primaryInner.classList.remove('rich_media_area_primary_inner');
        }

        // 删除 bottom_bar_interaction_wrp 的 max-width 属性
        const bottomBar = document.querySelector('.bottom_bar_interaction_wrp');
        if (bottomBar) {
            bottomBar.style.maxWidth = '';
        }

        // 删除 p 标签的 text-align:center 样式
        removeParagraphCenterAlign();
    });

    // 使用 MutationObserver 监听 DOM 变化，确保动态加载的内容也能被处理
    const observer = new MutationObserver(function(mutations) {
        let shouldProcess = false;

        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // 元素节点
                    // 检查新增的节点中是否有目标元素
                    if (node.classList && node.classList.contains('rich_media_area_primary_inner')) {
                        node.classList.remove('rich_media_area_primary_inner');
                        shouldProcess = true;
                    }

                    if (node.classList && node.classList.contains('bottom_bar_interaction_wrp')) {
                        node.style.maxWidth = '';
                        shouldProcess = true;
                    }

                    // 检查子节点中是否有目标元素
                    const primaryInner = node.querySelector('.rich_media_area_primary_inner');
                    if (primaryInner) {
                        primaryInner.classList.remove('rich_media_area_primary_inner');
                        shouldProcess = true;
                    }

                    const bottomBar = node.querySelector('.bottom_bar_interaction_wrp');
                    if (bottomBar) {
                        bottomBar.style.maxWidth = '';
                        shouldProcess = true;
                    }

                    // 检查是否有内容区域的变化
                    if (node.querySelector && node.querySelector('.rich_media_content.js_underline_content')) {
                        shouldProcess = true;
                    }
                }
            });
        });

        // 如果检测到相关变化，重新处理 p 标签
        if (shouldProcess) {
            setTimeout(removeParagraphCenterAlign, 100);
        }
    });

    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 额外监听内容区域的变化
    const contentObserver = new MutationObserver(function(mutations) {
        let shouldProcess = false;

        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.tagName === 'P') {
                        shouldProcess = true;
                    }
                });
            }
        });

        if (shouldProcess) {
            removeParagraphCenterAlign();
        }
    });

    // 当找到内容区域时，开始观察其内部变化
    function setupContentObserver() {
        const contentDiv = document.querySelector('.rich_media_content.js_underline_content');
        if (contentDiv) {
            contentObserver.observe(contentDiv, {
                childList: true,
                subtree: true
            });
        }
    }

    // 延迟设置内容观察器，确保内容已加载
    setTimeout(setupContentObserver, 1000);
})();
