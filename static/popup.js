/*
 * Compatibility Notice
 *
 * This software is designed to be compatible with the following environments:
 * - Browsers: Google Chrome, Mozilla Firefox, Microsoft Edge, Safari
 * - Platforms: Windows, macOS, Linux
 * - JavaScript Versions: ES5, ES6+
 *
 * While efforts have been made to ensure compatibility across these environments,
 * users may encounter issues due to differences in browser implementations or
 * platform-specific behaviors. It is recommended to test the software in your
 * specific environment to ensure full compatibility.
 *
 * For any compatibility issues or questions, please contact [Your Contact Information].
 */
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search');
    const foldersContainer = document.getElementById('folders-container');
    const bookmarksContainer = document.getElementById('bookmarks-container');
    const tabFolders = document.getElementById('tab-folders');
    const tabBookmarks = document.getElementById('tab-bookmarks');


    const backButton = document.createElement('img');
    backButton.src = 'images/return.png';
    backButton.alt = 'Back';
    backButton.style.display = 'none';
    backButton.style.cursor = 'pointer';
    backButton.addEventListener('click', () => {
        bookmarksContainer.innerHTML = '';
        foldersContainer.style.display = 'flex';
        backButton.style.display = 'none';
        loadBookmarkTree(true);
    });
    document.getElementById('popup-container').prepend(backButton);

    const addFolderIcon = document.getElementById('add-folder-icon');
    addFolderIcon.addEventListener('click', () => {
        chrome.bookmarks.create({ parentId: "1", title: 'New Folder' }, (newFolder) => {
            console.log('New folder created');
            foldersContainer.appendChild(createDeletableFolderElement(newFolder));
            showSuccessMessage(chrome.i18n.getMessage("success"));
        });
    });

    tabFolders.textContent = chrome.i18n.getMessage("tabFolders");
    tabBookmarks.textContent = chrome.i18n.getMessage("tabBookmarks");

    let currentTab = 'folders';
    tabFolders.classList.add('active');

    tabFolders.addEventListener('click', () => {
        if (currentTab !== 'folders') {
            currentTab = 'folders';
            tabFolders.classList.add('active');
            tabBookmarks.classList.remove('active');
            loadBookmarkTree(true);
            bookmarksContainer.innerHTML = '';
        }
    });
    
    tabBookmarks.addEventListener('click', () => {
        if (currentTab !== 'bookmarks') {
            currentTab = 'bookmarks';
            tabBookmarks.classList.add('active');
            tabFolders.classList.remove('active');
            foldersContainer.innerHTML = '';
            bookmarksContainer.innerHTML = '';
        }
    });

    searchInput.addEventListener('input', function () {
        const filter = searchInput.value.toLowerCase();
        if (currentTab === 'folders') {
            const folders = foldersContainer.children;
            for (let i = 0; i < folders.length; i++) {
                const folder = folders[i];
                if (folder.textContent.toLowerCase().includes(filter)) {
                    folder.style.display = '';
                } else {
                    folder.style.display = 'none';
                }
            }
        } else if (currentTab === 'bookmarks') {
            if (filter) {
                chrome.bookmarks.getTree((nodes) => {
                    bookmarksContainer.innerHTML = '';
                    nodes.forEach((node) => {
                        if (node.children) {
                            node.children.forEach((childNode) => {
                                searchBookmarks(childNode, filter);
                            });
                        }
                    });
                });
            } else {
                bookmarksContainer.innerHTML = '';
            }
        }
    });

    function searchBookmarks(node, filter) {
        if (node.url && node.title.toLowerCase().includes(filter)) {
            const div = createDeletableBookmarkElement(node);
            bookmarksContainer.appendChild(div);
        }
        if (node.children) {
            node.children.forEach((child) => searchBookmarks(child, filter));
        }
    }

    
    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.textContent = message;
        successDiv.className = 'success-message';
        document.body.appendChild(successDiv);
    
        setTimeout(() => {
            successDiv.style.opacity = '0';
            setTimeout(() => {
                successDiv.remove();
            }, 1000);
        }, 3000);
    }

    
    function traverseBookmarks(nodes) {
        nodes.forEach(node => {
            if (node.children && !isRootFolder(node)) {
                const div = createDeletableFolderElement(node);
                if (div) {
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        closeAllEditStates();
                        displayBookmarks(node.children);
                        backButton.style.display = 'block';
                    });
                    foldersContainer.appendChild(div);
                }
            }
            if (node.children) {
                traverseBookmarks(node.children);
            }
        });
    }

    function displayBookmarks(bookmarks) {
        bookmarksContainer.innerHTML = '';
        bookmarks.forEach(bookmark => {
            if (bookmark.url) {
                const div = createDeletableBookmarkElement(bookmark);
                bookmarksContainer.appendChild(div);
            }
        });
        foldersContainer.style.display = 'none';
        tabFolders.style.display = 'none';
        tabBookmarks.style.display = 'none';
    }

    function createDeletableFolderElement(folder) {
        if (!folder || !folder.title) {
            return null;
        }
        
        const div = createEditableFolderElement(folder);
        const deleteIcon = document.createElement('img');
        deleteIcon.src = 'images/delete.png';
        deleteIcon.className = 'delete-icon';
        deleteIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isRootFolder(folder) && confirm(chrome.i18n.getMessage("confirmDelete"))) {
                chrome.bookmarks.removeTree(folder.id, () => {
                    div.remove();
                    console.log('Removed folder:', folder.title);
                });
            }
        });
        div.appendChild(deleteIcon);
    
        
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllEditStates();
            displayBookmarks(folder.children);
            backButton.style.display = 'block';
        });
    
        return div;
    }

    function createEditableFolderElement(folder) {
        const div = document.createElement('div');
        div.className = 'folder';
        const title = document.createElement('span');
        title.textContent = folder.title;
    
        const editIcon = document.createElement('img');
        editIcon.src = 'images/edit.png';
        editIcon.className = 'edit-icon';
        editIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllEditStates();
            input.style.display = 'block';
            tickIcon.style.display = 'block';
            input.value = title.textContent;
            title.style.display = 'none';
            editIcon.style.display = 'none';
        });
    
        const input = document.createElement('textarea');
        input.style.display = 'none';
        input.style.height = 'auto';
        input.style.width = 'calc(100% - 30px)';
        input.style.resize = 'none';
        input.style.overflow = 'hidden';
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    
        const tickIcon = document.createElement('img');
        tickIcon.src = 'images/tick.png';
        tickIcon.className = 'tick-icon';
        tickIcon.style.display = 'none';
        tickIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isRootFolder(folder)) {
                const newTitle = input.value;
                saveFolderName(folder.id, newTitle);
                title.textContent = newTitle;
                title.style.display = 'block';
                editIcon.style.display = 'block';
                input.style.display = 'none';
                tickIcon.style.display = 'none';
            }
        });
    
        div.appendChild(title);
        div.appendChild(editIcon);
        div.appendChild(input);
        div.appendChild(tickIcon);
        return div;
    }

    function createDeletableBookmarkElement(bookmark) {
        const div = createEditableBookmarkElement(bookmark);
        const deleteIcon = document.createElement('img');
        deleteIcon.src = 'images/delete.png';
        deleteIcon.className = 'delete-icon';
        deleteIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(chrome.i18n.getMessage("confirmDelete"))) {
                chrome.bookmarks.remove(bookmark.id, () => {
                    div.remove();
                });
            }
        });
        div.appendChild(deleteIcon);
        return div;
    }

    function createEditableBookmarkElement(bookmark, isTopLevel = false) {
        const div = document.createElement('div');
        div.className = 'bookmark';
        div.setAttribute('data-bookmark-id', bookmark.id);

        const titleDiv = document.createElement('div');
        titleDiv.className = 'bookmark-title';
        const title = document.createElement('span');
        title.textContent = bookmark.title;
        titleDiv.appendChild(title);

        
        titleDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            chrome.tabs.create({ url: bookmark.url });
        });

        const editIcon = document.createElement('img');
        editIcon.src = 'images/edit.png';
        editIcon.className = 'edit-icon';
        editIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllEditStates();
            input.style.display = 'block';
            tickIcon.style.display = 'block';
            input.value = title.textContent;
            title.style.display = 'none';
            editIcon.style.display = 'none';

            
            if (!isTopLevel) {
                input.style.width = 'calc(100% - 25px)';
                input.style.height = '100px';
            }
        });

        const input = document.createElement('textarea');
        input.style.display = 'none';
        input.style.resize = 'none';
        input.style.overflow = 'hidden';
        input.style.boxSizing = 'border-box';
        input.style.marginRight = '13px';
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const tickIcon = document.createElement('img');
        tickIcon.src = 'images/tick.png';
        tickIcon.className = 'tick-icon';
        tickIcon.style.display = 'none';
        tickIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            saveBookmarkName(bookmark.id, input.value);
            title.textContent = input.value;
            title.style.display = 'block';
            editIcon.style.display = 'block';
            input.style.display = 'none';
            tickIcon.style.display = 'none';
        });

        
        const moveIcon = document.createElement('img');
        moveIcon.src = 'images/move.png';
        moveIcon.className = 'move-icon';
        moveIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            
            showMoveDialog(bookmark.id);
        });

        
        if (isTopLevel) {
            const deleteIcon = document.createElement('img');
            deleteIcon.src = 'images/delete.png';
            deleteIcon.className = 'delete-icon';
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(chrome.i18n.getMessage("confirmDelete"))) {
                    chrome.bookmarks.remove(bookmark.id, () => {
                        div.remove();
                    });
                }
            });

            
            const iconDiv = document.createElement('div');
            iconDiv.style.display = 'flex';
            iconDiv.style.gap = '4px';
            iconDiv.appendChild(editIcon);
            iconDiv.appendChild(deleteIcon);
            iconDiv.appendChild(moveIcon);

            div.appendChild(iconDiv);
        } else {
            const iconDiv = document.createElement('div');
            iconDiv.style.display = 'flex';
            iconDiv.style.gap = '4px';
            iconDiv.appendChild(editIcon);
            iconDiv.appendChild(moveIcon);

            div.appendChild(iconDiv);
        }

        div.appendChild(titleDiv);
        div.appendChild(input);
        div.appendChild(tickIcon);
        return div;
    }

    function saveFolderName(folderId, newName) {
        chrome.bookmarks.update(folderId, { title: newName }, () => {
            console.log('Folder name updated');
        });
    }

    function saveBookmarkName(bookmarkId, newName) {
        chrome.bookmarks.update(bookmarkId, { title: newName }, () => {
            console.log('Bookmark name updated');
        });
    }

    function closeAllEditStates() {
        const allFolders = foldersContainer.children;
        const allBookmarks = bookmarksContainer.children;
    
        for (let folder of allFolders) {
            const editIcon = folder.querySelector('.edit-icon');
            const tickIcon = folder.querySelector('.tick-icon');
            const title = folder.querySelector('span');
            const input = folder.querySelector('textarea');
    
            
            if (editIcon && tickIcon && title && input) {
                if (input.style.display === 'block') {
                    title.textContent = input.value;
                }
                title.style.display = 'block';
                editIcon.style.display = 'block';
                input.style.display = 'none';
                tickIcon.style.display = 'none';
            }
        }
    
        for (let bookmark of allBookmarks) {
            const editIcon = bookmark.querySelector('.edit-icon');
            const tickIcon = bookmark.querySelector('.tick-icon');
            const title = bookmark.querySelector('span');
            const input = bookmark.querySelector('textarea');
    
            if (editIcon && tickIcon && title && input) {
                if (input.style.display === 'block') {
                    title.textContent = input.value;
                }
                title.style.display = 'block';
                editIcon.style.display = 'block';
                input.style.display = 'none';
                tickIcon.style.display = 'none';
            }
        }
    }

    function isRootFolder(node) {
        const isRoot = node.id === "0" || node.parentId === null;
        return isRoot;
    }

    searchInput.addEventListener('input', function () {
        const filter = searchInput.value.toLowerCase();
        const isInFolder = bookmarksContainer.innerHTML !== '';

        if (isInFolder) {
            const bookmarks = bookmarksContainer.children;
            for (let i = 0; i < bookmarks.length; i++) {
                const bookmark = bookmarks[i];
                if (bookmark.textContent.toLowerCase().includes(filter)) {
                    bookmark.style.display = '';
                } else {
                    bookmark.style.display = 'none';
                }
            }
        } else {
            const folders = foldersContainer.children;
            for (let i = 0; i < folders.length; i++) {
                const folder = folders[i];
                if (folder.textContent.toLowerCase().includes(filter)) {
                    folder.style.display = '';
                } else {
                    folder.style.display = 'none';
                }
            }
        }
    });

    
    function loadBookmarkTree(clearFolders = false) {
        chrome.bookmarks.getTree((nodes) => {
            if (chrome.runtime.lastError) {
                return;
            }
            if (clearFolders) {
                foldersContainer.innerHTML = '';
            }
            let folderCount = 0;
            nodes.forEach((node) => {
                if (isRootFolder(node)) {
                    node.children.forEach((childNode) => {
                        folderCount += traverseAndCreateFolders(childNode);
                    });
                } else {
                    folderCount += traverseAndCreateFolders(node);
                }
            });
        });
    
        function traverseAndCreateFolders(node) {
            let localFolderCount = 0;
            if (node.children && !isRootFolder(node)) {
                const folderElement = createDeletableFolderElement(node);
                if (folderElement) {
                    foldersContainer.appendChild(folderElement);
                    localFolderCount++;
                } else {
                    console.log('Failed to create folder element for:', node);
                }
                node.children.forEach((childNode) => {
                    if (childNode.children) {
                        localFolderCount += traverseAndCreateFolders(childNode);
                    }
                });
            }
            return localFolderCount;
        }
    }

    
    function setupBookmarkListeners() {
        chrome.bookmarks.onCreated.addListener(() => loadBookmarkTree(true));
        chrome.bookmarks.onRemoved.addListener(() => loadBookmarkTree(true));
        chrome.bookmarks.onMoved.addListener(() => loadBookmarkTree(true));
    }

    
    function moveBookmarkToFolder(bookmarkId, folderId, dialog) {
        chrome.bookmarks.move(bookmarkId, { parentId: folderId }, () => {
            document.body.removeChild(dialog);
            const bookmarkElement = document.querySelector(`[data-bookmark-id="${bookmarkId}"]`);
            if (bookmarkElement) {
                bookmarkElement.remove();
                console.log('Removed moved bookmark:', bookmarkId);
            }
            loadBookmarkTree(true);
        });
    }

    function createFolderElement(folder) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder';
        folderDiv.setAttribute('data-folder-id', folder.id);

        const folderTitle = document.createElement('div');
        folderTitle.className = 'folder-title';
        folderTitle.textContent = folder.title;
        folderDiv.appendChild(folderTitle);

        const bookmarksContainer = document.createElement('div');
        bookmarksContainer.className = 'bookmarks-container';
        folderDiv.appendChild(bookmarksContainer);

        if (folder.children) {
            folder.children.forEach((child) => {
                const bookmarkElement = createEditableBookmarkElement(child, false);
                bookmarksContainer.appendChild(bookmarkElement);
            });
        }

        return folderDiv;
    }

    function showMoveDialog(bookmarkId) {
        const existingDialog = document.querySelector('.move-dialog');
        if (existingDialog) {
            document.body.removeChild(existingDialog);
        }
        const dialog = document.createElement('div');
        dialog.className = 'move-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Select Target Folder</h3>
                <select id="folderSelect">
                </select>
                <div class="dialog-buttons">
                    <button id="moveButton">Move</button>
                    <button id="cancelButton">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    
        const parentPopup = document.querySelector('.parent-popup');
        if (parentPopup) {
            const parentRect = parentPopup.getBoundingClientRect();
            dialog.style.position = 'absolute';
            dialog.style.left = `${parentRect.left + (parentRect.width - dialog.offsetWidth) / 2}px`;
            dialog.style.top = `${parentRect.top}px`;
        } else {
            dialog.style.position = 'absolute';
            dialog.style.left = '50%';
            dialog.style.top = '50px';
            dialog.style.transform = 'translateX(-50%)';
        }
    
        document.getElementById('moveButton').addEventListener('click', () => {
            const folderId = document.getElementById('folderSelect').value;
            moveBookmarkToFolder(bookmarkId, folderId, dialog);
        });
    
        document.getElementById('cancelButton').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    
        loadFolderOptions();
    }
    
    function loadFolderOptions() {
        chrome.bookmarks.getTree((nodes) => {
            const select = document.getElementById('folderSelect');
            select.innerHTML = '';
            nodes.forEach((node) => {
                console.log('Processing root node for options:', node);
                if (node.children) {
                    node.children.forEach((childNode) => {
                        addFolderOptions(childNode, select);
                    });
                }
            });
        });
    }
    
    function addFolderOptions(node, select) {
        if (node.children && !isRootFolder(node)) {
            console.log('Adding folder to options:', node.title);
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = node.title;
            select.appendChild(option);
            node.children.forEach((child) => addFolderOptions(child, select));
        }
    }

    
    loadBookmarkTree();
    setupBookmarkListeners();

    
    backButton.addEventListener('click', () => {
        bookmarksContainer.innerHTML = '';
        foldersContainer.style.display = 'flex';
        backButton.style.display = 'none';
        tabFolders.style.display = 'block';
        tabBookmarks.style.display = 'block';
        loadBookmarkTree(true);
    });

   
    document.querySelectorAll('.folder-title').forEach(title => {
        title.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    
    document.querySelectorAll('.bookmark-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    window.onload = function () {
        const searchInput = document.getElementById('search');
        searchInput.placeholder = chrome.i18n.getMessage("searchPlaceholder");
    };
    searchInput.focus();
});